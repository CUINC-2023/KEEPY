import { request } from "node:http";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { createLocalServer } from "../local-test/server.mjs";

if (!isMainThread) {
  const d = new LocalDatabase(workerData.path, await loadCatalog(), {
    clock: () => workerData.clock,
  });
  try {
    parentPort.postMessage({
      id: d.draw(workerData.token, { poolId: "p-uniform", mode: "single" }, "parallel-worker-key")
        .id,
    });
  } finally {
    d.close();
  }
} else {
  const checks = [],
    catalog = await loadCatalog(),
    dir = mkdtempSync(join(tmpdir(), "keepy-local-017-")),
    path = join(dir, "test.sqlite");
  let fault = "";
  const at = Date.parse("2026-10-04T10:00:00Z");
  let clock = at;
  let d = new LocalDatabase(path, catalog, {
    clock: () => clock,
    fault: (stage) => {
      if (fault === stage) throw Error("Injected " + stage);
    },
  });
  const a = d.session("member-a"),
    b = d.session("member-b"),
    ca = d.session("creator-a"),
    cb = d.session("creator-b"),
    oa = d.session("official-a"),
    ob = d.session("official-b");
  const snapshot = () => JSON.parse(JSON.stringify(d.summary(a)));
  const rejects = (fn, status) => assert.throws(fn, (e) => e.status === status);
  rejects(() => d.actor("forged"), 401);
  rejects(() => d.session("real-user"), 422);
  clock = at + 3 * 60 * 60 * 1000;
  rejects(() => d.actor(a), 401);
  clock = at;
  const ended = d.session("member-a");
  d.logout(ended);
  rejects(() => d.actor(ended), 401);
  const before = snapshot();
  const draw = d.draw(a, { poolId: "p-uniform", mode: "10plus1" }, "original-ten-key");
  assert.equal(draw.items.length, 11);
  assert.equal(draw.after - draw.before, 11);
  assert.equal(d.summary(a).user.balance, before.user.balance - 900);
  assert.equal(
    d.summary(a).holdings.reduce((n, h) => n + h.count, 0),
    11,
  );
  assert.ok(draw.items.every((i) => i.source === "test-paid-draw"));
  assert.equal(
    d.db.prepare("SELECT COUNT(*) n FROM acquisitions WHERE draw_id=?").get(draw.id).n,
    11,
  );
  const stable = snapshot();
  assert.deepEqual(d.draw(a, { poolId: "p-uniform", mode: "10plus1" }, "original-ten-key"), draw);
  assert.deepEqual(snapshot(), stable);
  rejects(() => d.draw(a, { poolId: "p-uniform", mode: "single" }, "original-ten-key"), 409);
  rejects(
    () => d.draw(a, { poolId: "p-uniform", mode: "single", results: [] }, "invalid-input-key"),
    422,
  );
  rejects(() => d.draw(a, { poolId: "nonexistent", mode: "single" }, "invalid-pool-key"), 422);
  rejects(() => d.draw(a, { poolId: "p-uniform", mode: "single" }, "short"), 422);
  assert.equal(d.summary(b).holdings.length, 0);
  rejects(() => d.drawById(b, draw.id), 404);
  rejects(() => d.audit(a), 403);
  rejects(() => d.revoke(a, "official-a"), 403);
  rejects(() => d.cooperation(a), 403);
  const ac = d.cooperation(ca),
    bc = d.cooperation(cb);
  assert.ok(ac.data.partners.every((p) => p.accountId === "demo-approved-a"));
  assert.ok(bc.data.partners.every((p) => p.accountId === "demo-approved-b"));
  assert.equal(ac.data.contracts.length, 1);
  assert.equal(bc.data.contracts.length, 1);
  assert.notEqual(ac.data.contracts[0].id, bc.data.contracts[0].id);
  checks.push(
    "Synthetic sessions: forged/expired/logout rejected; accounts, creator contracts and direct official APIs isolated",
  );
  for (const stage of ["after-debit", "after-result", "after-holdings", "after-ledger"]) {
    const previous = snapshot(),
      nAudit = d.db.prepare("SELECT COUNT(*) n FROM audit").get().n,
      nAcq = d.db.prepare("SELECT COUNT(*) n FROM acquisitions").get().n;
    fault = stage;
    assert.throws(() => d.draw(a, { poolId: "p-uniform", mode: "single" }, "fault-" + stage));
    fault = "";
    assert.deepEqual(snapshot(), previous);
    assert.equal(d.db.prepare("SELECT COUNT(*) n FROM audit").get().n, nAudit);
    assert.equal(d.db.prepare("SELECT COUNT(*) n FROM acquisitions").get().n, nAcq);
    assert.equal(
      d.db.prepare("SELECT COUNT(*) n FROM draws WHERE request_key=?").get("fault-" + stage).n,
      0,
    );
    d.draw(a, { poolId: "p-uniform", mode: "single" }, "fault-" + stage);
  }
  checks.push(
    "Four write faults roll back balance/result/holdings/pity/acquisition/ledger/audit completely; same keys retry successfully",
  );
  const oldRules = JSON.stringify(draw.rules),
    oldResult = d.drawById(a, draw.id);
  d.appendPoolVersion(oa, "p-uniform", { expectedVersion: 1, visibility: "hidden" });
  assert.equal(JSON.stringify(d.drawById(a, draw.id).rules), oldRules);
  assert.deepEqual(d.drawById(a, draw.id), oldResult);
  rejects(
    () => d.appendPoolVersion(oa, "p-uniform", { expectedVersion: 1, visibility: "normal" }),
    409,
  );
  const newer = d.draw(a, { poolId: "p-uniform", mode: "single" }, "new-version-key");
  assert.equal(newer.poolVersion, 2);
  assert.equal(newer.rules.visibility, "hidden");
  const doc = d.cooperation(oa),
    updated = structuredClone(doc.data);
  updated.partners[0].name = "Revised synthetic name";
  d.saveCooperation(oa, { expectedVersion: doc.version, data: updated });
  rejects(() => d.saveCooperation(oa, { expectedVersion: doc.version, data: updated }), 409);
  const tamper = structuredClone(updated);
  tamper.contracts[0].text = "Overwrite agreed v1";
  rejects(() => d.saveCooperation(oa, { expectedVersion: doc.version + 1, data: tamper }), 422);
  const currentDoc = d.cooperation(oa).data;
  const appended = structuredClone(currentDoc);
  appended.contracts.push({
    ...appended.contracts[0],
    id: "local-contract-a-v2",
    version: 2,
    text: "New immutable draft v2",
    status: "draft",
    confirmedAt: "",
    returnReason: "",
  });
  d.saveCooperation(oa, { expectedVersion: doc.version + 1, data: appended });
  assert.equal(d.cooperation(oa).data.contracts[0].text, currentDoc.contracts[0].text);
  assert.equal(draw.rules.cooperation, undefined);
  const storedDraw = JSON.parse(
    d.db.prepare("SELECT result FROM draws WHERE id=?").get(draw.id).result,
  );
  assert.deepEqual(storedDraw.rules.cooperation, catalog.operations);
  checks.push(
    "Pool visibility v2 and persisted cooperation/contract v2 append; stale updates and old contract overwrite rejected; old draw snapshot unchanged",
  );
  d.revoke(oa, "official-b");
  rejects(() => d.audit(ob), 403);
  rejects(
    () => d.appendPoolVersion(ob, "p-uniform", { expectedVersion: 2, visibility: "normal" }),
    403,
  );
  assert.equal(d.actor(ob).role, "member");
  d.revoke(oa, "creator-b");
  rejects(() => d.cooperation(cb), 403);
  assert.equal(d.summary(b).user.balance, 10000);
  checks.push(
    "Current-role revocation immediately blocks existing official/creator sessions; no loss of owned data",
  );
  const workersBefore = snapshot();
  const workerCatalog = {
    pools: catalog.pools,
    cards: catalog.cards,
    operations: catalog.operations,
  };
  const workerResults = await Promise.all(
    Array.from(
      { length: 4 },
      () =>
        new Promise((resolve, reject) => {
          const w = new Worker(new URL(import.meta.url), {
            workerData: { path, catalog: workerCatalog, token: a, clock },
          });
          w.on("message", resolve);
          w.on("error", reject);
          w.on("exit", (code) => {
            if (code) reject(Error("worker " + code));
          });
        }),
    ),
  );
  assert.equal(new Set(workerResults.map((r) => r.id)).size, 1);
  assert.equal(d.summary(a).user.balance, workersBefore.user.balance - 100);
  assert.equal(d.summary(a).draws.length, workersBefore.draws.length + 1);
  const api = createLocalServer(d);
  await new Promise((resolve) => api.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + api.address().port + "/api/local-test";
  const http = async (
    path,
    { method = "GET", body, token = a, key, origin = "http://127.0.0.1:8787", host } = {},
  ) =>
    fetch(base + path, {
      method,
      headers: {
        Origin: origin,
        Cookie: "keepy_local_session=" + token,
        "Content-Type": "application/json",
        ...(key ? { "Idempotency-Key": key } : {}),
        ...(host ? { Host: host } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  try {
    const httpBefore = snapshot();
    const responses = await Promise.all(
      Array.from({ length: 20 }, () =>
        http("/draws", {
          method: "POST",
          body: { poolId: "p-uniform", mode: "single" },
          key: "parallel-http-key",
        }),
      ),
    );
    assert.ok(responses.every((r) => r.status === 200));
    const results = await Promise.all(responses.map((r) => r.json()));
    assert.equal(new Set(results.map((r) => r.id)).size, 1);
    assert.equal(d.summary(a).user.balance, httpBefore.user.balance - 100);
    assert.equal((await http("/admin/audit", { token: a })).status, 403);
    assert.equal((await http("/draws/" + draw.id, { token: b })).status, 404);
    assert.equal((await http("/me", { token: "forged" })).status, 401);
    assert.equal(
      (
        await http("/draws", {
          method: "POST",
          body: { poolId: "p-uniform", mode: "single" },
          key: "hostile-origin-key",
          origin: "https://evil.example",
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await http("/session", {
          method: "POST",
          body: { fixtureId: "official-a" },
          origin: "https://evil.example",
        })
      ).status,
      403,
    );
    const hostileHost = await new Promise((resolve, reject) => {
      const req = request(base + "/health", { headers: { Host: "evil.example:8787" } }, (res) => {
        res.resume();
        resolve(res.statusCode);
      });
      req.on("error", reject);
      req.end();
    });
    assert.equal(hostileHost, 403);
    assert.equal(
      (
        await http("/session", {
          method: "POST",
          body: { fixtureId: "member-a", role: "official" },
        })
      ).status,
      422,
    );
    const foreign = await (await http("/me?userId=member-b")).json();
    assert.equal(foreign.user.id, "member-a");
  } finally {
    await new Promise((resolve) => api.close(resolve));
  }
  checks.push(
    "Four concurrent SQLite writers and twenty parallel HTTP retries commit one draw; hostile Origin/Host, forged sessions and caller role injection rejected",
  );
  // Insufficient balance must not create a request, debit, result or ledger fragment.
  const low = d.session("member-b");
  d.db.prepare("UPDATE users SET balance=0 WHERE id=?").run("member-b");
  const lowBefore = d.summary(low);
  rejects(() => d.draw(low, { poolId: "p-uniform", mode: "single" }, "insufficient-key"), 409);
  assert.deepEqual(d.summary(low), lowBefore);
  d.db.prepare("UPDATE users SET balance=10000 WHERE id=?").run("member-b");
  const unavailablePool = catalog.pools.find((p) => p.status === "live" && p.id !== "p-uniform");
  if (unavailablePool)
    rejects(
      () => d.draw(a, { poolId: unavailablePool.id, mode: "single" }, "unlicensed-pool-key"),
      422,
    );
  assert.ok(!JSON.stringify(snapshot()).includes("Synthetic Local Test contract"));
  const damaged = join(dir, "damaged.sqlite");
  writeFileSync(damaged, "not a sqlite database");
  const damagedBefore = readFileSync(damaged);
  assert.throws(() => new LocalDatabase(damaged, catalog));
  assert.deepEqual(readFileSync(damaged), damagedBefore);
  const persisted = snapshot();
  const copy = join(dir, "backup.sqlite");
  await d.backupTo(copy);
  d.close();
  d = new LocalDatabase(path, catalog, { clock: () => at });
  assert.deepEqual(snapshot(), persisted);
  assert.equal(d.actor(ob).role, "member");
  assert.equal(d.cooperation(oa).data.contracts.at(-1).version, 2);
  const restored = new LocalDatabase(copy, catalog, { clock: () => at });
  assert.deepEqual(JSON.parse(JSON.stringify(restored.summary(a))), persisted);
  assert.deepEqual(restored.cooperation(oa), d.cooperation(oa));
  assert.equal(
    restored.db.prepare("SELECT COUNT(*) n FROM audit").get().n,
    d.db.prepare("SELECT COUNT(*) n FROM audit").get().n,
  );
  for (const user of restored.db.prepare("SELECT id,balance FROM users").all())
    assert.equal(
      restored.db.prepare("SELECT SUM(amount) total FROM ledger WHERE user_id=?").get(user.id)
        .total,
      user.balance,
    );
  restored.close();
  d.close();
  checks.push(
    "Insufficient balance has no side effects; service reopen retains sessions/roles/holdings/history/ledger/contracts; backup restored to separate SQLite matches",
  );
  console.log("PASS " + JSON.stringify({ checks, artifactDirectory: dir }));
}
