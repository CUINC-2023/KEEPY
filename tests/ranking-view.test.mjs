import assert from "node:assert/strict";
import { parseRankingView } from "../src/lib/ranking-view.mjs";
for (const raw of [
  "bad",
  JSON.stringify({ schema: 2, boards: [], last: null }),
  JSON.stringify({ schema: 1, boards: ["total", "total"], last: null }),
  JSON.stringify({ schema: 1, boards: ["private-user"], last: null }),
  JSON.stringify({ schema: 1, boards: [], last: "evil" }),
])
  assert.equal(parseRankingView(raw), null);
assert.deepEqual(
  parseRankingView(JSON.stringify({ schema: 1, boards: ["total", "album"], last: "album" })),
  { schema: 1, boards: ["total", "album"], last: "album" },
);
console.log("PASS private ranking preferences whitelist and compatibility");
