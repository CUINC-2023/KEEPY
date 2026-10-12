import assert from "node:assert/strict";
import { inspectCatalogue } from "../src/lib/catalogue-health.mjs";
import { COLLECTION_THEMES, CREATOR_CONTENT_TEMPLATES } from "../src/lib/collection-samples.mjs";
const title = { "zh-TW": "QA", en: "QA" },
  catalogue = {
    version: 1,
    visibilityKey: "current",
    pools: [{ poolId: "p", title, visibleDesigns: 1 }],
    cards: [{ cardId: "c", poolId: "p" }],
  };
assert.deepEqual(inspectCatalogue(catalogue, COLLECTION_THEMES).issues, []);
assert.equal(inspectCatalogue(catalogue, COLLECTION_THEMES).publicationApproval, false);
assert.ok(
  inspectCatalogue(
    { ...catalogue, cards: [...catalogue.cards, ...catalogue.cards] },
    COLLECTION_THEMES,
  ).issues.includes("duplicate-public-design"),
);
const orphan = inspectCatalogue(
  { ...catalogue, cards: [{ cardId: "private-diagnostic-proof", poolId: "missing" }] },
  COLLECTION_THEMES,
);
assert.ok(orphan.issues.includes("orphan-public-design"));
assert.ok(!JSON.stringify(orphan).includes("private-diagnostic-proof"));
assert.ok(
  inspectCatalogue(catalogue, [
    { ...COLLECTION_THEMES[0], source: { "zh-TW": "QA", en: "" } },
  ]).issues.includes("incomplete-template"),
);
console.log(
  "PASS public integrity, bilingual templates, duplicate/orphan detection and minimal diagnostics",
);
const malformed = structuredClone(COLLECTION_THEMES.find((t) => t.cardStories));
malformed.cardStories[0].en = "";
const report = inspectCatalogue(catalogue, [malformed]);
assert.equal(report.templates[0].complete, false);
assert.deepEqual(report.templates[0].missingTranslations, ["cardStories"]);
assert.ok(!JSON.stringify(report).includes(malformed.cardStories[0]["zh-TW"]));
const references = inspectCatalogue(catalogue, [
  { ...COLLECTION_THEMES[0], materialReferences: ["review-only-local-reference"] },
]);
assert.equal(references.templates[0].materialReviewRequired, true);
assert.equal(references.publicationApproval, false);
assert.ok(!JSON.stringify(references).includes("review-only-local-reference"));
const creatorReport = inspectCatalogue(catalogue, COLLECTION_THEMES, CREATOR_CONTENT_TEMPLATES);
assert.equal(creatorReport.creatorTemplates.length, 3);
assert.ok(creatorReport.creatorTemplates.every((t) => t.complete));
assert.ok(!JSON.stringify(creatorReport).includes(CREATOR_CONTENT_TEMPLATES[0].workIntro.en));
const bad = {
  ...CREATOR_CONTENT_TEMPLATES[0],
  seriesId: "orphan",
  questions: [],
  confirmedAnswers: "private-proof",
};
const broken = inspectCatalogue(catalogue, COLLECTION_THEMES, [bad, bad]);
assert.ok(broken.issues.includes("duplicate-creator-template"));
assert.deepEqual(broken.creatorTemplates[0].missing, [
  "series-reference",
  "questions",
  "unconfirmed-facts",
]);
assert.ok(!JSON.stringify(broken).includes("private-proof"));
