import assert from "node:assert/strict";
import { reuseSupplyTemplate } from "../src/lib/supply-template.mjs";
import { sampleUniformPackage } from "../src/lib/sample-022.mjs";
import { COLLECTION_THEMES, CREATOR_CONTENT_TEMPLATES } from "../src/lib/collection-samples.mjs";
import { reusePlayOutline } from "../src/lib/supply-play-template.mjs";
import { PLAY_CONTENT_PACKS } from "../src/lib/play-packs.mjs";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
const value = sampleUniformPackage("local-partner-a", Date.now()),
  before = JSON.stringify(value),
  result = reuseSupplyTemplate(value, COLLECTION_THEMES[0].id);
assert.equal(JSON.stringify(value), before);
for (const k of Object.keys(value).filter((k) => k !== "copy"))
  assert.deepEqual(result[k], value[k]);
for (const k of Object.keys(value.copy).filter((k) => !["story", "goal"].includes(k)))
  assert.deepEqual(result.copy[k], value.copy[k]);
assert.deepEqual(result.copy.story, COLLECTION_THEMES[0].story);
assert.deepEqual(result.copy.goal, COLLECTION_THEMES[0].guide);
assert.throws(() => reuseSupplyTemplate(value, "unknown"));
const pack = CREATOR_CONTENT_TEMPLATES[0],
  combined = reuseSupplyTemplate(value, pack.seriesId, true);
assert.deepEqual(combined.editorial.creatorIntro, pack.workIntro);
assert.deepEqual(combined.editorial.questions, pack.questions);
assert.deepEqual(combined.editorial.articles, value.editorial.articles);
for (const key of Object.keys(value).filter((k) => !["copy", "editorial"].includes(k)))
  assert.deepEqual(combined[key], value[key]);
assert.equal(JSON.stringify(value), before);
assert.throws(() => reuseSupplyTemplate({ ...value, editorial: undefined }, pack.seriesId, true));
console.log("PASS text-only reuse preserves IDs, rights, dates, materials and histories");
const outline = reusePlayOutline(value, PLAY_CONTENT_PACKS[0].id, "local-play-outline-qa");
assert.equal(JSON.stringify(value), before);
for (const key of Object.keys(value).filter((k) => !["editorial", "articleIds"].includes(k)))
  assert.deepEqual(outline[key], value[key]);
assert.equal(outline.editorial.articles.at(-1).blocks.length, 31);
assert.throws(() => reusePlayOutline(value, "unknown", "local-play-outline-qa"));
assert.throws(() => reusePlayOutline(outline, PLAY_CONTENT_PACKS[0].id, "local-play-outline-qa"));
const db = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-play-supply-")), "qa.sqlite"),
  await loadCatalog(),
);
try {
  const creator = db.session("creator-a"),
    other = db.session("creator-b"),
    official = db.session("official-a"),
    id = "local-demo-022-uniform";
  const assets = () =>
    JSON.stringify(
      ["holdings", "asset_events", "ledger", "draws", "pity", "syntheses"].map((t) =>
        db.db.prepare("SELECT * FROM " + t).all(),
      ),
    );
  const frozen = assets();
  let seq = 0;
  const send = (action, v = null, reason = "", revision) => {
    const pack = db.supplyList(creator).packages.find((p) => p.data.id === id);
    return db.supplyCommand(
      ["approve", "return", "publish", "withdraw"].includes(action) ? official : creator,
      {
        action,
        id,
        expectedVersion: pack?.version ?? 0,
        revision: action === "save" ? null : (revision ?? pack.data.draftRevision),
        expectedDiscoveryVersion: ["publish", "withdraw"].includes(action)
          ? db.document("discovery").version
          : null,
        value: v,
        reason,
      },
      "qa-play-outline-" + ++seq,
      ["approve", "return", "publish", "withdraw"].includes(action),
    );
  };
  send("save", outline);
  assert.ok(!db.supplyList(other).packages.some((p) => p.data.id === id));
  assert.ok(!db.publicDiscovery().items.some((i) => i.id === "local-play-outline-qa"));
  send("submit");
  send("approve", null, "QA exact question-body revision");
  send("publish");
  const published = db.publicDiscovery().items.find((i) => i.id === "local-play-outline-qa");
  assert.ok(published.copy.body.en.includes("Answer"));
  assert.ok(published.copy.body.en.includes("local-demo-121-lantern"));
  const updated = structuredClone(outline);
  updated.editorial.articles.at(-1).blocks[2].text.en += " QA changed question";
  send("save", updated);
  assert.throws(
    () => send("publish"),
    (e) => e.status === 409,
  );
  assert.throws(
    () => send("approve", null, "QA stale approval", 1),
    (e) => e.status === 409,
  );
  assert.deepEqual(
    db.publicDiscovery().items.find((i) => i.id === "local-play-outline-qa").copy,
    published.copy,
  );
  send("submit");
  send("return", null, "QA clarify answer source");
  send("save", updated);
  send("submit");
  send("approve", null, "QA exact revised outline");
  send("publish");
  assert.ok(
    db
      .publicDiscovery()
      .items.find((i) => i.id === "local-play-outline-qa")
      .copy.body.en.includes("QA changed question"),
  );
  send("withdraw", null, "", db.document("supply:" + id).data.publishedRevision);
  assert.ok(!db.publicDiscovery().items.some((i) => i.id === "local-play-outline-qa"));
  assert.equal(assets(), frozen);
} finally {
  db.close();
}
console.log(
  "PASS question outline draft isolation, exact-version review, return/review, retained public snapshot, publication/withdrawal and unchanged assets",
);
