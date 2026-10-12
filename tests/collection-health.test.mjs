import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { DatabaseSync, backup } from "node:sqlite";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { collectionProfileHealth } from "../local-test/collection.mjs";
import { migrationInventory } from "../local-test/migration-inventory.mjs";
const root = mkdtempSync(join(tmpdir(), "keepy-health-")),
  path = join(root, "qa.sqlite"),
  d = new LocalDatabase(path, await loadCatalog());
try {
  const a = d.session("member-a"),
    o = d.session("official-a"),
    me = d.collectionMe(a),
    card = d.collectionCatalogue().cards[0];
  assert.throws(
    () => collectionProfileHealth(d, a),
    (e) => e.status === 403,
  );
  d.db.prepare("INSERT INTO holdings VALUES(?,?,?)").run("member-a", card.cardId, 1);
  d.collectionProfile(
    a,
    {
      expectedVersion: me.profile.version,
      data: { ...me.profile.data, mainCardId: card.cardId, shelfIds: [card.cardId] },
    },
    "qa-health-profile",
  );
  const rules = d.document("collection-rules"),
    value = structuredClone(rules.data);
  value.visibility.find((v) => v.poolId === card.poolId).hiddenGrades = [card.rarity];
  d.collectionRules(o, { expectedVersion: rules.version, data: value }, "qa-health-visibility");
  const before = migrationInventory(path),
    report = collectionProfileHealth(d, o);
  assert.ok(report.incompatible >= 1);
  assert.ok(report.repairable >= 1);
  assert.ok(report.removableSelections >= 2);
  assert.equal(report.applied, false);
  assert.equal(report.readOnly, true);
  assert.ok(!JSON.stringify(report).includes("member-a"));
  assert.ok(!JSON.stringify(report).includes(card.cardId));
  assert.deepEqual(migrationInventory(path), before);
  const stdout = execFileSync(process.execPath, ["local-test/backup.mjs"], {
    encoding: "utf8",
    env: { ...process.env, KEEPY_LOCAL_DB: path },
    windowsHide: true,
  });
  const copy = stdout.match(/backup saved: (.+); restore only/)?.[1];
  assert.ok(copy);
  assert.deepEqual(migrationInventory(copy), before);
  const restored = join(root, "restored.sqlite");
  assert.notEqual(resolve(restored), resolve(path));
  const ro = new DatabaseSync(copy, { readOnly: true });
  try {
    await backup(ro, restored);
  } finally {
    ro.close();
  }
  assert.deepEqual(migrationInventory(restored), before);
  console.log(
    "PASS role guarded aggregate diagnosis, no repair writes, immutable inventory and different-file backup restore rehearsal",
  );
} finally {
  d.close();
}
