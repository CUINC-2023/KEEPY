import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { playMe, playCommand } from "../local-test/play.mjs";
import { memoryStart, memoryAction } from "../src/lib/collection-play.mjs";
import { validPracticeItems } from "../src/lib/play-practice.mjs";
import { isPlayProjection } from "../src/lib/play-contract.mjs";
let fault = false;
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-practice-")), "qa.sqlite"),
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
    cards = cat.cards.slice(0, 6);
  const originalLedger = d.db.prepare("SELECT * FROM ledger ORDER BY rowid").all();
  for (const c of cards)
    d.db.prepare("INSERT INTO holdings VALUES(?,?,?)").run("member-a", c.cardId, 1);
  const items = [
      { mode: "memory", difficulty: "easy" },
      { mode: "memory", difficulty: "standard" },
    ],
    data = { items, paused: false, restart: true, cancel: false },
    send = (action, value, key) =>
      playCommand(
        d,
        a,
        { action, expectedVersion: playMe(d, a).settings.version, data: value },
        key,
      );
  for (const bad of [
    [{ ...items[0], actor: "member-b" }],
    [items[0], items[0]],
    [{ mode: "unknown", difficulty: "easy" }],
    [],
    Array(13).fill(items[0]),
  ])
    assert.equal(validPracticeItems(bad), false);
  const input = { action: "practice", expectedVersion: 0, data };
  const saved = playCommand(d, a, input, "qa-practice-start");
  assert.deepEqual(playCommand(d, a, input, "qa-practice-start"), saved);
  assert.equal(playMe(d, b).settings.data.practice, undefined);
  assert.throws(() => playCommand(d, o, input, "qa-practice-role"));
  assert.equal(isPlayProjection(playMe(d, a)), true);
  assert.throws(() => playCommand(d, a, input, "qa-practice-conflict"));
  const proof = (difficulty, seed) => {
    let s = memoryStart(
      cards.map((c) => c.cardId),
      difficulty,
      seed,
    );
    for (const id of s.cardIds)
      for (const index of s.deck.flatMap((v, i) => (v === id ? [i] : [])))
        s = memoryAction(s, { type: "flip", index });
    return {
      mode: "memory",
      difficulty,
      ruleVersion: s.ruleVersion,
      seed,
      visibilityKey: cat.visibilityKey,
      cardIds: cards.map((c) => c.cardId),
      cardVersions: cards.map((c) => c.cardVersion),
      events: s.events,
    };
  };
  send("result", proof("standard", 1), "qa-practice-out-order");
  assert.equal(playMe(d, a).settings.data.practice.completed, 0);
  const p = proof("easy", 2);
  send("result", p, "qa-practice-first");
  send("result", p, "qa-practice-repeat");
  assert.equal(playMe(d, a).settings.data.practice.completed, 1);
  send("practice", { ...data, paused: true, restart: false }, "qa-practice-pause");
  send("result", proof("standard", 3), "qa-practice-paused");
  assert.equal(playMe(d, a).settings.data.practice.completed, 1);
  send("practice", { ...data, restart: false }, "qa-practice-resume");
  fault = true;
  const before = playMe(d, a);
  assert.throws(() => send("result", proof("standard", 4), "qa-practice-fault"));
  assert.deepEqual(playMe(d, a), before);
  fault = false;
  send("result", proof("standard", 4), "qa-practice-fault");
  assert.equal(playMe(d, a).settings.data.practice.completed, 2);
  send("settings", { schema: 1, lastMode: "puzzle", difficulty: "easy" }, "qa-practice-preference");
  assert.equal(playMe(d, a).settings.data.practice.completed, 2);
  const count = playMe(d, a).total;
  send(
    "practice",
    { items: [], paused: false, restart: false, cancel: true },
    "qa-practice-cancel",
  );
  assert.equal(playMe(d, a).settings.data.practice, undefined);
  assert.equal(playMe(d, a).total, count);
  assert.deepEqual(d.db.prepare("SELECT * FROM ledger ORDER BY rowid").all(), originalLedger);
  console.log(
    "Practice exact mode/difficulty, CAS/key dedupe, pause, atomic rollback, settings preservation, plan-only cancellation, roles and accounts PASS",
  );
} finally {
  d.close();
}
