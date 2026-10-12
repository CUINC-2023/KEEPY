import test from "node:test";
import assert from "node:assert/strict";
import { supplyWorkRows } from "../src/lib/supply-work.mjs";
const pack = (id, status, zh, en, published = false) => ({
  version: 1,
  data: {
    id,
    status,
    published,
    draftRevision: 1,
    revisions: [{ revision: 1, value: { copy: { title: { "zh-TW": zh, en } } } }],
  },
});
const rows = [
  pack("local-a", "draft", "制服草稿", "Uniform draft", true),
  pack("local-b", "returned", "回顧", "Review"),
  pack("local-c", "submitted", "文章", "Article"),
];
test("own list pure name/ID/status filtering does not invent workflow or mutate revisions", () => {
  const frozen = JSON.stringify(rows);
  assert.equal(supplyWorkRows(rows, " UNIFORM ").length, 1);
  assert.equal(supplyWorkRows(rows, "回顧", "returned")[0].data.id, "local-b");
  assert.equal(supplyWorkRows(rows, "", "published")[0].data.status, "draft");
  assert.equal(supplyWorkRows(rows, "not-found").length, 0);
  assert.equal(supplyWorkRows(rows, "", "submitted").length, 1);
  assert.equal(supplyWorkRows(rows, "", "bad").length, 3);
  assert.equal(JSON.stringify(rows), frozen);
});
