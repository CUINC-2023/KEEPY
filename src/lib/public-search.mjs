import { filterExploreItems } from "./explore-search.mjs";
export function publicContentSearch(
  items,
  query = "",
  type = "all",
  locale = "zh-TW",
  filters = {},
) {
  const terms = query.trim().normalize("NFKC").toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return filterExploreItems(
    items
      .filter(
        (i) =>
          ["series", "creator", "article"].includes(i.kind) && (type === "all" || i.kind === type),
      )
      .filter((i) => {
        const text = [
          i.copy.title[locale],
          i.copy.summary[locale],
          i.copy.body[locale],
          i.copy.story[locale],
          ...(i.blocks ?? []).map((b) => b.text?.[locale] ?? b.caption?.[locale] ?? ""),
        ]
          .join(" ")
          .normalize("NFKC")
          .toLocaleLowerCase();
        return terms.every((t) => text.includes(t));
      }),
    filters,
    items,
  );
}
