import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { playMe, playCommand } from "../local-test/play.mjs";
import { memoryStart, memoryAction } from "../src/lib/collection-play.mjs";
import { playQuestions, quizStart } from "../src/lib/play-questions.mjs";
import { isPlayProjection } from "../src/lib/play-contract.mjs";
let fault = false;
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-mixed-")), "qa.sqlite"),
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
  for (const c of cards)
    d.db.prepare("INSERT INTO holdings VALUES(?,?,?)").run("member-a", c.cardId, 1);
  const assets = () =>
      JSON.stringify(
        [
          "holdings",
          "asset_events",
          "acquisitions",
          "ledger",
          "collection_awards",
          "document_versions",
        ].map((t) => d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all()),
      ),
    before = assets();
  const command = (action, data, key) =>
    playCommand(d, a, { action, data, expectedVersion: playMe(d, a).settings.version }, key);
  const proof = (mode, seed) => {
    let round;
    if (mode === "memory") {
      round = memoryStart(
        cards.map((c) => c.cardId),
        "easy",
        seed,
      );
      for (const id of round.cardIds)
        for (const index of round.deck.flatMap((v, i) => (v === id ? [i] : [])))
          round = memoryAction(round, { type: "flip", index });
    } else
      round = quizStart(
        playQuestions(
          {
            actorId: "member-a",
            visibilityKey: cat.visibilityKey,
            cards: cards.map((c) => ({ ...c, count: 1 })),
          },
          cat,
          mode,
        ),
        "easy",
        seed,
      );
    return {
      mode,
      difficulty: "easy",
      seed,
      ruleVersion: round.ruleVersion,
      cardIds: cards.map((c) => c.cardId),
      cardVersions: cards.map((c) => c.cardVersion),
      visibilityKey: cat.visibilityKey,
      events: mode === "memory" ? round.events : round.questions.map((q) => q.answer),
    };
  };
  command("result", proof("memory", 1), "qa-journey-pre");
  const start = {
    action: "journey",
    expectedVersion: 1,
    data: { modes: ["memory", "knowledge", "observation"], paused: false, restart: true },
  };
  const started = playCommand(d, a, start, "qa-journey-start");
  assert.deepEqual(playCommand(d, a, start, "qa-journey-start"), started);
  assert.equal(playMe(d, a).settings.data.journey.completed, 0);
  assert.equal(playMe(d, b).settings.data.journey, undefined);
  assert.throws(() => playCommand(d, o, start, "qa-journey-role"));
  assert.throws(() =>
    playCommand(
      d,
      a,
      { ...start, data: { ...start.data, modes: ["memory", "memory"] } },
      "qa-journey-bad",
    ),
  );
  command("result", proof("knowledge", 2), "qa-journey-out-order");
  assert.equal(playMe(d, a).settings.data.journey.completed, 0);
  const p = proof("memory", 3);
  command("result", p, "qa-journey-first");
  assert.equal(playMe(d, a).settings.data.journey.completed, 1);
  command("result", p, "qa-journey-duplicate");
  assert.equal(playMe(d, a).settings.data.journey.completed, 1);
  command("journey", { modes: start.data.modes, paused: true, restart: false }, "qa-journey-pause");
  command("result", proof("knowledge", 4), "qa-journey-paused-save");
  assert.equal(playMe(d, a).settings.data.journey.completed, 1);
  command(
    "journey",
    { modes: start.data.modes, paused: false, restart: false },
    "qa-journey-resume",
  );
  fault = true;
  const beforeState = playMe(d, a);
  assert.throws(() => command("result", proof("knowledge", 5), "qa-journey-fault"));
  assert.deepEqual(playMe(d, a), beforeState);
  fault = false;
  command("result", proof("knowledge", 5), "qa-journey-fault");
  command("result", proof("observation", 6), "qa-journey-last");
  assert.equal(playMe(d, a).settings.data.journey.completed, 3);
  assert.equal(isPlayProjection(playMe(d, a)), true);
  assert.equal(JSON.stringify(playMe(d, a).settings).includes("resultIds"), false);
  assert.equal(assets(), before);
  d.db.prepare("DELETE FROM holdings WHERE user_id=?").run("member-a");
  const hidden = playMe(d, a);
  assert.equal(hidden.settings.data.journey.invalidated, true);
  assert.equal(hidden.settings.data.journey.completed, 0);
  assert.equal(hidden.rows.length, 0);
  console.log(
    "Mixed journey exact order, current eligibility, original key, pause, duplicate, rollback, isolation and no assets PASS",
  );
} finally {
  d.close();
}
