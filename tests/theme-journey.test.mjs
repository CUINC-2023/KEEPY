import assert from "node:assert/strict";
import { previewThemeJourney } from "../src/lib/theme-journey.mjs";
const title = { "zh-TW": "QA", en: "QA" },
  cards = [
    { cardId: "one", poolId: "p", rarity: "C", cardVersion: 1 },
    { cardId: "two", poolId: "q", rarity: "C", cardVersion: 1 },
  ],
  cat = {
    visibilityKey: "v",
    version: 1,
    cards,
    pools: [
      { poolId: "p", title, visibleDesigns: 1 },
      { poolId: "q", title, visibleDesigns: 1 },
    ],
  },
  owner = {
    actorId: "a",
    visibilityKey: "v",
    acquiredCards: [cards[0], cards[0]],
    awards: [],
    profile: { data: { goalPoolIds: ["p", "p", "unknown", "q"] } },
  };
const v = previewThemeJourney(owner, cat);
assert.equal(v.chapters.length, 2);
assert.equal(v.completed, 1);
assert.equal(v.nextPoolId, "q");
assert.equal(v.rewards, false);
assert.equal(v.chapters[0].owned, 1);
assert.equal(previewThemeJourney({ ...owner, visibilityKey: "old" }, cat), null);
assert.equal(previewThemeJourney(owner, { ...cat, cards: [] }).chapters.length, 0);
assert.ok(!JSON.stringify(v).includes("unknown"));
assert.equal(previewThemeJourney({ ...owner, profile: { data: {} } }, cat).chapters.length, 0);
console.log(
  "PASS private saved goals, duplicate-free chapter completion, denominator validation and hidden masking",
);
