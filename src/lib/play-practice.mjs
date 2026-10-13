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
        exact(i, ["mode", "difficulty", ...(i?.hints !== undefined ? ["hints"] : [])]) &&
        PLAY_MODES.includes(i.mode) &&
        PLAY_DIFFICULTIES.includes(i.difficulty) &&
        (i.hints === undefined ||
          (["memory", "puzzle", "sequence"].includes(i.mode) &&
            ["none", "allowed"].includes(i.hints))),
    ) &&
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
    v.resultIds.length <= v.items.length &&
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
    v.completed <= v.items.length &&
    (!v.invalidated || v.completed === 0)
  );
}
export function practiceRuleVersion(items) {
  return Array.isArray(items) && items.some((i) => i?.hints !== undefined)
    ? "local-practice-v2"
    : "local-practice-v1";
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
