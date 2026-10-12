import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  sequenceStart,
  sequenceAction,
  SEQUENCE_RULE_VERSION,
} from "../src/lib/collection-extra-play.mjs";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { playCommand, playMe } from "../local-test/play.mjs";
import { isPlayProjection } from "../src/lib/play-contract.mjs";
const finish = (s) => {
  while (!s.complete) {
    s = sequenceAction(s, { type: "conceal" });
    const stage = s.stage;
    for (const id of s.sequence.slice(0, stage)) s = sequenceAction(s, { type: "answer", id });
  }
  return s;
};
for (const difficulty of ["easy", "standard", "hard"]) {
  let s = sequenceStart(["a", "b", "c", "d"], difficulty, 19);
  assert.equal(sequenceAction(s, { type: "answer", id: "a" }), s);
  s = sequenceAction(s, { type: "pause" });
  assert.equal(sequenceAction(s, { type: "conceal" }), s);
  s = sequenceAction(s, { type: "pause" });
  s = sequenceAction(s, { type: "replay" });
  s = sequenceAction(s, { type: "conceal" });
  s = sequenceAction(s, { type: "answer", id: s.sequence[1] });
  assert.equal(s.mistakes, 1);
  s = sequenceAction(s, { type: "replay" });
  s = finish(s);
  assert.equal(s.complete, true);
  assert.equal(s.moves, (s.sequence.length * (s.sequence.length + 1)) / 2 + 1);
  assert.equal(sequenceAction(s, { type: "answer", id: "a" }), s);
}
assert.throws(() => sequenceStart(["a"]));
let fault = false;
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-sequence-")), "qa.sqlite"),
  await loadCatalog(),
  {
    fault: (s) => {
      if (fault && s === "after-play-write") throw Error("QA rollback");
    },
  },
);
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    o = d.session("official-a"),
    cat = d.collectionCatalogue(),
    cards = cat.cards.slice(0, 4);
  for (const c of cards)
    d.db.prepare("INSERT INTO holdings VALUES(?,?,?)").run("member-a", c.cardId, 1);
  const assets = () =>
      JSON.stringify(
        ["holdings", "ledger", "asset_events", "document_versions", "collection_awards"].map((t) =>
          d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all(),
        ),
      ),
    before = assets(),
    s = finish(
      sequenceStart(
        cards.map((c) => c.cardId),
        "easy",
        19,
      ),
    ),
    input = {
      action: "result",
      expectedVersion: 0,
      data: {
        mode: "sequence",
        ruleVersion: SEQUENCE_RULE_VERSION,
        difficulty: "easy",
        seed: 19,
        cardIds: cards.map((c) => c.cardId),
        cardVersions: cards.map((c) => c.cardVersion),
        visibilityKey: cat.visibilityKey,
        events: s.events,
      },
    };
  fault = true;
  assert.throws(() => playCommand(d, a, input, "qa-sequence-save"));
  assert.equal(playMe(d, a).total, 0);
  fault = false;
  const saved = playCommand(d, a, input, "qa-sequence-save");
  assert.deepEqual(playCommand(d, a, input, "qa-sequence-save"), saved);
  assert.equal(playMe(d, a).rows[0].moves, 3);
  assert.equal(isPlayProjection(playMe(d, a)), true);
  assert.equal(playMe(d, b).total, 0);
  assert.throws(() => playCommand(d, b, input, "qa-sequence-foreign"));
  assert.throws(() => playCommand(d, o, input, "qa-sequence-role"));
  assert.throws(() =>
    playCommand(
      d,
      a,
      { ...input, expectedVersion: 1, data: { ...input.data, ruleVersion: "local-play-v1" } },
      "qa-sequence-forged",
    ),
  );
  assert.equal(assets(), before);
  console.log(
    "Sequence stages, replay/mistakes/pause, bounded server proof, original key, rollback, role/owner isolation and unchanged assets PASS",
  );
} finally {
  d.close();
}
