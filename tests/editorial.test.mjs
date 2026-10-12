import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { backup } from "node:sqlite";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { createLocalServer } from "../local-test/server.mjs";
import { discoverySearch } from "../local-test/discovery.mjs";
import {
  SAMPLE_PACKAGE_ID as id,
  SAMPLE_ARTICLES,
  sampleUniformPackage,
} from "../src/lib/sample-022.mjs";
const catalog = await loadCatalog(),
  dir = mkdtempSync(join(tmpdir(), "keepy-editorial-")),
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
  o = d.session("official-a");
const frozen = () =>
  JSON.stringify(
    [
      "holdings",
      "asset_events",
      "ledger",
      "pity",
      "draws",
      "syntheses",
      "pool_versions",
      "physical_previews",
    ].map((t) => d.db.prepare("SELECT * FROM " + t).all()),
  );
const assets = frozen(),
  ops = JSON.stringify(d.document("operations")),
  original = structuredClone(d.document("discovery").data.items);
const snap = () =>
  JSON.stringify(
    ["documents", "document_versions", "audit", "mutations"].map((t) =>
      d.db.prepare("SELECT * FROM " + t).all(),
    ),
  );
const pack = () =>
  d.db.prepare("SELECT version,payload FROM documents WHERE id=?").get("supply:" + id);
let seq = 0;
function cmd(action, value = null, reason = "") {
  const row = pack(),
    p = row && JSON.parse(row.payload);
  return {
    action,
    id,
    expectedVersion: row?.version ?? 0,
    revision:
      action === "save" ? null : action === "withdraw" ? p?.publishedRevision : p?.draftRevision,
    expectedDiscoveryVersion: ["publish", "withdraw"].includes(action)
      ? d.document("discovery").version
      : null,
    value,
    reason,
  };
}
const send = (token, body, official = false, key = "editorial-" + ++seq) =>
  d.supplyCommand(token, body, key, official);
const reject = (fn, status) => assert.throws(fn, (e) => e.status === status);
const v = sampleUniformPackage("local-partner-a", now);
assert.equal(
  d.publicDiscovery().items.find((i) => i.id === "journal-guide").copy.body.en,
  "Fictional sample content, not a real collaboration or interview.",
);
reject(() => send(b, cmd("save", v)), 403);
const bad = structuredClone(v);
bad.editorial.articles[0].blocks.push({ type: "html", html: "<script>bad</script>" });
reject(() => send(a, cmd("save", bad)), 422);
bad.editorial.articles[0].blocks.pop();
bad.editorial.articles[0].blocks[2].materialId = "https://unknown/image.jpg";
reject(() => send(a, cmd("save", bad)), 422);
bad.editorial.articles[0].blocks[2].materialId = "m-demo-022-hero";
bad.editorial.articles[0].title.en = "<script>evil</script>";
reject(() => send(a, cmd("save", bad)), 422);
const collision = structuredClone(v);
collision.editorial.articles[0].id = "journal-guide";
reject(() => send(a, cmd("save", collision)), 422);
const incomplete = structuredClone(v);
incomplete.editorial.articles[0].blocks[0].text.en = "";
send(a, cmd("save", incomplete));
reject(() => send(a, cmd("submit")), 422);
assert.equal(discoverySearch(d, "同一套服裝").count, 0);
const save = cmd("save", v);
send(a, save, false, "editorial-save-once");
assert.ok(!d.supplyList(b).packages.some((p) => p.data.id === id));
reject(() => send(a, { ...cmd("save", v), id: "local-other-editorial", expectedVersion: 0 }), 422);
const saved = snap();
send(a, save, false, "editorial-save-once");
assert.equal(snap(), saved);
reject(() => send(a, save), 409);
reject(() => send(b, cmd("submit")), 403);
reject(() => send(o, cmd("save", v)), 403);
send(a, cmd("submit"));
reject(() => send(a, cmd("submit")), 409);
reject(() => send(o, cmd("return"), true), 422);
send(o, cmd("return", null, "補充來源說明"), true);
send(a, cmd("save", v));
send(a, cmd("submit"));
reject(() => send(o, { ...cmd("approve", null, "QA"), revision: 1 }, true), 409);
send(o, cmd("approve", null, "完整雙語正文與本機示意來源已核對"), true);
for (const stage of [
  "after-document-snapshot",
  "after-supply-publication",
  "after-supply-package",
  "before-mutation-receipt",
]) {
  const before = snap();
  fault = stage;
  assert.throws(() => send(o, cmd("publish"), true));
  assert.equal(snap(), before);
  fault = "";
}
const publish = cmd("publish");
send(o, publish, true, "editorial-publish-once");
const published = snap();
send(o, publish, true, "editorial-publish-once");
assert.equal(snap(), published);
const result = d.publicDiscovery().items,
  story = result.find((i) => i.id === SAMPLE_ARTICLES[0]),
  guide = result.find((i) => i.id === SAMPLE_ARTICLES[1]);
