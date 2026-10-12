import assert from "node:assert/strict";
import { memoryStart, memoryAction, replayMemory, shuffle } from "../src/lib/collection-play.mjs";
assert.deepEqual(shuffle([1, 2, 3, 4], 9), shuffle([1, 2, 3, 4], 9));
assert.throws(() => memoryStart(["a", "a"], "easy"));
assert.throws(() => memoryStart(["a", "b"], "unknown"));
let s = memoryStart(["a", "b", "c"], "easy", 42);
const paused = memoryAction(s, { type: "pause" });
assert.equal(memoryAction(paused, { type: "flip", index: 0 }), paused);
assert.equal(memoryAction(s, { type: "flip", index: 99 }), s);
for (const id of s.cardIds) {
  for (const i of s.deck.flatMap((v, i) => (v === id ? [i] : [])))
    s = memoryAction(s, { type: "flip", index: i });
}
assert.equal(s.complete, true);
assert.equal(s.moves, 2);
assert.equal(replayMemory(s).correct, 2);
assert.equal(memoryAction(s, { type: "flip", index: 0 }), s);
console.log(
  "PASS deterministic legal pairs, distinct difficulty, pause/input bounds, completion replay and no reward state",
);
const { playQuestions, quizStart, quizAnswer } = await import("../src/lib/play-questions.mjs");
const cat = {
  visibilityKey: "v",
  version: 1,
  cards: [
    { cardId: "a", poolId: "p", rarity: "C", cardVersion: 1 },
    { cardId: "b", poolId: "q", rarity: "R", cardVersion: 1 },
  ],
  pools: [
    { poolId: "p", title: { "zh-TW": "P", en: "P" } },
    { poolId: "q", title: { "zh-TW": "Q", en: "Q" } },
  ],
};
const me = { actorId: "a", visibilityKey: "v", cards: [{ ...cat.cards[0], name: "A", count: 1 }] };
const questions = playQuestions(me, cat);
assert.equal(questions.length, 2);
assert.ok(questions.every((q) => q.cardId === "a"));
assert.equal(playQuestions({ ...me, visibilityKey: "old" }, cat).length, 0);
assert.throws(() => quizStart(questions, "hard"));
let quiz = quizStart(questions);
assert.throws(() => quizAnswer(quiz, "private"));
quiz = quizAnswer(quiz, quiz.questions[0].answer);
quiz = quizAnswer(quiz, quiz.questions[1].answer);
assert.equal(quiz.complete, true);
console.log(
  "PASS verified question sources, visibility/held limits, difficulty shortage and controlled answers",
);
