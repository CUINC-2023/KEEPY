import { useEffect } from "react";
import { CombinedExploreFilters } from "./CombinedExploreFilters";
import { ContentPagination } from "./ContentPagination";
import { usePublicReturnPosition } from "@/lib/public-return-position";
import { useNavigate, useSearch, useLocation } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useDiscovery, useLocalHead, publicContentSearch } from "@/lib/content-store";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useCollection } from "@/lib/collection-store";
import { useLocalTest } from "@/lib/local-test-client";
import { refreshDiscoveryMe } from "@/lib/discovery-store";
import { Button } from "@/components/ui/button";
import { normalizeExploreSearch, isExploreQueryAllowed } from "@/lib/explore-search.mjs";
import { DiscoveryEntry, DiscoveryStatus, DiscoveryNotice } from "./DiscoveryContent";
import { DiscoveryPathways } from "./DiscoveryPathways";
export function PublicExplore() {
  const data = useDiscovery(),
    { locale } = useLocale(),
    t = useDiscoveryText();
  const search = useSearch({ from: "/explore" }),
    searchStr = useLocation({ select: (location) => location.searchStr }),
    navigate = useNavigate(),
    query = search.q ?? "",
    type = search.type ?? "all";
  const effective = normalizeExploreSearch(search, data.loaded && !data.error ? data.items : []);
  useEffect(() => {
    if (!isExploreQueryAllowed(searchStr)) {
      void navigate({ to: "/explore", search: normalizeExploreSearch(search), replace: true });
      return;
    }
    if (
      data.loaded &&
      !data.error &&
      JSON.stringify(normalizeExploreSearch(search)) !== JSON.stringify(effective)
    )
      void navigate({ to: "/explore", search: effective, replace: true });
  }, [data.loaded, data.error, search, searchStr, effective, navigate]);
  const setQuery = (q: string) =>
    void navigate({
      to: "/explore",
      search: { ...effective, q, page: undefined, focus: undefined },
    });
  const setType = (type: string) =>
    void navigate({
      to: "/explore",
      search: normalizeExploreSearch({
        ...effective,
        q: query,
        type,
        page: undefined,
        focus: undefined,
      }),
    });
  useLocalHead(
    t("公開探索 — KEEPY", "Public exploration — KEEPY"),
    t(
      "搜尋當前公開的系列、創作者與收藏誌。",
      "Search currently public series, creators and journal articles.",
    ),
  );
  const items =
    data.loaded && !data.error
      ? publicContentSearch(data.items, query, type, locale, effective)
      : [];
  const pages = Math.max(1, Math.ceil(items.length / 20)),
    page = Math.min(pages, effective.page ?? 1);
  useEffect(() => {
    if (!data.loaded || data.error) return;
    if (effective.page && effective.page !== page)
      void navigate({
        to: "/explore",
        search: { ...effective, page: page === 1 ? undefined : page },
        replace: true,
      });
  }, [data.loaded, data.error, effective, page, navigate]);
  usePublicReturnPosition(effective.focus, data.loaded && !data.error, JSON.stringify(effective));
  return (
    <div className="mx-auto max-w-6xl space-y-5" data-public-explore>
      <h1 className="text-3xl font-black">{t("公開探索", "Public exploration")}</h1>
      <DiscoveryNotice />
      <DiscoveryStatus />
      {data.loaded &&
        !data.error &&
        !query &&
        type === "all" &&
        !effective.category &&
        !effective.pool &&
        !effective.creator && <DiscoveryPathways items={data.items} />}
      <div className="flex flex-wrap gap-3">
        <label className="min-w-0 flex-1">
          {t("關鍵字", "Keywords")}
          <input
            type="search"
            aria-label="Search public content"
            maxLength={200}
            className="mt-1 w-full rounded border bg-background p-3"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          {t("內容類型", "Content type")}
          <select
            aria-label="Public content type"
            className="mt-1 block rounded border bg-background p-3"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {[
              ["all", "全部", "All"],
              ["series", "系列", "Series"],
              ["creator", "創作者", "Creators"],
              ["article", "收藏誌", "Journal"],
            ].map(([id, zh, en]) => (
              <option key={id} value={id}>
                {t(zh!, en!)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <CombinedExploreFilters
        items={data.loaded && !data.error ? data.items : []}
        search={effective}
        change={(next) =>
          void navigate({
            to: "/explore",
            search: normalizeExploreSearch(
              { ...next, page: undefined, focus: undefined },
              data.items,
            ),
          })
        }
      />
      <Button
        variant="outline"
        onClick={() => void navigate({ to: "/explore", search: { q: "", type: "all" } })}
      >
        {t("清除搜尋", "Clear search")}
      </Button>
      {data.loaded && !data.error && (
        <p role="status">
          {items.length
            ? t("公開結果：", "Public results: ") + items.length
            : t(
                "沒有符合條件的公開內容，請調整關鍵字或類型。",
                "No matching public content. Try different keywords or a content type.",
              )}
        </p>
      )}
      <ContentPagination
        page={page}
        pages={pages}
        onChange={(p) =>
          void navigate({
            to: "/explore",
            search: { ...effective, page: p === 1 ? undefined : p, focus: undefined },
          })
        }
      />
      <div className="grid gap-3 md:grid-cols-2">
        {items.slice((page - 1) * 20, page * 20).map((i) => (
          <DiscoveryEntry key={i.id} item={i} exploreSearch={{ ...effective, focus: i.id }} />
        ))}
      </div>
      <ReturnEntrances />
    </div>
  );
}
export function ReturnEntrances() {
  const data = useDiscovery(),
    collection = useCollection(),
    local = useLocalTest(),
    { locale } = useLocale(),
    t = useDiscoveryText();
  const series = data.items.filter((i) => i.kind === "series");
  const stories = data.me
    ? data.items.filter(
        (i) => i.kind === "article" && i.creatorIds.some((id) => data.me!.follows.includes(id)),
      )
    : [];
  const incomplete =
    collection.me && collection.me.actorId === data.me?.actorId
      ? collection.me.progress.filter(
          (p) => p.total > 0 && p.owned < p.total && series.some((s) => s.referenceId === p.poolId),
        )
      : [];
  return (
    <section data-return-entrances className="panel space-y-4 p-5">
      <h2 className="text-xl font-bold">
        {t("回到你的收藏旅程", "Return to your collection journey")}
      </h2>
      {!local.enabled || !local.summary ? (
        <p>
          {t(
            "目前顯示公開內容。選擇測試身分後，可查看本人追蹤與收藏進度。",
            "You are viewing public content. Select a test identity to see your follows and collection progress.",
          )}{" "}
          <Link to="/local-test" className="text-primary underline">
            {t("測試登入", "Test sign-in")}
          </Link>
        </p>
      ) : !data.me && !data.meError ? (
        <p role="status">{t("讀取本人更新中…", "Loading your updates…")}</p>
      ) : null}
      {data.meError && (
        <div role="alert">
          <p>{t("本人更新無法載入。", "Your updates could not be loaded.")}</p>
          <Button onClick={() => void refreshDiscoveryMe()}>
            {t("重試本人更新", "Retry your updates")}
          </Button>
        </div>
      )}
      {data.me && (
        <>
          <h3 className="font-semibold">
            {t("追蹤創作者的公開內容", "Public stories from followed creators")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t(
              "顯示原因：你追蹤了文章關聯的創作者，只列當前公開內容。",
              "Why shown: you follow a linked creator; only currently public content is listed.",
            )}
          </p>
          {stories.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {stories.map((i) => (
                <DiscoveryEntry key={i.id} item={i} />
              ))}
            </div>
          ) : (
            <p>
              {t(
                data.me.follows.length ? "追蹤的創作者目前沒有公開文章。" : "尚未追蹤創作者。",
                data.me.follows.length
                  ? "Your followed creators have no public articles at present."
                  : "You have not followed a creator yet.",
              )}
            </p>
          )}
          <h3 className="font-semibold">{t("繼續收藏", "Continue collecting")}</h3>
          <p className="text-sm text-muted-foreground">
            {t(
              "顯示原因：本人曾取得的公開不同款式尚未完成。重複卡不增加百分比。",
              "Why shown: your acquired distinct public designs are incomplete. Duplicates do not raise completion.",
            )}
          </p>
          {incomplete.length ? (
            <div className="flex flex-wrap gap-3">
              {incomplete.map((p) => (
                <Link
                  key={p.poolId}
                  to="/app/album/$poolId"
                  params={{ poolId: p.poolId }}
                  className="text-primary underline"
                >
                  {series.find((s) => s.referenceId === p.poolId)!.copy.title[locale]} · {p.owned}/
                  {p.total}
                </Link>
              ))}
            </div>
          ) : (
            <p>
              {collection.meError || collection.error
                ? t(
                    "本人收藏進度無法讀取，請至收藏頁重試。",
                    "Collection progress is unavailable; retry from your collection page.",
                  )
                : t(
                    "目前沒有可繼續的未完成公開系列，或本人進度尚未讀取。",
                    "There are no incomplete public series to continue, or your progress has not loaded yet.",
                  )}
            </p>
          )}
        </>
      )}
      <div className="flex flex-wrap gap-3">
        <Link to="/pools" className="text-primary underline">
          {t("探索公開系列", "Explore public series")}
        </Link>
        <Link to="/goddesses" className="text-primary underline">
          {t("認識創作者", "Meet creators")}
        </Link>
      </div>
    </section>
  );
}