assert.ok(story && guide);
assert.equal(result.filter((i) => i.kind === "series" && i.referenceId === "p-uniform").length, 1);
for (const l of ["zh-TW", "en"]) {
  assert.ok(story.copy.body[l].length > story.copy.summary[l].length * 3);
  assert.ok(guide.copy.body[l].length > guide.copy.summary[l].length * 3);
  assert.ok(
    story.blocks.every((b) => (b.type === "image" ? b.caption[l] && b.material.alt[l] : b.text[l])),
  );
}
assert.deepEqual(story.creatorIds, ["g-yoru"]);
assert.deepEqual(story.poolIds, ["p-uniform"]);
assert.ok(!JSON.stringify(story).includes('"evidence"'));
assert.ok(!JSON.stringify(story).includes('"uses"'));
assert.equal(discoverySearch(d, "negative space", "article", "en").count, 1);
assert.equal(discoverySearch(d, "不存在內容").count, 0);
assert.ok(discoverySearch(d, "Uniform", "series", "en").items.every((i) => i.kind === "series"));
assert.deepEqual(
  d.document("discovery").data.items.filter((i) => original.some((x) => x.id === i.id)),
  original,
);
reject(
  () =>
    d.discoveryCommand(
      o,
      {
        action: "publish",
        expectedVersion: d.document("discovery").version,
        id: story.id,
        value: null,
      },
      "bypass-editorial",
    ),
  409,
);
// New draft does not change the old public snapshot and cannot reuse an old approval.
const revised = structuredClone(v);
revised.editorial.articles[0].blocks[1].text.en =
  "DRAFT_ONLY_SENTINEL " + revised.editorial.articles[0].blocks[1].text.en;
send(a, cmd("save", revised));
assert.equal(discoverySearch(d, "DRAFT_ONLY_SENTINEL", "all", "en").count, 0);
reject(() => send(o, cmd("publish"), true), 409);
send(a, cmd("submit"));
send(o, cmd("approve", null, "revision rechecked"), true);
send(o, cmd("publish"), true);
assert.equal(discoverySearch(d, "DRAFT_ONLY_SENTINEL", "all", "en").count, 1);
send(o, cmd("withdraw"), true);
assert.equal(discoverySearch(d, "DRAFT_ONLY_SENTINEL", "all", "en").count, 0);
assert.ok(!d.publicDiscovery().items.some((i) => SAMPLE_ARTICLES.includes(i.id)));
// Hidden/unknown card-linked images are removed together with captions and alternative text.
const privateImage = structuredClone(revised),
  card = catalog.cards.find(
    (c) =>
      c.poolId === "p-uniform" &&
      d
        .document("operations")
        .data.bindings.some((b) => b.partnerId === "local-partner-a" && b.cardId === c.id),
  );
