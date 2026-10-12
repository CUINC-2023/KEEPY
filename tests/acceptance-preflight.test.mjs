import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import {
  parseAcceptanceArgs,
  sourceVersion,
  requireReportVersion,
  acceptancePreflight,
  inspectLocalService,
  portAvailable,
  failureCategory,
  handoffSummary,
} from "../local-test/acceptance-preflight.mjs";
const root = fileURLToPath(new URL("../", import.meta.url)),
  dir = mkdtempSync(join(tmpdir(), "keepy-preflight-"));
function fake() {
  const p = join(dir, "source-" + Math.random().toString(36).slice(2));
  fs.mkdirSync(join(p, "src/data"), { recursive: true });
  fs.mkdirSync(join(p, "node_modules/vite/bin"), { recursive: true });
  fs.writeFileSync(join(p, "package.json"), JSON.stringify({ version: "1.2.3" }));
  fs.writeFileSync(
    join(p, "package-lock.json"),
    JSON.stringify({ version: "1.2.3", packages: { "": { version: "1.2.3" } } }),
  );
  fs.writeFileSync(
    join(p, "src/data/public-hub.ts"),
    'export const APP_VERSION = "1.2.3（Local）";',
  );
  fs.writeFileSync(join(p, "node_modules/vite/bin/vite.js"), "");
  return p;
}
async function freePorts() {
  const servers = Array.from({ length: 3 }, () => createServer());
  await Promise.all(servers.map((s) => new Promise((r) => s.listen(0, "127.0.0.1", r))));
  const ports = servers.map((s) => s.address().port);
  await Promise.all(servers.map((s) => new Promise((r) => s.close(r))));
  return { api: ports[0], web: ports[1], chrome: ports[2] };
}
test("strict isolated port contract and exact source/report versions", () => {
  assert.deepEqual(parseAcceptanceArgs(["--out", "new"]).ports, {
    api: 8787,
    web: 8083,
    chrome: 9337,
  });
  for (const args of [
    ["--out", "x", "--api-port", "8083"],
    ["--out", "x", "--api-port", "65536"],
    ["--out", "x", "--api-port", "1e3"],
    ["--out", "x", "--out", "y"],
    ["--out", "x", "--unknown", "y"],
  ])
    assert.throws(() => parseAcceptanceArgs(args));
  const p = fake();
  assert.equal(sourceVersion(p), "1.2.3");
  fs.writeFileSync(
    join(p, "package-lock.json"),
    JSON.stringify({ version: "1.2.3", packages: { "": { version: "1.2.4" } } }),
  );
  assert.throws(
    () => sourceVersion(p),
    (e) => e.code === "SOURCE_VERSION_MISMATCH",
  );
  assert.throws(
    () => requireReportVersion({ version: "1.2.2" }, "1.2.3"),
    (e) => e.category === "TEST_TOOL",
  );
  assert.doesNotThrow(() => requireReportVersion({ version: "1.2.3" }, "1.2.3"));
});
test("read-only service identity cannot equate HTTP 200 with flow; unavailable and occupied never initialize fixture", async () => {
  let fixtureCalls = 0;
  const s = createServer((req, res) => {
    if (req.method !== "GET" || req.url !== "/api/local-test/health") fixtureCalls++;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        environment: "Local Test",
        persistent: "SQLite",
        syntheticIdentity: true,
        productionAuth: false,
        version: "1.2.2",
      }),
    );
  });
  await new Promise((r) => s.listen(0, "127.0.0.1", r));
  const port = s.address().port;
  try {
    assert.equal(await portAvailable(port), false);
    const probe = await inspectLocalService(port, "api", "1.2.3");
    assert.equal(probe.status, "version-mismatch");
    assert.equal(probe.flowVerified, false);
    assert.equal(fixtureCalls, 0);
    const p = fake(),
      ports = await freePorts();
    ports.api = port;
    await assert.rejects(
      () =>
        acceptancePreflight({
          root: p,
          ports,
          chromePath: process.execPath,
          npmPath: process.execPath,
          version: "1.2.3",
        }),
      (e) => e.code === "PORT_OCCUPIED" && e.diagnostics.services[0].status === "version-mismatch",
    );
    assert.equal(s.listening, true);
    assert.equal(fixtureCalls, 0);
  } finally {
    await new Promise((r) => s.close(r));
  }
  assert.equal((await inspectLocalService(port, "api", "1.2.3")).status, "unavailable");
});
test("tool missing / source mismatch precedes SQLite and mutations; successful empty ports are not healthy-service claims", async () => {
  const p = fake(),
    ports = await freePorts(),
    options = {
      root: p,
      ports,
      chromePath: process.execPath,
      npmPath: process.execPath,
      version: "1.2.3",
    };
  await assert.rejects(
    () => acceptancePreflight({ ...options, chromePath: join(dir, "no-chrome.exe") }),
    (e) => e.code === "REQUIRED_TOOL_MISSING",
  );
  const d = await acceptancePreflight(options);
  assert.ok(d.ports.every((p) => p.available));
  assert.ok(d.services.every((p) => p.status === "unavailable" && !p.flowVerified));
  fs.writeFileSync(join(p, "src/data/public-hub.ts"), 'export const APP_VERSION = "1.2.4";');
  await assert.rejects(
    () => acceptancePreflight(options),
    (e) => e.code === "SOURCE_VERSION_MISMATCH",
  );
});
test("actual CLI missing tool writes minimal environment failure, explicit NOT_RUN, retains original bytes and evidence", () => {
  const source = join(dir, "sentinel.sqlite"),
    db = new DatabaseSync(source);
  const secret = "fixture-private-session-ledger-never-export";
  db.exec("CREATE TABLE sentinel(body TEXT)");
  db.prepare("INSERT INTO sentinel VALUES(?)").run(secret);
  db.close();
  const before = fs.readFileSync(source),
    out = join(dir, "missing-tool");
  const r = spawnSync(
    process.execPath,
    [join(root, "local-test/acceptance.mjs"), "--out", out, "--db", source],
    {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
      env: { ...process.env, KEEPY_CHROME: join(dir, "missing.exe") },
    },
  );
  assert.equal(r.status, 1);
  const report = JSON.parse(fs.readFileSync(join(out, "acceptance-report.json"), "utf8")),
    summary = JSON.parse(fs.readFileSync(join(out, "handoff-summary.json"), "utf8"));
  assert.equal(report.failureCategory, "ENVIRONMENT_STARTUP");
  assert.equal(report.failureCode, "REQUIRED_TOOL_MISSING");
  assert.ok(report.notExecuted.length);
  assert.equal(summary.manualAcceptance, "PENDING");
  assert.ok(
    !JSON.stringify({ report, summary, stdout: r.stdout, stderr: r.stderr }).includes(secret),
  );
  assert.deepEqual(fs.readFileSync(source), before);
  assert.equal(fs.existsSync(join(out, "flow.sqlite")), false);
});
test("classification and summary preserve truthful failures and no private payload", () => {
  assert.equal(failureCategory("preflight", Error()), "ENVIRONMENT_STARTUP");
  assert.equal(failureCategory("test:supply", Error()), "PRODUCT_VALIDATION");
  assert.equal(failureCategory("browser-smoke", Error()), "TEST_TOOL");
  const s = handoffSummary(
    {
      version: "1.2.3",
      status: "FAIL",
      checks: [{ item: "preflight", status: "FAIL", privateBody: "secret" }],
      notExecuted: ["build"],
      ports: { api: 1, web: 2, chrome: 3 },
      limitations: [],
    },
    "new",
  );
  assert.ok(!JSON.stringify(s).includes("secret"));
  assert.equal(s.manualAcceptance, "PENDING");
  assert.equal(s.checks[0].status, "FAIL");
});

