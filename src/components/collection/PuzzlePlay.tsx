import { useEffect, useRef, useState } from "react";
import { cardsByPool } from "@/data/mock";
import type { CollectionMe } from "@/lib/collection-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { puzzleStart, puzzleAction, type PuzzleRound } from "@/lib/collection-extra-play.mjs";
import { Button } from "@/components/ui/button";
import { RoundStartControl } from "./RoundStartControl";
import { SavePlayResult } from "./PlayRecords";
import { usePlayRoundLifecycle } from "@/lib/play-round-lifecycle";
import { hasPendingDiscovery } from "@/lib/discovery-store";
export function PuzzlePlay({ me }: { me: CollectionMe }) {
  const t = useDiscoveryText(),
    cards = me.cards.filter((c) => !!cardsByPool(c.poolId).find((v) => v.id === c.cardId)?.art),
    [cardId, setCardId] = useState(cards[0]?.cardId ?? ""),
    [difficulty, setDifficulty] = useState("easy"),
    [round, setRound] = useState<PuzzleRound | null>(null),
    [selected, setSelected] = useState<number | null>(null),
    [error, setError] = useState("");
  const root = useRef<HTMLElement>(null);
  usePlayRoundLifecycle(me.actorId, "puzzle", !!round && !round.complete);
  const card = cards.find((c) => c.cardId === (round?.cardId ?? cardId)),
    art = card && cardsByPool(card.poolId).find((c) => c.id === card.cardId)?.art;
  const focusTarget = round
    ? round.paused
      ? "[data-puzzle-pause]"
      : round.complete
        ? "[data-play-save] button"
        : "[data-puzzle-index]"
    : "";
  useEffect(() => {
    if (focusTarget)
      root.current?.querySelector<HTMLButtonElement>(focusTarget)?.focus({ preventScroll: true });
  }, [focusTarget, round?.events.length]);
  function act(event: Parameters<typeof puzzleAction>[1]) {
    try {
      if (round) setRound(puzzleAction(round, event));
    } catch {
      setRound(null);
      setSelected(null);
      setError(
        t(
          "已達本局操作上限，拼圖安全中止；可重新開始，不保存不完整結果。",
          "This round reached its action limit and ended safely. Start again; incomplete results are not saved.",
        ),
      );
    }
  }
  return (
    <section
      ref={root}
      id="play-puzzle"
      data-puzzle-play
      className="play-surface panel space-y-4 p-4 motion-reduce:transition-none"
    >
      <h2 className="text-xl font-bold">{t("卡牌拼圖", "Card puzzle")}</h2>
      <p>
        {t(
          "只切分目前合法已持卡。選取兩塊交換位置；2×2／3×3／4×4，最多三次完整卡面提示。沒有消耗、獎勵或正式XP。",
          "Only currently eligible held faces are sliced. Select two pieces to swap; 2×2 / 3×3 / 4×4, with up to three full-face hints. No consumption, rewards or official XP.",
        )}
      </p>
      <label>
        {t("合法卡面", "Eligible face")}{" "}
        <select
          aria-label="Puzzle material"
          disabled={!!round && !round.complete}
          value={cardId}
          onChange={(e) => setCardId(e.target.value)}
        >
          {cards.map((c) => (
            <option key={c.cardId} value={c.cardId}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("難度", "Difficulty")}{" "}
        <select
          aria-label="Puzzle difficulty"
          disabled={!!round && !round.complete}
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          {[
            ["easy", "2×2"],
            ["standard", "3×3"],
            ["hard", "4×4"],
          ].map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <RoundStartControl
        active={!!round && !round.complete}
        label={t("開始／重玩拼圖", "Start / replay puzzle")}
        onStart={() => {
          if (hasPendingDiscovery("/play/commands")) {
            setError(t("請先確認原遊玩操作。", "Confirm the original play operation first."));
            return;
          }
          try {
            if (!art) throw Error("No eligible face");
            setRound(
              puzzleStart([cardId], difficulty, crypto.getRandomValues(new Uint32Array(1))[0] || 1),
            );
            setSelected(null);
            setError("");
          } catch {
            setError(
              t(
                "沒有適用合法素材；先查看本人收藏，不使用未知／隱藏卡。",
                "No eligible material. Check your collection first; unknown or hidden cards are not used.",
              ),
            );
            setRound(null);
          }
        }}
      />
      {error && <p role="alert">{error}</p>}
      {round && (
        <>
          <p role="status" aria-live="polite">
            {t("交換次數", "Swaps")}: {round.moves} · {t("提示次數", "Hints")}: {round.hintsUsed} ·{" "}
            {round.ruleVersion}
          </p>
          {!round.complete && (
            <Button
              data-puzzle-pause
              variant="outline"
              onClick={() => {
                setSelected(null);
                act({ type: "pause" });
              }}
            >
              {round.paused ? t("繼續拼圖", "Resume puzzle") : t("暫停拼圖", "Pause puzzle")}
            </Button>
          )}
          {round.paused ? (
            <p>{t("已暫停，卡面切片已遮蔽。", "Paused; face pieces are concealed.")}</p>
          ) : (
            art && (
              <>
                <img
                  src={art}
                  alt={t("目前合法已持卡素材", "Currently eligible held material")}
                  className="hidden"
                  onError={() => {
                    setRound(null);
                    setSelected(null);
                    setError(
                      t(
                        "素材失效，拼圖中止；重新讀取合法來源後再開始。",
                        "Material unavailable; puzzle ended. Reload eligible sources before starting.",
                      ),
                    );
                  }}
                />
                <div
                  data-puzzle-grid
                  className="grid max-w-md gap-1"
                  style={{ gridTemplateColumns: `repeat(${round.size},minmax(0,1fr))` }}
                >
                  {round.tiles.map((piece, index) => (
                    <button
                      key={index}
                      type="button"
                      data-puzzle-index={index}
                      data-puzzle-piece={piece}
                      aria-label={t("拼圖位置", "Puzzle position") + " " + (index + 1)}
                      aria-pressed={selected === index}
                      disabled={round.complete}
                      className="aspect-[3/4] rounded border-2 border-border focus-visible:outline-2 focus-visible:outline-primary motion-reduce:transition-none"
                      style={{
                        backgroundImage: `url(${JSON.stringify(art)})`,
                        backgroundSize: `${round.size * 100}% ${round.size * 100}%`,
                        backgroundPosition: `${((piece % round.size) / (round.size - 1)) * 100}% ${(Math.floor(piece / round.size) / (round.size - 1)) * 100}%`,
                        boxShadow:
                          selected === index ? "0 0 0 3px var(--color-primary)" : undefined,
                      }}
                      onClick={() => {
                        if (selected === null) setSelected(index);
                        else {
                          act({ type: "swap", from: selected, to: index });
                          setSelected(null);
                        }
                      }}
                    />
                  ))}
                </div>
                {!round.complete && (
                  <Button
                    variant="outline"
                    disabled={!round.showHint && round.hintsUsed >= 3}
                    data-puzzle-hint
                    onClick={() => act({ type: round.showHint ? "hide-hint" : "hint" })}
                  >
                    {t("查看／收起合法卡面提示", "Show / hide eligible face hint")}
                  </Button>
                )}
                {round.showHint && (
                  <img
                    data-puzzle-full-hint
                    src={art}
                    className="max-w-48 rounded"
                    alt={t("本人合法卡面的完整提示", "Full-face hint from your eligible held card")}
                  />
                )}
              </>
            )
          )}
          {round.complete && card && (
            <div data-puzzle-complete>
              <h3>{t("拼圖完成（無獎勵）", "Puzzle complete (no rewards)")}</h3>
              <SavePlayResult
                actor={me.actorId}
                proof={{
                  mode: "puzzle",
                  difficulty: round.difficulty,
                  ruleVersion: round.ruleVersion,
                  seed: round.seed,
                  cardIds: [round.cardId],
                  cardVersions: [card.cardVersion],
                  visibilityKey: me.visibilityKey,
                  events: round.events,
                }}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
