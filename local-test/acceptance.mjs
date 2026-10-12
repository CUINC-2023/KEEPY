import fs from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  parseAcceptanceArgs,
  acceptancePreflight,
  inspectLocalService,
  requireReportVersion,
  DiagnosticError,
  failureCategory,
  handoffSummary,
} from "./acceptance-preflight.mjs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const root = fileURLToPath(new URL("../", import.meta.url)),
  args = process.argv.slice(2);
const options = parseAcceptanceArgs(args),
  ports = options.ports;
const out = resolve(options.out),
  source = resolve(
    options.db ?? process.env.KEEPY_LOCAL_DB ?? join(root, ".local-test/keepy.sqlite"),
  );
if (fs.existsSync(out) || !fs.existsSync(source))
  throw Error(
    "Requires a new output directory and an existing source database; no overwrite allowed",
  );
fs.mkdirSync(out, { recursive: true });
const version = JSON.parse(fs.readFileSync(join(root, "package.json"), "utf8")).version;
let sourceFiles, sourceBefore;
const hashSource = () =>
  Object.fromEntries(
    sourceFiles.stdout
      .trim()
      .split(/\r?\n/)
      .concat(["package.json", "package-lock.json", "vite.config.ts", "eslint.config.js"])
      .sort()
      .map((path) => [
        path.replaceAll("\\", "/"),
        createHash("sha256")
          .update(fs.readFileSync(join(root, path)))
          .digest("hex"),
      ]),
  );
