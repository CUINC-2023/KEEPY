import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { playMe, playCommand } from "../local-test/play.mjs";
import { puzzleStart, puzzleAction } from "../src/lib/collection-extra-play.mjs";
import { validPlayAnalysis } from "../src/lib/play-analysis.mjs";
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-analysis-")), "qa.sqlite"),
  await loadCatalog(),
);
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    cat = d.collectionCatalogue(),
    card = cat.cards[0];
  d.db.prepare("INSERT INTO holdings VALUES(?,?,?)").run("member-a", card.cardId, 1);
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
      seed,
      ruleVersion: s.ruleVersion,
      cardIds: [card.cardId],
      cardVersions: [card.cardVersion],
      visibilityKey: cat.visibilityKey,
      events: s.events,
    };
  };
  const p = proof(10, false),
    first = { action: "result", expectedVersion: 0, data: p };
  playCommand(d, a, first, "qa-analysis-original");
  playCommand(d, a, first, "qa-analysis-original");
  playCommand(
    d,
    a,
    { action: "result", expectedVersion: 1, data: proof(11, true) },
    "qa-analysis-assisted",
  );
  const result = playMe(d, a);
  assert.equal(result.total, 2);
  assert.equal(validPlayAnalysis(result.analysis), true);
  assert.equal(result.analysis.groups.length, 2);
  assert.deepEqual(result.analysis.groups.map((g) => g.hintsUsed).sort(), [0, 1]);
  assert.ok(
    result.analysis.groups.every((g) => g.rounds === 1 && g.ruleVersion === "local-puzzle-v1"),
  );
  assert.equal(result.rows[0].assistance.hintsUsed, 1);
  assert.equal(playMe(d, b).analysis.groups.length, 0);
  assert.equal(validPlayAnalysis({ ...result.analysis, proofHash: "never-published" }), false);
  assert.throws(() =>
    playCommand(
      d,
      a,
      { action: "result", expectedVersion: 2, data: { ...p, assistance: { hintsUsed: 0 } } },
      "qa-analysis-forged",
    ),
  );
  d.db.prepare("DELETE FROM holdings WHERE user_id=?").run("member-a");
  assert.equal(playMe(d, a).analysis.groups.length, 0);
  console.log(
    "Bounded private rule/config/hint groups, true totals, exact original-key dedupe, assistance server derivation and current eligibility masking PASS",
  );
} finally {
  d.close();
}
