import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { collectionRecap } from "../local-test/collection-history.mjs";
import { migrationInventory } from "../local-test/migration-inventory.mjs";
import { createLocalServer } from "../local-test/server.mjs";
const path = join(mkdtempSync(join(tmpdir(), "keepy-recap-")), "qa.sqlite"),
  d = new LocalDatabase(path, await loadCatalog(), {
    clock: () => Date.parse("2026-10-12T08:00:00Z"),
  });
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    o = d.session("official-a"),
    card = d.collectionCatalogue().cards[0];
  for (const [n, at] of [
    ["first", "2026-10-01T00:00:00+08:00"],
    ["repeat", "2026-10-03T00:00:00+08:00"],
  ])
    d.db
      .prepare("INSERT INTO asset_events VALUES(?,?,?,?,?,?,?,?)")
      .run(
        "qa-recap-" + n,
        "member-a",
        "qa",
        card.cardId,
        1,
        "test-grant",
        new Date(at).toISOString(),
        "{}",
      );
  d.collectionMe(a);
  const before = migrationInventory(path),
    early = collectionRecap(d, a, {
      start: "2026-10-01T00:00:00+08:00",
      end: "2026-10-02T00:00:00+08:00",
    }),
    later = collectionRecap(d, a, {
      start: "2026-10-03T00:00:00+08:00",
      end: "2026-10-04T00:00:00+08:00",
    });
  assert.equal(early.newDistinct, 1);
  assert.equal(early.positiveEvents, 1);
  assert.equal(early.earned.length, 0);
  assert.equal(later.positiveEvents, 1);
  assert.equal(later.newDistinct, 0);
  assert.equal(collectionRecap(d, b).newDistinct, 0);
  assert.equal(collectionRecap(d, a).newDistinct, 1);
  assert.ok(collectionRecap(d, a, { start: "2026-10-12", end: "2026-10-13" }).earned.length > 0);
  assert.deepEqual(migrationInventory(path), before);
  assert.throws(() => collectionRecap(d, a, { actorId: "member-b" }));
  const rules = d.document("collection-rules"),
    next = structuredClone(rules.data);
  next.visibility.find((v) => v.poolId === card.poolId).hiddenGrades = [card.rarity];
  d.collectionRules(o, { expectedVersion: rules.version, data: next }, "qa-recap-hide");
  assert.equal(collectionRecap(d, a).newDistinct, 0);
  assert.ok(!JSON.stringify(collectionRecap(d, a).earned).includes(card.cardId));
  const server = createLocalServer(d);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  try {
    assert.equal(
      (
        await fetch(
          "http://127.0.0.1:" + server.address().port + "/api/local-test/collection/recap",
        )
      ).status,
      401,
    );
  } finally {
    await new Promise((r) => server.close(r));
  }
} finally {
  d.close();
}
console.log(
  "PASS first-ever versus repeats, record-time period recap, owner isolation, read-only inventory, hiding and unauthorized API",
);
