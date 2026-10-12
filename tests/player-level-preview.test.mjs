import assert from "node:assert/strict";
import { previewPlayerLevel } from "../src/lib/player-level-preview.mjs";
const cards = [
    { cardId: "one", poolId: "p", rarity: "C", cardVersion: 1 },
    { cardId: "two", poolId: "p", rarity: "R", cardVersion: 1 },
  ],
  catalogue = { visibilityKey: "visible", version: 1, cards, pools: [{ poolId: "p" }] },
  owner = {
    actorId: "a",
    visibilityKey: "visible",
    acquiredCards: [...cards, ...cards],
    progress: [],
  };
const before = JSON.stringify({ owner, catalogue });
const a = previewPlayerLevel(owner, catalogue),
  b = previewPlayerLevel(owner, catalogue, "B");
assert.equal(a.xp, 20);
assert.equal(b.xp, 45);
assert.equal(a.designs, 2);
assert.equal(a.albums, 1);
assert.equal(JSON.stringify({ owner, catalogue }), before);
assert.equal(previewPlayerLevel({ ...owner, visibilityKey: "old" }, catalogue), null);
assert.equal(previewPlayerLevel({ ...owner, actorId: "" }, catalogue), null);
assert.throws(() => previewPlayerLevel(owner, catalogue, "official"));
const hidden = { ...catalogue, cards: [cards[0]] };
assert.equal(previewPlayerLevel(owner, hidden).designs, 1);
assert.ok(!JSON.stringify(previewPlayerLevel(owner, hidden)).includes("two"));
assert.equal(
  previewPlayerLevel(
    {
      ...owner,
      acquiredCards: [
        { ...cards[0], cardVersion: 2 },
        { ...cards[1], poolId: "other" },
      ],
    },
    catalogue,
  ).xp,
  0,
);
const huge = Array.from({ length: 300 }, (_, i) => ({ ...cards[0], cardId: "design-" + i }));
const capped = previewPlayerLevel({ ...owner, acquiredCards: huge }, { ...catalogue, cards: huge });
assert.equal(capped.level, 20);
assert.equal(capped.xp, 1900);
assert.equal(capped.cappedXP, 1100);
assert.equal(capped.nextXP, null);
console.log(
  "PASS preview distinct sources, candidate comparison, cap, visibility, identity and no writes",
);
