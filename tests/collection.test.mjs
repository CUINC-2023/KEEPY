import assert from "node:assert/strict";
import { isCollectionProjection } from "../src/lib/collection-contract.mjs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { backup } from "node:sqlite";
import { LocalDatabase } from "../local-test/database.mjs";
import {
  previewCollectionProfile,
  rankCollections,
  rankingPage,
} from "../local-test/collection.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { createLocalServer } from "../local-test/server.mjs";
const catalog = await loadCatalog(),
  dir = mkdtempSync(join(tmpdir(), "keepy-collection-")),
  path = join(dir, "test.sqlite");
const pageFixture = Array.from({ length: 45 }, (_, i) => ({
  displayName: "Collector " + i,
  rank: i + 1,
}));
assert.equal(rankingPage(pageFixture, { page: 2 }).rows[0].rank, 21);
assert.equal(rankingPage(pageFixture, { page: 999 }).page, 3);
assert.equal(rankingPage(pageFixture, { page: -1, q: "x".repeat(201) }).page, 1);
assert.equal(rankingPage(pageFixture, { q: "Collector 44" }).rows[0].rank, 45);
let fault = "",
  d = new LocalDatabase(path, catalog, {
    clock: () => Date.parse("2026-10-04T10:00:00Z"),
    fault: (stage) => {
      if (stage === fault) throw Error(stage);
    },
  });
const a = d.session("member-a"),
  b = d.session("member-b"),
  o = d.session("official-a"),
  c = d.session("creator-a");
const reject = (fn, status) => assert.throws(fn, (e) => e.status === status);
const snapshot = () =>
  JSON.stringify(
    [
      "holdings",
      "asset_events",
      "ledger",
      "pity",
      "draws",
      "syntheses",
      "collection_profiles",
      "collection_awards",
      "collection_growth",
      "documents",
      "document_versions",
      "audit",
      "mutations",
      "discovery_events",
    ].map((t) => d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all()),
  );
const assetSnapshot = () =>
  JSON.stringify(
    ["holdings", "asset_events", "ledger", "pity", "draws", "syntheses"].map((t) =>
      d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all(),
    ),
  );
let me = d.collectionMe(a);
assert.equal(isCollectionProjection(me, "owner"), true);
assert.equal(isCollectionProjection(me, "showcase"), false);
assert.equal(isCollectionProjection(d.collectionCatalogue(), "catalogue"), true);
assert.equal(
  isCollectionProjection({ ...d.collectionCatalogue(), actorId: "private-owner" }, "catalogue"),
  false,
);
assert.equal(isCollectionProjection(d.collectionRankings(), "ranking"), true);
assert.equal(me.profile.data.isPublic, false);
assert.equal(me.awards.length, 0);
reject(() => d.publicCollection(me.profile.handle), 404);
reject(() => d.collectionMe("invalid"), 401);
// A deterministic, isolated synthetic source fixture exercises every design without consuming the user's real local database.
const pool = me.progress.find((p) => p.total > 1).poolId,
  cards = d.collectionCatalogue().cards.filter((c) => c.poolId === pool);
const grant = (card, count = 1) => {
  d.db
    .prepare("INSERT INTO asset_events VALUES(?,?,?,?,?,?,?,?)")
    .run(
      "fixture-" + card.cardId + "-" + count,
      "member-a",
      "isolated-test",
      card.cardId,
      count,
      "test-grant",
      d.at(),
      JSON.stringify({ synthetic: true }),
    );
  d.db
    .prepare(
      "INSERT INTO holdings VALUES(?,?,?) ON CONFLICT(user_id,card_id) DO UPDATE SET count=count+excluded.count",
    )
    .run("member-a", card.cardId, count);
};
grant(cards[0], 4);
me = d.collectionMe(a);
assert.equal(me.progress.find((p) => p.poolId === pool).owned, 1);
assert.equal(me.awards.length, 1);
assert.deepEqual(me.awards[0].earnedCondition, { type: "first", threshold: 1 });
assert.equal(me.recent.length, 1);
assert.equal(me.recent[0].cardId, cards[0].cardId);
assert.equal(me.recent[0].source, "test-grant");
assert.deepEqual(d.collectionMe(b).recent, []);
assert.equal(Object.keys(me.recent[0]).sort().join(","), "at,cardId,source");
assert.equal(d.collectionMe(b).cards.length, 0);
for (const card of cards.slice(1)) grant(card);
me = d.collectionMe(a);
assert.equal(me.progress.find((p) => p.poolId === pool).pct, 100);
assert.ok(me.awards.some((a) => a.type === "series"));
const stable = snapshot();
d.collectionMe(a);
assert.equal(snapshot(), stable);
const eventCount = d.db
  .prepare("SELECT COUNT(*) n FROM discovery_events WHERE kind='series-complete'")
  .get().n;
