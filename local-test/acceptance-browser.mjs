import { parsePort, DiagnosticError } from "./acceptance-preflight.mjs";
import fs from "node:fs";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const out = process.env.KEEPY_ACCEPTANCE_DIR;
if (!out || !fs.existsSync(out))
  throw Error("Run through local:test:acceptance in an isolated environment");
const version = JSON.parse(fs.readFileSync(root + "package.json", "utf8")).version;
const chromePath =
  process.env.KEEPY_CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
if (!fs.existsSync(chromePath))
  throw Error("Local Chrome required; set KEEPY_CHROME to its executable");
const webPort = parsePort(process.env.KEEPY_ACCEPTANCE_WEB_PORT ?? "8083"),
  chromePort = parsePort(process.env.KEEPY_ACCEPTANCE_CHROME_PORT ?? "9337");
const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--remote-debugging-port=" + chromePort,
    "--remote-allow-origins=*",
    "--user-data-dir=" + out + "/browser-profile",
    "about:blank",
  ],
  { windowsHide: true, stdio: "ignore" },
);
let launchFailed = false;
chrome.once("error", () => {
  launchFailed = true;
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws,
  seq = 0;
const pending = new Map(),
  exceptions = [],
  checks = [];
function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new DiagnosticError("CDP_TIMEOUT", "TEST_TOOL"));
    }, 15000);
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function js(expression) {
  const r = await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new DiagnosticError("BROWSER_EXPRESSION_FAILED", "TEST_TOOL");
  return r.result.value;
}
async function until(expression) {
  for (let i = 0; i < 150; i++) {
    if (await js("Boolean(" + expression + ")")) return;
    await sleep(100);
  }
  throw new DiagnosticError("BROWSER_READINESS_TIMEOUT", "TEST_TOOL");
}
async function nav(route) {
  await call("Page.navigate", { url: "http://127.0.0.1:" + webPort + route });
  await until(
    'document.readyState === "complete" && document.body.innerText.includes(' +
      JSON.stringify(version) +
      ")",
  );
  await sleep(500);
}
async function click(text) {
  assert.ok(
    await js(
      "(()=>{const el=[...document.querySelectorAll('button,a')].find(e=>e.offsetParent!==null&&e.textContent.trim()===" +
        JSON.stringify(text) +
        ");if(!el)return false;el.click();return true;})()",
    ),
  );
  await sleep(100);
}
async function choose(fixtureId, locale) {
  await nav("/local-test");
  await until(
    'Object.keys(document.querySelector("[data-testid=local-fixture]")??{}).some(k=>k.startsWith("__reactProps"))',
  );
  await js(
    "(()=>{const el=document.querySelector('[data-testid=local-fixture]');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(el," +
      JSON.stringify(fixtureId) +
      ");el.dispatchEvent(new Event('change',{bubbles:true}));})()",
  );
  await sleep(100);
  await click(locale === "en" ? "Create test session" : "建立測試 Session");
  await until('document.querySelector("[data-testid=local-summary]")');
}
async function enter(route) {
  await js(
    "document.querySelector('[data-local-guide] nav').querySelector(" +
      JSON.stringify('a[href="' + route + '"]') +
      ").click()",
  );
  await until("location.pathname===" + JSON.stringify(route));
  await sleep(500);
}
let phase = "chrome-start",
  step = "start";
