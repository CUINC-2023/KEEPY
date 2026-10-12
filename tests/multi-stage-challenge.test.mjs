import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { previewMultiStage } from "../src/lib/multi-stage-challenge.mjs";
const card = { cardId: "one", poolId: "p", rarity: "C", cardVersion: 1 },
  title = { "zh-TW": "QA", en: "QA" };
const catalogue = {
  visibilityKey: "v",
  version: 1,
  cards: [card],
  pools: [{ poolId: "p", title, visibleDesigns: 1 }],
};
const owner = {
  actorId: "a",
  visibilityKey: "v",
  acquiredCards: [],
  awards: [],
  profile: { data: { goalPoolIds: ["p"] } },
};
assert.deepEqual(
  previewMultiStage(owner, catalogue).stages.map((s) => s.met),
  [true, false, false],
);
const complete = { ...owner, acquiredCards: [card, card] };
assert.deepEqual(
  previewMultiStage(complete, catalogue).stages.map((s) => s.met),
  [true, true, true],
);
assert.equal(previewMultiStage(complete, catalogue).rewards, false);
assert.deepEqual(
  previewMultiStage(complete, { ...catalogue, cards: [] }).stages.map((s) => s.met),
  [false, false, false],
);
assert.equal(previewMultiStage({ ...owner, visibilityKey: "old" }, catalogue), null);
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-stage-")), "qa.sqlite"),
  await loadCatalog(),
);
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    me = d.collectionMe(a);
  const assets = () =>
    JSON.stringify(
      ["holdings", "asset_events", "ledger"].map((t) =>
        d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all(),
      ),
    );
  const before = assets(),
    input = {
      expectedVersion: me.profile.version,
      data: { ...me.profile.data, journeyPaused: true, isPublic: true },
    };
  d.collectionProfile(a, input, "qa-stage-pause");
  d.collectionProfile(a, input, "qa-stage-pause");
  assert.equal(d.collectionMe(a).profile.version, me.profile.version + 1);
  assert.equal(d.collectionMe(a).profile.data.journeyPaused, true);
  assert.equal(d.collectionMe(b).profile.data.journeyPaused, undefined);
  assert.ok(!JSON.stringify(d.publicCollection(me.profile.handle)).includes("journeyPaused"));
  assert.equal(assets(), before);
  assert.throws(() => d.collectionProfile(a, input, "qa-stage-conflict"));
  const saved = d.collectionMe(a);
  assert.throws(() =>
    d.collectionProfile(
      a,
      {
        expectedVersion: saved.profile.version,
        data: { ...saved.profile.data, journeyPaused: "true" },
      },
      "qa-stage-invalid",
    ),
  );
} finally {
  d.close();
}
console.log(
  "PASS gated stages, duplicate sources, hiding invalidation, private pause CAS/replay/isolation and no asset changes",
);
