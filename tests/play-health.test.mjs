import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { playMe, playHealth, playCommand } from "../local-test/play.mjs";
import { migrationInventory } from "../local-test/migration-inventory.mjs";
import { validStoredPlaySettings } from "../src/lib/play-contract.mjs";
const path = join(mkdtempSync(join(tmpdir(), "keepy-play-health-")), "qa.sqlite");
const d = new LocalDatabase(path, await loadCatalog());
try {
  const a = d.session("member-a"),
    o = d.session("official-a");
  assert.throws(
    () => playHealth(d, a),
    (e) => e.status === 403,
  );
  assert.equal(playHealth(d, o).checked, 0);
  playCommand(
    d,
    a,
    {
      action: "journey",
      expectedVersion: 0,
      data: { modes: ["memory", "knowledge"], paused: false, restart: true },
    },
    "qa-health-journey",
  );
  const good = playMe(d, a).settings.data;
  assert.equal(good.journey.completed, 0);
  assert.equal(playHealth(d, o).incompatible, 0);
  const raw = JSON.parse(
    d.db.prepare("SELECT payload FROM play_private WHERE user_id=?").get("member-a").payload,
  );
  assert.equal(validStoredPlaySettings(raw), true);
  assert.equal(validStoredPlaySettings({ ...raw, unknown: "private-secret" }), false);
  raw.journey.resultIds = ["unknown-private-reference"];
  d.db
    .prepare("UPDATE play_private SET payload=? WHERE user_id=?")
    .run(JSON.stringify(raw), "member-a");
  const before = migrationInventory(path);
  const report = playHealth(d, o);
  assert.equal(report.missingReferences, 1);
  assert.equal(report.applied, false);
  assert.equal(report.autoRepair, false);
  assert.ok(!JSON.stringify(report).includes("unknown-private-reference"));
  assert.equal(playMe(d, a).settings.data.journey.invalidated, true);
  assert.deepEqual(migrationInventory(path), before);
  d.db
    .prepare("UPDATE play_private SET payload=? WHERE user_id=?")
    .run(JSON.stringify({ schema: 99, privateBody: "sensitive-never-report" }), "member-a");
  assert.equal(playHealth(d, o).incompatible, 1);
  assert.throws(
    () => playMe(d, a),
    (e) => e.status === 422,
  );
  assert.throws(
    () =>
      playCommand(d, a, { action: "clear", expectedVersion: 1, data: null }, "qa-invalid-clear"),
    (e) => e.status === 422,
  );
  assert.ok(!JSON.stringify(playHealth(d, o)).includes("sensitive"));
  console.log(
    "Play health role gate, exact legacy/current schema, missing owner references, readonly inventory and fail-closed incompatible settings PASS",
  );
} finally {
  d.close();
}
