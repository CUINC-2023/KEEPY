import test from "node:test";
import assert from "node:assert/strict";
import { supplyDiff } from "../src/lib/supply-diff.mjs";
test("diff existing immutable values and all editorial/material fields without writing", () => {
  const a = {
    copy: { story: { "zh-TW": "舊", en: "old" } },
    articleIds: ["a"],
    materials: [{ id: "m", uses: { website: "pending" }, startAt: "old", evidence: "private" }],
    editorial: { articles: [{ id: "a", blocks: [{ type: "heading", text: { en: "Old" } }] }] },
  };
  const b = structuredClone(a);
  b.copy.story.en = "new";
  b.materials[0].uses.website = "sample-confirmed";
  b.materials[0].startAt = "new";
  delete b.materials[0].evidence;
  b.editorial.articles[0].blocks.push({ type: "paragraph", text: { en: "New", "zh-TW": "新" } });
  b.articleIds.push("b");
  const snapshot = JSON.stringify(a),
    rows = supplyDiff(a, b);
  assert.ok(rows.some((r) => r.path === "copy.story.en" && r.kind === "changed"));
  assert.ok(rows.some((r) => r.path.endsWith("evidence") && r.kind === "removed"));
  assert.ok(rows.some((r) => r.path === "articleIds.1" && r.kind === "added"));
  assert.ok(rows.some((r) => r.path.includes("blocks.1.text.zh-TW")));
  assert.ok(rows.some((r) => r.path.includes("uses.website")));
  assert.equal(JSON.stringify(a), snapshot);
  assert.deepEqual(supplyDiff(a, a), []);
});
test("unknown document fields, remuneration and ownership never enter diff", () => {
  assert.deepEqual(
    supplyDiff(
      { ownerId: "a", remuneration: "secret" },
      { ownerId: "b", remuneration: "changed", sessionHash: "private" },
    ),
    [],
  );
  assert.equal(
    supplyDiff({ copy: { title: { en: "<script>" } } }, { copy: { title: { en: "literal" } } })[0]
      .before,
    "<script>",
  );
});
