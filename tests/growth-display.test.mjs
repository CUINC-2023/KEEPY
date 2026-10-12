import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-preview-share-")), "qa.sqlite"),
  await loadCatalog(),
);
try {
  const a = d.session("member-a"),
    b = d.session("member-b");
  let me = d.collectionMe(a);
  assert.throws(() =>
    d.collectionProfile(
      a,
      {
        expectedVersion: me.profile.version,
        data: { ...me.profile.data, growthPreview: { player: true } },
      },
      "qa-growth-bad",
    ),
  );
  let data = {
    ...me.profile.data,
    isPublic: true,
    growthPreview: { player: true, platform: true },
  };
  const input = { expectedVersion: me.profile.version, data };
  d.collectionProfile(a, input, "qa-growth-save");
  d.collectionProfile(a, input, "qa-growth-save");
  assert.throws(() => d.collectionProfile(a, input, "qa-growth-conflict"));
  const snapshot = () =>
    JSON.stringify(
      [
        "holdings",
        "asset_events",
        "ledger",
        "document_versions",
        "collection_awards",
        "participation_tasks",
      ].map((t) => d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all()),
    );
  const before = snapshot();
  const pub = d.publicCollection(me.profile.handle);
  assert.equal(pub.growthPreview.player.status, "local-preview");
  assert.equal(pub.growthPreview.platform.stage, 0);
  assert.ok(!JSON.stringify(pub.growthPreview).includes("actorId"));
  assert.ok(!JSON.stringify(pub.growthPreview).includes("sources"));
  assert.equal(snapshot(), before);
  const foreign = d.collectionMe(b);
  assert.throws(() => d.publicCollection(foreign.profile.handle));
  assert.equal(foreign.profile.data.growthPreview, undefined);
  me = d.collectionMe(a);
  d.collectionProfile(
    a,
    {
      expectedVersion: me.profile.version,
      data: { ...me.profile.data, growthPreview: { player: false, platform: false } },
    },
    "qa-growth-disable",
  );
  assert.deepEqual(d.publicCollection(me.profile.handle).growthPreview, {});
  me = d.collectionMe(a);
  d.collectionProfile(
    a,
    { expectedVersion: me.profile.version, data: { ...me.profile.data, isPublic: false } },
    "qa-growth-private",
  );
  assert.throws(() => d.publicCollection(me.profile.handle));
  console.log(
    "PASS private defaults, explicit choice, summary-only projection, same-key replay, CAS and read-only public preview",
  );
} finally {
  d.close();
}
