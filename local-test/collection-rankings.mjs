import {
  collectionCatalogue,
  collectionProgress,
  rankCollections,
  rankingPage,
} from "./collection.mjs";

/** Local preview only: positive, operation-backed TEST acquisitions in [start,end). */
export function periodDesigns(events, ids, startAt, endAt) {
  const start = Date.parse(startAt),
    end = Date.parse(endAt),
    allowed = new Set(ids);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return new Set();
  return new Set(
    events
      .filter(
        (e) =>
          e.verified === true &&
          ["test-paid-draw", "test-synthesis"].includes(e.source) &&
          e.delta > 0 &&
          allowed.has(e.cardId) &&
          Date.parse(e.at) >= start &&
          Date.parse(e.at) < end,
      )
      .map((e) => e.cardId),
  );
}
export function seasonRankings(d, query = {}) {
  const cat = collectionCatalogue(d),
    now = Date.parse(d.at());
  // Only current public projections supply labels and periods; unavailable historical contents stay unavailable.
  const seasons = cat.pools
    .filter(
      (p) =>
        Number.isFinite(Date.parse(p.releaseAt)) &&
        Number.isFinite(Date.parse(p.withdrawAt)) &&
        Date.parse(p.releaseAt) < Date.parse(p.withdrawAt),
    )
    .map((p) => ({
      id: p.poolId,
      title: p.title,
      startAt: p.releaseAt,
      endAt: p.withdrawAt,
      state: now >= Date.parse(p.withdrawAt) ? "historical" : "current",
    }));
  const group =
    query.group === undefined ? null : query.group === "historical" ? "historical" : "current";
  const eligibleSeasons = group ? seasons.filter((s) => s.state === group) : seasons;
  const season =
    eligibleSeasons.find((s) => s.id === query.season) ??
    (query.season ? null : (eligibleSeasons[0] ?? null));
  const ids = season ? cat.cards.filter((c) => c.poolId === season.id).map((c) => c.cardId) : [];
  const rows =
    season && ids.length
      ? d.db
          .prepare(
            "SELECT p.payload,p.handle,u.id FROM collection_profiles p JOIN users u ON p.user_id=u.id WHERE u.active=1",
          )
          .all()
          .flatMap((r) => {
            const p = JSON.parse(r.payload);
            if (!p.isPublic || !p.showRanking) return [];
            const events = d.db
              .prepare(
                `SELECT e.card_id AS cardId,e.delta,e.at,e.source FROM asset_events e WHERE e.user_id=? AND e.delta>0 AND ((e.source='test-paid-draw' AND EXISTS(SELECT 1 FROM draws x WHERE x.id=e.operation_id AND x.user_id=e.user_id)) OR (e.source='test-synthesis' AND EXISTS(SELECT 1 FROM syntheses x WHERE x.id=e.operation_id AND x.user_id=e.user_id)))`,
              )
              .all(r.id)
              .map((e) => ({ ...e, verified: true }));
            const owned = periodDesigns(events, ids, season.startAt, season.endAt).size;
            return [
              {
                handle: r.handle,
                displayName: p.displayName,
                isPublic: true,
                showRanking: true,
                synthetic: true,
                completion: Math.floor((owned / ids.length) * 100),
                completedSeries: owned === ids.length ? 1 : 0,
                achievements: 0,
              },
            ];
          })
      : [];
  return {
    ...rankingPage(rankCollections(rows, { localPreview: true }), query),
    seasons,
    season,
    updatedAt: d.at(),
    ruleVersion: cat.version,
    denominator: ids.length,
    denominatorVersion: cat.visibilityKey,
    preview: true,
    synthetic: true,
    formalPolicy: "pending",
    settled: false,
    rewards: false,
    sourcePolicy: "operation-backed TEST positive acquisitions only; not approved formal scoring",
    periodGroup: group,
    scoringVersion: "season-operation-preview-v1",
  };
}
export function albumRankings(d, query = {}) {
  const cat = collectionCatalogue(d),
    pool =
      cat.pools.find((p) => p.poolId === query.pool) ??
      (query.pool ? null : (cat.pools[0] ?? null));
  const preview = query.mode === "local-preview",
    total = pool?.visibleDesigns ?? 0;
  const rows =
    pool && total > 0
      ? d.db
          .prepare(
            "SELECT p.payload,p.handle,u.id FROM collection_profiles p JOIN users u ON p.user_id=u.id WHERE u.active=1",
          )
          .all()
          .flatMap((r) => {
            const p = JSON.parse(r.payload);
            if (!p.isPublic || !p.showRanking) return [];
            const progress = collectionProgress(d, r.id).find((x) => x.poolId === pool.poolId);
            if (!progress || progress.total !== total || progress.ruleVersion !== cat.version)
              return [];
            return [
              {
                handle: r.handle,
                displayName: p.displayName,
                isPublic: true,
                showRanking: true,
                synthetic: true,
                completion: progress.pct,
                completedSeries: 0,
                achievements: 0,
              },
            ];
          })
      : [];
  return {
    ...rankingPage(rankCollections(rows, { localPreview: preview }), query),
    pools: cat.pools.map((p) => ({ poolId: p.poolId, title: p.title })),
    pool: pool ? { poolId: pool.poolId, title: pool.title } : null,
    updatedAt: d.at(),
    ruleVersion: cat.version,
    denominator: total,
    denominatorVersion: cat.visibilityKey,
    preview,
    synthetic: preview,
    excludedSynthetic: !preview,
  };
}
