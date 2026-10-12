const categories = ["design", "guide", "interview", "behind-scenes"];
export function isExploreQueryAllowed(search) {
  const allowed = new Set([
    "q",
    "type",
    "category",
    "creator",
    "pool",
    "page",
    "focus",
    "returnTo",
    "readingSort",
  ]);
  const seen = new Set();
  for (const [key] of new URLSearchParams(search)) {
    if (!allowed.has(key) || seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}
export function normalizeExploreSearch(raw = {}, items) {
  const q =
    typeof raw.q === "string" && raw.q.length <= 200 && !/[\u0000-\u001f]/.test(raw.q) ? raw.q : "";
  const type = ["all", "series", "creator", "article"].includes(raw.type) ? raw.type : "all";
  const result = { q, type };
  const page =
    typeof raw.page === "string" && /^\d{1,3}$/.test(raw.page) ? Number(raw.page) : raw.page;
  if (Number.isSafeInteger(page) && page > 1 && page <= 100) result.page = page;
  if (
    typeof raw.focus === "string" &&
    /^[a-z0-9][a-z0-9-]{0,99}$/.test(raw.focus) &&
    (!items || items.some((i) => i.id === raw.focus))
  )
    result.focus = raw.focus;
  if (
    categories.includes(raw.category) &&
    (!items || items.some((i) => i.kind === "article" && i.category === raw.category))
  )
    result.category = raw.category;
  for (const [key, kind] of [
    ["creator", "creator"],
    ["pool", "series"],
  ])
    if (
      typeof raw[key] === "string" &&
      /^[a-z0-9][a-z0-9-]{0,95}$/.test(raw[key]) &&
      (!items || items.some((i) => i.kind === kind && i.referenceId === raw[key]))
    )
      result[key] = raw[key];
  if (["reading", "journal"].includes(raw.returnTo)) result.returnTo = raw.returnTo;
  if (["latest", "oldest"].includes(raw.readingSort)) result.readingSort = raw.readingSort;
  return result;
}
export function exploreOptions(items) {
  return {
    categories: categories.filter((category) =>
      items.some((i) => i.kind === "article" && i.category === category),
    ),
    creators: items
      .filter((i) => i.kind === "creator")
      .filter((i, n, a) => a.findIndex((v) => v.referenceId === i.referenceId) === n),
    pools: items
      .filter((i) => i.kind === "series")
      .filter((i, n, a) => a.findIndex((v) => v.referenceId === i.referenceId) === n),
  };
}
export function filterExploreItems(items, search, publicItems = items) {
  const s = normalizeExploreSearch(search, publicItems);
  return items.filter(
    (i) =>
      (!s.category || (i.kind === "article" && i.category === s.category)) &&
      (!s.creator || i.creatorIds.includes(s.creator)) &&
      (!s.pool || i.poolIds.includes(s.pool)),
  );
}
export function relatedArticles(items, item, limit = 6) {
  const current = items.find((i) => i.id === item.id && i.kind === "article");
  if (!current) return [];
  const seen = new Set([item.id]);
  return items
    .filter((i) => {
      if (i.kind !== "article" || seen.has(i.id)) return false;
      seen.add(i.id);
      return (
        i.category === current.category ||
        i.creatorIds.some((id) => current.creatorIds.includes(id)) ||
        i.poolIds.some((id) => current.poolIds.includes(id))
      );
    })
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
    .slice(0, Math.max(0, Math.min(6, limit)));
}