const gitValue = (args) => {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw Error("Cannot bind Git evidence");
  return result.stdout.trim();
};
const report = {
  version,
  at: new Date().toISOString(),
  environment: "Local Test only",
  ports,
  status: "RUNNING",
  checks: [],
  manualAcceptance: "PENDING",
  limitations: [
    "M1=C; no real membership/cloud or production asset validation",
    "All mutation tests use fresh synthetic SQLite; original source is read-only",
    "Reports omit content payloads, ledger records, session hashes and credentials",
  ],
};
const npm =
  process.env.npm_execpath ?? join(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js");
let phase = "preflight",
  vite,
  api,
  d,
  browser,
  migrationInventory;
const run = (file, args = [], env = process.env) =>
  spawnSync(process.execPath, [file, ...args], {
    cwd: root,
    env,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 8e6,
  });
const commands = [
  "test:multi-stage",
  "test:curations",
  "test:collection-history",
  "test:collection-recap",
  "test:collection-contract",
  "test:reading-layout",
  "test:supply-feedback",
  "test:reading-organize",
  "test:reading-bulk",
  "test:supply-tasks",
  "test:reading",
  "test:explore-combined",
  "test:editorial-draft",
  "test:acceptance-preflight",
  "test:supply-work",
  "test:supply-preview",
  "test:article-anchors",
  "test:supply-diff",
  "test:explore-search",
  "test:editorial",
  "test:supply-checklist",
  "test:supply",
  "test:operations",
  "test:participation",
  "test:collection",
  "test:collection-rankings",
  "test:collection-samples",
  "test:collection-goals",
  "test:player-level-preview",
  "test:platform-level-preview",
  "test:growth-display",
  "test:ranking-health",
  "test:ranking-view",
  "test:catalogue-health",
  "test:supply-template",
  "test:collection-query",
  "test:collection-health",
  "test:collection-next-step",
  "test:theme-journey",
  "test:discovery",
  "test:local",
  "test:local:group-one",
  "test:local:group-two",
  "test:handoff",
  "test:acceptance",
  "lint",
  "typecheck",
  "build",
];
const stages = [
  "preflight",
  ...commands,
  "backup-restore",
  "isolated-flow",
  "service-start",
  "browser-smoke",
  "original-preservation",
];
try {
  report.diagnostics = await acceptancePreflight({
    root,
    ports,
    chromePath: process.env.KEEPY_CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
    npmPath: npm,
    version,
  });
  report.checks.push({ item: "preflight", status: "PASS" });
  sourceFiles = spawnSync("rg", ["--files", "src", "local-test", "tests"], {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
  });
  if (sourceFiles.status !== 0) throw Error("Cannot bind source evidence");

  sourceBefore = hashSource();
  report.source = {
    head: gitValue(["rev-parse", "HEAD"]),
    branch: gitValue(["branch", "--show-current"]),
    dirtyCount: gitValue(["status", "--porcelain"]).split(/\r?\n/).filter(Boolean).length,
    hashFile: "source-hashes.json",
  };

  ({ migrationInventory } = await import("./migration-inventory.mjs"));
  const before = migrationInventory(source);
  assert.equal(
    JSON.parse(fs.readFileSync(join(root, "package-lock.json"), "utf8")).version,
    version,
  );
  assert.ok(fs.readFileSync(join(root, "src/data/public-hub.ts"), "utf8").includes(version + "（"));

  for (const command of commands) {
    phase = command;
    const r = run(npm, ["run", command]);
    report.checks.push({
      item: command,
      status: r.status === 0 ? "PASS" : "FAIL",
      exitCode: r.status,
    });
    console.log(command + ": " + r.status);
    if (r.error || r.status === null)
      throw new DiagnosticError("CHECK_PROCESS_FAILED", "TEST_TOOL");
    if (r.status !== 0) throw Error("Required check failed");
  }
  assert.equal(
    JSON.parse(fs.readFileSync(join(root, "package-lock.json"), "utf8")).packages[""].version,
    version,
  );
  phase = "backup-restore";
  // Reuse the existing backup CLI; it always chooses a new file and opens the source read-only.
  const saved = run(join(root, "local-test/backup.mjs"), [], {
    ...process.env,
    KEEPY_LOCAL_DB: source,
  });
  assert.equal(saved.status, 0);
  const backupPath = saved.stdout.match(/backup saved: (.+); restore only/)?.[1];
  assert.ok(backupPath);
  assert.deepEqual(migrationInventory(backupPath), before);
  const { DatabaseSync, backup } = await import("node:sqlite");
  const restored = join(out, "restored.sqlite"),
    readOnly = new DatabaseSync(backupPath, { readOnly: true });
  try {
    await backup(readOnly, restored);
  } finally {
    readOnly.close();
  }
  assert.deepEqual(migrationInventory(restored), before);
  const immutable = before.tables.find((t) => t.name === "document_versions");
  fs.writeFileSync(
    join(out, "backup-report.json"),
    JSON.stringify(
      {
        version,
        status: "PASS",
        integrity: "ok",
        foreignKeyErrors: 0,
        distinctRestore: true,
        tables: before.tables.map(({ name, count }) => ({
          name,
          count,
          countAndDigestMatch: true,
        })),
        immutableVersionCount: immutable?.count ?? 0,
        immutableDigestsMatch: true,
        sourceUnchanged: true,
      },
      null,
      2,
    ),
    { flag: "wx" },
  );
  report.checks.push({
    item: "Existing coherent backup and different-file restore: integrity/FK/count/digest/immutable versions",
    status: "PASS",
  });
  phase = "isolated-flow";
  const isolated = join(out, "flow.sqlite");
  const { acceptanceFlow } = await import("./acceptance-flow.mjs");
  const flow = await acceptanceFlow(isolated);
  fs.writeFileSync(join(out, "flow-report.json"), JSON.stringify({ version, ...flow }, null, 2), {
    flag: "wx",
  });
  report.checks.push(...flow.checks);
  phase = "service-start";
  const [{ LocalDatabase }, { loadCatalog }, { createLocalServer }, { createServer: createVite }] =
    await Promise.all([
      import("./database.mjs"),
      import("./catalog.mjs"),
      import("./server.mjs"),
      import("vite"),
    ]);
  d = new LocalDatabase(isolated, await loadCatalog());
  api = createLocalServer(d, { port: ports.api, webPort: ports.web });
  await new Promise((resolve, reject) => {
    api.once("error", reject);
    api.listen(ports.api, "127.0.0.1", resolve);
  });
  vite = await createVite({
    root,
    server: {
      host: "127.0.0.1",
      port: ports.web,
      strictPort: true,
      proxy: { "/api/local-test": "http://127.0.0.1:" + ports.api },
    },
    optimizeDeps: { force: true },
    logLevel: "error",
  });
  await vite.listen();
  report.ownedServices = await Promise.all([
    inspectLocalService(ports.api, "api", version),
    inspectLocalService(ports.web, "web", version, 30000),
  ]);
  if (
    report.ownedServices[0].status !== "identity-match-no-flow-proof" ||
    report.ownedServices[1].status !== "available-unvalidated"
  )
    throw new DiagnosticError("OWNED_SERVICE_NOT_READY");
  phase = "browser-smoke";
  // Asynchronous child keeps Vite and the API responsive while Chrome requests pages.
  const { spawn } = await import("node:child_process");
  browser = spawn(process.execPath, [join(root, "local-test/acceptance-browser.mjs")], {
    cwd: root,
    env: {
      ...process.env,
      KEEPY_ACCEPTANCE_DIR: out,
      KEEPY_ACCEPTANCE_WEB_PORT: String(ports.web),
      KEEPY_ACCEPTANCE_CHROME_PORT: String(ports.chrome),
    },
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let browserOutput = "";
  browser.stdout.on("data", (b) => {
    browserOutput += b;
  });
  browser.stderr.on("data", () => {});
  const exit = await new Promise((resolve, reject) => {
    browser.once("error", reject);
    browser.once("exit", resolve);
  });
  if (exit !== 0) {
    const path = join(out, "smoke-failure.json");
    const failure = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, "utf8")) : null;
    if (failure) requireReportVersion(failure, version);
    throw new DiagnosticError("BROWSER_VALIDATION_FAILED", failure?.failureCategory ?? "TEST_TOOL");
  }
  console.log(browserOutput.trim());
  const smoke = JSON.parse(fs.readFileSync(join(out, "smoke-report.json"), "utf8"));
  requireReportVersion(smoke, version);
  if (smoke.checks.length !== 8 || smoke.checks.some((c) => c.status !== "PASS"))
    throw new DiagnosticError("INCOMPLETE_BROWSER_REPORT", "TEST_TOOL");
  report.checks.push({
    item: "Four actual normal UI entrances: zh desktop/light and en phone/dark",
    status: "PASS",
  });
  phase = "original-preservation";
  assert.deepEqual(migrationInventory(source), before);
  report.checks.push({
    item: "Original SQLite table counts/digests and immutable version inventory unchanged",
    status: "PASS",
  });
  report.status = "PASS";
  report.source.unchanged = JSON.stringify(sourceBefore) === JSON.stringify(hashSource());
  assert.equal(report.source.unchanged, true);
} catch (error) {
  report.status = "FAIL";
  report.failureCategory = failureCategory(phase, error);
  report.failureCode = error.code ?? "PHASE_FAILED";
  if (error.diagnostics) report.diagnostics = error.diagnostics;
  report.notExecuted = stages.slice(stages.indexOf(phase) + 1);
  report.checks.push(...report.notExecuted.map((item) => ({ item, status: "NOT_RUN" })));
  report.checks.push({
    item: phase,
    status: "FAIL",
    reason: "Inspect this phase locally; no private payload or credential is exported",
  });
  process.exitCode = 1;
} finally {
  if (browser && browser.exitCode === null) browser.kill();
  if (vite) await vite.close();
  if (api?.listening) await new Promise((resolve) => api.close(resolve));
  if (d) d.close();
  if (sourceBefore)
    fs.writeFileSync(
      join(out, "source-hashes.json"),
      JSON.stringify({ before: sourceBefore, after: hashSource() }, null, 2),
      { flag: "wx" },
    );
  fs.writeFileSync(join(out, "acceptance-report.json"), JSON.stringify(report, null, 2), {
    flag: "wx",
  });
  fs.writeFileSync(
    join(out, "handoff-summary.json"),
    JSON.stringify(handoffSummary(report, out), null, 2),
    { flag: "wx" },
  );
  console.log(
    report.status +
      " Local acceptance " +
      version +
      "; report " +
      join(out, "acceptance-report.json"),
  );
}
