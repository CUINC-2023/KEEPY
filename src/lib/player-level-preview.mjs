// Candidate rules are read-only local previews, never an asset or award policy.
export const PLAYER_LEVEL_RULES = Object.freeze({
  A: Object.freeze({
    id: "player-preview-a-v1",
    designXP: 10,
    albumXP: 0,
    step: 100,
    maxLevel: 20,
  }),
  B: Object.freeze({
    id: "player-preview-b-v1",
    designXP: 10,
    albumXP: 25,
    step: 100,
    maxLevel: 20,
  }),
});

export function previewPlayerLevel(owner, catalogue, candidate = "A") {
  const rule = PLAYER_LEVEL_RULES[candidate];
  if (!rule) throw new Error("Unknown candidate rule");
  if (
    !owner?.actorId ||
    !catalogue?.visibilityKey ||
    owner.visibilityKey !== catalogue.visibilityKey
  )
    return null;
  const pools = new Set(catalogue.pools.map((p) => p.poolId));
  const known = new Map(
    catalogue.cards.filter((c) => pools.has(c.poolId)).map((c) => [c.cardId, c]),
  );
  const acquired = new Set(
    owner.acquiredCards
      .filter((c) => {
        const current = known.get(c.cardId);
        return (
          current &&
          current.poolId === c.poolId &&
          current.rarity === c.rarity &&
          current.cardVersion === c.cardVersion
        );
      })
      .map((c) => c.cardId),
  );
  const completed = [...pools].filter((id) => {
    const cards = [...known.values()].filter((c) => c.poolId === id);
    return cards.length > 0 && cards.every((c) => acquired.has(c.cardId));
  });
  const sources = [
    ...[...acquired].sort().map((id) => ({ kind: "design", id, xp: rule.designXP })),
    ...completed.sort().map((id) => ({ kind: "album", id, xp: rule.albumXP })),
  ];
  const rawXP = sources.reduce((sum, s) => sum + s.xp, 0);
  const cap = (rule.maxLevel - 1) * rule.step;
  const xp = Math.min(rawXP, cap);
  return {
    status: "local-preview",
    ruleVersion: rule.id,
    candidate,
    actorId: owner.actorId,
    visibilityKey: catalogue.visibilityKey,
    catalogueVersion: catalogue.version,
    rawXP,
    xp,
    cap,
    level: Math.floor(xp / rule.step) + 1,
    step: rule.step,
    nextXP: xp === cap ? null : rule.step - (xp % rule.step),
    cappedXP: rawXP - xp,
    designs: acquired.size,
    albums: completed.length,
    sources,
  };
}
