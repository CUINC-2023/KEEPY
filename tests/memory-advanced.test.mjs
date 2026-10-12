import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  memoryStart,
  memoryAction,
  MEMORY_RULE_VERSION,
  validMemoryConfig,
} from "../src/lib/collection-play.mjs";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { playMe, playCommand } from "../local-test/play.mjs";
import { isPlayProjection } from "../src/lib/play-contract.mjs";
const config = { schema: 1, variant: "practice", allowHints: true },
  ids = ["a", "b", "c", "d", "e", "f"];
for (const difficulty of ["easy", "standard", "hard"]) {
  let s = memoryStart(ids, difficulty, 11, config);
  assert.equal(s.ruleVersion, MEMORY_RULE_VERSION);
  assert.equal(s.moves, 0);
  s = memoryAction(s, { type: "hint" });
  assert.equal(s.hintsUsed, 1);
  assert.equal(s.moves, 0);
  assert.equal(s.hintIndexes.length, 2);
  s = memoryAction(s, { type: "hide-hint" });
  const original = s;
  s = memoryAction(s, { type: "pause" });
  assert.equal(memoryAction(s, { type: "flip", index: 0 }), s);
  s = memoryAction(s, { type: "pause" });
  for (const id of s.cardIds)
    for (const index of s.deck.flatMap((v, i) => (v === id ? [i] : [])))
      s = memoryAction(s, { type: "flip", index });
  assert.equal(s.complete, true);
  assert.equal(s.moves, s.cardIds.length);
  assert.equal(s.hintsUsed, original.hintsUsed);
  let limited = memoryStart(ids, difficulty, 11, {
    ...config,
    variant: "limit",
    allowHints: false,
  });
  const other = limited.deck.findIndex((v) => v !== limited.deck[0]);
  for (let n = 0; n < limited.moveLimit; n++) {
    limited = memoryAction(limited, { type: "flip", index: 0 });
    limited = memoryAction(limited, { type: "flip", index: other });
    if (!limited.failed) limited = memoryAction(limited, { type: "continue" });
  }
  assert.equal(limited.failed, true);
  assert.equal(limited.complete, false);
  assert.equal(memoryAction(limited, { type: "flip", index: 1 }), limited);
}
assert.equal(validMemoryConfig({ ...config, cost: 1 }), false);
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-memory-v2-")), "qa.sqlite"),
  await loadCatalog(),
);
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    cat = d.collectionCatalogue(),
    cards = cat.cards.slice(0, 6);
  for (const c of cards)
    d.db.prepare("INSERT INTO holdings VALUES(?,?,?)").run("member-a", c.cardId, 1);
  const frozen = () =>
      JSON.stringify(
        ["holdings", "asset_events", "ledger", "collection_awards", "document_versions"].map((t) =>
          d.db.prepare("SELECT * FROM " + t).all(),
        ),
      ),
    before = frozen();
  let s = memoryStart(
    cards.map((c) => c.cardId),
    "easy",
    19,
    config,
  );
  s = memoryAction(s, { type: "hint" });
  for (const id of s.cardIds)
    for (const index of s.deck.flatMap((v, i) => (v === id ? [i] : [])))
      s = memoryAction(s, { type: "flip", index });
  const proof = {
    mode: "memory",
    difficulty: "easy",
    ruleVersion: MEMORY_RULE_VERSION,
    memoryConfig: config,
    seed: 19,
    cardIds: cards.map((c) => c.cardId),
    cardVersions: cards.map((c) => c.cardVersion),
    visibilityKey: cat.visibilityKey,
    events: s.events,
  };
  const body = { action: "result", expectedVersion: 0, data: proof },
    saved = playCommand(d, a, body, "qa-memory-v2-save");
  assert.deepEqual(playCommand(d, a, body, "qa-memory-v2-save"), saved);
  assert.throws(() => playCommand(d, b, body, "qa-memory-v2-foreign"));
  const me = playMe(d, a);
  assert.equal(me.total, 1);
  assert.equal(me.rows[0].hintsUsed, 1);
  assert.equal(me.rows[0].memoryConfig.variant, "practice");
  assert.equal(me.best.length, 0);
  assert.ok(isPlayProjection(me));
  assert.equal(isPlayProjection({ ...me, rows: [{ ...me.rows[0], hintsUsed: 99 }] }), false);
  assert.throws(() =>
    playCommand(
      d,
      a,
      { ...body, expectedVersion: 1, data: { ...proof, memoryConfig: { ...config, cost: 1 } } },
      "qa-memory-bad-options",
    ),
  );
  assert.equal(frozen(), before);
} finally {
  d.close();
}
console.log(
  "PASS versioned practice/limits/hints, fair moves, pause/failure, server replay and original-key dedupe, isolated records and unchanged assets/history",
);
