import {
  publicDiscovery,
  discoverySearch,
  readingMe,
  readingCommand,
} from "../local-test/discovery.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { acceptanceFlow } from "../local-test/acceptance-flow.mjs";
import { migrationInventory } from "../local-test/migration-inventory.mjs";
import {
  feedbackTargets,
  validateFeedback,
  resolveFeedback,
  feedbackLocation,
} from "../src/lib/supply-feedback.mjs";
test("exact revision feedback, old reasons, own roles, conflict/replay/rollback, ID movement and end-to-end public/reading isolation", async () => {
  const path = join(mkdtempSync(join(tmpdir(), "keepy-feedback-")), "qa.sqlite");
  await acceptanceFlow(path);
  let fault = "",
    now = Date.now();
  let d = new LocalDatabase(path, await loadCatalog(), {
    clock: () => now,
    fault: (s) => {
      if (s === fault) throw Error("QA feedback rollback");
    },
  });
  try {
    const creator = d.session("creator-a"),
      other = d.session("creator-b"),
      official = d.session("official-a"),
      player = d.session("member-a"),
      id = "local-demo-022-uniform";
    const row = () => d.document("supply:" + id);
    const body = (action, value = null, reason = "", extra = {}) => {
      const p = row();
      return {
        action,
        id,
        expectedVersion: p.version,
        revision:
          action === "save"
            ? null
            : action === "withdraw"
              ? p.data.publishedRevision
              : p.data.draftRevision,
        expectedDiscoveryVersion: ["publish", "withdraw"].includes(action)
          ? d.document("discovery").version
          : null,
        value,
        reason,
        ...extra,
      };
    };
    let seq = 0;
    const send = (actor, input, admin = false, key = "feedback-" + ++seq) =>
      d.supplyCommand(actor, input, key, admin);
    const original = structuredClone(row().data);
    const v = structuredClone(original.revisions.at(-1).value);
    const newId = "local-qa-new-feedback-article";
    v.editorial.articles.push({
      ...structuredClone(v.editorial.articles[0]),
      id: newId,
      title: { "zh-TW": "QA新增文章：指定版本", en: "QA new article: revision review" },
    });
    v.articleIds.push(newId);
    send(creator, body("save", v));
    send(creator, body("submit"));
    const target = {
      kind: "article",
      id: newId,
      field: "title",
      locale: "en",
      note: "PRIVATE_TARGET_NOTE_NEVER_PUBLIC",
    };
    assert.ok(validateFeedback(v, [target]));
    assert.equal(feedbackLocation(target).step, 3);
    assert.ok(feedbackTargets(v).some((t) => t.id === newId));
    assert.ok(!validateFeedback(v, [{ ...target, id: "another-pack-article" }]));
    assert.ok(!validateFeedback(v, [{ ...target, field: "__proto__" }]));
    assert.ok(!validateFeedback(v, [{ ...target, note: "x".repeat(501) }]));
    assert.ok(!validateFeedback(v, Array(11).fill(target)));
    for (const bad of [
      { ...target, id: "cross-package" },
      { ...target, locale: "bad" },
      { ...target, field: "blocks.0.text.en" },
      { ...target, kind: "material", id: newId },
      { ...target, note: "" },
    ])
      assert.throws(
        () => send(official, body("return", null, "Required reason", { feedback: [bad] }), true),
        (e) => e.status === 422,
      );
    assert.throws(
      () => send(official, body("approve", null, "Approve", { feedback: [target] }), true),
      (e) => e.status === 422,
    );
    assert.throws(
      () => send(official, body("return", null, "", { feedback: [target] }), true),
      (e) => e.status === 422,
    );
    assert.throws(
      () => send(creator, body("return", null, "No", { feedback: [target] }), true),
      (e) => e.status === 403,
    );
    assert.ok(!d.supplyList(other).packages.some((p) => p.data.id === id));
    assert.throws(
      () => send(official, body("return", null, "No", { revision: 1, feedback: [target] }), true),
      (e) => e.status === 409,
    );
    const command = body("return", null, "QA exact target return", { feedback: [target] }),
      before = migrationInventory(path);
    fault = "before-mutation-receipt";
    assert.throws(() => send(official, command, true, "feedback-lost"));
    assert.deepEqual(migrationInventory(path), before);
    fault = "";
    const result = send(official, command, true, "feedback-lost");
    assert.deepEqual(send(official, command, true, "feedback-lost"), result);
    assert.throws(
      () => send(official, { ...command, reason: "Changed" }, true, "feedback-lost"),
      (e) => e.status === 409,
    );
    assert.throws(
      () => send(official, command, true),
      (e) => e.status === 409,
    );
    const returned = row().data;
    assert.equal(returned.reviews.length, original.reviews.length + 1);
    assert.deepEqual(returned.reviews.slice(0, -1), original.reviews);
    assert.deepEqual(returned.reviews.at(-1).feedback, [target]);
    const returnedRevision = structuredClone(returned.revisions.at(-1));
    v.editorial.articles.reverse();
    assert.equal(resolveFeedback(v, target).exists, true);
    assert.equal(resolveFeedback(v, target).value, "QA new article: revision review");
    const deleted = structuredClone(v);
    deleted.editorial.articles = deleted.editorial.articles.filter((a) => a.id !== newId);
    assert.equal(resolveFeedback(deleted, target).exists, false);
    v.editorial.articles.find((a) => a.id === newId).title.en += " revised";
    send(creator, body("save", v));
    assert.equal(row().data.approvedRevision, null);
    assert.throws(
      () => send(official, body("publish"), true),
      (e) => e.status === 409,
    );
    assert.deepEqual(
      row().data.revisions.find((r) => r.revision === returnedRevision.revision),
      returnedRevision,
    );
    send(creator, body("submit"));
    send(official, body("return", null, "QA plain old-compatible reason"), true);
    assert.equal("feedback" in row().data.reviews.at(-1), false);
    send(creator, body("save", v));
    send(creator, body("submit"));
    send(official, body("approve", null, "QA current exact approved"), true);
    send(official, body("publish"), true);
    const pub = publicDiscovery(d);
    assert.ok(pub.items.find((i) => i.id === newId));
    assert.ok(!JSON.stringify(pub).includes(target.note));
    assert.ok(
      !JSON.stringify(discoverySearch(d, "QA new article", "article", "en")).includes(target.note),
    );
    const me = readingMe(d, player);
    readingCommand(
      d,
      player,
      { articleId: newId, saved: true, expectedVersion: me.version },
      "feedback-read-save",
    );
    let read = readingMe(d, player);
    readingCommand(
      d,
      player,
      { action: "group-create", name: "QA reviewed articles", expectedVersion: read.version },
      "feedback-read-group",
    );
    read = readingMe(d, player);
    readingCommand(
      d,
      player,
      {
        action: "item-update",
        articleId: newId,
        state: "read",
        groupId: read.groups[0].id,
        expectedVersion: read.version,
      },
      "feedback-read-organize",
    );
    read = readingMe(d, player);
    assert.equal(read.items.find((i) => i.articleId === newId).state, "read");
    assert.ok(!JSON.stringify(read).includes(target.note));
    assert.deepEqual(row().data.revisions.slice(0, original.revisions.length), original.revisions);
    assert.deepEqual(row().data.reviews.slice(0, original.reviews.length), original.reviews);
    send(official, body("withdraw"), true);
    assert.ok(!publicDiscovery(d).items.some((i) => i.id === newId));
    assert.equal(readingMe(d, player).items.find((i) => i.articleId === newId).available, false);
    now += 2 * 60 * 60 * 1000;
    assert.throws(
      () => d.supplyList(creator),
      (e) => e.status === 401,
    );
  } finally {
    d.close();
  }
});
