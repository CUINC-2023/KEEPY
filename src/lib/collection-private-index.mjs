export const PRIVATE_INDEX_DEFAULT = { schema: 1, q: "", kind: "all", sort: "title", page: 1 };
export function validPrivateIndexPreference(v) {
  return (
    !!v &&
    Object.keys(v).sort().join() === "kind,page,q,schema,sort" &&
    v.schema === 1 &&
    typeof v.q === "string" &&
    v.q.length <= 100 &&
    ["all", "album", "card", "note", "curation"].includes(v.kind) &&
    ["title", "kind"].includes(v.sort) &&
    Number.isSafeInteger(v.page) &&
    v.page >= 1 &&
    v.page <= 10000
  );
}
export function privateCollectionIndex(me, catalogue, p = PRIVATE_INDEX_DEFAULT, locale = "zh-TW") {
  if (
    !validPrivateIndexPreference(p) ||
    !me?.actorId ||
    me.visibilityKey !== catalogue?.visibilityKey
  )
    throw Error("Private index source mismatch");
  const visible = new Set(catalogue.cards.map((c) => c.cardId)),
    held = new Set(me.cards.filter((c) => visible.has(c.cardId)).map((c) => c.cardId)),
    albums = new Set(catalogue.pools.map((p) => p.poolId)),
    awards = new Set(me.awards.map((a) => a.id));
  const rows = [
    ...me.progress
      .filter((r) => albums.has(r.poolId))
      .map((r) => ({
        kind: "album",
        id: r.poolId,
        title: r.title[locale],
        summary: `${r.owned}/${r.total} · ${r.pct}%`,
        sourceVersion: r.ruleVersion,
      })),
    ...new Map(
      [...me.acquiredCards, ...me.cards]
        .filter((c) => visible.has(c.cardId))
        .map((c) => [
          c.cardId,
          {
            kind: "card",
            id: c.cardId,
            title: c.name,
            summary: c.rarity,
            sourceVersion: c.cardVersion,
          },
        ]),
    ).values(),
    ...(me.profile.data.notes ?? [])
      .filter((n) =>
        n.kind === "card"
          ? held.has(n.subjectId)
          : n.kind === "album"
            ? albums.has(n.subjectId)
            : awards.has(n.subjectId),
      )
      .map((n) => ({
        kind: "note",
        id: n.id,
        title: n.category,
        summary: n.text + " " + (n.tags ?? []).join(" "),
        sourceVersion: me.profile.version,
      })),
    ...(me.profile.data.curations ?? [])
      .filter((g) => g.cardIds.length > 0 && g.cardIds.every((id) => held.has(id)))
      .map((g) => ({
        kind: "curation",
        id: g.id,
        title: g.title,
        summary: g.note,
        sourceVersion: me.profile.version,
      })),
  ].filter(
    (r) =>
      (p.kind === "all" || p.kind === r.kind) &&
      (!p.q.trim() ||
        (r.title + " " + r.summary).toLocaleLowerCase().includes(p.q.trim().toLocaleLowerCase())),
  );
  rows.sort(
    (a, b) =>
      (p.sort === "kind" ? a.kind.localeCompare(b.kind) : a.title.localeCompare(b.title)) ||
      a.kind.localeCompare(b.kind) ||
      a.id.localeCompare(b.id),
  );
  const pages = Math.max(1, Math.ceil(rows.length / 20)),
    page = Math.min(p.page, pages);
  return { total: rows.length, pages, page, rows: rows.slice((page - 1) * 20, page * 20) };
}