assert.equal(eventCount, 1);
// Consumption does not erase an acquisition; current holdings still control showcase eligibility.
d.db
  .prepare("UPDATE holdings SET count=0 WHERE user_id='member-a' AND card_id=?")
  .run(cards[1].cardId);
d.db
  .prepare(
    "INSERT INTO asset_events VALUES('consumed','member-a','isolated-test',?,-1,'test-consumed',?,?)",
  )
  .run(cards[1].cardId, d.at(), "{}");
assert.equal(d.collectionMe(a).progress.find((p) => p.poolId === pool).pct, 100);
assert.equal(d.collectionMe(a).acquiredCards.find((c) => c.cardId === cards[1].cardId).count, 0);
assert.equal(d.collectionMe(a).visibilityKey, d.collectionCatalogue().visibilityKey);
let profile = {
  ...me.profile.data,
  isPublic: true,
  showCards: true,
  showProgress: true,
  showBadges: true,
  showRanking: true,
  displayName: "Test showcase",
  bio: "<script>literal text</script>",
  mainCardId: cards[0].cardId,
  shelfIds: [cards[0].cardId],
};
let command = { expectedVersion: me.profile.version, data: profile };
for (const stage of ["after-collection-profile", "before-mutation-receipt"]) {
  fault = stage;
  const before = snapshot();
  assert.throws(() => d.collectionProfile(a, command, "rollback-profile-019"));
  assert.equal(snapshot(), before);
  fault = "";
}
d.collectionProfile(a, command, "save-profile-019");
const saved = snapshot();
d.collectionProfile(a, command, "save-profile-019");
assert.equal(snapshot(), saved);
reject(
  () =>
    d.collectionProfile(
      a,
      { ...command, data: { ...profile, bio: "changed" } },
      "save-profile-019",
    ),
  409,
);
reject(() => d.collectionProfile(a, command, "stale-profile-019"), 409);
const pub = d.publicCollection(me.profile.handle);
assert.equal(isCollectionProjection(pub, "showcase"), true);
assert.equal(isCollectionProjection({ ...pub, mainCard: { count: 1 } }, "showcase"), false);
assert.equal(
  isCollectionProjection({ ...pub, readContract: { ...pub.readContract, schema: 2 } }, "showcase"),
  false,
);
const beforePublicPreview = snapshot();
const previewCommand = { expectedVersion: d.collectionMe(a).profile.version, data: profile };
const themed = {
  ...profile,
  presentation: { layout: "albums", bioEn: "Local synthetic collection", poolIds: [pool] },
};
const themePreview = previewCollectionProfile(d, a, { ...previewCommand, data: themed }).projection;
assert.equal(themePreview.layout, "albums");
assert.equal(themePreview.bioEn, "Local synthetic collection");
assert.equal(themePreview.featured[0].poolId, pool);
const arranged = {
  ...themed,
  presentation: { ...themed.presentation, theme: "contrast", shelfLayout: "wide" },
};
const arrangedPreview = previewCollectionProfile(d, a, {
  ...previewCommand,
  data: arranged,
}).projection;
assert.equal(arrangedPreview.theme, "contrast");
assert.equal(arrangedPreview.shelfLayout, "wide");
reject(
  () =>
    previewCollectionProfile(d, a, {
      ...previewCommand,
      data: { ...arranged, presentation: { ...arranged.presentation, theme: "<script>" } },
    }),
  422,
);
reject(
  () =>
    previewCollectionProfile(d, a, {
      ...previewCommand,
      data: { ...arranged, presentation: { ...arranged.presentation, shelfLayout: "unknown" } },
    }),
  422,
);
assert.deepEqual(
  previewCollectionProfile(d, a, { ...previewCommand, data: { ...themed, showProgress: false } })
    .projection.featured,
  [],
);
reject(
  () =>
    previewCollectionProfile(d, a, {
      ...previewCommand,
      data: { ...profile, presentation: { layout: "secret", bioEn: "", poolIds: [] } },
    }),
  422,
);
reject(
  () =>
    previewCollectionProfile(d, a, {
      ...previewCommand,
      data: { ...themed, presentation: { ...themed.presentation, poolIds: ["missing"] } },
    }),
  422,
);
assert.deepEqual(
  previewCollectionProfile(d, a, { ...previewCommand, data: { ...profile, badgeIds: [] } })
    .projection.awards,
  [],
);
const earnedId = me.awards[0].id;
assert.deepEqual(
  previewCollectionProfile(d, a, {
    ...previewCommand,
    data: { ...profile, badgeIds: [earnedId] },
  }).projection.awards.map((a) => a.id),
  [earnedId],
);
reject(
  () =>
    previewCollectionProfile(d, a, {
      ...previewCommand,
      data: { ...profile, badgeIds: ["unearned"] },
    }),
  422,
);
assert.ok(!JSON.stringify(pub).includes("earnedCondition"));
assert.deepEqual(previewCollectionProfile(d, a, previewCommand).projection, pub);
assert.equal(
  previewCollectionProfile(d, a, { ...previewCommand, data: { ...profile, isPublic: false } })
    .projection,
  null,
);
assert.equal(
  previewCollectionProfile(d, a, {
    ...previewCommand,
    data: { ...profile, showCards: false, showProgress: false, showBadges: false },
  }).projection.mainCard,
  null,
);
reject(() => previewCollectionProfile(d, null, previewCommand), 401);
reject(
  () =>
    previewCollectionProfile(d, b, {
      ...previewCommand,
      expectedVersion: d.collectionMe(b).profile.version,
    }),
  422,
);
reject(() => previewCollectionProfile(d, a, { ...previewCommand, expectedVersion: 0 }), 409);
reject(() => previewCollectionProfile(d, a, { ...previewCommand, actorId: "member-b" }), 422);
assert.equal(snapshot(), beforePublicPreview);
assert.equal(pub.mainCard.cardId, cards[0].cardId);
for (const secret of [
  '"actorId"',
  '"user_id"',
  '"count"',
  '"ledger"',
  '"catalogueIds"',
  '"condition"',
])
  assert.ok(!JSON.stringify(pub).includes(secret), secret);
