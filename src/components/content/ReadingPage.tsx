import { useReadingFilters } from "@/lib/reading-filters";
import { useEffect, useState } from "react";
import { ContentPagination } from "./ContentPagination";
import { ReadingBatch } from "./ReadingBatch";
import { ReadingOrganization, ReadingItemOrganization } from "./ReadingOrganization";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useDiscovery, useLocalHead } from "@/lib/content-store";
import { useReadingList, refreshReading } from "@/lib/discovery-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { Button } from "@/components/ui/button";
import { DiscoveryNotice, DiscoveryStatus } from "./DiscoveryContent";
import { ReadingActions, ReadingRecovery } from "./ReadingActions";
export function ReadingPage() {
  const r = useReadingList(),
    d = useDiscovery(),
    t = useDiscoveryText(),
    { locale } = useLocale(),
    search = useSearch({ from: "/app/reading" }),
    navigate = useNavigate();
  const { actor, group, status, change: changeFilters } = useReadingFilters();
  const context = JSON.stringify([
    actor,
    search.q ?? "",
    search.category ?? "",
    search.readingSort ?? "latest",
    group,
    status,
  ]);
  const [position, setPosition] = useState({ context: "", page: 1 }),
    [selection, setSelection] = useState<{ scope: string; ids: string[] }>({ scope: "", ids: [] });
  useEffect(() => {
    let next = { context, page: 1 };
    try {
      const stored = JSON.parse(
        sessionStorage.getItem("keepy-reading-position-v1:" + actor) ?? "null",
      );
      if (
        stored?.context === context &&
        Number.isSafeInteger(stored.page) &&
        stored.page >= 1 &&
        stored.page <= 10
      )
        next = stored;
    } catch {
      /* optional device-only position */
    }
    setPosition(next);
  }, [actor, context]);
  const rememberPage = (page: number) => {
    const next = { context, page };
    setPosition(next);
    if (!actor) return;
    try {
      sessionStorage.setItem("keepy-reading-position-v1:" + actor, JSON.stringify(next));
    } catch {
      /* optional device-only position */
    }
  };
  useEffect(() => {
    if (r.reading && group !== "all" && group && !r.reading.groups.some((g) => g.id === group))
      changeFilters("all", status);
  }, [r.reading, group, status, changeFilters]);
  useLocalHead(
    t("稍後閱讀 — KEEPY", "Read later — KEEPY"),
    t(
      "本人本機閱讀清單；只顯示目前公開文章。",
      "Your local reading list; currently public articles only.",
    ),
  );
  const change = (next: typeof search) => void navigate({ to: "/app/reading", search: next });
  const ready = d.loaded && !d.error && r.reading && !r.error;
  const rows = ready
    ? r
        .reading!.items.map((row) => ({
          row,
          article: row.available
            ? d.items.find((i) => i.kind === "article" && i.id === row.articleId)
            : undefined,
        }))
        .filter(
          ({ row }) =>
            (group === "all" || row.groupId === group) &&
            (status === "all" || row.state === status),
        )
        .filter(
          ({ article }) =>
            (!search.q && !search.category) ||
            (!!article &&
              (!search.category || article.category === search.category) &&
              [article.copy.title[locale], article.copy.summary[locale]]
                .join(" ")
                .normalize("NFKC")
                .toLocaleLowerCase()
                .includes((search.q ?? "").normalize("NFKC").toLocaleLowerCase())),
        )
        .sort(
          (a, b) =>
            (search.readingSort === "oldest" ? 1 : -1) *
              a.row.savedAt.localeCompare(b.row.savedAt) ||
            a.row.articleId.localeCompare(b.row.articleId),
        )
    : [];
  const pages = Math.max(1, Math.ceil(rows.length / 20)),
    page = Math.min(pages, position.context === context ? position.page : 1),
    pageRows = rows.slice((page - 1) * 20, page * 20);
  const scope = JSON.stringify([context, page, r.reading?.version]),
    selected = selection.scope === scope ? selection.ids : [];
  const select = (ids: string[]) => setSelection({ scope, ids });
  const categories = [
    ...new Set(
      ready
        ? r.reading!.items.flatMap((row) => {
            const article = row.available
              ? d.items.find((i) => i.id === row.articleId && i.kind === "article")
              : undefined;
            return article ? [article.category] : [];
          })
        : [],
    ),
  ];
  return (
    <section data-reading-page className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-3xl font-black">{t("稍後閱讀", "Read later")}</h1>
      <DiscoveryNotice />
      <p className="text-xs text-muted-foreground">
        {t(
          "閱讀篩選與頁碼只保留在此裝置／瀏覽器分頁，依測試帳號隔離；不是跨裝置同步。",
          "Reading filters and page position stay in this device/browser tab, isolated by test account; this is not cross-device synchronization.",
        )}
      </p>
      <p>
        {t(
          "僅本機 SQLite 保存本人文章ID、加入時間、手動待讀狀態、分組與清單版本；不是持卡收藏或真人跨裝置同步，不發放獎勵。",
          "Only article IDs, save times, explicit read state, groups and list version are stored in local SQLite. This is separate from card ownership, real cross-device accounts and rewards.",
        )}
      </p>
      <DiscoveryStatus />
      <ReadingRecovery />
      <ReadingOrganization group={group} status={status} change={changeFilters} />
      {!r.allowed ? (
        <p>
          {t("請選擇有效本機玩家測試身分。", "Select a valid local player test identity.")}{" "}
          <Link to="/local-test" className="text-primary underline">
            {t("測試身分入口", "Test identity entry")}
          </Link>
        </p>
      ) : (
        <>
          {r.error ? (
            <div role="alert">
              <p>
                {t(
                  "本人閱讀清單無法讀取，未顯示舊資料。",
                  "Your reading list is unavailable; old data is cleared.",
                )}
              </p>
              <Button onClick={() => void refreshReading()}>
                {t("重新讀取閱讀清單", "Reload reading list")}
              </Button>
            </div>
          ) : !r.reading ? (
            <p role="status">{t("讀取本人清單中…", "Loading your list…")}</p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <label className="min-w-0 flex-1">
              {t("查找文章", "Find articles")}
              <input
                aria-label="Reading search"
                maxLength={200}
                type="search"
                className="block w-full rounded border bg-background p-2"
                value={search.q ?? ""}
                onChange={(e) => change({ ...search, q: e.target.value })}
              />
            </label>
            <label>
              {t("分類", "Category")}
              <select
                aria-label="Reading category"
                className="block max-w-full rounded border bg-background p-2"
                value={search.category ?? ""}
                onChange={(e) => change({ ...search, category: e.target.value || undefined })}
              >
                <option value="">{t("全部分類", "All categories")}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {t(
                      (
                        {
                          design: "設計故事",
                          guide: "收藏指南",
                          interview: "訪談",
                          "behind-scenes": "花絮",
                        } as Record<string, string>
                      )[c] ?? c,
                      c,
                    )}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("加入時間排序", "Sort by save time")}
              <select
                aria-label="Reading sort"
                className="block rounded border bg-background p-2"
                value={search.readingSort ?? "latest"}
                onChange={(e) =>
                  change({
                    ...search,
                    readingSort: e.target.value === "oldest" ? "oldest" : "latest",
                  })
                }
              >
                <option value="latest">{t("最新加入在前", "Newest saved first")}</option>
                <option value="oldest">{t("最早加入在前", "Oldest saved first")}</option>
              </select>
            </label>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              change({ q: "", type: "all" });
              changeFilters("all", "all");
            }}
          >
            {t("清除閱讀篩選", "Clear reading filters")}
          </Button>
          {ready && (
            <>
              {!rows.length && (
                <p data-reading-empty>
                  {t(
                    r.reading!.items.length
                      ? "沒有符合條件的目前公開文章；清除條件可查看不可用項目。"
                      : "尚未保存文章，可先探索目前公開內容。",
                    r.reading!.items.length
                      ? "No currently public articles match. Clear filters to see unavailable entries."
                      : "No articles saved yet. Explore currently public content.",
                  )}
                </p>
              )}
              <ContentPagination page={page} pages={pages} onChange={rememberPage} />
              <ReadingBatch
                key={r.reading!.actorId}
                ids={selected}
                pageIds={pageRows.map((r) => r.row.articleId)}
                scope={scope}
                version={r.reading!.version}
                groups={r.reading!.groups}
                change={select}
              />
              <ul className="space-y-4">
                {pageRows.map(({ row, article }) => (
                  <li key={row.articleId} data-reading-item className="panel space-y-3 p-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        aria-label={t("選取閱讀項目", "Select reading entry")}
                        checked={selected.includes(row.articleId)}
                        onChange={(e) =>
                          select(
                            e.target.checked
                              ? [...selected, row.articleId]
                              : selected.filter((id) => id !== row.articleId),
                          )
                        }
                      />
                      {t("選取", "Select")}
                    </label>
                    {article ? (
                      <>
                        <Link
                          data-reading-link
                          className="text-primary underline font-bold"
                          to="/journal/$articleId"
                          params={{ articleId: article.id }}
                          search={{ ...search, returnTo: "reading" }}
                        >
                          {article.copy.title[locale]}
                        </Link>
                        <p>{article.copy.summary[locale]}</p>
                        <time dateTime={row.savedAt}>
                          {t("加入時間：", "Saved: ")}
                          {row.savedAt}
                        </time>
                      </>
                    ) : (
                      <p data-reading-unavailable>
                        {t(
                          "目前不可用，可移除此項目。",
                          "Currently unavailable. You can remove this entry.",
                        )}
                      </p>
                    )}
                    <ReadingItemOrganization
                      articleId={row.articleId}
                      state={row.state}
                      groupId={row.groupId}
                      version={r.reading!.version}
                    />
                    <ReadingActions articleId={row.articleId} saved version={r.reading!.version} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
      <Link to="/explore" className="text-primary underline">
        {t("探索公開文章", "Explore public articles")}
      </Link>
    </section>
  );
}
