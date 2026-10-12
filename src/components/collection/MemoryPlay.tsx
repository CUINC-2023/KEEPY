import { useState } from "react";
import type { CollectionCard } from "@/lib/collection-store";
import { memoryStart, memoryAction, type MemoryRound } from "@/lib/collection-play.mjs";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { Button } from "@/components/ui/button";
import { cardsByPool } from "@/data/mock";
export function MemoryPlay({ cards }: { cards: CollectionCard[] }) {
  const t = useDiscoveryText(),
    [difficulty, setDifficulty] = useState("easy"),
    [round, setRound] = useState<MemoryRound | null>(null),
    [error, setError] = useState("");
  const start = () => {
    try {
      setRound(
        memoryStart(
          cards.map((c) => c.cardId),
          difficulty,
          crypto.getRandomValues(new Uint32Array(1))[0] || 1,
        ),
      );
      setError("");
    } catch {
      setRound(null);
      setError(
        t(
          "合法持卡不足：入門2、標準4、進階6種不同款式。",
          "Not enough eligible designs: easy 2, standard 4, hard 6.",
        ),
      );
    }
  };
  return (
    <section className="panel space-y-4 p-4" id="play-memory" data-memory-play>
      <h2 className="text-xl font-bold">{t("收藏記憶配對", "Collection memory pairs")}</h2>
      <label>
        {t("難度", "Difficulty")}{" "}
        <select
          aria-label="Memory difficulty"
          className="rounded border bg-background p-2"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          disabled={!!round && !round.complete}
        >
          <option value="easy">{t("入門：2對", "Easy: 2 pairs")}</option>
          <option value="standard">{t("標準：4對", "Standard: 4 pairs")}</option>
          <option value="hard">{t("進階：6對", "Hard: 6 pairs")}</option>
        </select>
      </label>
      <div className="flex flex-wrap gap-3">
        <Button onClick={start}>
          {round ? t("重新洗牌遊玩", "Shuffle and replay") : t("開始記憶玩法", "Start memory play")}
        </Button>
        {round && !round.complete && (
          <Button
            variant="outline"
            onClick={() => setRound(memoryAction(round, { type: "pause" }))}
          >
            {round.paused ? t("繼續配對", "Resume pairs") : t("暫停配對", "Pause pairs")}
          </Button>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      {round && (
        <>
          <p role="status">
            {round.complete
              ? t("配對完成（無獎勵）", "Pairs complete (no rewards)")
              : round.paused
                ? t("已暫停，卡面已遮蔽", "Paused; faces concealed")
                : t("選擇兩張卡，核對相同款式", "Choose two cards and match the same design")}{" "}
            · {t("配對次數", "Pair attempts")}: {round.moves}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-memory-grid>
            {round.deck.map((id, i) => {
              const c = cards.find((v) => v.cardId === id);
              if (!c) return null;
              const face = !round.paused && (round.open.includes(i) || round.matched.includes(i)),
                art = face ? cardsByPool(c.poolId).find((v) => v.id === id)?.art : undefined;
              return (
                <button
                  key={i}
                  type="button"
                  className="min-h-24 rounded-xl border p-3 text-left focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
                  data-memory-index={i}
                  disabled={
                    round.paused ||
                    round.complete ||
                    round.matched.includes(i) ||
                    round.open.length === 2
                  }
                  aria-label={
                    face ? c.name : t("翻開第" + (i + 1) + "張", "Reveal card " + (i + 1))
                  }
                  onClick={() => setRound(memoryAction(round, { type: "flip", index: i }))}
                >
                  {face ? (
                    <>
                      {art && (
                        <img
                          src={art}
                          alt={c.name}
                          className="aspect-[3/4] w-full rounded object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.hidden = true;
                          }}
                        />
                      )}
                      <span>{c.name}</span>
                    </>
                  ) : (
                    <span>{t("待翻閱", "Face down")}</span>
                  )}
                </button>
              );
            })}
          </div>
          {round.open.length === 2 && !round.paused && (
            <Button onClick={() => setRound(memoryAction(round, { type: "continue" }))}>
              {t("繼續下一對", "Continue with the next pair")}
            </Button>
          )}
          <p className="text-sm text-muted-foreground">
            {t(
              "本輪僅在本人頁面記憶；換帳號、登出或來源失效會中止。不是取得或成就事件。",
              "This round stays in your page memory; account switch, sign-out or source invalidation ends it. Not an acquisition or achievement event.",
            )}
          </p>
        </>
      )}
    </section>
  );
}
