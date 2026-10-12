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
        exact(i, ["mode", "difficulty"]) &&
        PLAY_MODES.includes(i.mode) &&
        PLAY_DIFFICULTIES.includes(i.difficulty),
    ) &&
    new Set(items.map((i) => i.mode + ":" + i.difficulty)).size === items.length
  );
}
export function validPracticeStored(v) {
  return (
    exact(v, ["schema", "ruleVersion", "items", "startedAt", "paused", "resultIds"]) &&
    v.schema === 1 &&
    v.ruleVersion === "local-practice-v1" &&
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
    v.ruleVersion === "local-practice-v1" &&
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
