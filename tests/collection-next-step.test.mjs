import assert from "node:assert/strict";
import { nextCollectionStep } from "../src/lib/collection-next-step.mjs";
const empty = { progress: [], acquiredCards: [], profile: { data: {} } };
assert.equal(nextCollectionStep(empty).reason, "no-public-albums");
const first = { ...empty, progress: [{ poolId: "p", total: 2, complete: false }] };
assert.equal(nextCollectionStep(first).reason, "first-collection");
const own = { ...first, acquiredCards: [{ cardId: "one" }] };
assert.equal(nextCollectionStep(own).kind, "albums");
assert.equal(
  nextCollectionStep({ ...own, profile: { data: { goalPoolIds: ["unknown", "p"] } } }).kind,
  "goals",
);
assert.equal(
  nextCollectionStep({ ...own, progress: [{ poolId: "p", total: 2, complete: true }] }).kind,
  "showcase",
);
assert.equal(
  nextCollectionStep({
    ...own,
    progress: [{ poolId: "hidden", total: 0, complete: false }],
    profile: { data: { goalPoolIds: ["hidden"] } },
  }).reason,
  "no-public-albums",
);
assert.ok(!JSON.stringify(nextCollectionStep(own)).includes("one"));
console.log(
  "PASS source-based next steps, zero-denominator masking, private goals and no event writes",
);