test("actual source version mismatch stops before copying/initializing data with a separate minimal failure", () => {
  const p = fake();
  fs.mkdirSync(join(p, "local-test"));
  for (const name of ["acceptance.mjs", "acceptance-preflight.mjs", "migration-inventory.mjs"])
    fs.copyFileSync(join(root, "local-test", name), join(p, "local-test", name));
  fs.writeFileSync(
    join(p, "package-lock.json"),
    JSON.stringify({ version: "1.2.4", packages: { "": { version: "1.2.4" } } }),
  );
  const source = join(dir, "version-source.sqlite"),
    db = new DatabaseSync(source);
  db.exec("CREATE TABLE untouched(id TEXT)");
  db.close();
  const before = fs.readFileSync(source),
    out = join(dir, "version-failure");
  const r = spawnSync(
    process.execPath,
    [join(p, "local-test/acceptance.mjs"), "--out", out, "--db", source],
    {
      cwd: p,
      windowsHide: true,
      encoding: "utf8",
      env: { ...process.env, KEEPY_CHROME: process.execPath },
    },
  );
  assert.equal(r.status, 1);
  const report = JSON.parse(fs.readFileSync(join(out, "acceptance-report.json"), "utf8"));
  assert.equal(report.failureCode, "SOURCE_VERSION_MISMATCH");
  assert.equal(report.failureCategory, "ENVIRONMENT_STARTUP");
  assert.ok(report.checks.some((c) => c.status === "NOT_RUN" && c.item === "build"));
  assert.deepEqual(fs.readFileSync(source), before);
  assert.equal(fs.existsSync(join(out, "flow.sqlite")), false);
});
