export const WORKBENCH_DEFAULT = {
  schema: 1,
  q: "",
  poolId: "",
  rarity: "all",
  mode: "all",
  sort: "name",
  page: 1,
};
export function validWorkbench(p) {
  return (
    !!p &&
    Object.keys(p).sort().join() === "mode,page,poolId,q,rarity,schema,sort" &&
    p.schema === 1 &&
    typeof p.q === "string" &&
    p.q.length <= 100 &&
    typeof p.poolId === "string" &&
    p.poolId.length <= 80 &&
    typeof p.rarity === "string" &&
    p.rarity.length <= 12 &&
    ["all", "held", "acquired", "duplicates"].includes(p.mode) &&
    ["name", "rarity", "count"].includes(p.sort) &&
    Number.isSafeInteger(p.page) &&
    p.page >= 1 &&
    p.page <= 10000
  );
}
export function collectionWorkbench(me, p = WORKBENCH_DEFAULT) {
  if (!validWorkbench(p)) throw Error("Invalid private search");
  const held = new Map(me.cards.map((c) => [c.cardId, c.count ?? 0])),
    ever = new Set(me.acquiredCards.map((c) => c.cardId));
  const merged = new Map(
    [...me.acquiredCards, ...me.cards].map((c) => [
      c.cardId,
      { ...c, count: held.get(c.cardId) ?? 0, everAcquired: ever.has(c.cardId) },
    ]),
  );
  const needle = p.q.trim().toLocaleLowerCase();
  const rows = [...merged.values()].filter(
    (c) =>
      (!needle ||
        (c.name + " " + c.poolId + " " + c.rarity).toLocaleLowerCase().includes(needle)) &&
      (!p.poolId || c.poolId === p.poolId) &&
      (p.rarity === "all" || c.rarity === p.rarity) &&
      (p.mode === "all" ||
        (p.mode === "held" && c.count > 0) ||
        (p.mode === "acquired" && c.everAcquired) ||
        (p.mode === "duplicates" && c.count > 1)),
  );
  rows.sort((a, b) =>
    p.sort === "count"
      ? b.count - a.count || a.cardId.localeCompare(b.cardId)
      : p.sort === "rarity"
        ? a.rarity.localeCompare(b.rarity) || a.cardId.localeCompare(b.cardId)
        : a.name.localeCompare(b.name) || a.cardId.localeCompare(b.cardId),
  );
  const pages = Math.max(1, Math.ceil(rows.length / 20)),
    page = Math.min(p.page, pages);
  return { total: rows.length, page, pages, rows: rows.slice((page - 1) * 20, page * 20) };
}
