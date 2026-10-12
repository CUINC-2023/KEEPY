import test from "node:test";
import assert from "node:assert/strict";
import { blankArticle, moveItem, ARTICLE_CATEGORIES } from "../src/lib/editorial-draft.mjs";
import { supplyChecklist } from "../src/lib/supply-checklist.mjs";
test("blank outlines append no answers or rights; reorder preserves exact object identity and bilingual pairing", () => {
  const original = blankArticle("design", "local-a");
  original.blocks[1].text = { "zh-TW": "既有正文", en: "Existing body" };
  const before = JSON.stringify(original);
  for (const category of ARTICLE_CATEGORIES) {
    const next = blankArticle(category, "local-b");
    assert.ok(next.blocks.every((b) => !b.text["zh-TW"] && !b.text.en));
    assert.equal(next.category, category);
    const rows = [original, next],
      moved = moveItem(rows, 0, 1);
    assert.equal(moved[1], original);
    assert.equal(rows[0], original);
    assert.equal(JSON.stringify(original), before);
    assert.equal(moveItem(rows, 0, -1), rows);
  }
  const blocks = moveItem(original.blocks, 1, 1);
  assert.equal(blocks[2], original.blocks[1]);
  assert.equal(blocks[2].text.en, "Existing body");
});
test("editorial/material missing fields use the shared checklist; old copy packages remain compatible", () => {
  const a = blankArticle("guide", "local-guide");
  a.blocks.push({ type: "image", materialId: "unknown", caption: { "zh-TW": "", en: "" } });
  const rows = supplyChecklist({
    editorial: { creatorIntro: { "zh-TW": "", en: "" }, questions: [], articles: [a] },
    materials: [],
  });
  assert.ok(
    rows[2].missing.some(
      (m) => m.materialId === "local-guide" && m.field === "title" && m.locale === "en",
    ),
  );
  assert.ok(rows[2].missing.some((m) => m.field === "material-block-9"));
  assert.ok(
    !supplyChecklist({ materials: [] })
      .flatMap((r) => r.missing)
      .some((m) => m.materialId === "local-guide"),
  );
});
