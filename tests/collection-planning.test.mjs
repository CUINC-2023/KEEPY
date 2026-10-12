import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { validPlanningOrder } from "../src/lib/collection-planning.mjs";
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-planning-")), "qa.sqlite"),
  await loadCatalog(),
);
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    me = d.collectionMe(a),
    order = ["practice", "guide", "journey", "goals"],
    input = {
      expectedVersion: me.profile.version,
      data: { ...me.profile.data, planningOrder: order, isPublic: true },
    };
  assert.equal(validPlanningOrder(order), true);
  for (const bad of [
    [],
    ["practice", "practice", "journey", "goals"],
    ["practice", "guide", "journey", "admin"],
  ])
    assert.equal(validPlanningOrder(bad), false);
  const assets = () =>
      JSON.stringify(
        ["holdings", "ledger", "asset_events", "document_versions", "collection_awards"].map((t) =>
          d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all(),
        ),
      ),
    before = assets();
  const saved = d.collectionProfile(a, input, "qa-planning-original");
  assert.deepEqual(d.collectionProfile(a, input, "qa-planning-original"), saved);
  assert.deepEqual(d.collectionMe(a).profile.data.planningOrder, order);
  assert.equal(d.collectionMe(b).profile.data.planningOrder, undefined);
  assert.throws(() => d.collectionProfile(a, input, "qa-planning-conflict"));
  assert.throws(() =>
    d.collectionProfile(
      a,
      {
        expectedVersion: me.profile.version + 1,
        data: { ...input.data, planningOrder: ["admin", "guide", "journey", "goals"] },
      },
      "qa-planning-invalid",
    ),
  );
  assert.ok(!JSON.stringify(d.publicCollection(me.profile.handle)).includes("planningOrder"));
  assert.equal(assets(), before);
  console.log(
    "Planning private controlled order, exact field validation, CAS/key dedupe, anonymous omission and unchanged source history PASS",
  );
} finally {
  d.close();
}
