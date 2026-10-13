import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { playMe, playCommand } from "../local-test/play.mjs";
import { puzzleStart, puzzleAction } from "../src/lib/collection-extra-play.mjs";
import { validPracticeItems, practiceResultMatches } from "../src/lib/play-practice.mjs";
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-challenge-")), "qa.sqlite"),
  await loadCatalog(),
);
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    o = d.session("official-a"),
    cat = d.collectionCatalogue(),
    card = cat.cards[0];
  d.db.prepare("INSERT INTO holdings VALUES(?,?,?)").run("member-a", card.cardId, 1);
  const item = { mode: "puzzle", difficulty: "easy", hints: "none" };
  assert.equal(validPracticeItems([item]), true);
  assert.equal(validPracticeItems([{ ...item, mode: "knowledge" }]), false);
  assert.equal(validPracticeItems([{ ...item, hints: "unlimited" }]), false);
  assert.equal(validPracticeItems([{ ...item, owner: "member-b" }]), false);
  assert.equal(practiceResultMatches(item, { mode: "puzzle", difficulty: "easy" }), false);
  const command = (action, data, key) =>
    playCommand(d, a, { action, expectedVersion: playMe(d, a).settings.version, data }, key);
  command(
    "practice",
    { items: [item], paused: false, restart: true, cancel: false },
    "qa-hint-plan",
  );
  assert.equal(playMe(d, a).settings.data.practice.ruleVersion, "local-practice-v2");
  const proof = (seed, hint) => {
    let s = puzzleStart([card.cardId], "easy", seed);
    if (hint) s = puzzleAction(s, { type: "hint" });
    for (let i = 0; i < s.tiles.length; i++) {
      const from = s.tiles.indexOf(i);
      if (from !== i) s = puzzleAction(s, { type: "swap", from, to: i });
    }
    return {
      mode: "puzzle",
      difficulty: "easy",
      ruleVersion: s.ruleVersion,
      seed,
      cardIds: [card.cardId],
      cardVersions: [card.cardVersion],
      visibilityKey: cat.visibilityKey,
      events: s.events,
    };
  };
  command("result", proof(1, true), "qa-hinted-result");
  assert.equal(playMe(d, a).settings.data.practice.completed, 0);
  command("result", proof(2, false), "qa-unassisted-result");
  assert.equal(playMe(d, a).settings.data.practice.completed, 1);
  assert.equal(playMe(d, b).settings.data.practice, undefined);
  assert.throws(() =>
    playCommand(
      d,
      o,
      {
        action: "practice",
        expectedVersion: 0,
        data: { items: [item], paused: false, restart: true, cancel: false },
      },
      "qa-role",
    ),
  );
  assert.equal(playMe(d, a).officialXP, false);
  console.log(
    "Versioned controlled hint policy, server-replayed assistance match, exact fields, account isolation and no official scoring PASS",
  );
} finally {
  d.close();
}
