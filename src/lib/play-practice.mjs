import { PLAY_MODES, PLAY_DIFFICULTIES } from "./collection-play.mjs";
const exact = (v, keys) =>
  v &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  Object.keys(v).sort().join() === keys.slice().sort().join();
export function validPracticeItems(items) {
  return (
    Array.isArray(items) &&
    items.length >= 1 &&
    items.length <= 12 &&
    items.every(
      (i) =>
        exact(i, [
          "mode",
          "difficulty",
          ...(i?.hints !== undefined ? ["hints"] : []),
          ...(i?.rounds !== undefined ? ["rounds"] : []),
        ]) &&
        (i.rounds === undefined ||
          (Number.isSafeInteger(i.rounds) && i.rounds >= 1 && i.rounds <= 5)) &&
        PLAY_MODES.includes(i.mode) &&
        PLAY_DIFFICULTIES.includes(i.difficulty) &&
        (i.hints === undefined ||
          (["memory", "puzzle", "sequence"].includes(i.mode) &&
            ["none", "allowed"].includes(i.hints))),
    ) &&
    practiceRoundCount(items) <= 30 &&
    new Set(items.map((i) => i.mode + ":" + i.difficulty + ":" + (i.hints ?? "legacy"))).size ===
      items.length
  );
}
export function validPracticeStored(v) {
  return (
    exact(v, ["schema", "ruleVersion", "items", "startedAt", "paused", "resultIds"]) &&
    v.schema === 1 &&
    v.ruleVersion === practiceRuleVersion(v.items) &&
    validPracticeItems(v.items) &&
    typeof v.startedAt === "string" &&
    v.startedAt.length <= 64 &&
    Number.isFinite(Date.parse(v.startedAt)) &&
    typeof v.paused === "boolean" &&
    Array.isArray(v.resultIds) &&
    v.resultIds.length <= practiceRoundCount(v.items) &&
    new Set(v.resultIds).size === v.resultIds.length &&
    v.resultIds.every((id) => typeof id === "string" && id.length > 0 && id.length <= 128)
  );
}
export function validPracticeProjection(v) {
  return (
    exact(v, [
      "schema",
      "ruleVersion",
      "items",
      "startedAt",
      "paused",
      "completed",
      "invalidated",
      ...(v?.roundSummaries !== undefined ? ["roundSummaries"] : []),
    ]) &&
    v.schema === 1 &&
    v.ruleVersion === practiceRuleVersion(v.items) &&
    validPracticeItems(v.items) &&
    typeof v.startedAt === "string" &&
    v.startedAt.length <= 64 &&
    Number.isFinite(Date.parse(v.startedAt)) &&
    typeof v.paused === "boolean" &&
    typeof v.invalidated === "boolean" &&
    Number.isSafeInteger(v.completed) &&
    v.completed >= 0 &&
    v.completed <= practiceRoundCount(v.items) &&
    (!v.invalidated || v.completed === 0) &&
    (v.roundSummaries === undefined ||
      (Array.isArray(v.roundSummaries) &&
        v.roundSummaries.length === v.completed &&
        v.roundSummaries.every(
          (r, i) =>
            exact(r, ["position", "mode", "difficulty", "ruleVersion", "correct", "total"]) &&
            r.position === i + 1 &&
            practiceStep(v.items, i)?.mode === r.mode &&
            practiceStep(v.items, i)?.difficulty === r.difficulty &&
            typeof r.ruleVersion === "string" &&
            r.ruleVersion.length <= 128 &&
            Number.isSafeInteger(r.correct) &&
            r.correct >= 0 &&
            Number.isSafeInteger(r.total) &&
            r.total >= r.correct &&
            r.total >= 1 &&
            r.total <= 120,
        )))
  );
}
export function practiceRuleVersion(items) {
  if (Array.isArray(items) && items.some((i) => i?.rounds !== undefined))
    return "local-practice-v3";
  return Array.isArray(items) && items.some((i) => i?.hints !== undefined)
    ? "local-practice-v2"
    : "local-practice-v1";
}
export function practiceRoundCount(items) {
  return Array.isArray(items) ? items.reduce((n, i) => n + (i?.rounds ?? 1), 0) : 0;
}
export function practiceStep(items, completed) {
  if (!Array.isArray(items) || !Number.isSafeInteger(completed) || completed < 0) return null;
  let start = 0;
  for (let index = 0; index < items.length; index++) {
    const rounds = items[index].rounds ?? 1;
    if (completed < start + rounds) return { ...items[index], index, round: completed - start + 1 };
    start += rounds;
  }
  return null;
}
export function practiceResultMatches(item, result) {
  return (
    !!item &&
    !!result &&
    item.mode === result.mode &&
    item.difficulty === result.difficulty &&
    (item.hints === undefined ||
      (Number.isSafeInteger(result.assistance?.hintsUsed) &&
        result.assistance.hintsUsed >= 0 &&
        result.assistance.hintsUsed <= 3 &&
        (item.hints !== "none" || result.assistance.hintsUsed === 0)))
  );
}
