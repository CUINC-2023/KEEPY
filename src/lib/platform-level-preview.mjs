export const PLATFORM_LEVEL_RULE = Object.freeze({
  id: "platform-preview-v1",
  cap: 4,
  kinds: Object.freeze(["profile", "first", "album", "vote"]),
});
export function previewPlatformLevel(owner, collection, participation) {
  if (!owner?.actorId || owner.actorId !== collection?.actorId || !participation) return null;
  const enabled = new Set(participation.tasks.filter((t) => t.enabled).map((t) => t.id));
  const reasons = [];
  const sources = PLATFORM_LEVEL_RULE.kinds.flatMap((id) => {
    const task = owner.tasks.find(
      (t) =>
        t.id === id &&
        Number.isSafeInteger(t.ruleVersion) &&
        t.ruleVersion > 0 &&
        Number.isFinite(Date.parse(t.completedAt)),
    );
    if (!enabled.has(id) || !task) {
      reasons.push({
        id,
        code: enabled.has(id) ? "no-valid-snapshot" : "not-currently-public",
        snapshotVersion: task?.ruleVersion ?? null,
      });
      return [];
    }
    const valid =
      id === "profile"
        ? collection.profile.version > 1
        : id === "first"
          ? collection.acquiredCards.length > 0
          : id === "album"
            ? collection.progress.some((p) => p.total > 0)
            : owner.votes.some((v) =>
                participation.rounds.some(
                  (r) =>
                    r.id === v.round_id &&
                    r.kind === "theme" &&
                    r.options.some((o) => o.id === v.option_id),
                ),
              );
    if (!valid)
      reasons.push({
        id,
        code: "current-source-condition-not-met",
        snapshotVersion: task.ruleVersion,
      });
    return valid ? [{ id, ruleVersion: task.ruleVersion, completedAt: task.completedAt }] : [];
  });
  return {
    status: "local-preview",
    ruleVersion: PLATFORM_LEVEL_RULE.id,
    actorId: owner.actorId,
    participationVersion: participation.version,
    completed: sources.length,
    cap: PLATFORM_LEVEL_RULE.cap,
    stage: sources.length,
    sources,
    reasons,
  };
}
