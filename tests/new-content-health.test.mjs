import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync, backup } from "node:sqlite";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { playHealth, playCommand } from "../local-test/play.mjs";
import { playQuestions, quizStart, quizAnswer } from "../src/lib/play-questions.mjs";
import { migrationInventory } from "../local-test/migration-inventory.mjs";
const root = mkdtempSync(join(tmpdir(), "keepy-content-health-")),
  path = join(root, "qa.sqlite"),
  d = new LocalDatabase(path, await loadCatalog());
try {
  const a = d.session("member-a"),
    o = d.session("official-a"),
    cat = d.collectionCatalogue(),
    card = cat.cards[0];
  d.db.prepare("INSERT INTO holdings VALUES(?,?,?)").run("member-a", card.cardId, 1);
  const me = d.collectionMe(a);
  let state = quizStart(playQuestions(me, cat), "easy", 12);
  for (const q of state.questions) state = quizAnswer(state, q.answer);
  playCommand(
    d,
    a,
    {
      action: "result",
      expectedVersion: 0,
      data: {
        mode: "knowledge",
        difficulty: "easy",
        ruleVersion: state.ruleVersion,
        seed: 12,
        cardIds: [card.cardId],
        cardVersions: [card.cardVersion],
        visibilityKey: cat.visibilityKey,
        events: state.answers,
      },
    },
    "qa-review-health",
  );
  const row = d.db.prepare("SELECT * FROM play_results").get(),
    r = JSON.parse(row.payload);
  assert.equal(playHealth(d, o).quizReviews.checked, 1);
  assert.equal(playHealth(d, o).quizReviews.incompatible, 0);
  assert.throws(
    () => playHealth(d, a),
    (e) => e.status === 403,
  );
  r.quizReview.questions[0].prompt.en = "";
  d.db
    .prepare("INSERT INTO play_results(id,user_id,at,payload,proof_hash) VALUES(?,?,?,?,?)")
    .run("qa-corrupt-review", "member-a", row.at, JSON.stringify(r), "qa-corrupt-isolated");
  delete r.quizReview;
  d.db
    .prepare("INSERT INTO play_results(id,user_id,at,payload,proof_hash) VALUES(?,?,?,?,?)")
    .run("qa-legacy-review", "member-a", row.at, JSON.stringify(r), "qa-legacy-isolated");
  const before = migrationInventory(path),
    report = playHealth(d, o);
  assert.equal(report.quizReviews.incompatible, 1);
  assert.equal(report.quizReviews.legacyWithoutReview, 1);
  assert.equal(report.quizReviews.applied, false);
  assert.ok(!JSON.stringify(report).includes("qa-corrupt-review"));
  assert.ok(!JSON.stringify(report).includes(state.questions[0].prompt.en));
  assert.deepEqual(migrationInventory(path), before);
  const restored = join(root, "distinct-restore.sqlite"),
    ro = new DatabaseSync(path, { readOnly: true });
  try {
    await backup(ro, restored);
  } finally {
    ro.close();
  }
  assert.deepEqual(migrationInventory(restored), before);
  d.db.prepare("DELETE FROM holdings WHERE user_id=?").run("member-a");
  assert.equal(playHealth(d, o).quizReviews.unavailableSources, 1);
  console.log(
    "New immutable quiz snapshot health, legacy distinction, owner/source, count-only official role, readonly inventory and distinct backup restoration PASS",
  );
} finally {
  d.close();
}
