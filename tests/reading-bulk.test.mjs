import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { readingCommand, readingMe } from "../local-test/discovery.mjs";
import { migrationInventory } from "../local-test/migration-inventory.mjs";
test("bounded reading batches are atomic, own-only, CAS protected, receipt safe, durable and asset-neutral", async () => {
  const path = join(mkdtempSync(join(tmpdir(), "keepy-bulk-")), "test.sqlite");
  let fault = "";
  const d = new LocalDatabase(path, await loadCatalog(), {
    fault: (s) => {
      if (s === fault) throw Error("synthetic fault");
    },
  });
  const a = d.session("member-a"),
    b = d.session("member-b"),
    o = d.session("official-a");
  try {
    for (let n = 0; n < 25; n++) {
      const id = "qa-bulk-" + n,
        base = structuredClone(d.document("discovery").data.items[0].draft);
      const value = {
        ...base,
        kind: "article",
        referenceId: "",
        category: "guide",
        creatorIds: [],
        poolIds: [],
        releaseAt: "",
        withdrawAt: "",
      };
      d.discoveryCommand(
        o,
        { action: "save", id, value, expectedVersion: d.document("discovery").version },
        "qa-save-" + n,
      );
      d.discoveryCommand(
        o,
        { action: "publish", id, value: null, expectedVersion: d.document("discovery").version },
        "qa-publish-" + n,
      );
      readingCommand(
        d,
        a,
        { articleId: id, saved: true, expectedVersion: readingMe(d, a).version },
        "qa-reading-" + n,
      );
    }
    const before = migrationInventory(path),
      me = readingMe(d, a),
      ids = me.items.slice(0, 20).map((i) => i.articleId);
    const input = {
      action: "bulk-state",
      articleIds: ids,
      state: "read",
      expectedVersion: me.version,
    };
    const reject = (value, token = a, status = 422) =>
      assert.throws(
        () => readingCommand(d, token, value, "reject-" + crypto.randomUUID()),
        (e) => e.status === status,
      );
    reject({ ...input, articleIds: [] });
    reject({ ...input, articleIds: me.items.map((i) => i.articleId) });
    reject({ ...input, articleIds: [ids[0], ids[0]] });
    reject({ ...input, articleIds: [ids[0], "unknown"] }, a, 409);
    reject(input, o, 403);
    reject({ ...input, expectedVersion: 0 }, b, 409);
    assert.deepEqual(migrationInventory(path), before);
    fault = "before-mutation-receipt";
    assert.throws(() => readingCommand(d, a, input, "original-bulk"));
    fault = "";
    assert.deepEqual(migrationInventory(path), before);
    const result = readingCommand(d, a, input, "original-bulk");
    assert.equal(result.version, me.version + 1);
    assert.deepEqual(readingCommand(d, a, input, "original-bulk"), result);
    reject({ ...input, state: "unread" }, a, 409);
    assert.equal(readingMe(d, a).items.filter((i) => i.state === "read").length, 20);
    assert.deepEqual(
      readingMe(d, a).items.map((i) => i.savedAt),
      me.items.map((i) => i.savedAt),
    );
    assert.equal(readingMe(d, b).items.length, 0);
    const group = readingCommand(
      d,
      a,
      { action: "group-create", name: "QA group", expectedVersion: result.version },
      "qa-group-create",
    );
    const move = {
      action: "bulk-group",
      articleIds: ids.slice(0, 2),
      groupId: group.groupId,
      expectedVersion: group.version,
    };
    reject({ ...move, groupId: "not-own" }, a, 404);
    const moved = readingCommand(d, a, move, "qa-bulk-move");
    assert.equal(readingMe(d, a).items.filter((i) => i.groupId === group.groupId).length, 2);
    readingCommand(
      d,
      a,
      { ...input, state: "unread", expectedVersion: moved.version },
      "qa-bulk-unread",
    );
    const after = migrationInventory(path);
    for (const table of before.tables.filter(
      (t) => !["documents", "audit", "mutations"].includes(t.name),
    ))
      assert.deepEqual(
        after.tables.find((t) => t.name === table.name),
        table,
      );
    assert.deepEqual(
      after.documents.filter((i) => !i.sourceId.startsWith("reading:")),
      before.documents.filter((i) => !i.sourceId.startsWith("reading:")),
    );
  } finally {
    d.close();
  }
  const reopened = new LocalDatabase(path, await loadCatalog());
  try {
    assert.equal(readingMe(reopened, a).items.length, 25);
    assert.equal(readingMe(reopened, a).items.filter((i) => i.state === "read").length, 0);
  } finally {
    reopened.close();
  }
});
