import fs from "node:fs";
import { join } from "node:path";
import { createServer } from "node:net";
export class DiagnosticError extends Error {
  constructor(code, category = "ENVIRONMENT_STARTUP") {
    super(code);
    this.code = code;
    this.category = category;
  }
}
export function parseAcceptanceArgs(args) {
  const allowed = new Set(["--out", "--db", "--api-port", "--web-port", "--chrome-port"]),
    values = {};
  if (args.length % 2) throw new DiagnosticError("INVALID_ARGUMENTS");
  for (let i = 0; i < args.length; i += 2) {
    if (!allowed.has(args[i]) || values[args[i]] !== undefined || !args[i + 1])
      throw new DiagnosticError("INVALID_ARGUMENTS");
    values[args[i]] = args[i + 1];
  }
  if (!values["--out"]) throw new DiagnosticError("OUTPUT_REQUIRED");
  const ports = {
    api: parsePort(values["--api-port"] ?? "8787"),
    web: parsePort(values["--web-port"] ?? "8083"),
    chrome: parsePort(values["--chrome-port"] ?? "9337"),
  };
  if (new Set(Object.values(ports)).size !== 3) throw new DiagnosticError("PORTS_MUST_DIFFER");
  return { out: values["--out"], db: values["--db"], ports };
}
export function parsePort(value) {
  if (!/^\d{1,5}$/.test(String(value)) || Number(value) < 1 || Number(value) > 65535)
    throw new DiagnosticError("INVALID_PORT");
  return Number(value);
}
export function sourceVersion(root) {
  try {
    const p = JSON.parse(fs.readFileSync(join(root, "package.json"), "utf8")),
      l = JSON.parse(fs.readFileSync(join(root, "package-lock.json"), "utf8")),
      a = fs
        .readFileSync(join(root, "src/data/public-hub.ts"), "utf8")
        .match(/APP_VERSION\s*=\s*["'](\d+\.\d+\.\d+)/)?.[1];
    if (
      !/^\d+\.\d+\.\d+$/.test(p.version) ||
      p.version !== l.version ||
      p.version !== l.packages?.[""]?.version ||
      p.version !== a
    )
      throw Error();
    return p.version;
  } catch {
    throw new DiagnosticError("SOURCE_VERSION_MISMATCH");
  }
}
export function requireReportVersion(report, version) {
  if (report?.version !== version)
    throw new DiagnosticError("REPORT_VERSION_MISMATCH", "TEST_TOOL");
}
export function portAvailable(port) {
  return new Promise((resolve) => {
    const probe = createServer();
    probe.once("error", () => resolve(false));
    probe.listen(port, "127.0.0.1", () => probe.close(() => resolve(true)));
  });
}
export async function inspectLocalService(port, kind, version, timeoutMs = 1000) {
  try {
    const response = await fetch(
      "http://127.0.0.1:" + port + (kind === "api" ? "/api/local-test/health" : "/"),
      {
        signal: AbortSignal.timeout(Math.min(30000, Math.max(1000, timeoutMs))),
        redirect: "error",
      },
    );
    if (!response.ok) {
      await response.body?.cancel();
      return { kind, port, status: "http-error", httpStatus: response.status };
    }
    if (kind === "web") {
      await response.body?.cancel();
      return { kind, port, status: "available-unvalidated", httpStatus: 200, flowVerified: false };
    }
    const reader = response.body.getReader();
    let bytes = 0,
      text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > 4096) {
        await reader.cancel();
        throw Error();
      }
      text += new TextDecoder().decode(value);
    }
    const body = JSON.parse(text);
    const identity =
      body.environment === "Local Test" &&
      body.syntheticIdentity === true &&
      body.productionAuth === false &&
      body.persistent === "SQLite";
    const observedVersion =
      typeof body.version === "string" && /^\d+\.\d+\.\d+$/.test(body.version)
        ? body.version
        : null;
    return {
      kind,
      port,
      status:
        identity && observedVersion === version
          ? "identity-match-no-flow-proof"
          : identity
            ? "version-mismatch"
            : "unexpected-service",
      httpStatus: 200,
      observedVersion,
      flowVerified: false,
    };
  } catch {
    return { kind, port, status: "unavailable", flowVerified: false };
  }
}
export async function acceptancePreflight({ root, ports, chromePath, npmPath, version }) {
  const tools = {
    node24: Number(process.versions.node.split(".")[0]) >= 24,
    npm: fs.existsSync(npmPath),
    vite: fs.existsSync(join(root, "node_modules/vite/bin/vite.js")),
    chrome: fs.existsSync(chromePath),
  };
  const availability = await Promise.all(
    Object.entries(ports).map(async ([kind, port]) => ({
      kind,
      port,
      available: await portAvailable(port),
    })),
  );
  const services = await Promise.all(
    ["api", "web"].map((kind) => inspectLocalService(ports[kind], kind, version)),
  );
  const diagnostics = { tools, ports: availability, services, flowVerified: false };
  const fail = (code) => {
    const error = new DiagnosticError(code);
    error.diagnostics = diagnostics;
    throw error;
  };
  if (Object.values(tools).some((v) => !v)) fail("REQUIRED_TOOL_MISSING");
  try {
    sourceVersion(root);
  } catch {
    fail("SOURCE_VERSION_MISMATCH");
  }
  if (availability.some((p) => !p.available)) fail("PORT_OCCUPIED");
  return diagnostics;
}
export function failureCategory(phase, error) {
  if (error?.category) return error.category;
  if (phase === "preflight" || phase === "service-start") return "ENVIRONMENT_STARTUP";
  if (phase === "browser-smoke") return "TEST_TOOL";
  return "PRODUCT_VALIDATION";
}
export function handoffSummary(report, out) {
  return {
    version: report.version,
    status: report.status,
    failureCategory: report.failureCategory ?? null,
    checks: report.checks.map(({ item, status }) => ({ item, status })),
    notExecuted: report.notExecuted ?? [],
    evidenceDirectory: out,
    entrances: {
      public: "/explore",
      player: "/app/collection",
      official: "/admin/supply",
      creator: "/goddess/supply",
    },
    ports: report.ports,
    manualAcceptance: "PENDING",
    continue:
      report.status === "PASS"
        ? "Review acceptance evidence and complete the unchecked manual checklist. Local-only; no deployment."
        : "Inspect the failure category and code, fix the stated cause, and retry in a NEW output directory. Never kill unrelated processes.",
    limitations: report.limitations,
  };
}