assert.ok(card);
privateImage.materials[0].cardId = card.id;
privateImage.materials[0].version++;
privateImage.materials[0].alt = { "zh-TW": "HIDDEN_ALT_SENTINEL", en: "HIDDEN_ALT_SENTINEL" };
privateImage.editorial.articles[0].blocks[2].caption = {
  "zh-TW": "HIDDEN_CAPTION_SENTINEL",
  en: "HIDDEN_CAPTION_SENTINEL",
};
send(a, cmd("save", privateImage));
send(a, cmd("submit"));
send(o, cmd("approve", null, "QA public material"), true);
send(o, cmd("publish"), true);
const definition = d.db
  .prepare("SELECT * FROM collection_definitions WHERE card_id=? AND version=1")
  .get(card.id);
assert.ok(definition);
d.db.prepare("DELETE FROM collection_definitions WHERE card_id=? AND version=1").run(card.id);
assert.ok(!JSON.stringify(d.publicDiscovery()).includes("HIDDEN_"));
d.db
  .prepare("INSERT INTO collection_definitions VALUES(?,?,?)")
  .run(definition.card_id, definition.version, definition.payload);
const rules = d.document("collection-rules"),
  value = structuredClone(rules.data);
value.visibility.find((r) => r.poolId === "p-uniform").hiddenGrades = [
  ...new Set([...value.visibility.find((r) => r.poolId === "p-uniform").hiddenGrades, card.grade]),
];
d.collectionRules(o, { expectedVersion: rules.version, data: value }, "hide-editorial-qa");
assert.equal(discoverySearch(d, "HIDDEN_ALT_SENTINEL", "all", "en").count, 0);
assert.equal(discoverySearch(d, "HIDDEN_CAPTION_SENTINEL", "all", "en").count, 0);
assert.ok(!JSON.stringify(d.publicDiscovery()).includes("HIDDEN_"));
// Periods use the same inclusive start / exclusive end as discovery.
now = Date.parse(v.releaseAt) - 1;
assert.ok(!d.publicDiscovery().items.some((i) => SAMPLE_ARTICLES.includes(i.id)));
now = Date.parse(v.releaseAt);
assert.ok(d.publicDiscovery().items.some((i) => SAMPLE_ARTICLES.includes(i.id)));
now = Date.parse(v.withdrawAt);
assert.ok(!d.publicDiscovery().items.some((i) => SAMPLE_ARTICLES.includes(i.id)));
now = Date.parse(v.releaseAt) + 60000;
const pools = d.pools.bind(d);
d.pools = () => pools().map((p) => (p.id === "p-uniform" ? { ...p, visibility: "hidden" } : p));
assert.ok(!d.publicDiscovery().items.some((i) => i.poolIds.includes("p-uniform")));
assert.equal(discoverySearch(d, "DRAFT_ONLY_SENTINEL", "all", "en").count, 0);
const api = createLocalServer(d, { port: 0 });
await new Promise((resolve) => api.listen(0, "127.0.0.1", resolve));
const http = await fetch(
  "http://127.0.0.1:" +
    api.address().port +
    "/api/local-test/discovery/search?q=DRAFT_ONLY_SENTINEL&locale=en",
);
assert.equal(http.status, 200);
assert.equal((await http.json()).count, 0);
await new Promise((resolve) => api.close(resolve));
assert.equal(frozen(), assets);
d.pools = pools;
// Intentional QA visibility edit is outside assets/contracts; historical contract document is preserved.
assert.deepEqual(d.document("operations").data.contracts, JSON.parse(ops).data.contracts);
const beforeRestore = d.publicDiscovery();
await backup(d.db, join(dir, "restore.sqlite"));
d.close();
d = new LocalDatabase(path, catalog, { clock: () => now });
assert.deepEqual(d.publicDiscovery(), beforeRestore);
d.close();
d = new LocalDatabase(join(dir, "restore.sqlite"), catalog, { clock: () => now });
assert.deepEqual(d.publicDiscovery(), beforeRestore);
d.close();
console.log(
  "PASS editorial: legacy copy, full bilingual content, isolation, review/re-review, atomic publish, replay/CAS, projections/search/privacy/period/hidden images, HTTP, assets/history, restart and separate restore",
);
