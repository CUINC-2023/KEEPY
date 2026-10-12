import assert from "node:assert/strict";
import { supplyChecklist } from "../src/lib/supply-checklist.mjs";
const bi = (s) => ({ "zh-TW": s, en: s });
const v = {
  partnerId: "local-partner-a",
  creatorId: "g-yoru",
  poolId: "p-uniform",
  application: bi("sample"),
  copy: Object.fromEntries(
    ["title", "summary", "story", "goal", "endPolicy"].map((k) => [k, bi(k)]),
  ),
  cardNotes: bi("sample"),
  promotion: bi("sample"),
  retrospective: bi(""),
  releaseAt: "2026-10-05T00:00:00Z",
  withdrawAt: "2026-11-01T00:00:00Z",
  materials: [
    {
      id: "m-example",
      ref: "text-only",
      version: 1,
      source: "sample source",
      evidence: "sample evidence",
      alt: bi("sample alternative text"),
      uses: { website: "sample-confirmed", social: "pending", print: "pending" },
      startAt: "2026-10-01T00:00:00Z",
      endAt: "2026-12-01T00:00:00Z",
    },
  ],
};
const before = JSON.stringify(v),
  ready = supplyChecklist(v);
assert.equal(ready.length, 7);
assert.ok(ready.slice(0, 6).every((c) => c.complete));
assert.equal(ready[6].complete, false);
assert.equal(ready[6].requiredForSubmission, false);
assert.equal(ready[1].pending.length, 2);
assert.equal(JSON.stringify(v), before);
const missing = structuredClone(v);
missing.materials[0].source = "";
missing.materials[0].alt.en = "";
missing.materials[0].uses.website = "pending";
missing.copy.story.en = "";
missing.cardNotes["zh-TW"] = "";
const checks = supplyChecklist(missing, ["creator-role", "cooperation"]);
assert.ok(!checks[0].complete);
assert.deepEqual(
  checks[1].missing.map((m) => m.field),
  ["source", "alt", "website"],
);
assert.equal(checks[1].missing[1].locale, "en");
assert.equal(checks[1].missing[1].materialId, "m-example");
assert.equal(checks[2].missing[0].field, "story");
assert.equal(checks[3].missing[0].field, "cardNotes");
missing.materials[0].startAt = "2026-10-06T00:00:00Z";
assert.ok(supplyChecklist(missing)[1].missing.some((m) => m.field === "coverage"));
missing.releaseAt = "2026-12-01";
assert.ok(supplyChecklist(missing)[4].missing.some((m) => m.field === "releaseAt"));
missing.releaseAt = "2026-12-02T00:00:00Z";
assert.ok(supplyChecklist(missing)[4].missing.some((m) => m.field === "publication-order"));
v.retrospective = bi("Observation without invented performance");
assert.equal(supplyChecklist(v)[6].complete, true);
console.log(
  "Supply checklist passed: seven independent readiness states, concrete field/locale/material gaps, pending uses, optional retrospective, timezone/coverage and no input mutation.",
);
