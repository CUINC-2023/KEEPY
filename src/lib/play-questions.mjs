import { shuffle, PLAY_DIFFICULTIES, PLAY_RULE_VERSION } from "./collection-play.mjs";
const bi = (zh, en) => ({ "zh-TW": zh, en });
export function playQuestions(owner, catalogue, mode = "knowledge") {
  if (
    !owner?.actorId ||
    owner.visibilityKey !== catalogue?.visibilityKey ||
    !["knowledge", "observation"].includes(mode)
  )
    return [];
  const visible = new Map(catalogue.cards.map((c) => [c.cardId, c]));
  const held = owner.cards.filter(
      (c) => c.count > 0 && visible.get(c.cardId)?.cardVersion === c.cardVersion,
    ),
    rarities = [...new Set(catalogue.cards.map((c) => c.rarity))],
    questions = [];
  for (const card of held) {
    const pool = catalogue.pools.find((p) => p.poolId === card.poolId);
    if (!pool) continue;
    const base = {
      cardId: card.cardId,
      poolId: card.poolId,
      cardVersion: card.cardVersion,
      sourceVersion: catalogue.version,
      source: "current-authorized-collection-definition",
    };
    if (mode === "knowledge" && catalogue.pools.length > 1)
      questions.push({
        ...base,
        id: card.cardId + ":pool",
        prompt: bi(
          "「" + card.name + "」屬於哪套目前公開系列？",
          "Which currently public series contains “" + card.name + "”?",
        ),
        options: catalogue.pools.map((p) => ({ id: p.poolId, label: p.title })),
        answer: card.poolId,
        explanation: bi(
          "依目前系列關聯：" + pool.title["zh-TW"],
          "Current series relation: " + pool.title.en,
        ),
      });
    if (rarities.length > 1)
      questions.push({
        ...base,
        id: card.cardId + ":rarity",
        prompt: bi(
          mode === "observation"
            ? "觀察卡面與框架，這張卡目前的稀有度是？"
            : "「" + card.name + "」記錄的稀有度是？",
          mode === "observation"
            ? "Observe the face and frame: what is its current rarity?"
            : "What rarity is recorded for “" + card.name + "”?",
        ),
        options: rarities.map((r) => ({ id: r, label: bi(r, r) })),
        answer: card.rarity,
        explanation: bi(
          "目前稀有度：" + card.rarity + "，與成長等級及卡牌版本分開。",
          "Current rarity: " + card.rarity + ", separate from growth level and card version.",
        ),
      });
  }
  return questions;
}
export function quizStart(questions, difficulty = "easy", seed = 1) {
  if (!PLAY_DIFFICULTIES.includes(difficulty)) throw Error("Unknown difficulty");
  const count = { easy: 2, standard: 4, hard: 6 }[difficulty];
  if (questions.length < count) throw Error("Insufficient verified questions");
  return {
    schema: 1,
    ruleVersion: PLAY_RULE_VERSION,
    difficulty,
    seed,
    questions: shuffle(questions, seed).slice(0, count),
    answers: [],
    paused: false,
    complete: false,
  };
}
export function quizAnswer(state, answer) {
  if (state.complete || state.paused) return state;
  const q = state.questions[state.answers.length];
  if (!q.options.some((o) => o.id === answer)) throw Error("Unknown answer");
  const answers = [...state.answers, answer];
  return { ...state, answers, complete: answers.length === state.questions.length };
}
