import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { migrationInventory } from "../local-test/migration-inventory.mjs";
const dir = mkdtempSync(join(tmpdir(), "keepy-migration-inventory-")),
  path = join(dir, "test.sqlite");
try {
  const db = new DatabaseSync(path);
  db.exec(
    "CREATE TABLE documents(id TEXT PRIMARY KEY,version INTEGER,payload TEXT); CREATE TABLE sessions(token_hash TEXT); CREATE TABLE holdings(user_id TEXT, count INTEGER);",
  );
  db.prepare("INSERT INTO documents VALUES(?,?,?)").run(
    "supply:local-demo",
    3,
    '{"email":"PRIVATE_SENTINEL","story":"PRIVATE_BODY"}',
  );
  db.prepare("INSERT INTO documents VALUES(?,?,?)").run("unclassified", 1, "PRIVATE_BODY");
  db.prepare("INSERT INTO sessions VALUES(?)").run("SECRET_TOKEN");
  db.prepare("INSERT INTO holdings VALUES(?,?)").run("TEST_USER", 5);
  db.close();
  const before = readFileSync(path),
    first = migrationInventory(path),
    second = migrationInventory(path);
  assert.deepEqual(first, second);
  assert.deepEqual(readFileSync(path), before);
  const text = JSON.stringify(first);
  for (const privateValue of ["PRIVATE_SENTINEL", "PRIVATE_BODY", "SECRET_TOKEN", "TEST_USER"])
    assert.ok(!text.includes(privateValue));
  assert.ok(first.tables.every((t) => t.automaticProductionImport === false));
  assert.equal(
    first.documents.find((d) => d.sourceId === "unclassified").disposition,
    "unknown-blocked",
  );
  assert.equal(
    first.tables.find((t) => t.name === "sessions").disposition,
    "never-migrate-credentials",
  );
  assert.throws(() => migrationInventory(join(dir, "missing.sqlite")), /Existing/);
  const cli = new URL("../local-test/migration-inventory.mjs", import.meta.url).pathname.replace(
      /^\/([A-Za-z]:)/,
      "$1",
    ),
    out = join(dir, "report.json");
  assert.equal(spawnSync(process.execPath, [cli, "--db", path, "--out", out]).status, 0);
  assert.notEqual(spawnSync(process.execPath, [cli, "--db", path, "--out", out]).status, 0);
  assert.notEqual(spawnSync(process.execPath, [cli, "--db", path, "--out", path]).status, 0);
  assert.deepEqual(readFileSync(path), before);
  console.log(
    "PASS: read-only, deterministic, no private payload or credentials, synthetic/unknown fail closed, missing source and overwrite protection",
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}
