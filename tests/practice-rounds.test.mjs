import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { playMe, playCommand } from "../local-test/play.mjs";
import { puzzleStart, puzzleAction } from "../src/lib/collection-extra-play.mjs";
import { validPracticeItems, practiceStep, practiceRoundCount } from "../src/lib/play-practice.mjs";
import { isPlayProjection } from "../src/lib/play-contract.mjs";
let fault = false;
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-rounds-")), "qa.sqlite"),
  await loadCatalog(),
  {
    fault: (s) => {
      if (fault && s === "after-play-write") throw Error("isolated round rollback");
    },
  },
);
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    cat = d.collectionCatalogue(),
    card = cat.cards[0],
    items = [{ mode: "puzzle", difficulty: "easy", hints: "none", rounds: 2 }];
  d.db.prepare("INSERT INTO holdings VALUES(?,?,?)").run("member-a", card.cardId, 1);
  assert.equal(validPracticeItems(items), true);
  assert.equal(validPracticeItems([{ ...items[0], rounds: 6 }]), false);
  assert.equal(practiceRoundCount(items), 2);
  assert.equal(practiceStep(items, 1).round, 2);
  assert.equal(practiceStep(items, 2), null);
  const send = (action, data, key) =>
      playCommand(d, a, { action, expectedVersion: playMe(d, a).settings.version, data }, key),
    plan = { items, paused: false, restart: true, cancel: false };
  send("practice", plan, "qa-round-plan");
  const proof = (seed) => {
    let s = puzzleStart([card.cardId], "easy", seed);
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
  const p = proof(1);
  send("result", p, "qa-first");
  send("result", p, "qa-first-other-key");
  assert.equal(playMe(d, a).settings.data.practice.completed, 1);
  send("practice", { ...plan, paused: true, restart: false }, "qa-round-pause");
  send("result", proof(2), "qa-not-counted-paused");
  assert.equal(playMe(d, a).settings.data.practice.completed, 1);
  send("practice", { ...plan, restart: false }, "qa-round-resume");
  const before = playMe(d, a);
  fault = true;
  assert.throws(() => send("result", proof(3), "qa-round-fault"));
  assert.deepEqual(playMe(d, a), before);
  fault = false;
  send("result", proof(3), "qa-round-fault");
  const result = playMe(d, a);
  assert.equal(result.settings.data.practice.completed, 2);
  assert.equal(result.settings.data.practice.roundSummaries.length, 2);
  assert.equal(result.settings.data.practice.ruleVersion, "local-practice-v3");
  assert.equal(isPlayProjection(result), true);
  assert.equal(playMe(d, b).settings.data.practice, undefined);
  d.db.prepare("DELETE FROM holdings WHERE user_id=?").run("member-a");
  assert.equal(playMe(d, a).settings.data.practice.invalidated, true);
  assert.deepEqual(playMe(d, a).settings.data.practice.roundSummaries, []);
  console.log(
    "Bounded multiround same source, legacy compatibility, stage/pause/key dedupe, atomic rollback, summary and account/current-material masking PASS",
  );
} finally {
  d.close();
}
