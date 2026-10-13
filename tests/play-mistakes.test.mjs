import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { playMe, playCommand, playMistakes } from "../local-test/play.mjs";
import { playQuestions, quizStart, quizAnswer } from "../src/lib/play-questions.mjs";
import { isMistakesProjection, validQuizReview } from "../src/lib/play-review.mjs";
import { PLAY_RULE_VERSION } from "../src/lib/collection-play.mjs";
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-mistakes-")), "qa.sqlite"),
  await loadCatalog(),
);
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    o = d.session("official-a"),
    cat = d.collectionCatalogue(),
    card = cat.cards[0];
  d.db.prepare("INSERT INTO holdings VALUES(?,?,?)").run("member-a", card.cardId, 1);
  d.collectionMe(b);
  const me = d.collectionMe(a),
    assets = () =>
      JSON.stringify(
        ["holdings", "ledger", "asset_events", "document_versions", "collection_awards"].map((t) =>
          d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all(),
        ),
      ),
    before = assets();
  let s = quizStart(playQuestions(me, cat, "knowledge"), "easy", 17);
  for (const q of s.questions) s = quizAnswer(s, q.options.find((o) => o.id !== q.answer).id);
  const input = {
    action: "result",
    expectedVersion: 0,
    data: {
      mode: "knowledge",
      difficulty: "easy",
      ruleVersion: PLAY_RULE_VERSION,
      seed: 17,
      cardIds: [card.cardId],
      cardVersions: [card.cardVersion],
      visibilityKey: cat.visibilityKey,
      events: s.answers,
    },
  };
  playCommand(d, a, input, "qa-mistake-key");
  playCommand(d, a, input, "qa-mistake-key");
  const result = playMistakes(d, a);
  assert.equal(result.total, 2);
  assert.equal(isMistakesProjection(result), true);
  assert.ok(result.rows.every((r) => r.question.selected !== r.question.answer));
  assert.equal(playMistakes(d, b).total, 0);
  assert.throws(
    () => playMistakes(d, o),
    (e) => e.status === 403,
  );
  assert.throws(
    () => playMistakes(d, "invalid"),
    (e) => e.status === 401,
  );
  assert.throws(
    () => playMistakes(d, a, { actorId: "member-b" }),
    (e) => e.status === 422,
  );
  assert.throws(
    () => playMistakes(d, a, { mode: "puzzle" }),
    (e) => e.status === 422,
  );
  assert.equal(assets(), before);
  const stored = d.db.prepare("SELECT * FROM play_results").get(),
    payload = JSON.parse(stored.payload);
  assert.equal(validQuizReview(payload.quizReview), true);
  assert.equal(validQuizReview({ ...payload.quizReview, privateOwner: "forged" }), false);
  delete payload.quizReview;
  d.db
    .prepare("INSERT INTO play_results(id,user_id,at,payload,proof_hash) VALUES(?,?,?,?,?)")
    .run("qa-old-summary", "member-a", stored.at, JSON.stringify(payload), "qa-isolated-legacy");
  assert.equal(playMistakes(d, a).legacyWithoutReview, 1);
  assert.equal(playMistakes(d, a).total, 2);
  assert.ok(!JSON.stringify(playMe(d, a)).includes("quizReview"));
  d.db.prepare("DELETE FROM holdings WHERE user_id=?").run("member-a");
  assert.equal(playMistakes(d, a).total, 0);
  assert.equal(playMistakes(d, a).legacyWithoutReview, 0);
  assert.ok(
    d.db
      .prepare("SELECT payload FROM play_results WHERE id=?")
      .get(stored.id)
      .payload.includes("quizReview"),
  );
  console.log(
    "Server-replayed immutable private question source, exact/bounded DTO, original key, owner/role, current eligibility, no fabricated legacy mistakes and no assets PASS",
  );
} finally {
  d.close();
}
