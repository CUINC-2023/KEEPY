import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { localApi, localSessionGeneration } from "@/lib/local-test-client";
import { isCollectionProjection } from "@/lib/collection-contract.mjs";
import type { CollectionMe, CollectionCard, CollectionAward } from "@/lib/collection-store";
type Recap = {
  actorId: string;
  visibilityKey: string;
  positiveEvents: number;
  newDistinct: number;
  newDesigns: { card: CollectionCard; firstAt: string }[];
  earned: CollectionAward[];
  seriesRecords: number;
  sources: string[];
  readOnly: true;
  playSummary?: {
    source: string;
    records: number;
    modes: {
      mode: string;
      rounds: number;
      correct: number;
      total: number;
      ruleVersions: string[];
    }[];
    recordTimeOnly: true;
    officialXP: false;
    rewards: false;
    ranking: false;
  } | null;
};
export function CollectionRecap({ me }: { me: CollectionMe }) {
  const t = useDiscoveryText(),
    { locale } = useLocale(),
    [start, setStart] = useState(""),
    [end, setEnd] = useState(""),
    [retry, setRetry] = useState(0),
    [snapshot, setSnapshot] = useState<{ scope: string; data: Recap } | null>(null),
    [error, setError] = useState("");
  const scope = JSON.stringify([
    me.actorId,
    me.visibilityKey,
    localSessionGeneration(),
    start,
    end,
  ]);
  useEffect(() => {
    const c = new AbortController();
    setSnapshot(null);
    setError("");
    const q = new URLSearchParams({
      start: start ? start + "T00:00:00+08:00" : "",
      end: end ? end + "T00:00:00+08:00" : "",
    });
    void localApi<Recap>("/collection/recap?" + q, undefined, "GET", undefined, c.signal)
      .then((data) => {
        if (
          !isCollectionProjection(data, "recap") ||
          data.actorId !== me.actorId ||
          data.visibilityKey !== me.visibilityKey
        )
          throw Error("Recap source mismatch");
        if (!c.signal.aborted) setSnapshot({ scope, data });
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(String(e));
      });
    return () => c.abort();
  }, [scope, retry, me.actorId, me.visibilityKey, start, end]);
  const data = snapshot?.scope === scope ? snapshot.data : null;
  return (
    <section id="collection-recap" data-collection-recap className="panel space-y-4 p-5">
      <h2 className="text-xl font-bold">
        {t("私人期間收藏回顧", "Private period collection recap")}
      </h2>
      <p>
        {t(
          "只讀本人目前可見且有來源的紀錄。新增款式以一生第一次正向取得落在期間計算；重複取得不再增加。里程碑依已取得紀錄時間，不把目前完成度當成當期成績，也不推測正式完成時刻。",
          "Read-only currently visible records with your own sources. New designs require the first positive acquisition to fall within the period; duplicates do not add designs. Milestones use earned-record times, without treating current completion as period results or guessing official completion times.",
        )}
      </p>
      <div className="flex flex-wrap gap-3">
        <label>
          {t("台北起日", "Taipei start date")}
          <input
            aria-label="Recap start"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label>
          {t("台北迄日（不含）", "Taipei end date (exclusive)")}
          <input
            aria-label="Recap end"
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
        <Button
          variant="outline"
          onClick={() => {
            setStart("");
            setEnd("");
          }}
        >
          {t("清除回顧期間", "Clear recap period")}
        </Button>
      </div>
      {error ? (
        <div role="alert">
          <p>
            {t(
              "期間無效或來源服務失敗，舊回顧已清空。",
              "Invalid period or source service failure; old recap is cleared.",
            )}
          </p>
          <Button onClick={() => setRetry((n) => n + 1)}>{t("重試回顧", "Retry recap")}</Button>
        </div>
      ) : !data ? (
        <p role="status">{t("讀取本人回顧中…", "Loading your recap…")}</p>
      ) : (
        <>
          <p data-recap-counts>
            {t("正向取得紀錄", "Positive acquisition records")}: {data.positiveEvents} ·{" "}
            {t("新增合法不同款式", "New eligible distinct designs")}: {data.newDistinct} ·{" "}
            {t("已有系列里程碑紀錄", "Existing series milestone records")}: {data.seriesRecords}
          </p>
          {data.newDistinct === 0 && (
            <p>
              {t(
                "此期間沒有可確認的新增公開款式。",
                "No confirmed new public designs in this period.",
              )}
            </p>
          )}
          <ol className="space-y-2">
            {data.newDesigns.map((v) => (
              <li className="break-words" key={v.card.cardId}>
                {v.card.name} ·{" "}
                <time dateTime={v.firstAt}>
                  {new Date(v.firstAt).toLocaleString(locale, { timeZone: "Asia/Taipei" })}
                </time>
              </li>
            ))}
          </ol>
          <p>
            {t("期間合法來源分類", "Eligible source categories in the period")}:{" "}
            {data.sources.join(" · ") || t("沒有可確認來源。", "No confirmed source.")}
          </p>
          {data.playSummary && (
            <section data-period-play-summary className="space-y-3 rounded-xl border p-4">
              <h3 className="font-bold">
                {t("同期間本人遊玩保存摘要", "Your saved play summaries in the same period")}
              </h3>
              <p>
                {t(
                  "依本機保存時間統計，不代表真正遊玩完成時間、收藏增長、正式XP或獎勵。素材失效紀錄不投影；歷史不足不補造過去卡冊完成度。",
                  "Counts local save timestamps, not actual play completion time, collection growth, official XP or rewards. Unavailable material records are not projected; missing history never invents past album completion.",
                )}
              </p>
              {data.playSummary.records ? (
                <ul>
                  {data.playSummary.modes.map((m) => (
                    <li key={m.mode}>
                      {m.mode} · {m.rounds} · {m.correct}/{m.total} · {m.ruleVersions.join(" / ")}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>
                  {t(
                    "此期間沒有合法本人玩法保存紀錄。",
                    "No eligible saved personal play records in this period.",
                  )}
                </p>
              )}
              <Link className="underline" to="/app/play">
                {t("回到私人遊玩紀錄", "Return to private play records")}
              </Link>
            </section>
          )}
          {data.earned.length > 0 && (
            <ul>
              {data.earned.map((a) => (
                <li key={a.id}>
                  {a.title[locale]} · v{a.ruleVersion} ·{" "}
                  <time dateTime={a.recordedAt}>
                    {new Date(a.recordedAt).toLocaleString(locale, { timeZone: "Asia/Taipei" })}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <p className="text-sm text-muted-foreground">
        {t(
          "最多顯示20款明細，數量由同源全期間計算；缺來源不補造。預設僅本人，回顧不寫入事件、不發獎、不公開私人條件。",
          "Up to 20 design details, with totals computed from the same full-period source. Missing sources are not invented. Private by default; recap writes no events, grants no rewards and publishes no private filters.",
        )}
      </p>
      <Link className="text-primary underline" to="/app/collection" hash="collection-history">
        {t("閱讀本人合法歷史明細", "Read your eligible history details")}
      </Link>
    </section>
  );
}
