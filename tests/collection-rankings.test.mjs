import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import {
  periodDesigns,
  seasonRankings,
  albumRankings,
} from "../local-test/collection-rankings.mjs";
const start = "2026-10-01T00:00:00+08:00",
  end = "2026-11-01T00:00:00+08:00";
const event = (id, at, extra = {}) => ({
  cardId: id,
  at,
  source: "test-paid-draw",
  delta: 1,
  verified: true,
  ...extra,
});
const events = [
  event("a", start),
  event("a", "2026-10-15T00:00:00+08:00"),
  event("b", end),
  event("c", start, { delta: -1 }),
  event("d", start, { verified: false }),
  event("e", start, { source: "test-grant" }),
  event("hidden", start),
];
assert.deepEqual([...periodDesigns(events, ["a", "b", "c", "d", "e"], start, end)], ["a"]);
assert.equal(periodDesigns(events, ["a"], end, start).size, 0);
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-ranking-")), "test.sqlite"),
  await loadCatalog(),
  { clock: () => Date.parse("2026-10-04T10:00:00Z") },
);
try {
  const official = d.session("official-a"),
    series = d
      .document("discovery")
      .data.items.find((i) => i.draft.kind === "series" && i.draft.referenceId === "p-uniform");
  const value = { ...series.draft, releaseAt: start, withdrawAt: end };
  d.discoveryCommand(
    official,
    { action: "save", id: series.id, value, expectedVersion: d.document("discovery").version },
    "qa-season-period-save",
  );
  d.discoveryCommand(
    official,
    {
      action: "publish",
      id: series.id,
      value: null,
      expectedVersion: d.document("discovery").version,
    },
    "qa-season-period-publish",
  );
  const a = d.session("member-a"),
    me = d.collectionMe(a),
    initial = seasonRankings(d);
  assert.equal(initial.preview, true);
  assert.equal(seasonRankings(d, { group: "current" }).season?.state, "current");
  assert.equal(seasonRankings(d, { group: "historical" }).season, null);
  assert.equal(seasonRankings(d, { group: "historical", season: "p-uniform" }).season, null);
  assert.deepEqual(seasonRankings(d, { group: "historical" }).rows, []);
  assert.equal(initial.scoringVersion, "season-operation-preview-v1");
  assert.equal(initial.settled, false);
  assert.equal(initial.rewards, false);
  assert.deepEqual(initial.rows, []);
  assert.deepEqual(seasonRankings(d, { season: "missing" }).rows, []);
  assert.deepEqual(d.collectionRankings().rows, []);
  d.collectionProfile(
    a,
    {
      expectedVersion: me.profile.version,
      data: { ...me.profile.data, isPublic: true, showRanking: true },
    },
    "qa-rank-profile",
  );
  const result = seasonRankings(d);
  assert.ok(result.season);
  if (result.season) {
    assert.ok(result.rows.length > 0);
    assert.equal(result.rows[0].completion, 0);
    assert.ok(!JSON.stringify(result).includes("asset_events"));
  }
  d.draw(a, { poolId: "p-uniform", mode: "single" }, "qa-season-valid-source");
  const acquired = seasonRankings(d);
  assert.ok(acquired.rows[0].completion > 0);
  assert.deepEqual(albumRankings(d).rows, []);
  const album = albumRankings(d, { pool: "p-uniform", mode: "local-preview" });
  assert.ok(album.rows.length > 0);
  assert.ok(album.rows[0].completion > 0);
  assert.equal(
    album.denominator,
    d.collectionCatalogue().pools.find((p) => p.poolId === "p-uniform").visibleDesigns,
  );
  assert.deepEqual(albumRankings(d, { pool: "missing", mode: "local-preview" }).rows, []);
  const rules = d.document("collection-rules"),
    hidden = structuredClone(rules.data);
  hidden.visibility.find((p) => p.poolId === "p-uniform").hiddenGrades = [...d.catalog.grades];
  d.collectionRules(
    official,
    { expectedVersion: rules.version, data: hidden },
    "qa-rank-hidden-rules",
  );
  const obscured = albumRankings(d, { pool: "p-uniform", mode: "local-preview" });
  assert.equal(obscured.denominator, 0);
  assert.deepEqual(obscured.rows, []);
  assert.notEqual(obscured.denominatorVersion, album.denominatorVersion);
  // Unapproved TEST data never becomes a real ranking, even when publicly opted in.
  assert.deepEqual(d.collectionRankings().rows, []);
  const next = d.collectionMe(a);
  d.collectionProfile(
    a,
    { expectedVersion: next.profile.version, data: { ...next.profile.data, isPublic: false } },
    "qa-rank-private",
  );
  assert.deepEqual(seasonRankings(d).rows, []);
  console.log("PASS ranking preview boundaries, sources, privacy, real/synthetic separation");
} finally {
  d.close();
}
