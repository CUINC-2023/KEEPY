import assert from "node:assert/strict";
import { PRACTICE_PRESETS, practicePreset } from "../src/lib/practice-presets.mjs";
import {
  validPracticeItems,
  practiceRuleVersion,
  practiceRoundCount,
} from "../src/lib/play-practice.mjs";
for (const p of PRACTICE_PRESETS) {
  const draft = practicePreset(p.id);
  assert.ok(validPracticeItems(draft));
  assert.ok(practiceRuleVersion(draft));
  assert.ok(practiceRoundCount(draft) <= 30);
  assert.ok(p.title.en && p.title["zh-TW"]);
  draft[0].difficulty = "unapproved";
  assert.ok(
    validPracticeItems(practicePreset(p.id)),
    "Draft mutation must not change reusable presets",
  );
  assert.equal(validPracticeItems(draft), false);
}
for (const id of ["__proto__", "constructor", "other", null, {}, []])
  assert.equal(practicePreset(id), null);
assert.equal(new Set(practicePreset("five").map((i) => i.mode)).size, 5);
console.log(
  "Practice draft presets preserve existing versioned contract; no automatic save, awards or rule changes.",
);
