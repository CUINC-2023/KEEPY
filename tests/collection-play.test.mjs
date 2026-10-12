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
