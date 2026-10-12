import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { localApi } from "@/lib/local-test-client";
import { useCollection } from "@/lib/collection-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { RankingNavigation } from "./RankingNavigation";
import type { RankingResult } from "./PublicRankings";
type Pool = { poolId: string; title: { "zh-TW": string; en: string } };
type Result = RankingResult & {
  pool: Pool | null;
  pools: Pool[];
  denominator: number;
  denominatorVersion: string;
  preview: boolean;
};
export function AlbumRankings() {
  const t = useDiscoveryText(),
    { locale } = useLocale(),
    collection = useCollection();
  const [snapshot, setData] = useState<Result | null>(null),
    [pool, setPool] = useState(""),
    [preview, setPreview] = useState(false),
    [page, setPage] = useState(1),
    [retry, setRetry] = useState(0),
    [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    setData(null);
    setError("");
    localApi<Result>(
      "/collection/rankings/albums?pool=" +
        encodeURIComponent(pool) +
        "&mode=" +
        (preview ? "local-preview" : "formal") +
        "&page=" +
        page,
      undefined,
      "GET",
      undefined,
      c.signal,
    )
      .then((v) => {
        if (!c.signal.aborted) setData(v);
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(String(e));
      });
    return () => c.abort();
  }, [pool, preview, page, retry, collection.catalogue?.visibilityKey]);
  useEffect(() => {
    const reload = () => setRetry((n) => n + 1),
      timer = window.setInterval(reload, 30000);
    window.addEventListener("focus", reload);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", reload);
    };
  }, []);
  const data =
    collection.catalogueValid &&
    snapshot?.denominatorVersion === collection.catalogue?.visibilityKey
      ? snapshot
      : null;
  const mine = collection.catalogueValid
    ? data?.rows.find((r) => r.handle === collection.me?.profile.handle)
    : undefined;
  const personal =
    data?.pool && collection.me?.progress.find((p) => p.poolId === data.pool?.poolId);
  const comparable =
    personal && personal.total === data?.denominator && personal.ruleVersion === data?.ruleVersion;
  return (
    <section id="ranking-album" className="panel space-y-4 p-4" data-album-rankings>
      <RankingNavigation />
      <h2 className="text-xl font-bold">{t("卡冊排行榜", "Album rankings")}</h2>
      <p>
        {t(
          "按目前可公開的不同款式完成度排序，同分並列。每次只比較同一卡冊與同一有效分母版本；下架或隱藏後重新計算。正式榜排除所有測試帳號。",
          "Ranked by distinct currently public designs; ties share positions. Each view compares one album and one current denominator version. Withdrawals and hidden designs trigger recalculation. The real ranking excludes all test accounts.",
        )}
      </p>
      <label className="block">
        {t("卡冊", "Album")}{" "}
        <select
          aria-label="Ranking album"
          value={pool || data?.pool?.poolId || ""}
          onChange={(e) => {
            setPool(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{t("選擇公開卡冊", "Choose public album")}</option>
          {data?.pools.map((p) => (
            <option key={p.poolId} value={p.poolId}>
              {p.title[locale]}
            </option>
          ))}
        </select>
      </label>
      <label>
        <input
          aria-label="Local album ranking preview"
          type="checkbox"
          checked={preview}
          onChange={(e) => {
            setPreview(e.target.checked);
            setPage(1);
          }}
        />{" "}
        {t(
          "明示的本機示意預覽（不屬正式榜）",
          "Explicit local synthetic preview (not the real ranking)",
        )}
      </label>
      {error ? (
        <div role="alert">
          <p>{t("卡冊榜服務無法讀取。", "Album ranking unavailable.")}</p>
          <Button onClick={() => setRetry((n) => n + 1)}>{t("重試", "Retry")}</Button>
        </div>
      ) : !data ? (
        <p role="status">{t("載入中…", "Loading…")}</p>
      ) : !data.pool ? (
        <p>{t("沒有目前可公開的卡冊。", "No currently public album.")}</p>
      ) : (
        <>
          <Link to="/pools/$poolId" params={{ poolId: data.pool.poolId }}>
            {data.pool.title[locale]}
          </Link>
          <p>
            {t("有效公開分母", "Current public denominator")}: {data.denominator} · v
            {data.ruleVersion} · {data.denominatorVersion.slice(0, 12)}
          </p>
          <p>
            {t("更新時間", "Updated at")}: {data.updatedAt}
          </p>
          {collection.me && (
            <aside data-album-personal-comparison className="rounded-xl border p-4 space-y-2">
              <h3 className="font-bold">
                {t(
                  "本人私人進度比較（不代表排名）",
                  "Your private progress comparison (not a rank)",
                )}
              </h3>
              {comparable ? (
                <p>
                  {personal.owned} / {personal.total} · {personal.pct}% · v{personal.ruleVersion}
                </p>
              ) : (
                <p>
                  {t(
                    "目前本人來源與公開分母版本不一致；請重新讀取，不混比。",
                    "Your source and public denominator versions differ. Reload before comparing; versions are not mixed.",
                  )}
                </p>
              )}
              <p className="text-sm">
                {!preview
                  ? t(
                      "本機身分不符合正式榜資格。",
                      "Local identities are ineligible for formal rankings.",
                    )
                  : !collection.me.profile.data.isPublic || !collection.me.profile.data.showRanking
                    ? t(
                        "本機預覽也需要啟用公開頁及排行同意；私人進度不自動上榜。",
                        "Local previews also require an enabled public page and ranking consent. Private progress is not automatically ranked.",
                      )
                    : t(
                        "已選公開排行；本人定位僅在當前結果有實際資料時提供。",
                        "Public ranking is selected; personal location is available only for an actual row in the current results.",
                      )}
              </p>
              <Link
                to="/app/collection"
                hash="collection-albums"
                className="text-primary underline"
              >
                {t("返回本人卡冊", "Back to your albums")}
              </Link>
            </aside>
          )}
          {mine && (
            <Button
              onClick={() =>
                document
                  .getElementById("album-rank-" + mine.handle)
                  ?.scrollIntoView({ block: "center" })
              }
            >
              {t("定位本人", "Locate me")} #{mine.rank}
            </Button>
          )}
          {!data.rows.length ? (
            <p>
              {data.preview
                ? t(
                    "沒有自願公開且同意排行的本機預覽資料。",
                    "No public, opted-in local preview data.",
                  )
                : t(
                    "尚無符合條件的正式資料，測試帳號已排除。",
                    "No qualifying real data; test accounts are excluded.",
                  )}
            </p>
          ) : (
            <ol>
              {data.rows.map((r) => (
                <li className="py-2" id={"album-rank-" + r.handle} key={r.handle}>
                  #{r.rank}{" "}
                  <Link to="/collectors/$collectorId" params={{ collectorId: r.handle }}>
                    {r.displayName}
                  </Link>{" "}
                  · {r.completion}%
                </li>
              ))}
            </ol>
          )}
          <nav className="flex gap-3">
            <Button disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}>
              {t("上一頁", "Previous")}
            </Button>
            <span>
              {data.page}/{data.pages}
            </span>
            <Button disabled={data.page >= data.pages} onClick={() => setPage(data.page + 1)}>
              {t("下一頁", "Next")}
            </Button>
          </nav>
        </>
      )}
    </section>
  );
}
