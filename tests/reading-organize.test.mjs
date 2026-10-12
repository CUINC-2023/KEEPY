import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { acceptanceFlow } from "../local-test/acceptance-flow.mjs";
import { readingMe, readingCommand } from "../local-test/discovery.mjs";
import { migrationInventory } from "../local-test/migration-inventory.mjs";
test("legacy preference defaults without GET migration, explicit state/groups, isolation, CAS, key, fault and immutable asset history", async () => {
  const path = join(mkdtempSync(join(tmpdir(), "keepy-organize-")), "qa.sqlite");
  await acceptanceFlow(path);
  let fault = "";
  const d = new LocalDatabase(path, await loadCatalog(), {
    fault: (s) => {
      if (s === fault) throw Error("Isolated group rollback");
    },
  });
  try {
    const a = d.session("member-a"),
      b = d.session("member-b"),
      o = d.session("official-a"),
      id = "local-demo-022-progress",
      time = "2026-10-09T00:00:00Z";
    d.db
      .prepare("INSERT INTO documents VALUES(?,?,?)")
      .run("reading:member-a", 1, JSON.stringify({ items: [{ articleId: id, savedAt: time }] }));
    const before = migrationInventory(path);
    const me = readingMe(d, a);
    assert.equal(me.items[0].state, "unread");
    assert.equal(me.items[0].groupId, "");
    assert.deepEqual(me.groups, []);
    assert.deepEqual(migrationInventory(path), before);
    assert.throws(
      () => readingMe(d, o),
      (e) => e.status === 403,
    );
    const input = { action: "group-create", name: "<b>私人分組</b>", expectedVersion: 1 },
      key = "group-create-original";
    const result = readingCommand(d, a, input, key);
    assert.deepEqual(readingCommand(d, a, input, key), result);
    assert.equal(readingMe(d, a).groups.length, 1);
    assert.equal(readingMe(d, b).groups.length, 0);
    assert.throws(
      () =>
        readingCommand(
          d,
          b,
          {
            action: "item-update",
            articleId: id,
            state: "read",
            groupId: result.groupId,
            expectedVersion: 0,
          },
          "group-other-denied",
        ),
      (e) => [404, 422].includes(e.status),
    );
    assert.throws(
      () => readingCommand(d, a, { ...input, name: "new" }, key),
      (e) => e.status === 409,
    );
    assert.throws(
      () => readingCommand(d, a, { ...input, expectedVersion: 1 }, "group-stale-version"),
      (e) => e.status === 409,
    );
    let version = result.version;
    const edit = {
      action: "item-update",
      articleId: id,
      state: "read",
      groupId: result.groupId,
      expectedVersion: version,
    };
    const stable = migrationInventory(path);
    fault = "before-mutation-receipt";
    assert.throws(() => readingCommand(d, a, edit, "group-fault-original"));
    assert.deepEqual(migrationInventory(path), stable);
    fault = "";
    version = readingCommand(d, a, edit, "group-fault-original").version;
    assert.equal(readingMe(d, a).items[0].state, "read");
    assert.equal(readingMe(d, a).items[0].savedAt, time);
    version = readingCommand(
      d,
      a,
      { action: "group-rename", groupId: result.groupId, name: "新名稱", expectedVersion: version },
      "group-rename-original",
    ).version;
    assert.equal(readingMe(d, a).groups[0].name, "新名稱");
    assert.throws(
      () =>
        readingCommand(
          d,
          a,
          { action: "group-create", name: "新名稱", expectedVersion: version },
          "group-duplicate-name",
        ),
      (e) => e.status === 409,
    );
    version = readingCommand(
      d,
      a,
      { action: "group-delete", groupId: result.groupId, expectedVersion: version },
      "group-delete-original",
    ).version;
    assert.equal(readingMe(d, a).items.length, 1);
    assert.equal(readingMe(d, a).items[0].groupId, "");
    assert.equal(readingMe(d, a).items[0].state, "read");
    assert.equal(readingMe(d, a).items[0].savedAt, time);
    assert.throws(
      () =>
        readingCommand(
          d,
          a,
          { action: "group-create", name: "x".repeat(41), expectedVersion: version },
          "group-long-name",
        ),
      (e) => e.status === 422,
    );
    for (let n = 0; n < 20; n++)
      version = readingCommand(
        d,
        a,
        { action: "group-create", name: "group " + n, expectedVersion: version },
        "group-bound-" + n,
      ).version;
    assert.throws(
      () =>
        readingCommand(
          d,
          a,
          { action: "group-create", name: "overflow", expectedVersion: version },
          "group-limit-bound",
        ),
      (e) => e.status === 422,
    );
    const after = migrationInventory(path);
    for (const t of before.tables.filter(
      (t) => !["documents", "audit", "mutations"].includes(t.name),
    ))
      assert.deepEqual(
        after.tables.find((x) => x.name === t.name),
        t,
      );
    assert.deepEqual(
      after.documents.filter((x) => !x.sourceId.startsWith("reading:")),
      before.documents.filter((x) => !x.sourceId.startsWith("reading:")),
    );
    d.close();
    const reopened = new LocalDatabase(path, await loadCatalog());
    try {
      assert.equal(readingMe(reopened, a).groups.length, 20);
      assert.equal(readingMe(reopened, a).items[0].state, "read");
      assert.equal(readingMe(reopened, a).items[0].savedAt, time);
    } finally {
      reopened.close();
    }
  } finally {
    try {
      d.close();
    } catch {}
  }
});
