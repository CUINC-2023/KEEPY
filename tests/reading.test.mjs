import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { DatabaseSync, backup } from "node:sqlite";
import { acceptanceFlow } from "../local-test/acceptance-flow.mjs";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { createLocalServer } from "../local-test/server.mjs";
import { readingMe, readingCommand } from "../local-test/discovery.mjs";
import { migrationInventory } from "../local-test/migration-inventory.mjs";
test("read later uses existing documents only: isolation, CAS/replay, rollback, current projection, expiry and backup/restart", async () => {
  const dir = mkdtempSync(join(tmpdir(), "keepy-reading-")),
    path = join(dir, "qa.sqlite");
  await acceptanceFlow(path);
  let now = Date.now(),
    fault = "";
  let d = new LocalDatabase(path, await loadCatalog(), {
    clock: () => now,
    fault: (s) => {
      if (s === fault) throw Error("Isolated reading rollback probe");
    },
  });
  const server = createLocalServer(d);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + server.address().port + "/api/local-test",
    a = d.session("member-a"),
    b = d.session("member-b"),
    official = d.session("official-a"),
    creator = d.session("creator-a");
  let seq = 0;
  async function api(route, token = "", body, key = "reading-test-" + ++seq) {
    const r = await fetch(base + route, {
      headers: {
        Origin: "http://127.0.0.1:8787",
        Cookie: "keepy_local_session=" + token,
        "Content-Type": "application/json",
        "Idempotency-Key": key,
      },
      ...(body === undefined ? {} : { method: "POST", body: JSON.stringify(body) }),
    });
    return { status: r.status, value: await r.json() };
  }
  const get = (token) => api("/discovery/reading/me", token),
    send = (body, key) => api("/discovery/reading/commands", a, body, key),
    id = "local-demo-022-progress",
    body = { articleId: id, saved: true, expectedVersion: 0 };
  try {
    const before = migrationInventory(path);
    assert.equal((await get("")).status, 401);
    assert.equal((await get(creator)).status, 403);
    assert.equal((await get(official)).status, 403);
    assert.deepEqual(migrationInventory(path), before);
    assert.equal((await get(a)).value.version, 0);
    assert.equal(
      d.db.prepare("SELECT count(*) n FROM documents WHERE id LIKE 'reading:%'").get().n,
      0,
    );
    assert.deepEqual(migrationInventory(path), before);
    assert.equal((await send({ ...body, actorId: "member-b" })).status, 422);
    assert.equal((await send({ ...body, articleId: "private-draft" })).status, 404);
    assert.equal((await send(body, "original-reading-key")).status, 200);
    const saved = (await get(a)).value;
    assert.equal(saved.items.length, 1);
    assert.deepEqual(Object.keys(saved.items[0]).sort(), [
      "articleId",
      "available",
      "groupId",
      "savedAt",
      "state",
    ]);
    assert.equal(saved.items[0].available, true);
    assert.equal((await get(b)).value.items.length, 0);
    assert.equal(
      (await api("/discovery/reading/commands", official, body, "original-reading-key")).status,
      403,
    );
    now += 1000;
    assert.equal((await send(body, "original-reading-key")).status, 200);
    assert.deepEqual((await get(a)).value, saved);
    assert.equal((await send({ ...body, expectedVersion: 1 })).value.version, 1);
    assert.deepEqual((await get(a)).value, saved);
    assert.equal((await send({ ...body, saved: false }, "original-reading-key")).status, 409);
    assert.equal((await send({ ...body, articleId: "local-demo-022-composition" })).status, 409);
    const stable = migrationInventory(path);
    fault = "before-mutation-receipt";
    assert.equal(
      (
        await send(
          { articleId: "local-demo-022-composition", saved: true, expectedVersion: 1 },
          "reading-rollback-key",
        )
      ).status,
      500,
    );
    assert.deepEqual(migrationInventory(path), stable);
    fault = "";
    assert.equal(
      (
        await send(
          { articleId: "local-demo-022-composition", saved: true, expectedVersion: 1 },
          "reading-rollback-key",
        )
      ).status,
      200,
    );
    assert.equal((await get(a)).value.items.length, 2);
    // Asset/task history and approved/published revision snapshots remain untouched by reading commands.
    const changed = migrationInventory(path);
    for (const table of before.tables.filter(
      (t) => !["documents", "audit", "mutations"].includes(t.name),
    ))
      assert.deepEqual(
        changed.tables.find((t) => t.name === table.name),
        table,
      );
    assert.deepEqual(
      changed.documents.filter((x) => !x.sourceId.startsWith("reading:")),
      before.documents,
    );
    assert.deepEqual(
      changed.tables.map((x) => x.name),
      before.tables.map((x) => x.name),
    );
    const packed = d.document("supply:local-demo-022-uniform");
    d.supplyCommand(
      official,
      {
        action: "withdraw",
        id: "local-demo-022-uniform",
        expectedVersion: packed.version,
        revision: packed.data.publishedRevision,
        expectedDiscoveryVersion: d.document("discovery").version,
        value: null,
        reason: "",
      },
      "reading-withdraw-key",
      true,
    );
    const unavailable = (await get(a)).value;
    assert.ok(unavailable.items.every((i) => !i.available));
    assert.ok(!JSON.stringify(unavailable).includes("title"));
    assert.ok(!JSON.stringify(unavailable).includes("caption"));
    assert.equal((await send({ ...body, expectedVersion: 2 })).status, 404);
    assert.equal((await send({ articleId: id, saved: false, expectedVersion: 2 })).status, 200);
    assert.equal((await get(a)).value.items.length, 1);
    const original = d.document("supply:local-demo-022-uniform");
    d.supplyCommand(
      official,
      {
        action: "publish",
        id: "local-demo-022-uniform",
        expectedVersion: original.version,
        revision: original.data.draftRevision,
        expectedDiscoveryVersion: d.document("discovery").version,
        value: null,
        reason: "",
      },
      "reading-republish-key",
      true,
    );
    const atStart = now;
    now += 100 * 86400000;
    const future = d.session("member-a");
    assert.equal(readingMe(d, future).items[0].available, false);
    assert.throws(
      () =>
        readingCommand(
          d,
          a,
          { articleId: id, saved: false, expectedVersion: 3 },
          "reading-expired-session",
        ),
      (e) => e.status === 401,
    );
    now = atStart;
    const inv = migrationInventory(path),
      stored = readingMe(d, a);
    const result = spawnSync(process.execPath, ["local-test/backup.mjs"], {
      encoding: "utf8",
      env: { ...process.env, KEEPY_LOCAL_DB: path },
      windowsHide: true,
    });
    assert.equal(result.status, 0);
    const savedPath = result.stdout.match(/backup saved: (.+); restore only/)?.[1];
    assert.ok(savedPath);
    assert.deepEqual(migrationInventory(savedPath), inv);
    const readOnly = new DatabaseSync(savedPath, { readOnly: true }),
      restore = join(dir, "different-restored.sqlite");
    try {
      await backup(readOnly, restore);
    } finally {
      readOnly.close();
    }
    assert.deepEqual(migrationInventory(restore), inv);
    const restored = new LocalDatabase(restore, await loadCatalog(), { clock: () => now });
    try {
      assert.deepEqual(readingMe(restored, a), stored);
      assert.deepEqual(migrationInventory(restore), inv);
    } finally {
      restored.close();
    }
    await new Promise((r) => server.close(r));
    d.close();
    d = new LocalDatabase(path, await loadCatalog(), { clock: () => now });
    assert.deepEqual(readingMe(d, a), stored);
    assert.deepEqual(migrationInventory(path), inv);
  } finally {
    if (server.listening) await new Promise((r) => server.close(r));
    d.close();
  }
});
