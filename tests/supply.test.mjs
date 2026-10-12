import { publicationPeriod } from "../local-test/publication-period.mjs";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { backup } from "node:sqlite";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { createLocalServer } from "../local-test/server.mjs";
assert.equal(publicationPeriod({ releaseAt: "invalid", withdrawAt: "" }, Date.now()), "invalid");
assert.equal(publicationPeriod({ releaseAt: "", withdrawAt: "invalid" }, Date.now()), "invalid");
assert.equal(
  publicationPeriod(
    { releaseAt: "2026-10-10T00:00:00Z", withdrawAt: "2026-10-09T00:00:00Z" },
    Date.now(),
  ),
  "invalid",
);
assert.equal(publicationPeriod({ releaseAt: "", withdrawAt: "" }, Date.now()), "current");
const catalog = await loadCatalog(),
  dir = mkdtempSync(join(tmpdir(), "keepy-supply-")),
  path = join(dir, "test.sqlite");
let now = Date.parse("2026-10-05T10:00:00Z"),
  fault = "",
  d = new LocalDatabase(path, catalog, {
    clock: () => now,
    fault: (s) => {
      if (s === fault) throw Error(s);
    },
  });
let a = d.session("creator-a"),
  b = d.session("creator-b"),
  o = d.session("official-a"),
  member = d.session("member-a");
const reject = (fn, status) => assert.throws(fn, (e) => e.status === status),
  bi = (s) => ({ "zh-TW": s + " · 示意", en: s + " · sample" }),
  id = "local-qa-package-a",
  idB = "local-qa-package-b";
const assets = () =>
  JSON.stringify(
    [
      "holdings",
      "asset_events",
      "ledger",
      "pity",
      "draws",
      "syntheses",
      "pool_versions",
      "synthesis_progress",
      "physical_previews",
    ].map((t) => d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all()),
  );
const frozenAssets = assets(),
  ops = d.document("operations"),
  snap = () =>
    JSON.stringify(
      ["documents", "document_versions", "audit", "mutations"].map((t) =>
        d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all(),
      ),
    );
const get = (id) => d.document("supply:" + id),
  v = {
    partnerId: "local-partner-a",
    creatorId: "g-yoru",
    poolId: "p-uniform",
    articleIds: [],
    copy: Object.fromEntries(
      ["title", "summary", "story", "goal", "endPolicy", "teaser"].map((k) => [k, bi("QA " + k)]),
    ),
    application: bi("application"),
    cardNotes: bi("card production"),
    promotion: bi("promotion"),
    retrospective: bi(""),
    releaseAt: "2026-10-05T10:00:00Z",
    withdrawAt: "2026-10-06T10:00:00Z",
    materials: [
      {
        id: "m-example",
        ref: "text-only",
        version: 1,
        source: "Synthetic existing artwork",
        evidence: "Local QA source fixture",
        uses: { website: "sample-confirmed", social: "pending", print: "pending" },
        startAt: "2026-10-01T00:00:00Z",
        endAt: "2026-11-01T00:00:00Z",
        alt: bi("sample alt"),
        cardId: "",
      },
    ],
  };
let seq = 0;
const cmd = (action, value = null, reason = "", packId = id) => {
  const p = d.db
      .prepare("SELECT version,payload FROM documents WHERE id=?")
      .get("supply:" + packId),
    data = p && JSON.parse(p.payload);
  return {
    action,
    id: packId,
    expectedVersion: p?.version ?? 0,
    revision:
      action === "save"
        ? null
        : action === "withdraw"
          ? data?.publishedRevision
          : data?.draftRevision,
    expectedDiscoveryVersion: ["publish", "withdraw"].includes(action)
      ? d.document("discovery").version
      : null,
    value,
    reason,
  };
};
const send = (token, body, official = false, key = "supply-key-" + ++seq) =>
  d.supplyCommand(token, body, key, official);
