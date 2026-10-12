import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { isCollectionProjection } from "../src/lib/collection-contract.mjs";
let fault = "";
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-curation-")), "qa.sqlite"),
  await loadCatalog(),
  {
    fault: (stage) => {
      if (stage === fault) throw Error("QA rollback");
    },
  },
);
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    o = d.session("official-a"),
    cat = d.collectionCatalogue(),
    first = cat.cards[0],
    second = cat.cards.find((c) => c.poolId !== first.poolId);
  assert.ok(second);
  for (const c of [first, second]) {
    d.db.prepare("INSERT INTO holdings VALUES(?,?,?)").run("member-a", c.cardId, 1);
    d.db
      .prepare("INSERT INTO asset_events VALUES(?,?,?,?,?,?,?,?)")
      .run("qa-curation-" + c.cardId, "member-a", "qa", c.cardId, 1, "test-grant", d.at(), "{}");
  }
  const assets = () =>
    JSON.stringify(
      ["holdings", "asset_events", "ledger"].map((t) =>
        d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all(),
      ),
    );
  const before = assets();
  let me = d.collectionMe(a);
  for (const tags of [
    ["dup", "dup"],
    ["a".repeat(21)],
    [""],
    Array.from({ length: 9 }, (_, i) => String(i)),
  ])
    assert.throws(() =>
      d.collectionProfile(
        a,
        {
          expectedVersion: me.profile.version,
          data: {
            ...me.profile.data,
            curations: [
              {
                id: "curation-invalid",
                title: "QA",
                note: "",
                cardIds: [],
                showPublic: false,
                tags,
              },
            ],
          },
        },
        "qa-invalid-tags",
      ),
    );
  const group = {
      id: "curation-qa",
      title: "Private proof",
      note: "Owner note",
      tags: ["private-only-tag"],
      cardIds: [first.cardId, second.cardId],
      showPublic: false,
    },
    data = { ...me.profile.data, isPublic: true, showCards: true, curations: [group] },
    input = { expectedVersion: me.profile.version, data };
  d.collectionProfile(a, input, "qa-curation-save");
  d.collectionProfile(a, input, "qa-curation-save");
  assert.equal(d.collectionMe(a).profile.version, me.profile.version + 1);
  assert.deepEqual(d.publicCollection(me.profile.handle).curations, []);
  assert.equal(d.collectionMe(b).profile.data.curations, undefined);
  assert.throws(() =>
    d.collectionProfile(
      b,
      {
        expectedVersion: d.collectionMe(b).profile.version,
        data: { ...d.collectionMe(b).profile.data, curations: [group] },
      },
      "qa-curation-foreign",
    ),
  );
  me = d.collectionMe(a);
  d.collectionProfile(
    a,
    {
      expectedVersion: me.profile.version,
      data: { ...me.profile.data, curations: [{ ...group, showPublic: true }] },
    },
    "qa-curation-public",
  );
  let pub = d.publicCollection(me.profile.handle);
  assert.equal(pub.curations[0].cards.length, 2);
  assert.ok(!JSON.stringify(pub).includes("curation-qa"));
  assert.ok(!JSON.stringify(pub).includes("private-only-tag"));
  assert.deepEqual(d.collectionMe(a).profile.data.curations[0].tags, ["private-only-tag"]);
  assert.ok(pub.curations[0].cards.every((c) => !Object.hasOwn(c, "count")));
  assert.equal(isCollectionProjection(pub, "showcase"), true);
  assert.equal(
    isCollectionProjection(
      { ...pub, curations: [{ ...pub.curations[0], actorId: "private" }] },
      "showcase",
    ),
    false,
  );
  const rules = d.document("collection-rules"),
    next = structuredClone(rules.data);
  next.visibility.find((v) => v.poolId === first.poolId).hiddenGrades = [first.rarity];
  d.collectionRules(o, { expectedVersion: rules.version, data: next }, "qa-curation-hide");
  pub = d.publicCollection(me.profile.handle);
  assert.equal(pub.curations[0].cards.length, 1);
  assert.ok(!JSON.stringify(pub.curations).includes(first.cardId));
  assert.ok(!JSON.stringify(d.collectionMe(a).profile.data.curations).includes(first.cardId));
  assert.ok(
    d.db
      .prepare("SELECT payload FROM collection_profiles WHERE user_id=?")
      .get("member-a")
      .payload.includes(first.cardId),
  );
  const current = d.collectionMe(a);
  assert.throws(() =>
    d.collectionProfile(
      a,
      {
        expectedVersion: current.profile.version,
        data: { ...current.profile.data, curations: [{ ...group, cardIds: [first.cardId] }] },
      },
      "qa-curation-hidden",
    ),
  );
  assert.equal(assets(), before);
  assert.throws(() => d.collectionProfile(a, input, "qa-curation-conflict"));
} finally {
  d.close();
}
console.log(
  "PASS curation CAS/replay, private defaults, cross-owner/hidden rejection, anonymous whitelist, live hiding and asset preservation",
);
