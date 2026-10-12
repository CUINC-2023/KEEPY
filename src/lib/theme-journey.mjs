import { previewPlayerLevel } from "./player-level-preview.mjs";
export function previewThemeJourney(owner, catalogue) {
  const preview = previewPlayerLevel(owner, catalogue);
  if (!preview) return null;
  const acquired = new Set(preview.sources.filter((s) => s.kind === "design").map((s) => s.id));
  const chapters = [...new Set(owner.profile.data.goalPoolIds ?? [])].flatMap((id) => {
    const pool = catalogue.pools.find((p) => p.poolId === id);
    const ids = new Set(catalogue.cards.filter((c) => c.poolId === id).map((c) => c.cardId));
    if (!pool || !ids.size || ids.size !== pool.visibleDesigns) return [];
    const owned = [...ids].filter((cardId) => acquired.has(cardId)).length;
    const complete = owned === ids.size;
    const award = complete && owner.awards.find((a) => a.type === "series" && a.subject === id);
    return [
      {
        poolId: id,
        title: pool.title,
        owned,
        total: ids.size,
        complete,
        stage: complete ? "complete" : owned ? "collecting" : "start",
        earnedRecordAt:
          award && Number.isFinite(Date.parse(award.recordedAt)) ? award.recordedAt : null,
      },
    ];
  });
  return {
    status: "local-preview",
    ruleVersion: "theme-journey-preview-v1",
    catalogueVersion: catalogue.version,
    chapters,
    completed: chapters.filter((c) => c.complete).length,
    nextPoolId: chapters.find((c) => !c.complete)?.poolId ?? null,
    rewards: false,
  };
}
