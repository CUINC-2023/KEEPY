import assert from "node:assert/strict";
import { reuseSupplyTemplate } from "../src/lib/supply-template.mjs";
import { sampleUniformPackage } from "../src/lib/sample-022.mjs";
import { COLLECTION_THEMES, CREATOR_CONTENT_TEMPLATES } from "../src/lib/collection-samples.mjs";
const value = sampleUniformPackage("local-partner-a", Date.now()),
  before = JSON.stringify(value),
  result = reuseSupplyTemplate(value, COLLECTION_THEMES[0].id);
assert.equal(JSON.stringify(value), before);
for (const k of Object.keys(value).filter((k) => k !== "copy"))
  assert.deepEqual(result[k], value[k]);
for (const k of Object.keys(value.copy).filter((k) => !["story", "goal"].includes(k)))
  assert.deepEqual(result.copy[k], value.copy[k]);
assert.deepEqual(result.copy.story, COLLECTION_THEMES[0].story);
assert.deepEqual(result.copy.goal, COLLECTION_THEMES[0].guide);
assert.throws(() => reuseSupplyTemplate(value, "unknown"));
const pack = CREATOR_CONTENT_TEMPLATES[0],
  combined = reuseSupplyTemplate(value, pack.seriesId, true);
assert.deepEqual(combined.editorial.creatorIntro, pack.workIntro);
assert.deepEqual(combined.editorial.questions, pack.questions);
assert.deepEqual(combined.editorial.articles, value.editorial.articles);
for (const key of Object.keys(value).filter((k) => !["copy", "editorial"].includes(k)))
  assert.deepEqual(combined[key], value[key]);
assert.equal(JSON.stringify(value), before);
assert.throws(() => reuseSupplyTemplate({ ...value, editorial: undefined }, pack.seriesId, true));
console.log("PASS text-only reuse preserves IDs, rights, dates, materials and histories");
