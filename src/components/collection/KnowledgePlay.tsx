import { useState, useEffect, useRef } from "react";
import { cardsByPool } from "@/data/mock";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import type { CollectionMe, CollectionCatalogue } from "@/lib/collection-store";
import { playQuestions, quizStart, quizAnswer, type QuizRound } from "@/lib/play-questions.mjs";
import { SavePlayResult } from "./PlayRecords";
import { hasPendingDiscovery } from "@/lib/discovery-store";
import { usePlayRoundLifecycle } from "@/lib/play-round-lifecycle";
import { RoundStartControl } from "./RoundStartControl";
export function KnowledgePlay({
  me,
  catalogue,
  mode = "knowledge",
}: {
  me: CollectionMe;
  catalogue: CollectionCatalogue;
  mode?: "knowledge" | "observation";
}) {
  const t = useDiscoveryText(),
    { locale } = useLocale(),
    [difficulty, setDifficulty] = useState("easy"),
    [round, setRound] = useState<QuizRound | null>(null),
    [error, setError] = useState(""),
    [hint, setHint] = useState(false),
    [pool, setPool] = useState("all"),
    [roundCards, setRoundCards] = useState(me.cards.slice(0, 120)),
    [feedback, setFeedback] = useState<number | null>(null);
  const candidates = me.cards.filter((c) => pool === "all" || c.poolId === pool).slice(0, 120);
  const questions = playQuestions({ ...me, cards: candidates }, catalogue, mode).filter(
      (q) =>
        mode === "knowledge" || Boolean(cardsByPool(q.poolId).find((c) => c.id === q.cardId)?.art),
    ),
    q = round?.questions[round.answers.length];
  usePlayRoundLifecycle(me.actorId, mode, !!round && !round.complete);
  const root = useRef<HTMLElement>(null),
    step = round?.answers.length ?? -1,
    paused = round?.paused ?? false,
    complete = round?.complete ?? false;
  useEffect(() => {
    if (step < 0) return;
    root.current
      ?.querySelector<HTMLButtonElement>(
        paused
          ? "[data-play-pause]"
          : feedback !== null
            ? "[data-answer-next]"
            : complete
              ? "[data-play-save] button"
              : "button[data-answer]",
      )
      ?.focus({ preventScroll: true });
  }, [step, paused, complete, feedback]);
  return (
    <section
      ref={root}
      id={"play-" + mode}
      data-knowledge-play={mode === "knowledge" ? true : undefined}
      data-observation-play={mode === "observation" ? true : undefined}
      className="play-surface panel space-y-4 p-4 motion-reduce:transition-none"
    >
      <h2 className="text-xl font-bold">
        {mode === "knowledge"
          ? t("卡冊知識玩法", "Album knowledge play")
          : t("收藏觀察玩法", "Collection observation play")}
      </h2>
      <p>
        {t(
          "題目只依本人合法持卡與目前公開定義的系列關聯、稀有度；不編造訪談答案。每題保留來源與版本。",
          "Questions use your eligible held designs and current public definitions for series relations and rarity, without inventing interview answers. Every question retains its source and version.",
        )}
      </p>
      {mode === "knowledge" && (
        <label className="block">
          {t("題組系列", "Question series")}{" "}
          <select
            aria-label="Knowledge series"
            className="rounded border bg-background p-2"
            value={pool}
            disabled={!!round && !round.complete}
            onChange={(e) => setPool(e.target.value)}
          >
            <option value="all">{t("目前合法系列", "Eligible series")}</option>
            {catalogue.pools
              .filter((p) => me.cards.some((c) => c.poolId === p.poolId))
              .map((p) => (
                <option key={p.poolId} value={p.poolId}>
                  {p.title[locale]}
                </option>
              ))}
          </select>
        </label>
      )}
      <label>
        {t("難度", "Difficulty")}{" "}
        <select
          aria-label={mode === "knowledge" ? "Knowledge difficulty" : "Observation difficulty"}
          value={difficulty}
          className="rounded border bg-background p-2"
          disabled={!!round && !round.complete}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          {[
            ["easy", "入門2題", "Easy: 2"],
            ["standard", "標準4題", "Standard: 4"],
            ["hard", "進階6題", "Hard: 6"],
          ].map(([id, zh, en]) => (
            <option key={id} value={id}>
              {t(zh!, en!)}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-3">
        <RoundStartControl
          active={!!round && !round.complete}
          label={
            mode === "knowledge"
              ? t("開始／重新洗題", "Start / reshuffle questions")
              : t("開始／重新觀察", "Start / reshuffle observations")
          }
          onStart={() => {
            if (hasPendingDiscovery("/play/commands")) {
              setError(
                t(
                  "請先確認原遊玩操作，保留目前結果後再重玩。",
                  "Confirm the original play operation before replaying; the current result is retained.",
                ),
              );
              return;
            }
            try {
              setRound(
                quizStart(
                  questions,
                  difficulty,
                  crypto.getRandomValues(new Uint32Array(1))[0] || 1,
                ),
              );
              setError("");
              setHint(false);
              setFeedback(null);
              setRoundCards(candidates);
            } catch {
              setRound(null);
              setError(
                t(
                  "已核對的合法題目不足，請選較低難度或探索目前公開系列；不補造題目。",
                  "Not enough verified questions. Choose a lower difficulty or explore currently public series; questions are not invented.",
                ),
              );
            }
          }}
        />
        {round && !round.complete && (
          <Button
            data-play-pause
            variant="outline"
            onClick={() => setRound({ ...round, paused: !round.paused })}
          >
            {round.paused ? t("繼續答題", "Resume questions") : t("暫停答題", "Pause questions")}
          </Button>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      {round?.paused ? (
        <p role="status">{t("已暫停，題目已遮蔽。", "Paused; question concealed.")}</p>
      ) : (
        feedback === null &&
        q && (
          <article
            className="space-y-3"
            data-play-question
            data-play-question-step={round?.answers.length ?? 0}
          >
            <p role="status">
              {t("目前題目", "Current question")}: {(round?.answers.length ?? 0) + 1}/
              {round?.questions.length}
            </p>
            {mode === "observation" && (
              <figure
                className="max-w-xs rounded-xl border border-primary p-3"
                data-observation-material
              >
                <img
                  src={cardsByPool(q.poolId).find((c) => c.id === q.cardId)?.art}
                  alt={t(
                    "目前合法已持卡的觀察素材",
                    "Observation material from a currently eligible held card",
                  )}
                  className="aspect-[3/4] w-full rounded object-cover"
                  loading="lazy"
                  onError={() => {
                    setRound(null);
                    setError(
                      t(
                        "素材讀取失敗，觀察局已中止；重讀合法來源後再開始。",
                        "Material failed to load; observation round ended. Reload eligible sources before starting again.",
                      ),
                    );
                  }}
                />
                <figcaption>
                  <p
                    className="rounded border-2 border-primary p-2 font-bold"
                    data-observation-frame
                  >
                    {t("已核對框架", "Verified frame")}:{" "}
                    {catalogue.cards.find((c) => c.cardId === q.cardId)?.rarity} ·{" "}
                    {t("卡牌版本", "Card version")} {q.cardVersion}
                  </p>
                  {t(
                    "只使用目前合法卡面與已核對的稀有度框架；題目不聲稱照片細節。未知或隱藏卡不預載。",
                    "Only the eligible face and verified rarity frame; questions do not assert photographic details. Unknown or hidden cards are not preloaded.",
                  )}
                </figcaption>
                <Button variant="outline" onClick={() => setHint(!hint)}>
                  {t("查看／收起觀察提示", "Show / hide observation hint")}
                </Button>
                {hint && (
                  <p>
                    {t(
                      "核對卡冊資料中的稀有度框架；成長等級與卡牌版本是不同欄位。",
                      "Check the rarity frame in album data; growth level and card version are different fields.",
                    )}
                  </p>
                )}
              </figure>
            )}
            <h3 className="font-bold">{q.prompt[locale]}</h3>
            <p>
              {t("來源", "Source")}: {q.source} · v{q.sourceVersion} /{" "}
              {t("卡牌版本", "Card version")} {q.cardVersion}
            </p>
            <Link className="underline" to="/app/cards/$cardId" params={{ cardId: q.cardId }}>
              {t("核對本人合法卡牌資料", "Check your eligible card data")}
            </Link>
            <div className="flex flex-wrap gap-3">
              {q.options.map((o) => (
                <Button
                  key={o.id}
                  data-answer={o.id}
                  variant="outline"
                  onClick={() => {
                    setFeedback(round!.answers.length);
                    setRound(quizAnswer(round!, o.id));
                    setHint(false);
                  }}
                >
                  {o.label[locale]}
                </Button>
              ))}
            </div>
          </article>
        )
      )}
      {feedback !== null && round && !round.paused && (
        <section data-answer-feedback className="rounded border p-3 space-y-3" aria-live="polite">
          <h3 className="font-bold">{t("本題解說", "Answer explanation")}</h3>
          <p>{round.questions[feedback]!.prompt[locale]}</p>
          <p>
            {
              round.questions[feedback]!.options.find((o) => o.id === round.answers[feedback])
                ?.label[locale]
            }{" "}
            → {round.questions[feedback]!.explanation[locale]}
          </p>
          <p>
            {round.questions[feedback]!.source} · v{round.questions[feedback]!.sourceVersion}
          </p>
          <Button data-answer-next onClick={() => setFeedback(null)}>
            {t("繼續／查看完成回顧", "Continue / review completion")}
          </Button>
        </section>
      )}
      {round?.complete && feedback === null && (
        <section data-play-complete>
          <SavePlayResult
            key={round.seed}
            actor={me.actorId}
            proof={{
              mode,
              difficulty: round.difficulty,
              ruleVersion: round.ruleVersion,
              seed: round.seed,
              visibilityKey: me.visibilityKey,
              cardIds: roundCards.map((c) => c.cardId),
              cardVersions: roundCards.map((c) => c.cardVersion),
              events: round.answers,
            }}
          />
          <h3 className="font-bold">
            {t("答題完成（無獎勵）", "Questions complete (no rewards)")}
          </h3>
          <p>
            {round.answers.filter((a, i) => a === round.questions[i]?.answer).length}/
            {round.questions.length}
          </p>
          <ol className="space-y-3">
            {round.questions.map((question, i) => (
              <li key={question.id}>
                <p>{question.prompt[locale]}</p>
                <p>
                  {question.options.find((o) => o.id === round.answers[i])?.label[locale]} →{" "}
                  {question.explanation[locale]}
                </p>
                <p>
                  {question.source} · v{question.sourceVersion}
                </p>
              </li>
            ))}
          </ol>
          {mode === "knowledge" &&
            round.questions.some((question, i) => question.answer !== round.answers[i]) && (
              <Button
                variant="outline"
                data-wrong-practice
                onClick={() => {
                  if (hasPendingDiscovery("/play/commands")) {
                    setError(
                      t("請先確認原遊玩操作。", "Confirm the original play operation first."),
                    );
                    return;
                  }
                  const ids = new Set(
                    round.questions
                      .filter((question, i) => question.answer !== round.answers[i])
                      .map((question) => question.cardId),
                  );
                  const cards = roundCards.filter((c) => ids.has(c.cardId));
                  try {
                    setRound(
                      quizStart(
                        playQuestions({ ...me, cards }, catalogue, mode),
                        "easy",
                        crypto.getRandomValues(new Uint32Array(1))[0] || 1,
                      ),
                    );
                    setRoundCards(cards);
                    setFeedback(null);
                    setHint(false);
                    setError("");
                  } catch {
                    setError(
                      t(
                        "錯題卡牌的已核對題目不足，請核對來源後重玩；不補造題目。",
                        "Not enough verified questions for the missed cards. Check sources before replaying; no questions are invented.",
                      ),
                    );
                  }
                }}
              >
                {t("以錯題卡牌再練習", "Practice with missed cards")}
              </Button>
            )}
        </section>
      )}
    </section>
  );
}
