import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import type { CollectionMe } from "@/lib/collection-store";
import { ContentPagination } from "@/components/content/ContentPagination";
export function CollectionAlbums({ me }: { me: CollectionMe }) {
  const t = useDiscoveryText(),
    { locale } = useLocale();
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [rarity, setRarity] = useState("all"),
    [sort, setSort] = useState("title"),
    [selected, setSelected] = useState(""),
    [page, setPage] = useState(1),
    [cardPage, setCardPage] = useState(1),
    [positionStatus, setPositionStatus] = useState<"saved" | "cleared" | "unavailable" | null>(
      null,
    );
  const restoredActor = useRef("");
  useEffect(() => {
    if (restoredActor.current === me.actorId) return;
    restoredActor.current = me.actorId;
    try {
      const value = JSON.parse(
        sessionStorage.getItem("keepy-album-position-v1:" + me.actorId) ?? "null",
      );
      if (value?.schema !== 1) return;
      setSelected(me.progress.some((p) => p.poolId === value.poolId) ? value.poolId : "");
    } catch {
      /* An unavailable or invalid preference must not block collection reading. */
    }
  }, [me]);
  const rows = me.progress
    .filter(
      (p) =>
        p.title[locale].toLowerCase().includes(query.toLowerCase()) &&
        (category === "all" || (category === "complete" ? p.complete : !p.complete)) &&
        (rarity === "all" ||
          me.acquiredCards.some((c) => c.poolId === p.poolId && c.rarity === rarity)),
    )
    .sort((a, b) =>
      sort === "progress"
        ? b.pct - a.pct || a.poolId.localeCompare(b.poolId)
        : a.title[locale].localeCompare(b.title[locale]) || a.poolId.localeCompare(b.poolId),
    );
  const detail = me.progress.find((p) => p.poolId === selected);
  const pages = Math.max(1, Math.ceil(rows.length / 6)),
    currentPage = Math.min(page, pages);
  const cards = me.acquiredCards.filter((c) => c.poolId === detail?.poolId);
  const cardPages = Math.max(1, Math.ceil(cards.length / 6)),
    currentCardPage = Math.min(cardPage, cardPages);
  const selectAlbum = (id: string) => {
    setSelected(id);
    setCardPage(1);
  };
  return (
    <section id="collection-albums" data-collection-albums className="panel min-w-0 space-y-4 p-5">
      <h2 className="text-xl font-bold">{t("我的卡冊", "My albums")}</h2>
      <div className="flex flex-wrap gap-3">
        <label>
          {t("搜尋卡冊", "Search albums")}
          <input
            aria-label="Search albums"
            maxLength={200}
            className="block max-w-full border bg-background p-2"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          {t("完成分類", "Completion category")}
          <select
            aria-label="Album category"
            className="block border bg-background p-2"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">{t("全部", "All")}</option>
            <option value="complete">{t("已完成", "Complete")}</option>
            <option value="incomplete">{t("未完成", "Incomplete")}</option>
          </select>
        </label>
        <label>
          {t("曾取得稀有度", "Acquired rarity")}
          <select
            aria-label="Album rarity"
            className="block border bg-background p-2"
            value={rarity}
            onChange={(e) => {
              setRarity(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">{t("全部", "All")}</option>
            {[...new Set(me.acquiredCards.map((c) => c.rarity))].sort().map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label>
          {t("排序", "Sort")}
          <select
            aria-label="Album sort"
            className="block border bg-background p-2"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="title">{t("名稱", "Title")}</option>
            <option value="progress">{t("完成度", "Completion")}</option>
          </select>
        </label>
      </div>
      {detail ? (
        <div data-album-detail className="space-y-3">
          <h3 className="font-bold">{detail.title[locale]}</h3>
          <p>
            {detail.owned}/{detail.total} · {detail.pct}% · v{detail.ruleVersion}{" "}
            {detail.complete && t("已完成卡冊", "Album complete")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("目前持有張數（含重複）", "Currently held copies (including duplicates)")}:{" "}
            {me.cards
              .filter((c) => c.poolId === detail.poolId)
              .reduce((n, c) => n + (c.count ?? 0), 0)}{" "}
            · {t("曾取得不同款式", "Acquired distinct designs")}: {detail.owned}
          </p>
          <ul data-album-designs>
            {cards.slice((currentCardPage - 1) * 6, currentCardPage * 6).map((c) => (
              <li key={c.cardId} className="break-words">
                {c.name} · {t("曾取得不同款式", "Acquired distinct design")} 1 ·{" "}
                {t("目前持有", "Currently held")} {c.count ?? 0} · {c.rarity}
              </li>
            ))}
          </ul>
          <ContentPagination page={currentCardPage} pages={cardPages} onChange={setCardPage} />
          <Link
            className="text-primary underline"
            to="/app/album/$poolId"
            params={{ poolId: detail.poolId }}
          >
            {t("本人卡冊入口", "Your album entry")}
          </Link>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => {
                try {
                  sessionStorage.setItem(
                    "keepy-album-position-v1:" + me.actorId,
                    JSON.stringify({ schema: 1, poolId: detail.poolId }),
                  );
                  setPositionStatus("saved");
                } catch {
                  setPositionStatus("unavailable");
                }
              }}
            >
              {t("記住本頁卡冊", "Remember this album")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                try {
                  sessionStorage.removeItem("keepy-album-position-v1:" + me.actorId);
                  setPositionStatus("cleared");
                } catch {
                  setPositionStatus("unavailable");
                }
              }}
            >
              {t("清除閱讀位置", "Clear reading position")}
            </Button>
          </div>
          <nav
            aria-label={t("其他公開卡冊", "Other public albums")}
            className="flex flex-wrap gap-2"
          >
            {me.progress
              .filter((p) => p.poolId !== detail.poolId)
              .slice(0, 3)
              .map((p) => (
                <Button variant="outline" key={p.poolId} onClick={() => selectAlbum(p.poolId)}>
                  {p.title[locale]}
                </Button>
              ))}
          </nav>
          <Button
            variant="outline"
            onClick={() => {
              const id = selected;
              setSelected("");
              requestAnimationFrame(() => document.getElementById("album-return-" + id)?.focus());
            }}
          >
            {t("返回卡冊列表", "Back to albums")}
          </Button>
        </div>
      ) : (
        <div data-album-list className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            {rows.slice((currentPage - 1) * 6, currentPage * 6).map((p) => (
              <Button
                key={p.poolId}
                id={"album-return-" + p.poolId}
                variant="outline"
                className="h-auto whitespace-normal text-left"
                onClick={() => selectAlbum(p.poolId)}
              >
                {p.title[locale]} · {p.owned}/{p.total} · {p.pct}%{" "}
                {p.complete && t("完成", "Complete")}
              </Button>
            ))}
          </div>
          <ContentPagination page={currentPage} pages={pages} onChange={setPage} />
        </div>
      )}
      {!detail && !rows.length && (
        <p role="status">{t("沒有符合條件的公開卡冊。", "No public albums match.")}</p>
      )}
      {positionStatus && (
        <p role="status">
          {positionStatus === "saved"
            ? t("已記住此分頁閱讀位置", "Reading position saved in this tab")
            : positionStatus === "cleared"
              ? t("已清除閱讀位置", "Reading position cleared")
              : t(
                  "瀏覽器無法保存位置；收藏資料不受影響。",
                  "Browser position could not be saved; collection data is unaffected.",
                )}
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        {t(
          "只計公開不同款式，曾取得與目前持有分開。篩選只保留此頁；記住卡冊只保存本帳號在此瀏覽器分頁的閱讀位置，不跨裝置。失效或不可見卡冊不恢復。",
          "Only public distinct designs count. Acquired and currently held are separate. Filters stay on this page. Remembering an album saves this account's position in this browser tab only, not across devices. Unavailable albums are never restored.",
        )}
      </p>
    </section>
  );
}
