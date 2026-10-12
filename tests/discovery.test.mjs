import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { backup } from "node:sqlite";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { createLocalServer } from "../local-test/server.mjs";
const catalog = await loadCatalog();
const path = join(mkdtempSync(join(tmpdir(), "keepy-discovery-")), "discovery.sqlite");
let now = Date.parse("2026-10-04T10:00:00Z"),
  fault = "";
let d = new LocalDatabase(path, catalog, {
  clock: () => now,
  fault: (stage) => {
    if (stage === fault) throw Error(stage);
  },
});
const o = d.session("official-a"),
  a = d.session("member-a"),
  b = d.session("member-b"),
  c = d.session("creator-a");
const reject = (fn, status) => assert.throws(fn, (e) => e.status === status);
const id = "journal-guide",
  creator = catalog.discoveryCreators[0].id;
const command = (action, value = null, target = id) => ({
  action,
  expectedVersion: d.document("discovery").version,
  id: target,
  value,
});
const current = () =>
  structuredClone(d.document("discovery").data.items.find((i) => i.id === id).draft);
const publicItem = () => d.publicDiscovery().items.find((i) => i.id === id);
const auditTables = () =>
  JSON.stringify(
    [
      "documents",
      "document_versions",
      "mutations",
      "audit",
      "creator_follows",
      "discovery_events",
    ].map((t) => d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all()),
  );
const original = publicItem().copy.title;
let draft = current();
draft.copy.title["zh-TW"] = "唯讀草稿不可外洩";
draft.copy.title.en = "Private draft must not leak";
reject(() => d.discoveryCommand(a, command("save", draft), "member-save-018"), 403);
reject(() => d.discoveryCommand(c, command("save", draft), "creator-save-018"), 403);
for (const stage of ["after-document-snapshot", "before-mutation-receipt"]) {
  const before = auditTables();
  fault = stage;
  assert.throws(() => d.discoveryCommand(o, command("save", draft), "rollback-save-018"));
  assert.equal(auditTables(), before);
  fault = "";
}
const save = command("save", draft);
d.discoveryCommand(o, save, "save-draft-018");
const afterSave = auditTables();
d.discoveryCommand(o, save, "save-draft-018");
assert.equal(auditTables(), afterSave);
assert.deepEqual(publicItem().copy.title, original);
assert.ok(!JSON.stringify(d.publicDiscovery()).includes("Private draft"));
reject(
  () => d.discoveryCommand(o, { ...save, value: { ...draft, order: 42 } }, "save-draft-018"),
  409,
);
reject(() => d.discoveryCommand(o, save, "stale-save-018"), 409);
d.discoveryCommand(o, command("publish"), "publish-draft-018");
assert.equal(publicItem().copy.title.en, "Private draft must not leak");
draft = current();
draft.copy.title["zh-TW"] = "中英文獨立";
d.discoveryCommand(o, command("save", draft), "save-zh-only-018");
d.discoveryCommand(o, command("publish"), "publish-zh-only-018");
assert.equal(publicItem().copy.title.en, "Private draft must not leak");
const historic = d.db
  .prepare("SELECT payload FROM document_versions WHERE id='discovery' AND version=1")
  .get().payload;
