import { PLAY_MODES, PLAY_DIFFICULTIES } from "./collection-play.mjs";
import { MEMORY_RULE_VERSION, validMemoryConfig } from "./collection-play.mjs";
const exact = (v, keys) =>
  !!v &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  Object.keys(v).sort().join() === keys.slice().sort().join();
const integer = (v, min = 0) => Number.isSafeInteger(v) && v >= min;
const text = (v, max = 512) => typeof v === "string" && v.length > 0 && v.length <= max;
/** Internal settings validation; never a public projection or permission grant. */
export function validStoredPlaySettings(v) {
  if (
    !exact(v, [
      "schema",
      "lastMode",
      "difficulty",
      ...(v?.journey !== undefined ? ["journey"] : []),
    ]) ||
    v.schema !== 1 ||
    !PLAY_MODES.includes(v.lastMode) ||
    !PLAY_DIFFICULTIES.includes(v.difficulty)
  )
    return false;
  const j = v.journey;
  return (
    j === undefined ||
    (exact(j, ["schema", "ruleVersion", "modes", "startedAt", "paused", "resultIds"]) &&
      j.schema === 1 &&
      j.ruleVersion === "local-mixed-journey-v1" &&
      Array.isArray(j.modes) &&
      j.modes.length >= 2 &&
      j.modes.length <= 3 &&
      new Set(j.modes).size === j.modes.length &&
      j.modes.every((m) => PLAY_MODES.includes(m)) &&
      text(j.startedAt, 64) &&
      Number.isFinite(Date.parse(j.startedAt)) &&
      typeof j.paused === "boolean" &&
      Array.isArray(j.resultIds) &&
      j.resultIds.length <= j.modes.length &&
      new Set(j.resultIds).size === j.resultIds.length &&
      j.resultIds.every((id) => text(id, 128)))
  );
}
const row = (v) =>
  exact(v, [
    "id",
    "at",
    "mode",
    "difficulty",
    "ruleVersion",
    "sourceVersion",
    "moves",
    "correct",
    "total",
    ...(v?.ruleVersion === MEMORY_RULE_VERSION ? ["memoryConfig", "hintsUsed"] : []),
  ]) &&
  text(v.id, 128) &&
  text(v.at, 64) &&
  Number.isFinite(Date.parse(v.at)) &&
  PLAY_MODES.includes(v.mode) &&
  PLAY_DIFFICULTIES.includes(v.difficulty) &&
  text(v.ruleVersion, 128) &&
  (v.ruleVersion !== MEMORY_RULE_VERSION ||
    (v.mode === "memory" &&
      validMemoryConfig(v.memoryConfig) &&
      integer(v.hintsUsed) &&
      v.hintsUsed <= 3)) &&
  integer(v.sourceVersion) &&
  integer(v.correct) &&
  integer(v.total, 1) &&
  v.total <= 120 &&
  v.correct <= v.total &&
  (v.mode === "memory" ? integer(v.moves, 1) && v.moves <= 500 : v.moves === null);
/** Read-only projection whitelist; legacy rule labels are retained, never promoted to current rules. */
export function isPlayProjection(v) {
  return (
    exact(v, [
      "schema",
      "source",
      "actorId",
      "visibilityKey",
      "settings",
      "page",
      "pages",
      "total",
      "rows",
      "best",
      "officialXP",
      "ranking",
      "rewards",
    ]) &&
    v.schema === 1 &&
    v.source === "local-SQLite-private-play" &&
    text(v.actorId, 128) &&
    text(v.visibilityKey) &&
    exact(v.settings, ["version", "data"]) &&
    integer(v.settings.version) &&
    exact(v.settings.data, [
      "schema",
      "lastMode",
      "difficulty",
      ...(v.settings.data?.journey ? ["journey"] : []),
    ]) &&
    (!v.settings.data.journey ||
      (exact(v.settings.data.journey, [
        "schema",
        "ruleVersion",
        "modes",
        "startedAt",
        "paused",
        "completed",
        "invalidated",
      ]) &&
        v.settings.data.journey.schema === 1 &&
        v.settings.data.journey.ruleVersion === "local-mixed-journey-v1" &&
        Array.isArray(v.settings.data.journey.modes) &&
        v.settings.data.journey.modes.length >= 2 &&
        v.settings.data.journey.modes.length <= 3 &&
        new Set(v.settings.data.journey.modes).size === v.settings.data.journey.modes.length &&
        v.settings.data.journey.modes.every((m) => PLAY_MODES.includes(m)) &&
        text(v.settings.data.journey.startedAt, 64) &&
        Number.isFinite(Date.parse(v.settings.data.journey.startedAt)) &&
        typeof v.settings.data.journey.paused === "boolean" &&
        typeof v.settings.data.journey.invalidated === "boolean" &&
        integer(v.settings.data.journey.completed) &&
        v.settings.data.journey.completed <= v.settings.data.journey.modes.length)) &&
    v.settings.data.schema === 1 &&
    PLAY_MODES.includes(v.settings.data.lastMode) &&
    PLAY_DIFFICULTIES.includes(v.settings.data.difficulty) &&
    integer(v.page, 1) &&
    integer(v.pages, 1) &&
    v.page <= v.pages &&
    integer(v.total) &&
    v.pages === Math.max(1, Math.ceil(v.total / 20)) &&
    Array.isArray(v.rows) &&
    v.rows.length <= 20 &&
    v.rows.every(row) &&
    v.rows.length === Math.min(20, Math.max(0, v.total - (v.page - 1) * 20)) &&
    new Set(v.rows.map((r) => r.id)).size === v.rows.length &&
    Array.isArray(v.best) &&
    v.best.length <= 9 &&
    v.best.every(row) &&
    new Set(v.best.map((r) => r.mode + ":" + r.difficulty)).size === v.best.length &&
    v.officialXP === false &&
    v.ranking === false &&
    v.rewards === false
  );
}
