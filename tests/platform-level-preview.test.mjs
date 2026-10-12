import assert from "node:assert/strict";
import { previewPlatformLevel } from "../src/lib/platform-level-preview.mjs";
const ids = ["profile", "first", "album", "vote"],
  tasks = ids.map((id) => ({
    id,
    enabled: true,
    ruleVersion: 1,
    completedAt: "2026-10-12T00:00:00Z",
  })),
  owner = { actorId: "a", tasks: [...tasks, ...tasks], votes: [{ round_id: "r", option_id: "o" }] },
  collection = {
    actorId: "a",
    profile: { version: 2 },
    acquiredCards: [{}],
    progress: [{ total: 1 }],
  },
  publicData = { version: 2, tasks, rounds: [{ id: "r", kind: "theme", options: [{ id: "o" }] }] };
assert.equal(previewPlatformLevel(owner, collection, publicData).completed, 4);
assert.equal(previewPlatformLevel(owner, { ...collection, actorId: "b" }, publicData), null);
assert.equal(
  previewPlatformLevel(owner, collection, {
    ...publicData,
    tasks: tasks.map((t) => ({ ...t, enabled: false })),
  }).stage,
  0,
);
assert.equal(
  previewPlatformLevel(
    owner,
    { ...collection, acquiredCards: [], progress: [] },
    { ...publicData, rounds: [] },
  ).completed,
  1,
);
assert.equal(
  previewPlatformLevel(
    { ...owner, tasks: tasks.map((t) => ({ ...t, completedAt: "invalid" })) },
    collection,
    publicData,
  ).stage,
  0,
);
console.log(
  "PASS platform preview valid types, cap, dedupe, snapshot validity, public invalidation and owner isolation",
);
