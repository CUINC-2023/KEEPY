import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ProgressiveDetails } from "@/components/ui/progressive-details";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { localApi, useLocalTest } from "@/lib/local-test-client";
import { SeasonRankings } from "./SeasonRankings";
import { AlbumRankings } from "./AlbumRankings";
import { RankingNavigation } from "./RankingNavigation";
import { isCollectionProjection } from "@/lib/collection-contract.mjs";

export interface RankingResult {
  rows: {
    handle: string;
    displayName: string;
    rank: number;
    completion: number;
    completedSeries: number;
    achievements: number;
  }[];
  page: number;
  pages: number;
  total: number;
  updatedAt: string;
  ruleVersion: number;
  catalogueVersion?: number;
  visibilityKey?: string;
  eligibilityVersion?: string;
}
export function PublicRankings({ summary = false }: { summary?: boolean }) {
  const t = useDiscoveryText(),
    local = useLocalTest();
  const [data, setData] = useState<RankingResult | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [q, setQ] = useState(""),
    [page, setPage] = useState(1);
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError("");
    localApi<RankingResult>(
      "/collection/rankings?q=" + encodeURIComponent(q) + "&page=" + page,
      undefined,
      "GET",
      undefined,
      controller.signal,
    )
      .then((v) => {
        if (
          !isCollectionProjection(v, "ranking") ||
          v.rows.some(
            (r) =>
              !Number.isSafeInteger(r.rank) ||
              r.rank < 1 ||
              !Number.isFinite(r.completion) ||
              r.completion < 0 ||
              r.completion > 100,
          )
        )
          throw new Error("Invalid ranking projection");
        if (!controller.signal.aborted) setData(v);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(String(e));
      });
    return () => controller.abort();
  }, [q, page, retry]);
  useEffect(() => {
    const reload = () => setRetry((n) => n + 1),
      timer = window.setInterval(reload, 30000);
    window.addEventListener("focus", reload);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", reload);
    };
  }, []);
  return (
    <section
      id="ranking-total"
      data-collection-rankings
      className={summary ? "space-y-4" : "space-y-6 p-4 md:p-8"}
    >
      {!summary && (
        <h1 className="text-2xl font-bold">
          {t("公開收藏總排行榜", "Public collection rankings")}
        </h1>
      )}
      {!summary && <RankingNavigation />}
      <p className="text-sm">
        {t(
          "公開收藏完成度、完成系列與已取得成就；同分並列。正式榜只計自願公開資料，不含測試、消費或玩法分數。",
          "Public completion, completed series and earned achievements; ties share ranks. Formal rankings require voluntary public data and exclude test data, spending and game scores.",
        )}
      </p>
      <ProgressiveDetails summary={t("計分與同分規則", "Scoring and tie rules")}>
        <p>
          {t(
            "依公开系列平均完成度、完成系列數與成就排序，同分並列（1、1、3）。僅自願公開且同意排行的正式資料；本機Mock與synthetic全部排除，不以儲值排名。",
            "Ranked by average public series completion, completed series and achievements; ties share positions (1, 1, 3). Only public, opted-in real data qualify. All local Mock and synthetic accounts are excluded. Spending is not ranked.",
          )}
        </p>
      </ProgressiveDetails>
      {!summary && (
        <label className="block">
          {t("查找公開收藏家", "Find public collector")}
          <input
            className="ml-2 rounded border p-2"
            maxLength={200}
            aria-label="Ranking search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </label>
      )}
      {local.enabled && (
        <p>
          {t(
            "本人本機測試身分不具正式榜資格，不顯示虛構名次。",
            "Your local test identity is ineligible for the real ranking; no fictitious position is shown.",
          )}
        </p>
      )}
      {error ? (
        <div role="alert">
          <p>
            {t(
              "排行榜服務無法讀取，這不是空榜。",
              "Ranking service unavailable; this is not an empty ranking.",
            )}
          </p>

          <Button onClick={() => setRetry((n) => n + 1)}>{t("重試", "Retry")}</Button>
        </div>
      ) : !data ? (
        <p role="status">{t("載入中…", "Loading…")}</p>
      ) : (
        <>
          <p>
            {t("更新時間", "Updated at")}: <time dateTime={data.updatedAt}>{data.updatedAt}</time> ·{" "}
            {t("規則版本", "Rule version")} {data.ruleVersion}
          </p>
          <details data-ranking-source>
            <summary className="min-h-11 cursor-pointer py-3">
              {t("資格與來源版本", "Eligibility and source versions")}
            </summary>
            <p>
              {t(
                "公開頁與排行同意必須同时啟用；無效分數或重複識別排除，不產生虛構本人名次。查找不重排全榜名次。",
                "Public page and ranking consent must both be enabled. Invalid scores or duplicate identities are excluded; no fictitious personal positions. Searching preserves global ranks.",
              )}
            </p>
            <p>
              {t("來源", "Source")}: Local Test SQLite · {t("目錄版本", "Catalogue version")}{" "}
              {data.catalogueVersion} · {data.eligibilityVersion}
            </p>
            <p>
              {t(
                "本人本機帳戶無正式資格；候選成長等級不納入計分。",
                "Local test accounts are ineligible for formal rankings; candidate growth levels do not affect scores.",
              )}
            </p>
          </details>
          {!data.rows.length ? (
            <p className="panel p-6">
              {t(
                "尚無符合條件的正式排行資料。本機示意帳號不列入排名。",
                "No qualifying real ranking data. Local synthetic accounts are excluded.",
              )}
            </p>
          ) : (
            <ol>
              {data.rows.map((r) => (
                <li className="panel p-4" key={r.handle}>
                  #{r.rank}{" "}
                  <Link to="/collectors/$collectorId" params={{ collectorId: r.handle }}>
                    {r.displayName}
                  </Link>{" "}
                  · {r.completion}% · {r.completedSeries} · {r.achievements}
                </li>
              ))}
            </ol>
          )}
          {!summary && (
            <nav aria-label="Ranking pages" className="flex gap-3">
              <Button disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}>
                {t("上一頁", "Previous")}
              </Button>
              <span>
                {data.page} / {data.pages}
              </span>
              <Button disabled={data.page >= data.pages} onClick={() => setPage(data.page + 1)}>
                {t("下一頁", "Next")}
              </Button>
            </nav>
          )}
        </>
      )}
      {!summary && <SeasonRankings />}
      {!summary && <AlbumRankings />}
      {summary && <Link to="/leaderboards">{t("查看公開總榜", "View public rankings")}</Link>}
    </section>
  );
}
