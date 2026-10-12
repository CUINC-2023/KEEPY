import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
let fault = false;
const path = join(mkdtempSync(join(tmpdir(), "keepy-layout-")), "qa.sqlite");
const catalog = await loadCatalog();
let d = new LocalDatabase(path, catalog, {
  fault: (stage) => {
    if (fault && stage === "after-collection-profile") throw Error("QA rollback");
  },
});
try {
  const a = d.session("member-a"),
    b = d.session("member-b");
  let me = d.collectionMe(a);
  assert.equal(me.profile.data.readingLayout, undefined);
  const input = {
    expectedVersion: me.profile.version,
    data: {
      ...me.profile.data,
      isPublic: true,
      readingLayout: { schema: 1, mode: "compact", first: "growth" },
    },
  };
  d.collectionProfile(a, input, "qa-layout-save");
  d.collectionProfile(a, input, "qa-layout-save");
  me = d.collectionMe(a);
  assert.equal(me.profile.version, input.expectedVersion + 1);
  assert.deepEqual(me.profile.data.readingLayout, input.data.readingLayout);
  assert.equal(d.collectionMe(b).profile.data.readingLayout, undefined);
  assert.ok(!JSON.stringify(d.publicCollection(me.profile.handle)).includes("readingLayout"));
  assert.throws(() => d.collectionProfile(a, input, "qa-layout-conflict"));
  for (const readingLayout of [
    { schema: 2, mode: "full", first: "awards" },
    { schema: 1, mode: "full", first: "private" },
    { schema: 1, mode: "full", first: "awards", actor: "other" },
  ]) {
    assert.throws(() =>
      d.collectionProfile(
        a,
        { expectedVersion: me.profile.version, data: { ...me.profile.data, readingLayout } },
        "qa-invalid-" + JSON.stringify(readingLayout),
      ),
    );
  }
  fault = true;
  assert.throws(() =>
    d.collectionProfile(
      a,
      {
        expectedVersion: me.profile.version,
        data: { ...me.profile.data, readingLayout: { schema: 1, mode: "full", first: "timeline" } },
      },
      "qa-layout-rollback",
    ),
  );
  assert.equal(d.collectionMe(a).profile.version, me.profile.version);
  fault = false;
  d.close();
  d = new LocalDatabase(path, catalog);
  assert.deepEqual(
    d.collectionMe(d.session("member-a")).profile.data.readingLayout,
    input.data.readingLayout,
  );
} finally {
  d.close();
}
console.log(
  "PASS explicit local SQLite layout, private projection, CAS/replay, strict fields, rollback and restart",
);
