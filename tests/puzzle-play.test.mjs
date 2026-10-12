import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  puzzleStart,
  puzzleAction,
  PUZZLE_RULE_VERSION,
} from "../src/lib/collection-extra-play.mjs";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { playCommand, playMe } from "../local-test/play.mjs";
import { isPlayProjection } from "../src/lib/play-contract.mjs";
const solve = (s) => {
  for (let i = 0; i < s.tiles.length; i++) {
    const from = s.tiles.indexOf(i);
    if (from !== i) s = puzzleAction(s, { type: "swap", from, to: i });
  }
  return s;
};
for (const difficulty of ["easy", "standard", "hard"]) {
  let s = puzzleStart(["eligible"], difficulty, 17);
  assert.equal(s.complete, false);
  s = puzzleAction(s, { type: "hint" });
  assert.equal(s.moves, 0);
  s = puzzleAction(s, { type: "pause" });
  assert.equal(puzzleAction(s, { type: "swap", from: 0, to: 1 }), s);
  s = puzzleAction(s, { type: "pause" });
  s = solve(s);
  assert.equal(s.complete, true);
  assert.ok(s.moves > 0);
  assert.equal(puzzleAction(s, { type: "hint" }), s);
}
assert.throws(() => puzzleStart([]));
let bounded = puzzleStart(["eligible"], "easy", 17);
for (let i = 0; i < 500; i++) bounded = puzzleAction(bounded, { type: "pause" });
assert.equal(bounded.events.length, 500);
assert.throws(() => puzzleAction(bounded, { type: "pause" }), /Bounded round exceeded/);
assert.equal(bounded.events.length, 500);
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-puzzle-")), "qa.sqlite"),
  await loadCatalog(),
);
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    o = d.session("official-a"),
    cat = d.collectionCatalogue(),
    card = cat.cards[0];
  d.db.prepare("INSERT INTO holdings VALUES(?,?,?)").run("member-a", card.cardId, 1);
  const asset = () =>
      JSON.stringify(
        ["holdings", "ledger", "asset_events", "collection_awards", "document_versions"].map((t) =>
          d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all(),
        ),
      ),
    before = asset(),
    s = solve(puzzleStart([card.cardId], "easy", 17)),
    proof = {
      mode: "puzzle",
      difficulty: "easy",
      seed: 17,
      ruleVersion: PUZZLE_RULE_VERSION,
      visibilityKey: cat.visibilityKey,
      cardIds: [card.cardId],
      cardVersions: [card.cardVersion],
      events: s.events,
    },
    input = { action: "result", expectedVersion: 0, data: proof };
  const result = playCommand(d, a, input, "qa-puzzle-result");
  assert.deepEqual(playCommand(d, a, input, "qa-puzzle-result"), result);
  assert.equal(playMe(d, a).rows[0].moves, s.moves);
  assert.equal(isPlayProjection(playMe(d, a)), true);
  assert.equal(playMe(d, b).total, 0);
  assert.throws(() => playCommand(d, b, input, "qa-puzzle-foreign"));
  assert.throws(() => playCommand(d, o, input, "qa-puzzle-official"));
  assert.throws(() =>
    playCommand(
      d,
      a,
      { ...input, expectedVersion: 1, data: { ...proof, ruleVersion: "local-play-v1" } },
      "qa-puzzle-wrong-version",
    ),
  );
  assert.throws(() =>
    playCommand(
      d,
      a,
      {
        ...input,
        expectedVersion: 1,
        data: { ...proof, events: [{ type: "swap", from: 0, to: 99 }] },
      },
      "qa-puzzle-invalid",
    ),
  );
  assert.equal(asset(), before);
  console.log(
    "Puzzle difficulty, fair swaps, pause/hints, server replay, original key, role/owner/version rejection and asset preservation PASS",
  );
} finally {
  d.close();
}