reject(() => d.supplyList(member), 403);
reject(() => d.supplyList(a, true), 403);
reject(() => send(o, cmd("save", v)), 403);
assert.equal(d.supplyList(a).context.creatorId, "g-yoru");
assert.equal(d.supplyList(b).context.creatorId, "g-akane");
// Failed first save must leave neither a document shell nor any snapshot/receipt.
for (const stage of [
  "after-document-snapshot",
  "after-supply-package",
  "before-mutation-receipt",
]) {
  const before = snap();
  fault = stage;
  assert.throws(() => send(a, cmd("save", v), false, "new-package-rollback-" + stage));
  assert.equal(snap(), before);
  fault = "";
}
const bad = { ...structuredClone(v), partnerId: "local-partner-b" };
reject(() => send(a, cmd("save", bad)), 403);
bad.partnerId = "local-partner-a";
bad.materials[0].ref = "https://example.com/image.jpg";
reject(() => send(a, cmd("save", bad)), 422);
const blank = structuredClone(v);
blank.materials[0].evidence = "";
blank.copy.story.en = "";
send(a, cmd("save", blank));
reject(() => send(a, cmd("submit")), 422);
assert.equal(
  d.publicDiscovery().items.some((i) => i.copy.title.en === v.copy.title.en),
  false,
);
reject(() => send(b, cmd("save", v)), 403);
assert.equal(d.supplyList(b).packages.length, 0);
const vb = { ...structuredClone(v), partnerId: "local-partner-b", creatorId: "g-akane" };
send(b, cmd("save", vb, "", idB));
assert.equal(d.supplyList(a).packages.length, 1);
assert.equal(d.supplyList(b).packages.length, 1);
v.materials[0].version = 2;
send(a, cmd("save", v));
const stale = cmd("save", v);
send(a, cmd("save", v));
reject(() => send(a, stale), 409);
let body = cmd("submit"),
  key = "original-submit-key";
send(a, body, false, key);
reject(() => send(a, cmd("submit")), 409);
assert.deepEqual(send(a, body, false, key), { version: get(id).version });
reject(() => send(a, { ...body, reason: "changed" }, false, key), 409);
reject(() => send(a, cmd("approve", null, "not allowed"), true), 403);
reject(() => send(o, cmd("return"), true), 422);
send(o, cmd("return", null, "Clarify source evidence"), true);
assert.equal(get(id).data.reviews[0].reason, "Clarify source evidence");
send(a, cmd("save", v));
send(a, cmd("submit"));
const approval = cmd("approve", null, "Synthetic source and bilingual checks complete");
send(o, approval, true);
assert.equal(get(id).data.approvedRevision, get(id).data.draftRevision);
// New changes invalidate approval; publication of the prior approved version is forbidden.
send(a, cmd("save", v));
reject(() => send(o, cmd("publish"), true), 409);
send(a, cmd("submit"));
send(o, cmd("approve", null, "Reviewed new revision"), true);
d.db.prepare("UPDATE users SET role='member' WHERE id='creator-a'").run();
reject(() => send(o, cmd("publish"), true), 422);
d.db.prepare("UPDATE users SET role='creator' WHERE id='creator-a'").run();
const beforePub = snap(),
  publish = cmd("publish");
for (const stage of [
  "after-document-snapshot",
  "after-supply-publication",
  "after-supply-package",
  "before-mutation-receipt",
]) {
  fault = stage;
  assert.throws(() => send(o, publish, true, "rollback-publication-" + stage));
  assert.equal(snap(), beforePub);
  fault = "";
}
send(o, publish, true, "stable-publication-key");
const afterPub = snap();
send(o, publish, true, "stable-publication-key");
assert.equal(snap(), afterPub);
let pub = d.publicDiscovery().items.find((i) => i.referenceId === "p-uniform");
assert.equal(pub.copy.story.en, v.copy.story.en);
assert.equal(pub.sourceRevision, get(id).data.draftRevision);
assert.equal(pub.materials.length, 1);
assert.ok(!JSON.stringify(pub).includes("Local QA source fixture"));
assert.ok(!JSON.stringify(pub).includes("local-partner-a"));
assert.ok(!JSON.stringify(pub).includes("website"));
const discovery = d.document("discovery"),
  series = discovery.data.items.find(
    (i) => i.draft.referenceId === "p-uniform" && i.draft.kind === "series",
  );
reject(
  () =>
    d.discoveryCommand(
      o,
      { action: "publish", id: series.id, value: null, expectedVersion: discovery.version },
      "no-bypass-review",
    ),
  409,
);
const historical = get(id).data.revisions[0],
  next = structuredClone(v);
next.copy.story = bi("new unpublished story");
send(a, cmd("save", next));
assert.equal(
  d.publicDiscovery().items.find((i) => i.referenceId === "p-uniform").copy.story.en,
  v.copy.story.en,
);
assert.deepEqual(get(id).data.revisions[0], historical);
// Material changes require their own version increase, independently of package revisions.
next.materials[0].evidence = "new evidence";
reject(() => send(a, cmd("save", next)), 422);
next.materials[0].version++;
send(a, cmd("save", next));
send(a, cmd("submit"));
send(o, cmd("approve", null, "Reviewed changed material version"), true);
body = cmd("publish");
const priorDiscovery = d.document("discovery");
d.writeDocument(
  "discovery",
  priorDiscovery,
  priorDiscovery.data,
  "official-a",
  "isolated-cas-test",
);
reject(() => send(o, body, true), 409);
send(o, cmd("publish"), true);
pub = d.publicDiscovery().items.find((i) => i.referenceId === "p-uniform");
assert.equal(pub.copy.story.en, next.copy.story.en);
now = Date.parse(v.releaseAt) - 1;
assert.ok(!d.publicDiscovery().items.some((i) => i.sourcePackId === id));
now = Date.parse(v.releaseAt);
assert.ok(d.publicDiscovery().items.some((i) => i.sourcePackId === id));
now = Date.parse(v.withdrawAt);
assert.ok(!d.publicDiscovery().items.some((i) => i.sourcePackId === id));
now = Date.parse(v.releaseAt) + 1000;
a = d.session("creator-a");
b = d.session("creator-b");
o = d.session("official-a");
// Linked hidden card materials never appear in public projection, counts or metadata.
const hidden = structuredClone(next),
  linked = d.document("operations").data.bindings.find((b) => b.partnerId === v.partnerId);
