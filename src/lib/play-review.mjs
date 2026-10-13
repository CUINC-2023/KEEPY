const exact = (v, keys) =>
  !!v &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  Object.keys(v).sort().join() === keys.slice().sort().join();
const text = (v, max = 128) => typeof v === "string" && v.length > 0 && v.length <= max;
const bi = (v) => exact(v, ["zh-TW", "en"]) && text(v["zh-TW"], 2000) && text(v.en, 2000);
export function validQuizReview(v) {
  return (
    exact(v, ["schema", "questions"]) &&
    v.schema === 1 &&
    Array.isArray(v.questions) &&
    v.questions.length >= 2 &&
    v.questions.length <= 6 &&
    new Set(v.questions.map((q) => q?.id)).size === v.questions.length &&
    v.questions.every(validReviewQuestion)
  );
}
export function currentQuizQuestion(saved, current) {
  if (!current) return false;
  const { selected, ...snapshot } = saved;
  return JSON.stringify(snapshot) === JSON.stringify(current);
}
export function isMistakesProjection(v) {
  return (
    exact(v, [
      "schema",
      "source",
      "actorId",
      "visibilityKey",
      "page",
      "pages",
      "pageSize",
      "total",
      "rows",
      "legacyWithoutReview",
      "historyLimited",
    ]) &&
    v.schema === 1 &&
    v.source === "local-private-current-quiz-review" &&
    text(v.actorId) &&
    text(v.visibilityKey, 512) &&
    Number.isSafeInteger(v.total) &&
    v.total >= 0 &&
    v.total <= 600 &&
    v.pageSize === 20 &&
    v.pages === Math.max(1, Math.ceil(v.total / 20)) &&
    Number.isSafeInteger(v.page) &&
    v.page >= 1 &&
    v.page <= v.pages &&
    typeof v.historyLimited === "boolean" &&
    Number.isSafeInteger(v.legacyWithoutReview) &&
    v.legacyWithoutReview >= 0 &&
    v.legacyWithoutReview <= 100 &&
    Array.isArray(v.rows) &&
    v.rows.length === Math.min(20, Math.max(0, v.total - (v.page - 1) * 20)) &&
    v.rows.every(
      (r) =>
        exact(r, ["resultId", "at", "mode", "difficulty", "ruleVersion", "question"]) &&
        text(r.resultId) &&
        text(r.at, 64) &&
        Number.isFinite(Date.parse(r.at)) &&
        ["knowledge", "observation"].includes(r.mode) &&
        ["easy", "standard", "hard"].includes(r.difficulty) &&
        text(r.ruleVersion) &&
        validReviewQuestion(r.question) &&
        r.question.selected !== r.question.answer,
    )
  );
}
function validReviewQuestion(q) {
  return (
    exact(q, [
      "id",
      "cardId",
      "poolId",
      "cardVersion",
      "sourceVersion",
      "source",
      "prompt",
      "options",
      "answer",
      "explanation",
      "selected",
    ]) &&
    text(q.id) &&
    text(q.cardId) &&
    text(q.poolId) &&
    Number.isSafeInteger(q.cardVersion) &&
    q.cardVersion >= 1 &&
    Number.isSafeInteger(q.sourceVersion) &&
    q.sourceVersion >= 0 &&
    q.source === "current-authorized-collection-definition" &&
    bi(q.prompt) &&
    bi(q.explanation) &&
    Array.isArray(q.options) &&
    q.options.length >= 2 &&
    q.options.length <= 120 &&
    new Set(q.options.map((o) => o?.id)).size === q.options.length &&
    q.options.every((o) => exact(o, ["id", "label"]) && text(o.id) && bi(o.label)) &&
    q.options.some((o) => o.id === q.answer) &&
    q.options.some((o) => o.id === q.selected)
  );
}
