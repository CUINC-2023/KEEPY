import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { playMe } from "../local-test/play.mjs";
import { PLAY_RULE_VERSION } from "../src/lib/collection-play.mjs";
import { isPlayProjection } from "../src/lib/play-contract.mjs";
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-play-query-")), "qa.sqlite"),
  await loadCatalog(),
);
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    o = d.session("official-a"),
    cat = d.collectionCatalogue(),
    sourceIds = cat.cards.slice(0, 2).map((c) => c.cardId);
  for (const id of sourceIds)
    d.db.prepare("INSERT INTO holdings VALUES(?,?,?)").run("member-a", id, 1);
  const unchanged = () =>
    JSON.stringify(
      ["holdings", "asset_events", "ledger", "collection_awards", "document_versions"].map((t) =>
        d.db.prepare("SELECT * FROM " + t).all(),
      ),
    );
  const frozen = unchanged();
  const add = (n, extra = {}) =>
    d.db
      .prepare("INSERT INTO play_results(id,user_id,at,payload,proof_hash) VALUES(?,?,?,?,?)")
      .run(
        "qa-query-" + n,
        "member-a",
        new Date(1760000000000 + n).toISOString(),
        JSON.stringify({
          schema: 1,
          mode: n < 10 ? "memory" : "knowledge",
          difficulty: "easy",
          sourceIds,
          sourceVersion: cat.version,
          ruleVersion: PLAY_RULE_VERSION,
          moves: n < 10 ? n + 2 : null,
          correct: 2,
          total: 2,
          ...extra,
        }),
        "isolated-proof-" + n,
      );
  for (let n = 0; n < 45; n++) add(n);
  add(45, { sourceIds: ["unavailable-private-card"] });
  add(46, { sourceIds: [] });
  add(47, { ruleVersion: "retained-legacy-rule-v1", correct: 1 });
  const first = playMe(d, a);
  assert.equal(first.total, 46);
  assert.equal(first.rows.length, 20);
  assert.equal(first.pages, 3);
  assert.ok(isPlayProjection(first));
  assert.equal(first.best.find((r) => r.mode === "memory").moves, 2);
  assert.equal(first.best.find((r) => r.mode === "knowledge").id, "qa-query-44");
  assert.ok(first.rows.some((r) => r.ruleVersion === "retained-legacy-rule-v1"));
  const last = playMe(d, a, { page: 9999 });
  assert.equal(last.page, 3);
  assert.equal(last.rows.length, 6);
  assert.equal(
    new Set([...first.rows, ...playMe(d, a, { page: 2 }).rows, ...last.rows].map((r) => r.id)).size,
    46,
  );
  const memory = playMe(d, a, { mode: "memory" });
  assert.equal(memory.total, 10);
  assert.equal(memory.best.length, 1);
  assert.equal(playMe(d, b).total, 0);
  assert.equal(playMe(d, b).best.length, 0);
  assert.throws(
    () => playMe(d, o),
    (e) => e.status === 403,
  );
  assert.throws(
    () => playMe(d, a, { page: 10001 }),
    (e) => e.status === 422,
  );
  assert.equal(JSON.stringify(first).includes("unavailable-private-card"), false);
  assert.equal(JSON.stringify(first).includes("isolated-proof"), false);
  assert.equal(unchanged(), frozen);
} finally {
  d.close();
}
console.log(
  "PASS bounded private query, stable paging/ties, rule-version bests, missing-source masking, owner/role isolation and unchanged history",
);
