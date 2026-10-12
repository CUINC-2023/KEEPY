import { useState, useEffect, useRef } from "react";
import type { CollectionCard } from "@/lib/collection-store";
import { memoryStart, memoryAction, type MemoryRound } from "@/lib/collection-play.mjs";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { Button } from "@/components/ui/button";
import { cardsByPool } from "@/data/mock";
import { SavePlayResult } from "./PlayRecords";
import { hasPendingDiscovery } from "@/lib/discovery-store";
import { usePlayRoundLifecycle } from "@/lib/play-round-lifecycle";
import { RoundStartControl } from "./RoundStartControl";
export function MemoryPlay({
  cards,
  actor,
  visibilityKey,
}: {
  cards: CollectionCard[];
  actor: string;
  visibilityKey: string;
}) {
  const t = useDiscoveryText(),
    [difficulty, setDifficulty] = useState("easy"),
    [variant, setVariant] = useState<"classic" | "practice" | "limit">("classic"),
    [allowHints, setAllowHints] = useState(false),
    [round, setRound] = useState<MemoryRound | null>(null),
    [error, setError] = useState("");
  const root = useRef<HTMLElement>(null),
    step = round?.events.length ?? -1,
    paused = round?.paused ?? false,
    complete = round?.complete ?? false;
  useEffect(() => {
    if (step < 0) return;
    const selector = paused
      ? "[data-play-pause]"
      : complete
        ? "[data-play-save] button"
        : round?.open.length === 2
          ? "[data-next-pair]"
          : "[data-memory-index]:not([disabled])";
    root.current?.querySelector<HTMLButtonElement>(selector)?.focus({ preventScroll: true });
  }, [step, paused, complete, round?.open.length]);
  const start = () => {
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
        memoryStart(
          cards.slice(0, 120).map((c) => c.cardId),
          difficulty,
          crypto.getRandomValues(new Uint32Array(1))[0] || 1,
          variant === "classic" ? null : { schema: 1, variant, allowHints },
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
  usePlayRoundLifecycle(actor, "memory", !!round && !round.complete && !round.failed);
  return (
    <section
      ref={root}
      className="play-surface panel space-y-4 p-4"
      id="play-memory"
      data-memory-play
    >
      <h2 className="text-xl font-bold">{t("收藏記憶配對", "Collection memory pairs")}</h2>
      <label>
        {t("難度", "Difficulty")}{" "}
        <select
          aria-label="Memory difficulty"
          className="rounded border bg-background p-2"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          disabled={!!round && !round.complete && !round.failed}
        >
          <option value="easy">{t("入門：2對", "Easy: 2 pairs")}</option>
          <option value="standard">{t("標準：4對", "Standard: 4 pairs")}</option>
          <option value="hard">{t("進階：6對", "Hard: 6 pairs")}</option>
        </select>
      </label>
      <label className="block">
        {t("記憶模式", "Memory mode")}{" "}
        <select
          aria-label="Memory variant"
          className="min-h-11 rounded border bg-background p-2"
          disabled={!!round && !round.complete && !round.failed}
          value={variant}
          onChange={(e) => setVariant(e.target.value as typeof variant)}
        >
          <option value="classic">{t("原規則", "Original rules")}</option>
          <option value="practice">{t("進階練習", "Advanced practice")}</option>
          <option value="limit">{t("本機限步", "Local move limit")}</option>
        </select>
      </label>
      <label className="flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          aria-label="Allow memory hints"
          checked={allowHints}
          disabled={variant === "classic" || (!!round && !round.complete && !round.failed)}
          onChange={(e) => setAllowHints(e.target.checked)}
        />
        {t(
          "允許至多三次合法配對提示（另記使用次數）",
          "Allow up to three eligible-pair hints (usage is recorded separately)",
        )}
      </label>
      {variant !== "classic" && (
        <p className="text-sm">
          {t(
            "local-memory-v2 本機玩法；限步入門4／標準8／進階12次完整配對嘗試，首張翻開不算一步。沒有消耗、獎勵或正式XP，不與原規則最佳混比。",
            "local-memory-v2 local play: move limits are easy 4 / standard 8 / hard 12 complete pair attempts; revealing only the first card is not a move. No consumption, rewards or official XP; not compared against original-rule bests.",
          )}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <RoundStartControl
          active={!!round && !round.complete && !round.failed}
          label={
            round ? t("重新洗牌遊玩", "Shuffle and replay") : t("開始記憶玩法", "Start memory play")
          }
          onStart={start}
        />
        {round && !round.complete && !round.failed && (
          <Button
            data-play-pause
            variant="outline"
            onClick={() => setRound(memoryAction(round, { type: "pause" }))}
          >
            {round.paused ? t("繼續配對", "Resume pairs") : t("暫停配對", "Pause pairs")}
          </Button>
        )}
        {round?.memoryConfig?.allowHints && !round.complete && !round.failed && (
          <Button
            variant="outline"
            disabled={
              round.paused ||
              round.open.length > 0 ||
              ((round.hintsUsed ?? 0) >= 3 && !round.hintIndexes?.length)
            }
            onClick={() =>
              setRound(
                memoryAction(round, { type: round.hintIndexes?.length ? "hide-hint" : "hint" }),
              )
            }
          >
            {round.hintIndexes?.length
              ? t("收起提示", "Hide pair hint")
              : t("提示一對合法卡牌", "Hint an eligible pair")}
          </Button>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      {round?.failed && (
        <p role="alert">
          {t(
            "已達本機限步，這局未完成且沒有保存結果；可重新開始。",
            "Local move limit reached. This round is incomplete and no result is saved; you can restart.",
          )}
        </p>
      )}
      {round && (
        <>
          <p role="status">
            {round.complete
              ? t("配對完成（無獎勵）", "Pairs complete (no rewards)")
              : round.paused
                ? t("已暫停，卡面已遮蔽", "Paused; faces concealed")
                : t("選擇兩張卡，核對相同款式", "Choose two cards and match the same design")}{" "}
            · {t("配對次數", "Pair attempts")}: {round.moves}
            {round.memoryConfig && (
              <>
                {" "}
                · {round.moveLimit ?? "∞"} · {t("提示", "Hints")}: {round.hintsUsed}
              </>
            )}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-memory-grid>
            {round.deck.map((id, i) => {
              const c = cards.find((v) => v.cardId === id);
              if (!c) return null;
              const face =
                  !round.paused &&
                  (round.open.includes(i) ||
                    round.matched.includes(i) ||
                    !!round.hintIndexes?.includes(i)),
                art = face ? cardsByPool(c.poolId).find((v) => v.id === id)?.art : undefined;
              return (
                <button
                  key={i}
                  type="button"
                  className="min-h-24 rounded-xl border p-3 text-left focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
                  data-memory-index={i}
                  disabled={
                    round.failed ||
                    round.paused ||
                    round.complete ||
                    round.matched.includes(i) ||
                    round.open.includes(i) ||
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
          {round.open.length === 2 && !round.paused && !round.failed && (
            <Button
              data-next-pair
              onClick={() => setRound(memoryAction(round, { type: "continue" }))}
            >
              {t("繼續下一對", "Continue with the next pair")}
            </Button>
          )}
          {round.complete && (
            <SavePlayResult
              key={round.seed}
              actor={actor}
              proof={{
                mode: "memory",
                ...(round.memoryConfig ? { memoryConfig: round.memoryConfig } : {}),
                difficulty: round.difficulty,
                ruleVersion: round.ruleVersion,
                seed: round.seed,
                visibilityKey,
                cardIds: round.inputIds,
                cardVersions: round.inputIds.map(
                  (id) => cards.find((c) => c.cardId === id)!.cardVersion,
                ),
                events: round.events,
              }}
            />
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
