import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
const path = join(mkdtempSync(join(tmpdir(), "keepy-goals-")), "test.sqlite"),
  catalog = await loadCatalog();
let fault = "",
  d = new LocalDatabase(path, catalog, {
    fault: (stage) => {
      if (stage === fault) throw Error(stage);
    },
  });
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    me = d.collectionMe(a),
    pool = d.collectionCatalogue().pools[0].poolId;
  const data = { ...me.profile.data, goalPoolIds: [pool] },
    input = { expectedVersion: me.profile.version, data };
  const snapshot = () =>
    JSON.stringify(
      [
        "collection_profiles",
        "document_versions",
        "mutations",
        "audit",
        "asset_events",
        "ledger",
        "holdings",
      ].map((t) => d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all()),
    );
  fault = "after-collection-profile";
  const before = snapshot();
  assert.throws(() => d.collectionProfile(a, input, "qa-goals-rollback"));
  assert.equal(snapshot(), before);
  fault = "";
  d.collectionProfile(a, input, "qa-goals-original-key");
  const saved = snapshot();
  d.collectionProfile(a, input, "qa-goals-original-key");
  assert.equal(snapshot(), saved);
  assert.deepEqual(d.collectionMe(a).profile.data.goalPoolIds, [pool]);
  assert.equal(d.collectionMe(b).profile.data.goalPoolIds, undefined);
  assert.throws(
    () => d.collectionProfile(a, input, "qa-goals-stale-key"),
    (e) => e.status === 409,
  );
  const next = d.collectionMe(a);
  assert.throws(
    () =>
      d.collectionProfile(
        a,
        {
          expectedVersion: next.profile.version,
          data: { ...data, goalPoolIds: ["private-or-missing"] },
        },
        "qa-goals-invalid",
      ),
    (e) => e.status === 422,
  );
  assert.throws(
    () =>
      d.collectionProfile(
        a,
        { expectedVersion: next.profile.version, data: { ...data, goalPoolIds: [pool, pool] } },
        "qa-goals-duplicate",
      ),
    (e) => e.status === 422,
  );
  d.collectionProfile(
    a,
    { expectedVersion: next.profile.version, data: { ...data, isPublic: true } },
    "qa-goals-public-settings",
  );
  assert.ok(!JSON.stringify(d.publicCollection(me.profile.handle)).includes("goalPoolIds"));
  const stored = d.collectionMe(a).profile.data;
  d.close();
  d = new LocalDatabase(path, catalog);
  assert.deepEqual(d.collectionMe(d.session("member-a")).profile.data, stored);
  console.log(
    "PASS private goals save/read/restart, original-key dedup, conflict, rollback, unavailable album rejection, owner isolation and no public goals",
  );
} finally {
  d.close();
}
