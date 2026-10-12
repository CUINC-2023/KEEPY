import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";
import { DatabaseSync } from "node:sqlite";
const root = fileURLToPath(new URL("../", import.meta.url)),
  dir = mkdtempSync(join(tmpdir(), "keepy-acceptance-guards-"));
const source = join(dir, "source.sqlite"),
  db = new DatabaseSync(source);
const secret = "private-fixture-body-and-session-credential-never-report";
db.exec("CREATE TABLE sentinel(payload TEXT)");
db.prepare("INSERT INTO sentinel VALUES(?)").run(secret);
db.close();
const before = readFileSync(source),
  existing = join(dir, "existing");
mkdirSync(existing);
writeFileSync(join(existing, "preserve.txt"), "existing evidence");
const run = (out) =>
  spawnSync(
    process.execPath,
    [join(root, "local-test/acceptance.mjs"), "--out", out, "--db", source],
    { cwd: root, windowsHide: true, encoding: "utf8", maxBuffer: 2e6 },
  );
assert.notEqual(run(existing).status, 0);
assert.deepEqual(readdirSync(existing), ["preserve.txt"]);
assert.deepEqual(readFileSync(source), before);
const blocker = createServer();
await new Promise((resolve) => blocker.listen(9337, "127.0.0.1", resolve));
try {
  const output = join(dir, "busy-port");
  const r = run(output);
  assert.equal(r.status, 1);
  const text = readFileSync(join(output, "acceptance-report.json"), "utf8"),
    report = JSON.parse(text);
  assert.equal(report.status, "FAIL");
  assert.equal(report.manualAcceptance, "PENDING");
  assert.ok(report.checks.some((c) => c.item === "preflight" && c.status === "FAIL"));
  assert.ok(!text.includes(secret));
  assert.ok(!JSON.stringify({ stdout: r.stdout, stderr: r.stderr }).includes(secret));
  assert.deepEqual(readFileSync(source), before);
} finally {
  await new Promise((resolve) => blocker.close(resolve));
}
console.log(
  "Acceptance guards passed: existing evidence refused, occupied ports do not kill others, original bytes unchanged, minimal failed report and manual pending.",
);
