import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { validReadingGuide, READING_GUIDES } from "../src/lib/collection-reading-guide.mjs";
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-reading-guide-")), "qa.sqlite"),
  await loadCatalog(),
);
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    o = d.session("official-a"),
    cat = d.collectionCatalogue(),
    pool = cat.pools[0];
  assert.equal(READING_GUIDES.length, 3);
  const me = d.collectionMe(a),
    guide = { schema: 1, template: "starter", poolId: pool.poolId, step: 0 },
    data = { ...me.profile.data, readingGuide: guide },
    input = { expectedVersion: me.profile.version, data };
  const before = JSON.stringify(
    ["holdings", "ledger", "asset_events", "document_versions"].map((t) =>
      d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all(),
    ),
  );
  d.collectionProfile(a, input, "qa-guide-original");
  d.collectionProfile(a, input, "qa-guide-original");
  assert.equal(d.collectionMe(a).profile.version, me.profile.version + 1);
  assert.deepEqual(d.collectionMe(a).profile.data.readingGuide, guide);
  assert.equal(d.collectionMe(b).profile.data.readingGuide, undefined);
  d.collectionProfile(o, input, "qa-guide-official-own-profile");
  assert.equal(d.collectionMe(a).profile.version, me.profile.version + 1);
  assert.throws(() =>
    d.collectionProfile(o, { ...input, userId: "member-a" }, "qa-guide-foreign-actor"),
  );
  for (const bad of [
    { ...guide, step: 4 },
    { ...guide, template: "unknown" },
    { ...guide, privateActor: "member-b" },
  ])
    assert.equal(validReadingGuide(bad), false);
  assert.throws(() =>
    d.collectionProfile(
      a,
      {
        expectedVersion: me.profile.version + 1,
        data: { ...data, readingGuide: { ...guide, poolId: "unknown-private-pool" } },
      },
      "qa-guide-invalid-pool",
    ),
  );
  assert.throws(
    () => d.publicCollection(me.profile.handle),
    (e) => e.status === 404,
  );
  const current = d.collectionMe(a);
  d.collectionProfile(
    a,
    { expectedVersion: current.profile.version, data: { ...current.profile.data, isPublic: true } },
    "qa-guide-public-choice",
  );
  assert.ok(!JSON.stringify(d.publicCollection(me.profile.handle)).includes("readingGuide"));
  assert.equal(
    JSON.stringify(
      ["holdings", "ledger", "asset_events", "document_versions"].map((t) =>
        d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all(),
      ),
    ),
    before,
  );
  console.log(
    "Reading guide bilingual templates, exact input/current source, private CAS/key isolation and unchanged assets/history PASS",
  );
} finally {
  d.close();
}