assert.ok(!historic.includes("Private draft"));
for (const mutate of [
  (v) => {
    v.copy.social.en = "javascript:alert(1)";
  },
  (v) => {
    v.poolIds = ["unknown"];
  },
  (v) => {
    v.order = NaN;
  },
  (v) => {
    v.releaseAt = "2026-10-05";
  },
  (v) => {
    v.withdrawAt = "2026-10-02T00:00:00Z";
    v.releaseAt = "2026-10-03T00:00:00Z";
  },
  (v) => {
    v.copy.bad = { en: "bad" };
  },
  (v) => {
    v.copy.title.en = "";
  },
]) {
  const bad = current();
  mutate(bad);
  reject(
    () =>
      d.discoveryCommand(
        o,
        command("save", bad),
        "invalid-save-" + Math.random().toString(36).slice(2),
      ),
    422,
  );
}
draft = current();
draft.order = -100;
draft.releaseAt = "2026-10-05T12:00:00+08:00";
draft.withdrawAt = "2026-10-06T12:00:00+08:00";
d.discoveryCommand(o, command("save", draft), "save-schedule-018");
d.discoveryCommand(o, command("publish"), "publish-schedule-018");
assert.equal(publicItem(), undefined);
now = Date.parse(draft.releaseAt);
assert.equal(d.publicDiscovery().items[0].id, id);
now = Date.parse(draft.withdrawAt);
assert.equal(publicItem(), undefined);
now = Date.parse("2026-10-04T10:00:00Z");
draft.releaseAt = "";
draft.withdrawAt = "";
d.discoveryCommand(o, command("save", draft), "save-unschedule-018");
d.discoveryCommand(o, command("publish"), "publish-unschedule-018");
const follow = { creatorId: creator, following: true };
d.followCreator(a, follow, "follow-creator-018");
const afterFollow = auditTables();
d.followCreator(a, follow, "follow-creator-018");
assert.equal(auditTables(), afterFollow);
assert.deepEqual(d.discoveryMe(a).follows, [creator]);
assert.deepEqual(d.discoveryMe(b).follows, []);
d.followCreator(a, follow, "follow-again-018");
assert.equal(
  d.db.prepare("SELECT COUNT(*) AS n FROM creator_follows WHERE user_id='member-a'").get().n,
  1,
);
assert.equal(
  d.db.prepare("SELECT COUNT(*) AS n FROM discovery_events WHERE kind='follow'").get().n,
  1,
);
d.followCreator(a, { ...follow, following: false }, "unfollow-creator-018");
assert.deepEqual(d.discoveryMe(a).follows, []);
const holdingsBefore = JSON.stringify(d.db.prepare("SELECT * FROM holdings").all());
d.discoveryCommand(o, command("archive", null, "creator-" + creator), "withdraw-creator-018");
assert.equal(
  d.publicDiscovery().items.some((i) => i.referenceId === creator),
  false,
);
reject(() => d.followCreator(a, follow, "follow-withdrawn-018"), 422);
assert.equal(JSON.stringify(d.db.prepare("SELECT * FROM holdings").all()), holdingsBefore);
d.discoveryCommand(o, command("publish", null, "creator-" + creator), "restore-creator-018");
const catalogueCard = catalog.cards.find((c) => c.poolId === "p-uniform");
d.db.prepare("INSERT INTO holdings VALUES(?,?,17)").run("member-a", catalogueCard.id);
assert.equal(d.discoveryMe(a).progress.find((p) => p.poolId === "p-uniform").distinctOwned, 1);
assert.equal(d.discoveryMe(b).progress.find((p) => p.poolId === "p-uniform").distinctOwned, 0);
assert.ok(!JSON.stringify(d.discoveryMe(a)).includes("balance"));
assert.ok(!JSON.stringify(d.publicDiscovery()).includes("card_id"));
d.db.prepare("DELETE FROM holdings WHERE user_id='member-a'").run();
const firstDraw = d.draw(a, { poolId: "p-uniform", mode: "single" }, "first-draw-018");
assert.ok(firstDraw.items.length);
d.draw(a, { poolId: "p-uniform", mode: "single" }, "second-draw-018");
assert.equal(
  d.db.prepare("SELECT COUNT(*) AS n FROM discovery_events WHERE kind='first-collection'").get().n,
  1,
);
d.discoveryVisit(a, { kind: "content-to-pool", subject: id + ":p-uniform" }, "article-to-pool-018");
reject(
  () =>
    d.discoveryVisit(a, { kind: "content-to-pool", subject: id + ":unknown" }, "invalid-event-018"),
  422,
);
now += 6 * 86400000;
const day6 = d.session("member-a");
d.discoveryVisit(day6, { kind: "visit", subject: "discovery" }, "visit-six-days-018");
assert.equal(
  d.db.prepare("SELECT COUNT(*) AS n FROM discovery_events WHERE kind='seven-day-return'").get().n,
  0,
);
now += 86400000;
const day7 = d.session("member-a");
d.discoveryVisit(day7, { kind: "visit", subject: "discovery" }, "visit-seven-days-018");
d.discoveryVisit(day7, { kind: "visit", subject: "discovery" }, "visit-seven-again-018");
assert.equal(
  d.db.prepare("SELECT COUNT(*) AS n FROM discovery_events WHERE kind='seven-day-return'").get().n,
  1,
);
assert.equal(
  d.db.prepare("SELECT COUNT(*) AS n FROM discovery_events WHERE synthetic!=1").get().n,
  0,
);
now = Date.parse("2026-10-04T10:00:00Z");
const stale = command("save", current());
const other = new LocalDatabase(path, catalog, { clock: () => now });
const otherO = other.session("official-b");
other.discoveryCommand(otherO, stale, "other-editor-018");
reject(() => d.discoveryCommand(o, stale, "concurrent-editor-018"), 409);
other.db.close();
d.revoke(o, "official-b");
reject(() => d.discoveryCommand(otherO, stale, "other-editor-018"), 403);
const saved = JSON.stringify(d.document("discovery"));
const privateSaved = JSON.stringify(d.discoveryMe(a));
const backupPath = path + ".backup";
await backup(d.db, backupPath);
d.db.close();
d = new LocalDatabase(path, catalog, { clock: () => now });
assert.equal(JSON.stringify(d.document("discovery")), saved);
assert.equal(JSON.stringify(d.discoveryMe(a)), privateSaved);
const restored = new LocalDatabase(backupPath, catalog, { clock: () => now });
assert.equal(JSON.stringify(restored.document("discovery")), saved);
restored.db.close();
const app = createLocalServer(d, { port: 0 });
await new Promise((resolve) => app.listen(0, "127.0.0.1", resolve));
const port = app.address().port,
  url = "http://127.0.0.1:" + port + "/api/local-test";
try {
  const publicRes = await fetch(url + "/discovery");
  assert.equal(publicRes.status, 200);
  assert.equal((await fetch(url + "/admin/discovery")).status, 401);
  assert.equal((await fetch(url + "/discovery/me")).status, 401);
  const cookie = "keepy_local_session=" + b;
  assert.equal((await fetch(url + "/admin/discovery", { headers: { cookie } })).status, 403);
  assert.deepEqual(
    (await (await fetch(url + "/discovery/me", { headers: { cookie } })).json()).follows,
    [],
  );
  const rejectedOrigin = await fetch(url + "/discovery/follow", {
    method: "POST",
    headers: {
      cookie,
      origin: "https://untrusted.invalid",
      "Content-Type": "application/json",
      "Idempotency-Key": "bad-origin-018",
    },
    body: JSON.stringify(follow),
  });
  assert.equal(rejectedOrigin.status, 403);
} finally {
  await new Promise((resolve) => app.close(resolve));
  d.db.close();
}
console.log(
  "PASS discovery: publication isolation, bilingual edit, immutable versions, CAS, rollback, schedule boundaries, safe links, actor isolation, follow replay, distinct designs, synthetic events, restart, backup restore and HTTP permissions",
);
