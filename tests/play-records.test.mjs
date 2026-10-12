import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { playMe, playCommand, privatePlaySummary } from "../local-test/play.mjs";
import { memoryStart, memoryAction, PLAY_RULE_VERSION } from "../src/lib/collection-play.mjs";
import { playQuestions, quizStart } from "../src/lib/play-questions.mjs";
import { isPlayProjection } from "../src/lib/play-contract.mjs";
const file = join(mkdtempSync(join(tmpdir(), "keepy-play-")), "qa.sqlite"),
  cat = await loadCatalog();
let fault = false,
  d = new LocalDatabase(file, cat, {
    fault: (s) => {
      if (fault && s === "after-play-write") throw Error("QA rollback");
    },
  });
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    o = d.session("official-a"),
    catalogue = d.collectionCatalogue(),
    cards = catalogue.cards.slice(0, 6);
  assert.ok(cards.length >= 2);
  for (const c of cards)
    d.db.prepare("INSERT INTO holdings VALUES(?,?,?)").run("member-a", c.cardId, 1);
  const assets = () =>
      JSON.stringify(
        [
          "holdings",
          "asset_events",
          "acquisitions",
          "draws",
          "ledger",
          "collection_awards",
          "document_versions",
        ].map((t) => d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all()),
      ),
    before = assets();
  const projection = playMe(d, a);
  assert.equal(isPlayProjection(projection), true);
  for (const key of ["session", "proofHash", "cardIds", "privateEvidence"])
    assert.equal(isPlayProjection({ ...projection, [key]: [] }), false);
  assert.equal(isPlayProjection({ ...projection, officialXP: true }), false);
  assert.equal(isPlayProjection({ ...projection, page: 2 }), false);
  assert.equal(
    isPlayProjection({
      ...projection,
      settings: {
        ...projection.settings,
        data: { schema: 2, lastMode: "memory", difficulty: "easy" },
      },
    }),
    false,
  );
  let round = memoryStart(
    cards.map((c) => c.cardId),
    "easy",
    17,
  );
  for (const id of round.cardIds)
    for (const i of round.deck.flatMap((v, i) => (v === id ? [i] : [])))
      round = memoryAction(round, { type: "flip", index: i });
  const proof = {
      mode: "memory",
      difficulty: "easy",
      ruleVersion: PLAY_RULE_VERSION,
      seed: 17,
      cardIds: cards.map((c) => c.cardId),
      cardVersions: cards.map((c) => c.cardVersion),
      visibilityKey: catalogue.visibilityKey,
      events: round.events,
    },
    input = { action: "result", expectedVersion: 0, data: proof };
  const saved = playCommand(d, a, input, "qa-play-result");
  assert.deepEqual(playCommand(d, a, input, "qa-play-result"), saved);
  assert.equal(playMe(d, a).total, 1);
  assert.equal(playMe(d, b).total, 0);
  assert.throws(() => playMe(d, o));
  assert.throws(() => playCommand(d, b, { ...input, data: proof }, "qa-play-foreign"));
  assert.throws(() => playCommand(d, a, input, "qa-play-conflict"));
  assert.equal(
    playCommand(d, a, { ...input, expectedVersion: 1 }, "qa-play-duplicate").duplicate,
    true,
  );
  assert.equal(playMe(d, a).settings.version, 1);
  for (const mode of ["knowledge", "observation"]) {
    const owner = {
        actorId: "member-a",
        visibilityKey: catalogue.visibilityKey,
        cards: cards.map((c) => ({ ...c, count: 1 })),
      },
      questions = playQuestions(owner, catalogue, mode);
    if (questions.length < 2) continue;
    const q = quizStart(questions, "easy", 22),
      data = { ...proof, mode, seed: 22, events: q.questions.map((q) => q.answer) };
    playCommand(
      d,
      a,
      { action: "result", expectedVersion: playMe(d, a).settings.version, data },
      "qa-play-" + mode,
    );
  }
  assert.equal(playMe(d, a).best.length, 3);
  assert.equal(privatePlaySummary(d, a, { start: "", end: "" }).records, 3);
  assert.equal(privatePlaySummary(d, a, { start: "2099-01-01T00:00:00Z", end: "" }).records, 0);
  assert.equal(privatePlaySummary(d, b, { start: "", end: "" }).records, 0);
  assert.equal(privatePlaySummary(d, o, { start: "", end: "" }), null);
  assert.equal(assets(), before);
  const current = playMe(d, a);
  fault = true;
  assert.throws(() =>
    playCommand(
      d,
      a,
      { action: "clear", expectedVersion: current.settings.version, data: null },
      "qa-play-rollback",
    ),
  );
  assert.equal(playMe(d, a).total, current.total);
  assert.equal(playMe(d, a).settings.version, current.settings.version);
  fault = false;
  assert.throws(() =>
    playCommand(
      d,
      a,
      {
        action: "settings",
        expectedVersion: current.settings.version,
        data: { schema: 1, lastMode: "memory", difficulty: "easy", role: "official" },
      },
      "qa-play-injection",
    ),
  );
  assert.throws(() =>
    playCommand(
      d,
      a,
      {
        action: "result",
        expectedVersion: current.settings.version,
        data: { ...proof, seed: 99, events: [] },
      },
      "qa-play-incomplete",
    ),
  );
  assert.ok(!JSON.stringify(playMe(d, a)).includes(cards[0].cardId));
  assert.equal(playMe(d, a).officialXP, false);
  d.close();
  d = new LocalDatabase(file, cat);
  const again = d.session("member-a");
  assert.equal(playMe(d, again).total, 3);
  const rules = d.document("collection-rules"),
    next = structuredClone(rules.data);
  next.visibility.find((v) => v.poolId === cards[0].poolId).hiddenGrades = [cards[0].rarity];
  d.collectionRules(
    d.session("official-a"),
    { expectedVersion: rules.version, data: next },
    "qa-play-hide",
  );
  assert.equal(playMe(d, again).total, 0);
  assert.throws(() =>
    playCommand(
      d,
      again,
      {
        action: "result",
        expectedVersion: playMe(d, again).settings.version,
        data: { ...proof, seed: 81 },
      },
      "qa-play-hidden",
    ),
  );
  playCommand(
    d,
    again,
    { action: "clear", expectedVersion: playMe(d, again).settings.version, data: null },
    "qa-play-clear",
  );
  assert.equal(
    d.db.prepare("SELECT count(*) n FROM play_results WHERE user_id=?").get("member-a").n,
    0,
  );
} finally {
  d.close();
}
console.log(
  "PASS three replayed results, CAS/original-key/semantic dedupe, member scope, unchanged assets/awards/history, rollback/restart, hidden masking and record-only deletion",
);
