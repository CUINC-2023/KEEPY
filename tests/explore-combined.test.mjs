import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  normalizeExploreSearch,
  exploreOptions,
  relatedArticles,
} from "../src/lib/explore-search.mjs";
import { publicContentSearch } from "../src/lib/public-search.mjs";
import { acceptanceFlow } from "../local-test/acceptance-flow.mjs";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { createLocalServer } from "../local-test/server.mjs";
const pair = { "zh-TW": "制服", en: "Uniform" },
  copy = Object.fromEntries(
    ["title", "summary", "body", "story", "period", "goal", "endPolicy", "teaser", "social"].map(
      (k) => [k, pair],
    ),
  );
const entry = (id, kind, referenceId, category, order = 1) => ({
  id,
  kind,
  referenceId,
  category,
  order,
  creatorIds: ["g-a"],
  poolIds: ["p-a"],
  copy,
});
const items = [
  entry("series", "series", "p-a", "seasonal"),
  entry("creator", "creator", "g-a", "guide"),
  entry("b", "article", "b", "guide", 2),
  entry("a", "article", "a", "design", 1),
  entry("c", "article", "c", "guide", 1),
];
test("current-public allowlist, keyword/category/creator/pool intersection and bounded URL values", () => {
  assert.deepEqual(
    normalizeExploreSearch(
      { category: "private", creator: "g-unknown", pool: "p-missing", actor: "secret" },
      items,
    ),
    { q: "", type: "all" },
  );
  assert.deepEqual(
    publicContentSearch(items, "Uniform", "article", "en", {
      category: "guide",
      creator: "g-a",
      pool: "p-a",
    }).map((i) => i.id),
    ["b", "c"],
  );
  assert.deepEqual(exploreOptions(items).categories, ["design", "guide"]);
  assert.equal(
    normalizeExploreSearch({ creator: "x".repeat(97), pool: "<script>", category: ["guide"] })
      .creator,
    undefined,
  );
  assert.equal(exploreOptions([]).creators.length, 0);
});
test("related articles exclude self, deduplicate, remain deterministic and fail closed without current source", () => {
  assert.deepEqual(
    relatedArticles([...items, items[2]], items[3]).map((i) => i.id),
    ["c", "b"],
  );
  assert.equal(relatedArticles(items, items[3], 1).length, 1);
  assert.equal(
    relatedArticles(
      items.filter((i) => i.id !== "a"),
      items[3],
    ).length,
    0,
  );
  assert.equal(relatedArticles([], items[3]).length, 0);
});
test("actual API sees only current publication: combinations, unknown filters and expired snapshots", async () => {
  const dir = mkdtempSync(join(tmpdir(), "keepy-explore-combined-")),
    path = join(dir, "flow.sqlite");
  await acceptanceFlow(path);
  let now = Date.now();
  const d = new LocalDatabase(path, await loadCatalog(), { clock: () => now }),
    server = createLocalServer(d);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + server.address().port;
  try {
    const data = await (
      await fetch(
        base +
          "/api/local-test/discovery/search?type=article&category=guide&creator=g-yoru&pool=p-uniform&locale=en",
      )
    ).json();
    assert.ok(data.count > 0);
    assert.ok(data.items.some((i) => i.id === "local-demo-022-progress"));
    assert.ok(data.items.every((i) => i.kind === "article" && i.category === "guide"));
    const body = JSON.stringify(data);
    assert.ok(!body.includes("evidence"));
    assert.ok(!body.includes("remuneration"));
    assert.equal(data.count, data.items.length);
    const projection = d.publicDiscovery().items;
    assert.deepEqual(
      data.items,
      publicContentSearch(projection, "", "article", "en", {
        category: "guide",
        creator: "g-yoru",
        pool: "p-uniform",
      }),
    );
    now += 100 * 86400000;
    const expired = await (
      await fetch(base + "/api/local-test/discovery/search?type=article&category=guide")
    ).json();
    assert.ok(!expired.items.some((i) => i.sourcePackId === "local-demo-022-uniform"));
    assert.deepEqual(exploreOptions([]), { categories: [], creators: [], pools: [] });
  } finally {
    await new Promise((r) => server.close(r));
    d.close();
  }
});
