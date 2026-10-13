import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useCollection } from "@/lib/collection-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { localApi, localSessionGeneration, useLocalTest } from "@/lib/local-test-client";
import { isMistakesProjection, type MistakesProjection } from "@/lib/play-review.mjs";
export function PracticeMistakes() {
  const d = useCollection(),
    local = useLocalTest(),
    t = useDiscoveryText(),
    me =
      !d.error && !d.meError && d.catalogueValid && local.summary?.user.role === "member"
        ? d.me
        : null;
  return (
    <main className="space-y-4 p-4 md:p-8">
      <h1 className="text-2xl font-bold">{t("本人練習錯題本", "Your practice mistakes")}</h1>
      <Link to="/app/play" className="text-primary underline">
        {t("返回本人練習工作台", "Back to your practice workbench")}
      </Link>
      <p>
        {t(
          "只讀服務端重播保存的逐題來源，核對目前持卡、公開定義與版本。舊摘要無逐題資料，不推造錯題。最多查核近期100局，單題重練不写入資產、XP或正式榜。",
          "Only server-replayed question sources, checked against current holdings, public definitions and versions. Old summaries without question detail never become invented mistakes. Up to 100 recent rounds; single-question practice writes no assets, XP or official ranking.",
        )}
      </p>
      {me ? (
        <Book
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
            "請在本機確認本人玩家身分／服務；Staging只前端，舊私人內容已清空。",
            "Confirm your own member identity / service locally. Staging is a front-end preview; old private content is cleared.",
          )}
        </p>
      )}
    </main>
  );
}
function Book({ actor, visibilityKey }: { actor: string; visibilityKey: string }) {
  const t = useDiscoveryText(),
    [mode, setMode] = useState("all"),
    [page, setPage] = useState(1),
    [retry, setRetry] = useState(0),
    [snapshot, setSnapshot] = useState<MistakesProjection | null>(null),
    [error, setError] = useState(false);
  useEffect(() => {
    const c = new AbortController(),
      epoch = localSessionGeneration();
    setSnapshot(null);
    setError(false);
    void localApi<MistakesProjection>(
      "/play/mistakes?mode=" + mode + "&page=" + page,
      undefined,
      "GET",
      undefined,
      c.signal,
    )
      .then((v) => {
        if (c.signal.aborted || epoch !== localSessionGeneration()) return;
        if (!isMistakesProjection(v) || v.actorId !== actor || v.visibilityKey !== visibilityKey)
          throw Error("Private mistakes mismatch");
        setSnapshot(v);
      })
      .catch(() => {
        if (!c.signal.aborted && epoch === localSessionGeneration()) setError(true);
      });
    return () => c.abort();
  }, [actor, visibilityKey, mode, page, retry]);
  return (
    <section className="space-y-4" data-practice-mistakes>
      <label>
        {t("錯題分類", "Mistake category")}{" "}
        <select
          aria-label="Mistake mode"
          value={mode}
          onChange={(e) => {
            setMode(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">{t("全部", "All")}</option>
          <option value="knowledge">{t("知識", "Knowledge")}</option>
          <option value="observation">{t("觀察", "Observation")}</option>
        </select>
      </label>
      {error ? (
        <div role="alert">
          <p>
            {t(
              "錯題服務失敗，舊資料已清空，不是沒有錯題。",
              "Mistake service failed; old data cleared, not an empty result.",
            )}
          </p>
          <Button onClick={() => setRetry((n) => n + 1)}>
            {t("重讀本人錯題", "Reload your mistakes")}
          </Button>
        </div>
      ) : !snapshot ? (
        <p role="status">{t("讀取本人來源…", "Loading your sources…")}</p>
      ) : (
        <>
          <p>
            {t("近期有效錯題", "Recent eligible mistakes")}: {snapshot.total} ·{" "}
            {t("舊摘要缺逐題資料", "Old summaries without question detail")}:{" "}
            {snapshot.legacyWithoutReview}
          </p>
          {snapshot.historyLimited && (
            <p>
              {t(
                "只覆蓋近期100局，不宣稱完整歷史。",
                "Only the latest 100 rounds, not a complete history.",
              )}
            </p>
          )}
          {snapshot.rows.length ? (
            <ul className="space-y-4">
              {snapshot.rows.map((r) => (
                <li key={r.resultId + ":" + r.question.id}>
                  <PracticeQuestion row={r} />
                </li>
              ))}
            </ul>
          ) : (
            <p>
              {t(
                "沒有目前有效的本人錯題；可先完成并保存一局。",
                "No currently valid mistakes. Complete and save a round first.",
              )}
            </p>
          )}
          <nav className="flex gap-3" aria-label={t("錯題分頁", "Mistakes pagination")}>
            <Button disabled={snapshot.page <= 1} onClick={() => setPage((n) => n - 1)}>
              {t("上一頁", "Previous page")}
            </Button>
            <span>
              {snapshot.page}/{snapshot.pages}
            </span>
            <Button
              disabled={snapshot.page >= snapshot.pages}
              onClick={() => setPage((n) => n + 1)}
            >
              {t("下一頁", "Next page")}
            </Button>
          </nav>
        </>
      )}
    </section>
  );
}
function PracticeQuestion({ row }: { row: MistakesProjection["rows"][number] }) {
  const t = useDiscoveryText(),
    { locale } = useLocale(),
    [answer, setAnswer] = useState<string | null>(null),
    q = row.question;
  const root = useRef<HTMLElement>(null),
    prior = useRef<string | null>(null);
  useEffect(() => {
    if (answer !== null)
      root.current
        ?.querySelector<HTMLElement>("[data-mistake-feedback]")
        ?.focus({ preventScroll: true });
    else if (prior.current !== null)
      root.current
        ?.querySelector<HTMLButtonElement>("[data-mistake-answer]")
        ?.focus({ preventScroll: true });
    prior.current = answer;
  }, [answer]);
  return (
    <article ref={root} className="panel space-y-3 p-4" data-mistake-question>
      <h2 className="text-lg font-bold">{q.prompt[locale]}</h2>
      <p>
        {row.at} · {row.ruleVersion} · {row.difficulty} · v{q.cardVersion}/{q.sourceVersion}
      </p>
      <p>
        {t("原答題", "Original answer")}:{" "}
        {q.options.find((o) => o.id === q.selected)?.label[locale]}
      </p>
      <div className="flex flex-wrap gap-3">
        {q.options.map((o) => (
          <Button
            key={o.id}
            data-mistake-answer={o.id}
            disabled={answer !== null}
            variant="outline"
            onClick={() => setAnswer(o.id)}
          >
            {o.label[locale]}
          </Button>
        ))}
      </div>
      {answer !== null && (
        <div
          role="status"
          tabIndex={-1}
          data-mistake-feedback
          className="focus-visible:outline-2 focus-visible:outline-primary"
        >
          <p>
            {answer === q.answer
              ? t("重練答對", "Correct in practice")
              : t("仍需複習", "Review again")}
          </p>
          <p>{q.explanation[locale]}</p>
          <Button onClick={() => setAnswer(null)}>
            {t("重新練習本題", "Practice this question again")}
          </Button>
        </div>
      )}
      <details>
        <summary className="cursor-pointer">
          {t("定位來源與解答", "Locate source and explanation")}
        </summary>
        <p>{q.explanation[locale]}</p>
        <Link
          to="/app/cards/$cardId"
          params={{ cardId: q.cardId }}
          className="text-primary underline"
        >
          {t("核對本人卡牌", "Check your card")}
        </Link>
      </details>
    </article>
  );
}
