import { exploreOptions } from "@/lib/explore-search.mjs";
import type { ExploreSearch } from "@/lib/explore-search.mjs";
import type { DiscoveryItem } from "@/lib/content-store";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { useDiscoveryText } from "@/lib/discovery-copy";
export function CombinedExploreFilters({
  items,
  search,
  change,
}: {
  items: DiscoveryItem[];
  search: ExploreSearch;
  change: (v: ExploreSearch) => void;
}) {
  const options = exploreOptions(items),
    { locale } = useLocale(),
    t = useDiscoveryText();
  return (
    <div data-explore-relations className="grid gap-3 sm:grid-cols-3">
      <label>
        {t("文章分類", "Article category")}
        <select
          aria-label="Public article category"
          className="block max-w-full w-full rounded border bg-background p-2"
          value={search.category ?? ""}
          onChange={(e) => change({ ...search, category: e.target.value || undefined })}
        >
          <option value="">{t("全部分類", "All categories")}</option>
          {options.categories.map((c) => (
            <option key={c} value={c}>
              {t(
                {
                  design: "設計故事",
                  guide: "收藏指南",
                  interview: "訪談",
                  "behind-scenes": "花絮",
                }[c] ?? c,
                c,
              )}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("公開創作者", "Public creator")}
        <select
          aria-label="Public creator filter"
          className="block max-w-full w-full rounded border bg-background p-2"
          value={search.creator ?? ""}
          onChange={(e) => change({ ...search, creator: e.target.value || undefined })}
        >
          <option value="">{t("全部創作者", "All creators")}</option>
          {options.creators.map((i) => (
            <option key={i.id} value={i.referenceId}>
              {i.copy.title[locale]}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("公開系列", "Public series")}
        <select
          aria-label="Public series filter"
          className="block max-w-full w-full rounded border bg-background p-2"
          value={search.pool ?? ""}
          onChange={(e) => change({ ...search, pool: e.target.value || undefined })}
        >
          <option value="">{t("全部系列", "All series")}</option>
          {options.pools.map((i) => (
            <option key={i.id} value={i.referenceId}>
              {i.copy.title[locale]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
