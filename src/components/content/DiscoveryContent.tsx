import { ReadingButton } from "./ReadingActions";
import { RelatedReading } from "./RelatedReading";
import { StructuredArticle } from "./StructuredArticle";
import { ExploreBackLink } from "./ExploreBackLink";
import type { ExploreSearch } from "@/lib/explore-search.mjs";
import { ReturnEntrances } from "./PublicExplore";
import { ContentImage } from "./ContentImage";
import { ContentState } from "./ContentState";
import { useCollection } from "@/lib/collection-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { normalizeExploreSearch } from "@/lib/explore-search.mjs";
import { Button } from "@/components/ui/button";
import { CardFrame } from "@/components/ui/card-frame";
import { ALBUM } from "@/data/player";
import { goddessById, cardsByPool } from "@/data/mock";
import { useDemoPlayer } from "@/lib/demo-player-store";
import { useAlbumVisibility, missingCardDisplay } from "@/lib/album-visibility";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { useDiscovery, useLocalHead, type DiscoveryItem } from "@/lib/content-store";
import { followDiscovery, refreshDiscovery, trackDiscovery } from "@/lib/discovery-store";
import { useLocalTest } from "@/lib/local-test-client";

export function DiscoveryNotice() {
  const t = useDiscoveryText();
  return (
    <p className="text-xs text-muted-foreground">
      {t(
        "本機測試 · 所有創作者、文章與素材為示意，不代表真實合作。",
        "Local Test · Creators, articles and assets are samples, not real collaborations.",
      )}
    </p>
  );
}
export function DiscoveryStatus() {
  const data = useDiscovery(),
    t = useDiscoveryText();
  if (data.error)
    return (
      <ContentState kind="error">
        <p>
          {t(
            "內容暫時無法載入，請確認本機測試服務。",
            "Content unavailable. Check the Local Test service.",
          )}
        </p>
        <Button variant="outline" onClick={() => void refreshDiscovery()}>
          {t("重試", "Retry")}
        </Button>
      </ContentState>
    );
  if (!data.loaded)
    return <ContentState kind="loading">{t("載入內容中…", "Loading content…")}</ContentState>;
  if (!data.items.length)
    return (
      <ContentState kind="empty">
        {t(
          "目前沒有有效公開內容，可稍後返回探索。",
          "No content is currently public. You can return to exploration later.",
        )}
      </ContentState>
    );
  return null;
}
function FollowButton({ item }: { item: DiscoveryItem }) {
  const data = useDiscovery(),
    t = useDiscoveryText(),
    local = useLocalTest();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const following = data.me?.follows.includes(item.referenceId) ?? false;
  return (
    <div className="space-y-2">
      <Button
        disabled={busy || !data.me}
        aria-pressed={following}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await followDiscovery(item.referenceId, !following);
          } catch (e) {
            setError(String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy
          ? t("儲存中…", "Saving…")
          : following
            ? t("取消追蹤", "Unfollow")
            : t("追蹤創作者", "Follow creator")}
      </Button>
      {!data.me && (
        <p className="text-xs text-muted-foreground">
          {local.enabled ? (
            t("請重新讀取測試登入資料。", "Reload your test session.")
          ) : (
            <Link to="/local-test" className="text-primary underline">
              {t("選擇測試身分後即可追蹤", "Select a test identity to follow")}
            </Link>
          )}
        </p>
      )}
      {error && (
        <p role="alert" className="break-words text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
export function DiscoveryEntry({
  item,
  detail = false,
  compact = false,
  exploreSearch,
  previewItems,
  onPreviewNavigate,
}: {
  item: DiscoveryItem;
  detail?: boolean;
  compact?: boolean;
  exploreSearch?: ExploreSearch;
  previewItems?: DiscoveryItem[];
  onPreviewNavigate?: (item: DiscoveryItem) => void;
}) {
  const { locale } = useLocale(),
    t = useDiscoveryText(),
    data = useDiscovery();
  const sourceItems = previewItems ?? data.items;
  const location = useLocation();
  const returnSearch = exploreSearch ?? normalizeExploreSearch(location.search);
  const privatePreview = previewItems !== undefined;
  const text = item.copy;
  const Title = detail ? "h1" : compact ? "h3" : "h2";
  return (
    <article
      className={`${compact ? "space-y-1 border-b border-border py-2 last:border-0" : "panel space-y-3 p-5"} min-w-0 focus-visible:outline focus-visible:outline-primary`}
      tabIndex={-1}
      data-content-id={item.id}
    >
      {detail && !privatePreview && item.kind !== "article" && <ExploreBackLink />}
      <p className="text-xs font-bold text-gold">
        {item.kind === "article"
          ? t(
              { interview: "訪談", "behind-scenes": "花絮", design: "設計故事", guide: "收藏指南" }[
                item.category
              ] ?? "收藏誌",
              item.category,
            )
          : item.kind === "creator"
            ? t("精選創作者", "Featured creator")
            : t(
                {
                  permanent: "常駐",
                  seasonal: "當季",
                  upcoming: "即將推出",
                  historical: "歷史系列",
                }[item.category] ?? "系列",
                item.category,
              )}
      </p>
      <Title className={`break-words font-black ${compact ? "text-base" : "text-xl"}`}>
        {text.title[locale]}
      </Title>
      <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
        {compact && text.summary[locale].length > 140
          ? text.summary[locale].slice(0, 140) + "…"
          : text.summary[locale]}
      </p>
      {detail &&
        item.materials?.map((m, i) => (
          <figure key={i} className="space-y-2">
            {m.ref === "season-hero" ? (
              <ContentImage alt={m.alt[locale]} />
            ) : (
              <p className="text-sm">{m.alt[locale]}</p>
            )}
            <figcaption className="text-xs text-muted-foreground">
              {t("本機示意素材版本", "Local sample material version")} {m.version}
            </figcaption>
          </figure>
        ))}
      {detail ? (
        <div className="space-y-4">
          {item.blocks && <StructuredArticle item={item} privatePreview={privatePreview} />}
          {item.questions && (
            <section className="space-y-2">
              <h3 className="font-bold">
                {t("訪談題綱（真人回答尚未提供）", "Interview outline (real answers not supplied)")}
              </h3>
              <ol className="list-inside list-decimal space-y-2">
                {item.questions.map((q, i) => (
                  <li key={i}>{q[locale]}</li>
                ))}
              </ol>
            </section>
          )}
          {item.promotion && (
            <section>
              <h3 className="font-bold">{t("上架預告", "Preview announcement")}</h3>
              <p className="whitespace-pre-wrap text-sm">{item.promotion[locale]}</p>
            </section>
          )}
          {item.retrospective && (
            <section>
              <h3 className="font-bold">
                {t("內容回顧（非營運成效）", "Editorial wrap-up (not operational results)")}
              </h3>
              <p className="whitespace-pre-wrap text-sm">{item.retrospective[locale]}</p>
            </section>
          )}
          {!privatePreview && item.kind === "article" && (
            <div className="flex flex-wrap gap-3">
              <Link to="/app/collection" className="text-primary underline">
                {t("查看本人收藏 →", "View your collection →")}
              </Link>
              <Link to="/app/reading" className="text-primary underline">
                {t("查看本人閱讀清單 →", "View your reading list →")}
              </Link>
            </div>
          )}
          {(
            [
              ...(item.blocks ? [] : ["body"]),
              ...(item.kind === "article" && item.blocks ? [] : ["story"]),
              ...(item.kind === "series" ? ["period", "goal", "endPolicy", "teaser"] : []),
            ] as ("body" | "story" | "period" | "goal" | "endPolicy" | "teaser")[]
          ).map((field) => (
            <section key={field} className="space-y-1">
              <h3 className="text-sm font-bold">
                {t(
                  {
                    body: "內容",
                    story: "作品故事",
                    period: "期間",
                    goal: "收藏目標",
                    endPolicy: "結束後政策",
                    teaser: "下一季預告",
                  }[field],
                  {
                    body: "Content",
                    story: "Work story",
                    period: "Schedule",
                    goal: "Collection goal",
                    endPolicy: "After the series",
                    teaser: "Next season",
                  }[field],
                )}
              </h3>
              <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {text[field][locale] || t("尚未提供", "Not provided")}
              </p>
            </section>
          ))}
          {item.kind === "creator" && (
            <>
              {!privatePreview && <FollowButton item={item} />}
              <h3 className="font-bold">{t("官方社群連結", "Official social links")}</h3>
              {text.social[locale] ? (
                text.social[locale]
                  .split("\n")
                  .filter(Boolean)
                  .map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block break-all text-sm text-primary underline"
                    >
                      {url}
                    </a>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("尚未提供已確認的官方連結。", "No confirmed official links provided.")}
                </p>
              )}
            </>
          )}
          {item.kind === "article" && !privatePreview && (
            <>
              <ReadingButton articleId={item.id} />
              <RelatedReading item={item} />
            </>
          )}
          <div className="flex flex-wrap gap-3">
            {item.creatorIds.map((id) => {
              const creator = sourceItems.find((i) => i.kind === "creator" && i.referenceId === id);
              return creator && item.kind !== "creator" ? (
                privatePreview ? (
                  <Button key={id} variant="outline" onClick={() => onPreviewNavigate?.(creator)}>
                    {creator.copy.title[locale]}
                  </Button>
                ) : (
                  <Link
                    key={id}
                    to="/goddesses/$goddessId"
                    search={returnSearch}
                    params={{ goddessId: id }}
                    className="text-sm text-primary underline"
                  >
                    {creator.copy.title[locale]}
                  </Link>
                )
              ) : null;
            })}
          </div>
        </div>
      ) : item.kind === "article" ? (
        <Link
          to="/journal/$articleId"
          params={{ articleId: item.id }}
          search={exploreSearch ?? {}}
          className="inline-block text-sm text-primary underline"
        >
          {t("閱讀故事 →", "Read story →")}
        </Link>
      ) : item.kind === "creator" ? (
        <Link
          to="/goddesses/$goddessId"
          params={{ goddessId: item.referenceId }}
          search={exploreSearch ?? {}}
          className="inline-block text-sm text-primary underline"
        >
          {t("認識創作者 →", "Meet creator →")}
        </Link>
      ) : item.kind === "series" ? (
        <Link
          to="/pools/$poolId"
          params={{ poolId: item.referenceId }}
          search={exploreSearch ?? {}}
          className="inline-block text-sm text-primary underline"
        >
          {t("探索系列 →", "Explore series →")}
        </Link>
      ) : null}
      {detail && (
        <div className="flex flex-wrap gap-3">
          {item.poolIds.map((id) => {
            const series = sourceItems.find((i) => i.kind === "series" && i.referenceId === id);
            return series ? (
              privatePreview ? (
                <Button key={id} variant="outline" onClick={() => onPreviewNavigate?.(series)}>
                  {series.copy.title[locale]} →
                </Button>
              ) : (
                <Link
                  key={id}
                  to="/pools/$poolId"
                  search={returnSearch}
                  params={{ poolId: id }}
                  onClick={() => {
                    if (item.kind === "article")
                      void trackDiscovery("content-to-pool", item.id + ":" + id).catch(() => {});
                  }}
                  className="text-sm text-primary underline"
                >
                  {series.copy.title[locale]} →
                </Link>
              )
            ) : null;
          })}
        </div>
      )}
      {!compact && <DiscoveryNotice />}
    </article>
  );
}
export function DiscoveryHome({
  nextOnly = false,
  compact = false,
  sectionKey,
}: {
  nextOnly?: boolean;
  compact?: boolean;
  sectionKey?: "stories" | "pools" | "cards" | "season-wish";
}) {
  const data = useDiscovery(),
    t = useDiscoveryText();
  const [trackingError, setTrackingError] = useState(false);
  const actorId = data.me?.actorId;
  useEffect(() => {
    if (actorId && !compact)
      void trackDiscovery("visit", "discovery").catch(() => setTrackingError(true));
  }, [actorId, compact]);
  const groups = nextOnly
    ? ([
        [
          t("下一季預告", "Next season"),
          data.items.filter((i) => i.kind === "series" && i.category === "upcoming"),
        ],
      ] as const)
    : ([
        [
          t("當季主題", "This season"),
          data.items.filter(
            (i) => i.kind === "series" && ["seasonal", "permanent"].includes(i.category),
          ),
        ],
        [
          t("精選創作者", "Featured creators"),
          data.items.filter((i) => i.kind === "creator" && i.featured),
        ],
        [
          t("最新內容", "Latest stories"),
          data.items
            .filter((i) => i.kind === "article")
            .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.order - b.order),
        ],
        [
          t("下一季預告", "Next season"),
          data.items.filter((i) => i.kind === "series" && i.category === "upcoming"),
        ],
      ] as const);
  if (compact) {
    const index = { pools: 0, cards: 1, stories: 2, "season-wish": 3 }[sectionKey ?? "stories"];
    const items = groups[index]?.[1] ?? [];
    return (
      <div className="space-y-2" data-discovery="compact">
        {items.slice(0, 2).map((item) => (
          <DiscoveryEntry key={item.id} item={item} compact />
        ))}
        {!items.length && data.loaded && !data.error && (
          <p className="text-xs text-muted-foreground">
            {t("目前沒有有效公開內容", "No content is currently public")}
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-6" data-discovery="home">
      <DiscoveryStatus />
      {!nextOnly && <ReturnEntrances />}
      {(data.meError || trackingError) && (
        <p role="status" className="text-sm text-muted-foreground">
          {t(
            "個人更新或測試事件暂時無法讀取／保存。",
            "Personal updates or test events could not be loaded/saved.",
          )}
        </p>
      )}
      {groups.map(([title, items]) => (
        <section key={title} className="space-y-3">
          <h2 className="text-xl font-black">{title}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {items.length ? (
              items.slice(0, 4).map((i) => <DiscoveryEntry key={i.id} item={i} />)
            ) : data.loaded && !data.error ? (
              <p className="text-sm text-muted-foreground">
                {t("尚無已發布內容", "No published content")}
              </p>
            ) : null}
          </div>
        </section>
      ))}
      <Link to="/explore" className="inline-block text-primary underline">
        {t("搜尋公開內容 →", "Search public content →")}
      </Link>
      <Link to="/journal" className="inline-block text-primary underline">
        {t("閱讀收藏誌 →", "Read the collection journal →")}
      </Link>
    </div>
  );
}
export function DiscoverySeries({ poolId }: { poolId: string }) {
  const data = useDiscovery(),
    t = useDiscoveryText();
  const item = data.items.find((i) => i.kind === "series" && i.referenceId === poolId);
  const { locale } = useLocale();
  useLocalHead(
    (item?.copy.title[locale] ?? t("系列尚未發布", "Series unavailable")) + " — KEEPY · Local Test",
    item?.copy.summary[locale] ?? "Local Test sample content",
  );
  return (
    <div className="space-y-3">
      <DiscoveryStatus />
      {item ? (
        <DiscoveryEntry item={item} detail />
      ) : data.loaded && !data.error ? (
        <p>
          {t(
            "此系列介紹尚未發布或已下架；既有收藏與歷史仍保留。",
            "This series introduction is unpublished or withdrawn; existing cards and history are retained.",
          )}
        </p>
      ) : null}
    </div>
  );
}
export function DiscoveryCreator({ creatorId }: { creatorId: string }) {
  const data = useDiscovery(),
    t = useDiscoveryText(),
    { album } = useDemoPlayer();
  const visibility = useAlbumVisibility();
  const collection = useCollection();
  const item = data.items.find((i) => i.kind === "creator" && i.referenceId === creatorId);
  const { locale } = useLocale();
  useLocalHead(
    (item?.copy.title[locale] ?? t("創作者尚未發布", "Creator unavailable")) +
      " — KEEPY · Local Test",
    item?.copy.summary[locale] ?? "Local Test sample content",
  );
  if (!item)
    return (
      <>
        <DiscoveryStatus />
        {data.loaded && !data.error && (
          <p>
            {t(
              "此創作者介紹尚未發布或已下架。",
              "This creator profile is unpublished or withdrawn.",
            )}
          </p>
        )}
      </>
    );
  const related = data.items.filter(
    (i) => i.kind !== "creator" && i.creatorIds.includes(creatorId),
  );
  // Reuse actual pool/grade visibility; no new art, share or flip route.
  const cards = item.poolIds
    .flatMap((id) => cardsByPool(id))
    .filter(
      (c) =>
        c.goddessId === creatorId && collection.catalogue?.cards.some((x) => x.cardId === c.id),
    );
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <DiscoveryEntry item={item} detail />
      <section className="space-y-3">
        <h2 className="text-xl font-black">
          {t("合作系列與公開花絮", "Series and public behind the scenes")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {related.map((i) => (
            <DiscoveryEntry key={i.id} item={i} />
          ))}
        </div>
        {!related.length && <p>{t("尚無已發布系列或花絮。", "No published series or stories.")}</p>}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-black">{t("作品目錄示意", "Sample work catalogue")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {cards.map((c) => {
            const definition = ALBUM.find((a) => a.id === c.id);
            const owned = album.find((a) => a.id === c.id)?.owned ?? false;
            const display = definition
              ? missingCardDisplay(visibility, definition.poolId, definition.grade)
              : "silhouette";
            return (
              <CardFrame
                key={c.id}
                goddess={goddessById(c.goddessId)}
                grade={c.grade}
                cardName={
                  !owned && display === "silhouette" ? t("未公開卡面", "Hidden card") : c.name
                }
                locked={!owned}
                missingDisplay={display}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
