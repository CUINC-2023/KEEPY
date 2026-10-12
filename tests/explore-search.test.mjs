import assert from "node:assert/strict";
import { normalizeExploreSearch, isExploreQueryAllowed } from "../src/lib/explore-search.mjs";
assert.equal(isExploreQueryAllowed("?q=literal&type=article&page=2"), true);
assert.equal(isExploreQueryAllowed("?actor=private&q=literal"), false);
assert.equal(isExploreQueryAllowed("?q=a&q=b"), false);
assert.equal(isExploreQueryAllowed("?group=private"), false);
assert.deepEqual(normalizeExploreSearch({ q: "制服", type: "article", actor: "private" }), {
  q: "制服",
  type: "article",
});
for (const q of ["x".repeat(201), ["duplicate"], null, 12, "a\u0000b"])
  assert.equal(normalizeExploreSearch({ q }).q, "");
for (const type of ["draft", "private", ["article"], null])
  assert.equal(normalizeExploreSearch({ type }).type, "all");
assert.equal(
  normalizeExploreSearch({ q: "<script>literal</script>" }).q,
  "<script>literal</script>",
);
assert.deepEqual(normalizeExploreSearch({}), { q: "", type: "all" });
assert.equal(normalizeExploreSearch({ page: "2" }).page, 2);
for (const page of [0, -1, 101, NaN, Infinity, "2.5", "0010", [2], {}])
  assert.equal(normalizeExploreSearch({ page }).page, undefined);
assert.equal(
  normalizeExploreSearch({ focus: "public-article" }, [{ id: "public-article" }]).focus,
  "public-article",
);
assert.equal(
  normalizeExploreSearch({ focus: "private-article" }, [{ id: "public-article" }]).focus,
  undefined,
);
assert.equal(normalizeExploreSearch({ focus: "<script>" }).focus, undefined);
assert.deepEqual(normalizeExploreSearch({ page: 2, owner: "private", group: "secret" }), {
  q: "",
  type: "all",
  page: 2,
});
console.log("Explore URL allowlist, length, malformed values and literal text passed");
