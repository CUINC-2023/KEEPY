import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import type { CollectionMe, CollectionCatalogue } from "@/lib/collection-store";
import { playQuestions, quizStart, quizAnswer, type QuizRound } from "@/lib/play-questions.mjs";
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
    [error, setError] = useState("");
  const questions = playQuestions(me, catalogue, mode),
    q = round?.questions[round.answers.length];
  return (
    <section id={"play-" + mode} data-knowledge-play className="panel space-y-4 p-4">
      <h2 className="text-xl font-bold">{t("卡冊知識玩法", "Album knowledge play")}</h2>
      <p>
        {t(
          "題目只依本人合法持卡與目前公開定義的系列關聯、稀有度；不編造訪談答案。每題保留來源與版本。",
          "Questions use your eligible held designs and current public definitions for series relations and rarity, without inventing interview answers. Every question retains its source and version.",
        )}
      </p>
      <label>
        {t("難度", "Difficulty")}{" "}
        <select
          aria-label="Knowledge difficulty"
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
        <Button
          onClick={() => {
            try {
              setRound(
                quizStart(
                  questions,
                  difficulty,
                  crypto.getRandomValues(new Uint32Array(1))[0] || 1,
                ),
              );
              setError("");
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
        >
          {t("開始／重新洗題", "Start / reshuffle questions")}
        </Button>
        {round && !round.complete && (
          <Button variant="outline" onClick={() => setRound({ ...round, paused: !round.paused })}>
            {round.paused ? t("繼續答題", "Resume questions") : t("暫停答題", "Pause questions")}
          </Button>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      {round?.paused ? (
        <p role="status">{t("已暫停，題目已遮蔽。", "Paused; question concealed.")}</p>
      ) : (
        q && (
          <article className="space-y-3" data-play-question>
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
                  onClick={() => setRound(quizAnswer(round!, o.id))}
                >
                  {o.label[locale]}
                </Button>
              ))}
            </div>
          </article>
        )
      )}
      {round?.complete && (
        <section data-play-complete>
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
        </section>
      )}
    </section>
  );
}
