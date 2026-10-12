import assert from "node:assert/strict";
import { acceptanceFlow } from "../local-test/acceptance-flow.mjs";
const result = await acceptanceFlow();
assert.equal(result.checks.length, 3);
assert.ok(result.checks.every((r) => r.status === "PASS"));
console.log(
  "Local handoff HTTP flow passed: isolated source/review/publication/search/display, replay/conflict/rollback, re-review/withdrawal/logout/expiry.",
);
