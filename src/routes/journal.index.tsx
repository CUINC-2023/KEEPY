import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useEffect } from "react";
import { normalizeExploreSearch, isExploreQueryAllowed } from "@/lib/explore-search.mjs";
import { usePublicReturnPosition } from "@/lib/public-return-position";
import { ContentPagination } from "@/components/content/ContentPagination";
import { createFileRoute } from "@tanstack/react-router";
import { useDiscovery } from "@/lib/content-store";
import { useLocale } from "@/lib/keepy-i18n-shared";
import {
  DiscoveryEntry,
  DiscoveryStatus,
  DiscoveryNotice,
} from "@/components/content/DiscoveryContent";
export const Route = createFileRoute("/journal/")({
  validateSearch: (raw: Record<string, unknown>) => normalizeExploreSearch(raw),
  head: () => ({ meta: [{ title: "KEEPY · Collection journal · Local Test" }] }),
  component: Journal,
});
function Journal() {
  const data = useDiscovery(),
    t = useDiscoveryText(),
    { locale } = useLocale();
  const params = Route.useSearch(),
    searchStr = useLocation({ select: (location) => location.searchStr }),
    navigate = useNavigate(),
    effective = normalizeExploreSearch(params, data.loaded && !data.error ? data.items : []),
    type = effective.category ?? "all",
    search = effective.q ?? "";
  const change = (next: typeof params) =>
    void navigate({ to: "/journal", search: normalizeExploreSearch(next) });
  const items = data.items.filter(
    (i) =>
      i.kind === "article" &&
      (type === "all" || i.category === type) &&
      (i.copy.title[locale] + i.copy.summary[locale]).toLowerCase().includes(search.toLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(items.length / 20)),
    page = Math.min(pages, effective.page ?? 1);
  useEffect(() => {
    if (!isExploreQueryAllowed(searchStr)) {
      void navigate({ to: "/journal", search: normalizeExploreSearch(params), replace: true });
      return;
    }
    if (
      data.loaded &&
      !data.error &&
      (JSON.stringify(normalizeExploreSearch(params)) !== JSON.stringify(effective) ||
        (effective.page && effective.page !== page))
    )
      void navigate({
        to: "/journal",
        search: { ...effective, page: page === 1 ? undefined : page },
        replace: true,
      });
  }, [data.loaded, data.error, params, searchStr, effective, page, navigate]);
  usePublicReturnPosition(effective.focus, data.loaded && !data.error, JSON.stringify(effective));
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <h1 className="text-3xl font-black">{t("收藏誌", "Collection journal")}</h1>
      <Link to="/explore" className="text-primary underline">
        {t("探索系列、創作者與文章", "Explore series, creators and articles")}
      </Link>
      <DiscoveryNotice />
      <DiscoveryStatus />
      <div className="flex flex-wrap gap-3">
        <label className="min-w-0 flex-1">
          {t("搜尋", "Search")}
          <input
            aria-label="Search journal"
            className="mt-1 w-full rounded-lg border bg-background p-3"
            value={search}
            maxLength={200}
            onChange={(e) =>
              change({ ...effective, q: e.target.value, page: undefined, focus: undefined })
            }
          />
        </label>
        <label>
          {t("分類", "Category")}
          <select
            aria-label="Journal category"
            className="mt-1 block w-full rounded-lg border bg-background p-3"
            value={type}
            onChange={(e) =>
              change({ ...effective, category: e.target.value, page: undefined, focus: undefined })
            }
          >
            {[
              ["all", "全部", "All"],
              ["interview", "創作者訪談", "Interviews"],
              ["behind-scenes", "拍攝花絮", "Behind the scenes"],
              ["design", "卡面設計故事", "Design stories"],
              ["guide", "收藏指南", "Collection guides"],
            ].map(([key, zh, en]) => (
              <option key={key} value={key}>
                {t(zh!, en!)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ContentPagination
        page={page}
        pages={pages}
        onChange={(p) => change({ ...effective, page: p === 1 ? undefined : p, focus: undefined })}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {items.slice((page - 1) * 20, page * 20).map((i) => (
          <DiscoveryEntry
            key={i.id}
            item={i}
            exploreSearch={{ ...effective, returnTo: "journal", focus: i.id }}
          />
        ))}
      </div>
      {data.loaded && !data.error && !items.length && (
        <p role="status">{t("沒有符合條件的已發布文章。", "No matching published articles.")}</p>
      )}
    </div>
  );
}
