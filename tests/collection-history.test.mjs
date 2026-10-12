import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { collectionHistory } from "../local-test/collection-history.mjs";
import { createLocalServer } from "../local-test/server.mjs";
import { migrationInventory } from "../local-test/migration-inventory.mjs";
const path = join(mkdtempSync(join(tmpdir(), "keepy-history-")), "qa.sqlite"),
  d = new LocalDatabase(path, await loadCatalog());
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    o = d.session("official-a"),
    card = d.collectionCatalogue().cards[0];
  for (let n = 0; n < 45; n++)
    d.db
      .prepare("INSERT INTO asset_events VALUES(?,?,?,?,?,?,?,?)")
      .run(
        "qa-history-" + String(n).padStart(3, "0"),
        "member-a",
        "qa",
        card.cardId,
        1,
        n % 2 ? "test-grant" : "draw",
        new Date(Date.parse("2026-10-01T00:00:00+08:00") + n * 3600000).toISOString(),
        "{}",
      );
  d.db
    .prepare("INSERT INTO asset_events VALUES(?,?,?,?,?,?,?,?)")
    .run("qa-history-unknown", "member-a", "qa", "unknown-hidden-proof", 1, "draw", d.at(), "{}");
  const before = migrationInventory(path),
    one = collectionHistory(d, a),
    two = collectionHistory(d, a, { page: "2" });
  assert.equal(one.rows.length, 20);
  assert.equal(one.total, 45);
  assert.equal(two.rows.length, 20);
  assert.equal(new Set([...one.rows, ...two.rows].map((e) => e.eventId)).size, 40);
  assert.equal(one.rows[0].currentCount, 0);
  assert.equal(one.rows[0].quantity, 1);
  assert.equal(collectionHistory(d, a, { page: "50000" }).page, 3);
  assert.equal(collectionHistory(d, a, { source: "test-grant" }).total, 22);
  assert.equal(
    collectionHistory(d, a, {
      start: "2026-10-01T00:00:00+08:00",
      end: "2026-10-02T00:00:00+08:00",
    }).total,
    24,
  );
  assert.equal(collectionHistory(d, b).total, 0);
  assert.ok(!JSON.stringify(one).includes("unknown-hidden-proof"));
  assert.deepEqual(migrationInventory(path), before);
  assert.throws(() => collectionHistory(d, a, { actorId: "member-b" }));
  assert.throws(() => collectionHistory(d, a, { page: "-1" }));
  assert.throws(() => collectionHistory(d, a, { start: "2026-10-02", end: "2026-10-01" }));
  const rules = d.document("collection-rules"),
    value = structuredClone(rules.data);
  value.visibility.find((v) => v.poolId === card.poolId).hiddenGrades = [card.rarity];
  d.collectionRules(o, { expectedVersion: rules.version, data: value }, "qa-history-hide");
  assert.equal(collectionHistory(d, a).total, 0);
  const server = createLocalServer(d);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  try {
    const base = "http://127.0.0.1:" + server.address().port + "/api/local-test";
    assert.equal((await fetch(base + "/collection/history")).status, 401);
  } finally {
    await new Promise((r) => server.close(r));
  }
} finally {
  d.close();
}
console.log(
  "PASS bounded owner history, stable pages, source/Taipei boundaries, missing/hidden masking, read-only and unauthorized API",
);
