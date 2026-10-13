import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useCollection } from "@/lib/collection-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { localApi, localSessionGeneration, useLocalTest } from "@/lib/local-test-client";
import { isPlayProjection } from "@/lib/play-contract.mjs";
import type { PlayPrivate } from "./PlayRecords";
export function PracticeComparison() {
  const d = useCollection(),
    l = useLocalTest(),
    t = useDiscoveryText(),
    me =
      !d.error && !d.meError && d.catalogueValid && l.summary?.user.role === "member" ? d.me : null;
  return (
    <main className="space-y-4 p-4 md:p-8">
      <h1 className="text-2xl font-bold">
        {t("本人練習進步比較", "Your practice progress comparison")}
      </h1>
      <Link to="/app/play" className="text-primary underline">
        {t("返回練習工作台", "Back to practice workbench")}
      </Link>
      <p>
        {t(
          "相同玩法、難度、規則版本、設定與提示使用才並列，不是正式等級或排行榜。使用目前合法来源，期間為台北午夜含起日／不含迄日；未設定則兩側皆所有有效紀錄，不冒稱進步。",
          "Only matching mode, difficulty, rule version, configuration and hint usage are compared, not official levels or rankings. Current eligible sources only. Taipei-midnight periods include the start date and exclude the end date. Unset periods both show all eligible records, without claiming progress.",
        )}
      </p>
      {me ? (
        <Compare
          key={
            me.actorId +
            me.visibilityKey +
            me.cards.map((c) => c.cardId + ":" + c.cardVersion).join(",")
          }
          actor={me.actorId}
          visibilityKey={me.visibilityKey}
        />
      ) : (
        <p role={d.error || d.meError ? "alert" : "status"}>
          {t(
            "需本人本機玩家來源；Staging只前端，舊私人比較已清空。",
            "Your local member source is required. Staging is a front-end preview; old private comparisons cleared.",
          )}
        </p>
      )}
    </main>
  );
}
function Compare({ actor, visibilityKey }: { actor: string; visibilityKey: string }) {
  const t = useDiscoveryText(),
    [dates, setDates] = useState(["", "", "", ""]),
    [retry, setRetry] = useState(0),
    [data, setData] = useState<PlayPrivate[] | null>(null),
    [error, setError] = useState(false);
  useEffect(() => {
    const c = new AbortController(),
      epoch = localSessionGeneration();
    setData(null);
    setError(false);
    void Promise.all(
      [0, 2].map((i) =>
        localApi<PlayPrivate>(
          "/play/me?start=" +
            encodeURIComponent(dates[i] ? dates[i] + "T00:00:00+08:00" : "") +
            "&end=" +
            encodeURIComponent(dates[i + 1] ? dates[i + 1] + "T00:00:00+08:00" : ""),
          undefined,
          "GET",
          undefined,
          c.signal,
        ),
      ),
    )
      .then((v) => {
        if (c.signal.aborted || epoch !== localSessionGeneration()) return;
        if (
          v.some(
            (x) => !isPlayProjection(x) || x.actorId !== actor || x.visibilityKey !== visibilityKey,
          )
        )
          throw Error("Comparison scope mismatch");
        setData(v);
      })
      .catch(() => {
        if (!c.signal.aborted && epoch === localSessionGeneration()) setError(true);
      });
    return () => c.abort();
  }, [actor, visibilityKey, dates, retry]);
  const key = (g: NonNullable<PlayPrivate["analysis"]>["groups"][number]) =>
    JSON.stringify([
      g.mode,
      g.difficulty,
      g.ruleVersion,
      g.configuration,
      g.hintPolicy ?? "legacy",
      g.hintsUsed,
    ]);
  const left = new Map(data?.[0]?.analysis?.groups.map((g) => [key(g), g]) ?? []),
    right = new Map(data?.[1]?.analysis?.groups.map((g) => [key(g), g]) ?? []),
    keys = [...new Set([...left.keys(), ...right.keys()])];
  return (
    <section className="space-y-4" data-practice-comparison>
      <div className="grid gap-3 sm:grid-cols-2">
        {dates.map((v, i) => (
          <label key={i}>
            {
              [
                t("左側起日", "Left start"),
                t("左側迄日（不含）", "Left end (exclusive)"),
                t("右側起日", "Right start"),
                t("右側迄日（不含）", "Right end (exclusive)"),
              ][i]
            }
            <input
              type="date"
              aria-label={"Comparison date " + i}
              className="block rounded border bg-background p-2"
              value={v}
              onChange={(e) => setDates(dates.map((x, n) => (n === i ? e.target.value : x)))}
            />
          </label>
        ))}
      </div>
      {error ? (
        <div role="alert">
          <p>
            {t(
              "比較來源失敗或期間無效，舊結果已清空，不視為零進步。",
              "Comparison source failed or period invalid. Old results cleared, not zero progress.",
            )}
          </p>
          <Button onClick={() => setRetry((n) => n + 1)}>
            {t("重讀比較", "Reload comparison")}
          </Button>
        </div>
      ) : !data ? (
        <p role="status">{t("讀取兩側有效樣本…", "Loading eligible samples for both periods…")}</p>
      ) : (
        <>
          {data.some((v) => v.analysis?.truncated) && (
            <p>
              {t(
                "類型超過100組，摘要有界，不宣稱全部比較。",
                "More than 100 groups; bounded summaries, not a complete comparison.",
              )}
            </p>
          )}
          {keys.length ? (
            <ul className="space-y-3">
              {keys.map((k) => {
                const a = left.get(k),
                  b = right.get(k),
                  g = a ?? b!;
                return (
                  <li key={k} className="panel space-y-2 p-4" data-comparison-group>
                    <h2 className="font-bold break-words">
                      {g.mode} / {g.difficulty} / {g.ruleVersion} / {g.configuration} /{" "}
                      {g.hintPolicy ?? "legacy"} · {t("提示", "Hints")}{" "}
                      {g.hintsUsed ?? t("未記錄", "unrecorded")}
                    </h2>
                    <p>
                      {t("左側樣本／答對／最佳步數", "Left samples / correct / best moves")}:{" "}
                      {a?.rounds ?? 0} · {a ? `${a.correct}/${a.total}` : "—"} ·{" "}
                      {a?.bestMoves ?? "—"}
                    </p>
                    <p>
                      {t("右側樣本／答對／最佳步數", "Right samples / correct / best moves")}:{" "}
                      {b?.rounds ?? 0} · {b ? `${b.correct}/${b.total}` : "—"} ·{" "}
                      {b?.bestMoves ?? "—"}
                    </p>
                    {(!a || !b || a.rounds < 2 || b.rounds < 2) && (
                      <p>
                        {t(
                          "樣本不足，不推定進步趨勢。",
                          "Insufficient samples; no progress trend inferred.",
                        )}
                      </p>
                    )}
                    <Link to="/app/play" hash="play-records" className="underline text-primary">
                      {t("核對原私人紀錄", "Check original private records")}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>
              {t(
                "所選期間沒有有效本人樣本。",
                "No eligible personal samples in the selected periods.",
              )}
            </p>
          )}
        </>
      )}
    </section>
  );
}
