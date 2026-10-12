export function nextCollectionStep(owner) {
  const visible = owner?.progress?.filter((p) => p.total > 0) ?? [];
  if (!visible.length) return { kind: "explore", reason: "no-public-albums" };
  if (!owner.acquiredCards.length) return { kind: "explore", reason: "first-collection" };
  if (
    (owner.profile.data.goalPoolIds ?? []).some((id) =>
      visible.some((p) => p.poolId === id && !p.complete),
    )
  )
    return { kind: "goals", reason: "selected-incomplete" };
  if (visible.some((p) => !p.complete)) return { kind: "albums", reason: "public-incomplete" };
  return { kind: "showcase", reason: "current-public-complete" };
}
