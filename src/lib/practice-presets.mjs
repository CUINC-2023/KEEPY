import { validPracticeItems } from "./play-practice.mjs";

// Draft shortcuts use only parameters already accepted by the existing practice contract.
export const PRACTICE_PRESETS = Object.freeze([
  { id: "quick", title: { "zh-TW": "快速知識練習", en: "Quick knowledge practice" } },
  { id: "review", title: { "zh-TW": "知識與觀察", en: "Knowledge and observation" } },
  { id: "five", title: { "zh-TW": "五玩法體驗", en: "Try five modes" } },
]);
export function practicePreset(id) {
  if (typeof id !== "string") return null;
  const modes = {
    quick: ["knowledge"],
    review: ["knowledge", "observation"],
    five: ["memory", "puzzle", "sequence", "knowledge", "observation"],
  };
  if (!Object.hasOwn(modes, id)) return null;
  const items = modes[id].map((mode) => ({ mode, difficulty: "easy" }));
  return validPracticeItems(items) ? items : null;
}
