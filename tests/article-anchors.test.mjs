import test from "node:test";
import assert from "node:assert/strict";
import { articleAnchors } from "../src/lib/article-anchors.mjs";
test("anchors are unique, bilingual-stable and do not encode titles or hidden metadata", () => {
  const a = [
    { type: "heading", text: { en: "Same", "zh-TW": "同" } },
    { type: "paragraph", text: { en: "Body" } },
    { type: "heading", text: { en: "Same" } },
    { type: "image" },
  ];
  const out = articleAnchors("journal-id", a);
  assert.equal(new Set(out.map((b) => b.anchor)).size, 4);
  assert.ok(out.every((b) => !b.anchor.includes("Same")));
  assert.equal(articleAnchors("journal-id", [{ type: "image" }, ...a])[1].anchor, out[0].anchor);
  assert.notEqual(articleAnchors("another", a)[0].anchor, out[0].anchor);
  assert.deepEqual(articleAnchors("old-copy"), []);
  assert.equal(a[0].anchor, undefined);
});
test("ID encoding avoids punctuation collisions and script characters", () => {
  assert.notEqual(
    articleAnchors("a/b", [{ type: "heading" }])[0].anchor,
    articleAnchors("a-b", [{ type: "heading" }])[0].anchor,
  );
  assert.match(articleAnchors("<script>", [{ type: "paragraph" }])[0].anchor, /^[a-z0-9-]+$/);
});
