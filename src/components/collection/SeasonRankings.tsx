import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { localApi } from "@/lib/local-test-client";
import { useCollection } from "@/lib/collection-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { RankingNavigation } from "./RankingNavigation";
import type { RankingResult } from "./PublicRankings";
type Season = {
  id: string;
  title: { "zh-TW": string; en: string };
  startAt: string;
  endAt: string;
  state: string;
};
type Result = RankingResult & {
  seasons: Season[];
  season: Season | null;
  denominator: number;
  denominatorVersion: string;
  scoringVersion: string;
};
export function SeasonRankings() {
  const t = useDiscoveryText(),
    collection = useCollection(),
    { locale } = useLocale();
  const [snapshot, setData] = useState<Result | null>(null),
    [error, setError] = useState(""),
    [selected, setSelected] = useState(""),
    [group, setGroup] = useState("current"),
    [page, setPage] = useState(1),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setData(null);
    setError("");
    localApi<Result>(
      "/collection/rankings/seasons?season=" +
        encodeURIComponent(selected) +
        "&page=" +
        page +
        "&group=" +
        group,
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
  }, [selected, page, group, retry, collection.catalogue?.visibilityKey]);
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
  const mine = data?.rows.find((r) => r.handle === collection.me?.profile.handle);
  const periods = data?.seasons.filter((s) => s.state === group) ?? [];
  const date = (v: string) =>
    new Date(v).toLocaleString(locale, { timeZone: "Asia/Taipei", hour12: false });
  return (
    <section id="ranking-season" data-season-rankings className="panel space-y-4 p-4">
      <RankingNavigation />
      <h2 className="text-xl font-bold">
        {t("賽季排行 · 本機預覽", "Season rankings · Local preview")}
      </h2>
      <p>
        {t(
          "正式賽季與結算規則待核定。此預覽沿當前公開系列期間，只計期間內有TEST抽卡／合成操作來源的正向取得，不使用累計收藏；不封榜、不發獎。不可見歷史系列不提供內容或成績。",
          "Formal seasons and settlement remain unapproved. This preview uses current public series periods and only operation-backed TEST draw/synthesis acquisitions within the period, not lifetime holdings. No finalization or rewards. Unavailable historical series expose neither content nor scores.",
        )}
      </p>
      <label>
        {t("期間分流", "Period group")}{" "}
        <select
          aria-label="Season group"
          value={group}
          onChange={(e) => {
            setGroup(e.target.value);
            setSelected("");
            setPage(1);
          }}
        >
          <option value="current">{t("目前", "Current")}</option>
          <option value="historical">{t("歷史", "Historical")}</option>
        </select>
      </label>
      <label className="block">
        {t("公開系列期間", "Public series period")}{" "}
        <select
          aria-label="Season selection"
          value={selected || data?.season?.id || ""}
          onChange={(e) => {
            setSelected(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{t("選擇公開期間", "Choose public period")}</option>
          {periods.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title[locale]}
            </option>
          ))}
        </select>
      </label>
      {error ? (
        <div role="alert">
          <p>{t("預覽服務無法讀取。", "Preview service unavailable.")}</p>
          <Button onClick={() => setRetry((n) => n + 1)}>{t("重試", "Retry")}</Button>
        </div>
      ) : !data ? (
        <p role="status">{t("載入中…", "Loading…")}</p>
      ) : !periods.length ? (
        <p>
          {t("此分流沒有目前可公開的期間資料。", "No currently public period data in this group.")}
        </p>
      ) : data.season && data.season.state === group ? (
        <>
          <p>
            Asia/Taipei · {date(data.season.startAt)} → {date(data.season.endAt)} ·{" "}
            {t("起點含、終點不含", "Start inclusive, end exclusive")}
          </p>
          <p>
            {t("規則版本", "Rule version")} {data.ruleVersion} ·{" "}
            {t("公開不同款式分母", "Public design denominator")} {data.denominator}
          </p>
          <p className="text-sm">
            {data.scoringVersion} ·{" "}
            {t(
              "動態本機預覽，歷史分流不是已結算封榜；公開來源失效後不保留舊成績。",
              "Live local preview; historical periods are not settled rankings. Invalid public sources do not retain old scores.",
            )}
          </p>
          {mine && (
            <Button
              onClick={() =>
                document
                  .getElementById("season-rank-" + mine.handle)
                  ?.scrollIntoView({ block: "center" })
              }
            >
              {t("定位本人", "Locate me")} #{mine.rank}
            </Button>
          )}
          {!data.rows.length ? (
            <p>
              {t("沒有自願公開並同意排行的本機資料。", "No public, opted-in local preview data.")}
            </p>
          ) : (
            <ol>
              {data.rows.map((r) => (
                <li key={r.handle} id={"season-rank-" + r.handle}>
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
      ) : null}
    </section>
  );
}