reject(
  () => d.collectionProfile(b, { expectedVersion: 1, data: profile }, "cross-select-019"),
  422,
);
const version = d.collectionMe(a).profile.version;
reject(
  () =>
    d.collectionProfile(
      a,
      { expectedVersion: version, data: { ...profile, mainCardId: cards[1].cardId } },
      "consumed-select-019",
    ),
  422,
);
const beforePreview = snapshot();
const preview = d.collectionPreview(a, { cardId: cards[0].cardId, count: 100 });
assert.equal(preview.approved, false);
assert.equal(preview.cardsConsumed, 0);
assert.equal(preview.kpConsumed, 0);
assert.equal(preview.sufficient, false);
assert.equal(preview.growthLevel, null);
assert.equal(snapshot(), beforePreview);
reject(() => d.collectionPreview(b, { cardId: cards[0].cardId, count: 1 }), 404);
let rules = d.document("collection-rules"),
  data = structuredClone(rules.data);
data.visibility.find((v) => v.poolId === pool).hiddenGrades = [cards[0].rarity];
let input = { expectedVersion: rules.version, data };
reject(() => d.collectionRules(a, input, "member-rules-019"), 403);
reject(() => d.collectionRules(c, input, "creator-rules-019"), 403);
for (const stage of ["after-document-snapshot", "before-mutation-receipt"]) {
  fault = stage;
  const before = snapshot();
  assert.throws(() => d.collectionRules(o, input, "rollback-rules-019"));
  assert.equal(snapshot(), before);
  fault = "";
}
d.collectionRules(o, input, "hide-rules-019");
const hidden = snapshot();
d.collectionRules(o, input, "hide-rules-019");
assert.equal(snapshot(), hidden);
const hiddenPub = d.publicCollection(me.profile.handle);
reject(
  () =>
    previewCollectionProfile(d, a, {
      expectedVersion: d.collectionMe(a).profile.version,
      data: profile,
    }),
  422,
);
const safePreview = previewCollectionProfile(d, a, {
  expectedVersion: d.collectionMe(a).profile.version,
  data: { ...profile, mainCardId: null, shelfIds: [] },
}).projection;
assert.deepEqual(safePreview.mainCard, null);
assert.ok(!JSON.stringify(safePreview).includes(cards[0].cardId));
assert.equal(hiddenPub.mainCard, null);
assert.equal(hiddenPub.shelf.length, 0);
assert.ok(!JSON.stringify(hiddenPub).includes(cards[0].cardId));
assert.ok(!hiddenPub.awards.some((a) => a.type === "series"));
assert.ok(
  !d.collectionCatalogue().cards.some((c) => c.rarity === cards[0].rarity && c.poolId === pool),
);
assert.equal(
  hiddenPub.progress.find((p) => p.poolId === pool).total,
  cards.filter((c) => c.rarity !== cards[0].rarity).length,
);
const historic = d.db
  .prepare("SELECT payload FROM document_versions WHERE id='collection-rules' AND version=1")
  .get().payload;
