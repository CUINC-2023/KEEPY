import assert from "node:assert/strict";
import { rankCollections, rankingPage } from "../local-test/collection.mjs";
const good = {
  handle: "qa-valid",
  displayName: "QA",
  completion: 50,
  completedSeries: 1,
  achievements: 1,
  isPublic: true,
  showRanking: true,
  synthetic: false,
};
for (const extra of [
  { completion: NaN },
  { achievements: Infinity },
  { completedSeries: -1 },
  { completion: 101 },
  { showRanking: "true" },
  { synthetic: undefined },
])
  assert.deepEqual(rankCollections([{ ...good, ...extra }]), []);
assert.deepEqual(rankCollections([good, good]), []);
const rows = rankCollections(
  Array.from({ length: 45 }, (_, i) => ({
    ...good,
    handle: "qa-" + String(i).padStart(3, "0"),
    displayName: "QA " + i,
  })),
);
assert.equal(rankingPage(rows, { page: 3 }).rows.length, 5);
assert.equal(rankingPage(rows, { q: "QA 44" }).rows[0].rank, 1);
assert.equal(rankingPage(rows, { page: "huge" }).page, 1);
console.log(
  "PASS ranking invalid rows, duplicate identities, tied global ranks, bounded paging and search",
);
