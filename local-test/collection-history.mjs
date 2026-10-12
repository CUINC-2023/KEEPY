import { ApiError } from "./database.mjs";
import { collectionReadContract } from "../src/lib/collection-contract.mjs";
import { readEarnedCollectionRecords } from "./collection.mjs";
export function collectionHistory(d, token, params = {}) {
  const u = d.actor(token),
    cat = d.collectionCatalogue();
  if (Object.keys(params).some((k) => !["page", "start", "end", "source"].includes(k)))
    throw new ApiError(422, "collection", "Unknown history filters");
  const page = Number(params.page ?? 1),
    start = params.start ?? "",
    end = params.end ?? "",
    source = params.source ?? "";
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 50000 ||
    typeof source !== "string" ||
    source.length > 40 ||
    [start, end].some(
      (v) => typeof v !== "string" || v.length > 40 || (v && !Number.isFinite(Date.parse(v))),
    ) ||
    (start && end && Date.parse(start) >= Date.parse(end))
  )
    throw new ApiError(422, "collection", "Invalid bounded history range");
  const from = start ? new Date(start).toISOString() : "",
    to = end ? new Date(end).toISOString() : "",
    ids = JSON.stringify(cat.cards.map((c) => c.cardId)),
    where =
      "user_id=? AND delta>0 AND card_id IN (SELECT value FROM json_each(?)) AND (?='' OR at>=?) AND (?='' OR at<?) AND (?='' OR source=?)",
    args = [u.id, ids, from, from, to, to, source, source],
    count = d.db.prepare("SELECT count(*) AS n FROM asset_events WHERE " + where).get(...args).n;
  const totalPages = Math.max(1, Math.ceil(count / 20)),
    currentPage = Math.min(page, totalPages),
    cards = new Map(cat.cards.map((c) => [c.cardId, c])),
    held = new Map(
      d.db
        .prepare("SELECT card_id,count FROM holdings WHERE user_id=?")
        .all(u.id)
        .map((r) => [r.card_id, r.count]),
    );
  const rows = d.db
    .prepare(
      "SELECT id,card_id,delta,source,at FROM asset_events WHERE " +
        where +
        " ORDER BY at DESC,id DESC LIMIT 20 OFFSET ?",
    )
    .all(...args, (currentPage - 1) * 20)
    .map((e) => ({
      eventId: e.id,
      at: e.at,
      source: e.source,
      quantity: e.delta,
      card: cards.get(e.card_id),
      currentCount: held.get(e.card_id) ?? 0,
    }));
  return {
    readContract: collectionReadContract("history"),
    actorId: u.id,
    visibilityKey: cat.visibilityKey,
    catalogueVersion: cat.version,
    page: currentPage,
    pageSize: 20,
    total: count,
    totalPages,
    range: { start: from, end: to, source },
    rows,
    sources: d.db
      .prepare("SELECT DISTINCT source FROM asset_events WHERE " + where + " ORDER BY source")
      .all(u.id, ids, from, from, to, to, "", "")
      .map((r) => r.source),
  };
}
export function collectionRecap(d, token, params = {}) {
  if (Object.keys(params).some((k) => !["start", "end"].includes(k)))
    throw new ApiError(422, "collection", "Only private period filters are allowed");
  const history = collectionHistory(d, token, params),
    cat = d.collectionCatalogue(),
    known = new Map(cat.cards.map((c) => [c.cardId, c])),
    ids = JSON.stringify([...known.keys()]);
  const within = (at) =>
    Number.isFinite(Date.parse(at)) &&
    (!history.range.start || at >= history.range.start) &&
    (!history.range.end || at < history.range.end);
  const firsts = d.db
    .prepare(
      "SELECT card_id,MIN(at) AS firstAt FROM asset_events WHERE user_id=? AND delta>0 AND card_id IN (SELECT value FROM json_each(?)) GROUP BY card_id",
    )
    .all(history.actorId, ids)
    .filter((r) => within(r.firstAt))
    .sort((a, b) => b.firstAt.localeCompare(a.firstAt) || a.card_id.localeCompare(b.card_id));
  const earned = readEarnedCollectionRecords(d, token).filter((a) => within(a.recordedAt));
  return {
    readContract: collectionReadContract("recap"),
    actorId: history.actorId,
    visibilityKey: history.visibilityKey,
    catalogueVersion: history.catalogueVersion,
    range: history.range,
    positiveEvents: history.total,
    newDistinct: firsts.length,
    newDesigns: firsts
      .slice(0, 20)
      .map((r) => ({ card: known.get(r.card_id), firstAt: r.firstAt })),
    earnedCount: earned.length,
    earned: earned.slice(0, 20),
    seriesRecords: earned.filter((a) => a.type === "series").length,
    sources: history.sources,
    recordedAtIsNotCompletionTime: true,
    readOnly: true,
  };
}