hidden.materials[0].cardId = linked.cardId;
hidden.materials[0].version++;
send(a, cmd("save", hidden));
send(a, cmd("submit"));
send(o, cmd("approve", null, "Review hidden-card projection test"), true);
send(o, cmd("publish"), true);
const rules = d.document("collection-rules"),
  copy = structuredClone(rules.data),
  grade = catalog.cards.find((c) => c.id === linked.cardId).grade;
copy.visibility.find((v) => v.poolId === "p-uniform").hiddenGrades = [grade];
d.writeDocument("collection-rules", rules, copy, "official-a", "qa-hide");
pub = d.publicDiscovery().items.find((i) => i.sourcePackId === id);
assert.equal(pub.materials.length, 0);
assert.ok(!JSON.stringify(pub).includes(linked.cardId));
d.writeDocument(
  "collection-rules",
  d.document("collection-rules"),
  rules.data,
  "official-a",
  "qa-unhide",
);
send(o, cmd("withdraw"), true);
assert.ok(!d.publicDiscovery().items.some((i) => i.sourcePackId === id));
assert.ok(get(id).data.publications.length >= 4);
const receipt = cmd("save", hidden);
send(a, receipt, false, "creator-role-replay");
d.db.prepare("UPDATE users SET role='member' WHERE id='creator-a'").run();
reject(() => send(a, receipt, false, "creator-role-replay"), 403);
d.db.prepare("UPDATE users SET role='creator' WHERE id='creator-a'").run();
assert.equal(assets(), frozenAssets);
assert.deepEqual(d.document("operations"), ops);
assert.throws(() =>
  d.db.prepare("UPDATE document_versions SET payload='{}' WHERE id=?").run("supply:" + id),
);
// Schedule is derived from the same public projection, not another stored calendar.
const savedNow = now;
for (const time of [
  Date.parse(hidden.releaseAt) - 1,
  Date.parse(hidden.releaseAt),
  Date.parse(hidden.withdrawAt) - 1,
  Date.parse(hidden.withdrawAt),
]) {
  now = time;
  o = d.session("official-a");
  const row = d.supplyList(o, true).packages.find((x) => x.data.id === id).data;
  assert.equal(
    row.schedule.visible,
    d.publicDiscovery().items.some((i) => i.sourcePackId === id),
  );
  assert.equal(
    row.schedule.draftPeriod,
    time < Date.parse(hidden.releaseAt)
      ? "upcoming"
      : time >= Date.parse(hidden.withdrawAt)
        ? "expired"
        : "current",
  );
  assert.equal(row.schedule.needsReview, true);
}
now = savedNow;
o = d.session("official-a");
member = d.session("member-a");
reject(() => d.supplyList(member, true), 403);
const persisted = d.supplyList(a),
  back = join(dir, "backup.sqlite");
await backup(d.db, back);
d.close();
d = new LocalDatabase(path, catalog, { clock: () => now });
assert.deepEqual(d.supplyList(a), persisted);
const restore = new LocalDatabase(back, catalog, { clock: () => now });
assert.deepEqual(restore.supplyList(a), persisted);
restore.close();
const server = createLocalServer(d);
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = "http://127.0.0.1:" + server.address().port + "/api/local-test";
try {
  assert.equal((await fetch(base + "/supply/me")).status, 401);
  assert.equal((await fetch(base + "/admin/supply")).status, 401);
  assert.equal(
    (
      await fetch(base + "/supply/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
    ).status,
    403,
  );
} finally {
  await new Promise((r) => server.close(r));
  d.close();
}
console.log(
  "Supply 0.21 passed: ownership/roles, bounded local materials/rights/versions, missing fields, return/approval/re-review, draft isolation, exact publication/CAS/replay/rollback, periods/hidden projection, unchanged assets/contracts, restart/restore, HTTP.",
);
