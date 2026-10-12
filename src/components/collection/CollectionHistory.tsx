import { useEffect, useState } from "react";
import type { CollectionMe, CollectionCard } from "@/lib/collection-store";
import { localApi, localSessionGeneration } from "@/lib/local-test-client";
import { isCollectionProjection } from "@/lib/collection-contract.mjs";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
type History = {
  sources: string[];
  actorId: string;
  visibilityKey: string;
  page: number;
  pageSize: 20;
  totalPages: number;
  total: number;
  rows: {
    eventId: string;
    at: string;
    source: string;
    quantity: number;
    card: CollectionCard;
    currentCount: number;
  }[];
};
export function CollectionHistory({ me }: { me: CollectionMe }) {
  const t = useDiscoveryText(),
    { locale } = useLocale(),
    [page, setPage] = useState(1),
    [start, setStart] = useState(""),
    [end, setEnd] = useState(""),
    [source, setSource] = useState(""),
    [retry, setRetry] = useState(0),
    [snapshot, setSnapshot] = useState<{ scope: string; value: History } | null>(null),
    [error, setError] = useState("");
  const scope = JSON.stringify([
    me.actorId,
    me.visibilityKey,
    localSessionGeneration(),
    page,
    start,
    end,
    source,
  ]);
  useEffect(() => {
    const c = new AbortController();
    setSnapshot(null);
    setError("");
    const params = new URLSearchParams({
      page: String(page),
      source,
      start: start ? start + "T00:00:00+08:00" : "",
      end: end ? end + "T00:00:00+08:00" : "",
    });
    void localApi<History>("/collection/history?" + params, undefined, "GET", undefined, c.signal)
      .then((v) => {
        if (
          !isCollectionProjection(v, "history") ||
          v.actorId !== me.actorId ||
          v.visibilityKey !== me.visibilityKey
        )
          throw Error("History source mismatch");
        if (!c.signal.aborted) setSnapshot({ scope, value: v });
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(String(e));
      });
    return () => c.abort();
  }, [scope, retry, me.actorId, me.visibilityKey, page, start, end, source]);
  const data = snapshot?.scope === scope ? snapshot.value : null;
  return (
    <section id="collection-history" data-collection-history className="panel space-y-4 p-5">
      <h2 className="text-xl font-bold">
        {t("本人合法取得歷史", "Your eligible acquisition history")}
      </h2>
      <p>
        {t(
          "每頁20筆，目前公開且有定義的本人正向取得紀錄；不以目前持有冒充歷史。期間以台北時間起日含、迄日不含；缺少取得紀錄不補造。條件保持私人，不放入公開分享URL。",
          "20 records per page, limited to your positive acquisitions of currently public, defined designs. Current holdings are separate from history. Taipei start date inclusive, end date exclusive; missing acquisitions are not invented. Filters stay private and never enter public share URLs.",
        )}
      </p>
      <div className="flex flex-wrap gap-3">
        <label>
          {t("起日", "Start date")}
          <input
            aria-label="History start"
            type="date"
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          {t("迄日（不含）", "End date (exclusive)")}
          <input
            aria-label="History end"
            type="date"
            value={end}
            onChange={(e) => {
              setEnd(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          {t("來源分類", "Source category")}
          <select
            aria-label="History source"
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("全部合法來源", "All eligible sources")}</option>
            {(data?.sources ?? [...new Set(me.recent.map((e) => e.source))]).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <Button
          variant="outline"
          onClick={() => {
            setStart("");
            setEnd("");
            setSource("");
            setPage(1);
          }}
        >
          {t("清除私人條件", "Clear private filters")}
        </Button>
      </div>
      {error ? (
        <div role="alert">
          <p>
            {t(
              "歷史服務失敗或條件無效，舊結果已清空；請確認期間與服務後重試。",
              "History service failed or filters are invalid; old results are cleared. Check the range and service, then retry.",
            )}
          </p>
          <Button onClick={() => setRetry((v) => v + 1)}>{t("重試歷史", "Retry history")}</Button>
        </div>
      ) : !data ? (
        <p role="status">{t("讀取歷史中…", "Loading history…")}</p>
      ) : (
        <>
          <p>
            {t("合法紀錄數", "Eligible records")}: {data.total} · {data.page}/{data.totalPages}
          </p>
          {!data.rows.length ? (
            <p>
              {t("目前條件沒有合法可見紀錄。", "No eligible visible records under these filters.")}
            </p>
          ) : (
            <ol className="space-y-3">
              {data.rows.map((e) => (
                <li className="break-words rounded border p-3" key={e.eventId}>
                  <time dateTime={e.at}>
                    {new Date(e.at).toLocaleString(locale, { timeZone: "Asia/Taipei" })}
                  </time>{" "}
                  · {e.card.name} · {e.source} · {t("本次取得", "Acquired in this event")}:{" "}
                  {e.quantity} · {t("目前持有", "Currently held")}: {e.currentCount} ·{" "}
                  <Link
                    className="text-primary underline"
                    to="/app/album/$poolId"
                    params={{ poolId: e.card.poolId }}
                  >
                    {t("本人卡冊", "Your album")}
                  </Link>
                </li>
              ))}
            </ol>
          )}
          <div className="flex gap-3">
            <Button
              variant="outline"
              disabled={data.page <= 1}
              onClick={() => setPage(data.page - 1)}
            >
              {t("上一頁", "Previous page")}
            </Button>
            <Button
              variant="outline"
              disabled={data.page >= data.totalPages}
              onClick={() => setPage(data.page + 1)}
            >
              {t("下一頁", "Next page")}
            </Button>
          </div>
        </>
      )}
      <Link className="text-primary underline" to="/app/achievements">
        {t("定位已取得里程碑", "Find earned milestones")}
      </Link>
    </section>
  );
}