try {
  let tab;
  for (let i = 0; i < 60; i++) {
    if (launchFailed) throw new DiagnosticError("CHROME_START_FAILED", "ENVIRONMENT_STARTUP");
    try {
      tab = (
        await (
          await fetch("http://127.0.0.1:" + chromePort + "/json", {
            signal: AbortSignal.timeout(1000),
          })
        ).json()
      ).find((t) => t.type === "page");
      if (tab) break;
    } catch {
      /* Chrome is still starting; retry within the bounded wait. */
    }
    await sleep(200);
  }
  if (!tab) throw Error("Chrome unavailable");
  ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new DiagnosticError("CDP_CONNECT_TIMEOUT", "TEST_TOOL")),
      10000,
    );
    ws.onopen = () => {
      clearTimeout(timer);
      resolve();
    };
    ws.onerror = () => {
      clearTimeout(timer);
      reject(new DiagnosticError("CDP_CONNECT_FAILED", "TEST_TOOL"));
    };
  });
  ws.onclose = () => {
    for (const p of pending.values()) {
      clearTimeout(p.timer);
      p.reject(new DiagnosticError("CDP_CLOSED", "TEST_TOOL"));
    }
    pending.clear();
  };
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id) {
      const p = pending.get(m.id);
      if (p) {
        clearTimeout(p.timer);
        pending.delete(m.id);
        m.error ? p.reject(Error("CDP failed")) : p.resolve(m.result);
      }
    }
    if (m.method === "Runtime.exceptionThrown") exceptions.push("Browser exception");
  };
  await call("Page.enable");
  await call("Runtime.enable");
  await call("Network.enable");
  await call("Network.setCacheDisabled", { cacheDisabled: true });
  for (const [locale, width, theme] of [
    ["zh-TW", 1440, "light"],
    ["en", 360, "dark"],
  ]) {
    await nav("/local-test");
    await js(
      "localStorage.setItem('keepy-locale-v1'," +
        JSON.stringify(locale) +
        ");localStorage.setItem('pf-theme'," +
        JSON.stringify(theme) +
        ")",
    );
    await call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: width === 360,
    });
    for (const [fixtureId, role, route, ready] of [
      ["member-a", "player", "/app/collection", "[data-collection-filters]"],
      ["creator-a", "creator", "/goddess/supply", "[aria-label='Supply package']"],
      ["official-a", "official", "/admin/supply", "[data-supply-tasks]"],
    ]) {
      phase = role;
      await choose(fixtureId, locale);
      await enter(route);
      await until("document.querySelector(" + JSON.stringify(ready) + ")");
      assert.equal(
        await js("fetch('/api/local-test/me').then(r=>r.json()).then(v=>v.user.id)"),
        fixtureId,
      );
      assert.equal(await js("document.documentElement.scrollWidth>innerWidth"), false);
      await call("Input.dispatchKeyEvent", {
        type: "keyDown",
        key: "Tab",
        code: "Tab",
        windowsVirtualKeyCode: 9,
      });
      checks.push({ entrance: role, route, locale, width, theme, status: "PASS" });
    }
    phase = "public";
    step = "public-load-saved";
    await nav("/local-test");
    await until(
      'Object.keys(document.querySelector("[data-testid=local-fixture]")??{}).some(k=>k.startsWith("__reactProps"))',
    );
    await click(locale === "en" ? "Load saved data" : "讀取已保存資料");
    await until('document.querySelector("[data-testid=local-summary]")');
    step = "public-logout";
    await click(locale === "en" ? "End test session" : "登出測試 Session");
    await until('!document.querySelector("[data-testid=local-summary]")');
    step = "public-explore";
    await enter("/explore");
    await until('document.querySelector("[data-content-id]")');
    step = "public-private-api-rejection";
    assert.equal(await js("fetch('/api/local-test/collection/me').then(r=>r.status)"), 401);
    checks.push({ entrance: "public", route: "/explore", locale, width, theme, status: "PASS" });
  }
  assert.equal(exceptions.length, 0);
  fs.writeFileSync(
    out + "/smoke-report.json",
    JSON.stringify(
      {
        version,
        at: new Date().toISOString(),
        environment: "Isolated Local Test",
        checks,
        exceptionCount: exceptions.length,
        limitations: [
          "Quick smoke does not replace full regression or human acceptance",
          "No real Auth/cloud/payment acceptance",
        ],
      },
      null,
      2,
    ),
    { flag: "wx" },
  );
  console.log("PASS " + checks.length + " four-entrance browser checks");
} catch (e) {
  fs.writeFileSync(
    out + "/smoke-failure.json",
    JSON.stringify(
      {
        version,
        phase,
        step,
        failureCode: e instanceof DiagnosticError ? e.code : "BROWSER_CHECK_FAILED",
        checks,
        exceptionCount: exceptions.length,
        status: "FAIL",
        failureCategory:
          e.name === "AssertionError"
            ? "PRODUCT_VALIDATION"
            : phase === "chrome-start"
              ? "ENVIRONMENT_STARTUP"
              : (e.category ?? "TEST_TOOL"),
        reason: "Browser smoke failed; inspect locally without exporting private content",
      },
      null,
      2,
    ),
    { flag: "wx" },
  );
  throw e;
} finally {
  if (ws?.readyState === WebSocket.OPEN) {
    await call("Browser.close").catch(() => {});
    ws.close();
  }
  chrome.kill();
}
