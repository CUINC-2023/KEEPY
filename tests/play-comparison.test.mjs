import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { playMe } from "../local-test/play.mjs";
import { isPlayProjection } from "../src/lib/play-contract.mjs";
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-compare-")), "qa.sqlite"),
  await loadCatalog(),
);
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    cat = d.collectionCatalogue(),
    card = cat.cards[0];
  d.db.prepare("INSERT INTO holdings VALUES(?,?,?)").run("member-a", card.cardId, 1);
  const insert = (id, at, hints) =>
    d.db
      .prepare("INSERT INTO play_results(id,user_id,at,payload,proof_hash) VALUES(?,?,?,?,?)")
      .run(
        id,
        "member-a",
        at,
        JSON.stringify({
          schema: 1,
          mode: "memory",
          difficulty: "easy",
          ruleVersion: "local-memory-v2",
          sourceIds: [card.cardId],
          sourceVersion: cat.version,
          memoryConfig: { schema: 1, variant: "practice", allowHints: hints },
          hintsUsed: 0,
          assistance: { hintsUsed: 0, mistakes: null },
          moves: 2,
          correct: 2,
          total: 2,
        }),
        "isolated-comparison-" + id,
      );
  insert("start", "2026-10-04T16:00:00.000Z", false);
  insert("middle", "2026-10-05T10:00:00.000Z", true);
  insert("end", "2026-10-05T16:00:00.000Z", false);
  const input = { start: "2026-10-05T00:00:00+08:00", end: "2026-10-06T00:00:00+08:00" },
    v = playMe(d, a, input);
  assert.equal(v.total, 2);
  assert.equal(v.analysis.groups.length, 2);
  assert.deepEqual(v.analysis.groups.map((g) => g.hintPolicy).sort(), ["allowed", "none"]);
  assert.equal(isPlayProjection(v), true);
  assert.equal(playMe(d, b, input).total, 0);
  assert.throws(
    () => playMe(d, a, { start: input.end, end: input.start }),
    (e) => e.status === 422,
  );
  assert.throws(
    () => playMe(d, a, { start: "invalid" }),
    (e) => e.status === 422,
  );
  for (const start of [
    "1",
    "2026-02-30T00:00:00+08:00",
    "2025-02-29T00:00:00Z",
    "2026-10-05T24:00:00Z",
    "2026-10-05T00:00:00+14:30",
  ])
    assert.throws(
      () => playMe(d, a, { start }),
      (e) => e.status === 422,
    );
  assert.equal(playMe(d, a, { start: "2024-02-29T00:00:00Z" }).total, 3);
  assert.throws(
    () => playMe(d, a, { owner: "member-b" }),
    (e) => e.status === 422,
  );
  assert.equal(playMe(d, a).total, 3);
  d.db.prepare("DELETE FROM holdings WHERE user_id=?").run("member-a");
  assert.equal(playMe(d, a, input).total, 0);
  console.log(
    "Taipei inclusive start/exclusive end, strict ranges, bounded same rule/hint-policy groups, owner/material masking and legacy all-time query PASS",
  );
} finally {
  d.close();
}