assert.deepEqual(JSON.parse(historic).visibility.find((v) => v.poolId === pool).hiddenGrades, []);
assert.throws(() => d.db.prepare("UPDATE collection_awards SET rule_version=99").run());
assert.throws(() => d.db.prepare("UPDATE collection_definitions SET version=99").run());
assert.deepEqual(d.collectionRankings().rows, []);
assert.deepEqual(
  rankCollections([
    {
      handle: "a",
      displayName: "A",
      completion: 50,
      completedSeries: 1,
      achievements: 2,
      isPublic: true,
      showRanking: true,
      synthetic: false,
    },
    {
      handle: "b",
      displayName: "B",
      completion: 50,
      completedSeries: 1,
      achievements: 2,
      isPublic: true,
      showRanking: true,
      synthetic: false,
    },
    {
      handle: "c",
      displayName: "C",
      completion: 10,
      completedSeries: 0,
      achievements: 0,
      isPublic: true,
      showRanking: true,
      synthetic: false,
    },
    { handle: "fixture", completion: 100, isPublic: true, showRanking: true, synthetic: true },
    { handle: "private", completion: 100, isPublic: false, showRanking: true, synthetic: false },
  ]).map((r) => r.rank),
  [1, 1, 3],
);
reject(
  () =>
    d.collectionParticipation(
      a,
      { fixtureId: "member-a", activityId: "local-activity-check" },
      "member-evidence-019",
    ),
  403,
);
d.collectionParticipation(
  o,
  { fixtureId: "member-a", activityId: "local-activity-check" },
  "evidence-019",
);
d.collectionParticipation(
  o,
  { fixtureId: "member-a", activityId: "local-activity-check" },
  "evidence-again-019",
);
assert.equal(d.db.prepare("SELECT COUNT(*) n FROM collection_participation").get().n, 1);
assert.ok(d.collectionMe(a).awards.some((a) => a.type === "activity"));
rules = d.document("collection-rules");
data = structuredClone(rules.data);
data.proposal.status = "approved";
reject(
  () => d.collectionRules(o, { expectedVersion: rules.version, data }, "approve-forbidden-019"),
  422,
);
// A new account's award creation rolls back atomically when the fault fires.
const card = d.collectionCatalogue().cards[0];
d.db
  .prepare(
    "INSERT INTO asset_events VALUES('b-first','member-b','isolated-test',?,1,'test-grant',?,?)",
  )
  .run(card.cardId, d.at(), "{}");
fault = "after-collection-award";
const before = snapshot();
assert.throws(() => d.collectionMe(b));
assert.equal(snapshot(), before);
fault = "";
const persisted = d.collectionMe(a),
  assets = assetSnapshot(),
  copy = join(dir, "backup.sqlite");
await backup(d.db, copy);
d.close();
d = new LocalDatabase(path, catalog, { clock: () => Date.parse("2026-10-04T10:00:00Z") });
assert.deepEqual(d.collectionMe(a), persisted);
assert.equal(assetSnapshot(), assets);
const restored = new LocalDatabase(copy, catalog, {
  clock: () => Date.parse("2026-10-04T10:00:00Z"),
});
assert.deepEqual(restored.collectionMe(a), persisted);
restored.close();
const server = createLocalServer(d);
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = "http://127.0.0.1:" + server.address().port + "/api/local-test";
try {
  assert.equal((await fetch(base + "/collection/me")).status, 401);
  assert.equal((await fetch(base + "/admin/collection/rules")).status, 401);
  assert.equal((await fetch(base + "/collection/profiles/" + me.profile.handle)).status, 200);
  assert.equal((await fetch(base + "/collection/profiles/c-00000000000000000000")).status, 404);
  assert.equal(
    (
      await fetch(base + "/collection/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
    ).status,
    403,
  );
  assert.deepEqual((await (await fetch(base + "/collection/rankings")).json()).rows, []);
} finally {
  await new Promise((resolve) => server.close(resolve));
}
d.close();
console.log(
  "Collection 0.19 passed: privacy, own data, lifetime distinct progress, hidden projections, immutable rules, award dedupe/rollback, preview no-consumption, tied ranks/test exclusion, restart/backup and HTTP.",
);
