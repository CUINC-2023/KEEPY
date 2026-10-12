import { useEffect, useRef, useState } from "react";
import { cardsByPool } from "@/data/mock";
import type { CollectionMe } from "@/lib/collection-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import {
  sequenceStart,
  sequenceAction,
  type SequenceRound,
  type SequenceEvent,
} from "@/lib/collection-extra-play.mjs";
import { Button } from "@/components/ui/button";
import { RoundStartControl } from "./RoundStartControl";
import { SavePlayResult } from "./PlayRecords";
import { usePlayRoundLifecycle } from "@/lib/play-round-lifecycle";
import { hasPendingDiscovery } from "@/lib/discovery-store";
export function SequencePlay({ me }: { me: CollectionMe }) {
  const t = useDiscoveryText(),
    cards = me.cards
      .filter((c) => cardsByPool(c.poolId).find((v) => v.id === c.cardId)?.art)
      .slice(0, 120),
    [difficulty, setDifficulty] = useState("easy"),
    [round, setRound] = useState<SequenceRound | null>(null),
    [error, setError] = useState(""),
    root = useRef<HTMLElement>(null);
  const active = !!round && !round.complete,
    step = round?.events.length ?? -1,
    selector = round?.paused
      ? "[data-sequence-pause]"
      : round?.complete
        ? "[data-play-save] button"
        : round?.showSequence
          ? "[data-sequence-conceal]"
          : "[data-sequence-answer]";
  usePlayRoundLifecycle(me.actorId, "sequence", active);
  useEffect(() => {
    if (step >= 0)
      root.current?.querySelector<HTMLButtonElement>(selector)?.focus({ preventScroll: true });
  }, [step, selector]);
  const act = (event: SequenceEvent) => {
    if (!round) return;
    try {
      setRound(sequenceAction(round, event));
    } catch {
      setRound(null);
      setError(
        t(
          "操作上限已達，本局中止；可以重新開始，不保存不完整結果。",
          "Action limit reached; round ended. Start again; incomplete results are not saved.",
        ),
      );
    }
  };
  const face = (id: string) => {
    const c = cards.find((c) => c.cardId === id);
    return c && cardsByPool(c.poolId).find((v) => v.id === id)?.art;
  };
  return (
    <section
      ref={root}
      id="play-sequence"
      data-sequence-play
      className="play-surface panel space-y-4 p-4 motion-reduce:transition-none"
    >
      <h2 className="text-xl font-bold">{t("順序記憶", "Sequence memory")}</h2>
      <p>
        {t(
          "先閱讀合法卡牌順序，再收起提示依序作答。從一張逐步到2／3／4張；重播最多3次，錯誤不扣資產。不使用定時閃爍，低動態與螢幕閱讀可用。",
          "Read eligible card order, then conceal the prompt and answer in order. Stages grow from one to 2 / 3 / 4 cards, with up to three replays. Mistakes consume no assets. No timed flashes; reduced motion and screen-reader reading are supported.",
        )}
      </p>
      <label>
        {t("難度", "Difficulty")}{" "}
        <select
          aria-label="Sequence difficulty"
          value={difficulty}
          disabled={active}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          {[
            ["easy", "2"],
            ["standard", "3"],
            ["hard", "4"],
          ].map(([id, n]) => (
            <option key={id} value={id}>
              {n}
              {t("張", " cards")}
            </option>
          ))}
        </select>
      </label>
      <RoundStartControl
        active={active}
        label={t("開始／重玩順序記憶", "Start / replay sequence memory")}
        onStart={() => {
          if (hasPendingDiscovery("/play/commands")) {
            setError(t("請先確認原遊玩操作。", "Confirm the original play operation first."));
            return;
          }
          try {
            setRound(
              sequenceStart(
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
                "合法不同卡面不足；降低難度或查看本人收藏，不補造素材。",
                "Not enough eligible distinct faces. Lower difficulty or check your collection; no materials are invented.",
              ),
            );
          }
        }}
      />
      {error && <p role="alert">{error}</p>}
      {round && (
        <>
          <p role="status" aria-live="polite">
            {t("階段", "Stage")} {round.stage}/{round.sequence.length} · {t("作答次數", "Answers")}{" "}
            {round.moves} · {t("錯誤", "Mistakes")} {round.mistakes} · {t("重播", "Replays")}{" "}
            {round.hintsUsed} · {round.ruleVersion}
          </p>
          {active && (
            <Button data-sequence-pause variant="outline" onClick={() => act({ type: "pause" })}>
              {round.paused
                ? t("繼續順序記憶", "Resume sequence memory")
                : t("暫停順序記憶", "Pause sequence memory")}
            </Button>
          )}
          {round.paused ? (
            <p>
              {t("已暫停，序列與答案選項遮蔽。", "Paused; sequence and answer choices concealed.")}
            </p>
          ) : round.complete ? (
            <div data-sequence-complete>
              <h3>{t("順序記憶完成（無獎勵）", "Sequence memory complete (no rewards)")}</h3>
              <SavePlayResult
                actor={me.actorId}
                proof={{
                  mode: "sequence",
                  difficulty: round.difficulty,
                  ruleVersion: round.ruleVersion,
                  seed: round.seed,
                  cardIds: cards.map((c) => c.cardId),
                  cardVersions: cards.map((c) => c.cardVersion),
                  visibilityKey: me.visibilityKey,
                  events: round.events,
                }}
              />
            </div>
          ) : (
            <>
              {round.showSequence ? (
                <div data-sequence-prompt>
                  <ol className="flex flex-wrap gap-2">
                    {round.sequence.slice(0, round.stage).map((id, index) => (
                      <li key={id} data-sequence-id={id} className="w-24">
                        <p>
                          {index + 1}. {cards.find((c) => c.cardId === id)?.name}
                        </p>
                        <img
                          src={face(id)}
                          className="aspect-[3/4] rounded object-cover"
                          alt={t("合法卡面", "Eligible face") + " " + (index + 1)}
                          onError={() => {
                            setRound(null);
                            setError(
                              t("素材失效，本局中止。", "Material unavailable; round ended."),
                            );
                          }}
                        />
                      </li>
                    ))}
                  </ol>
                  <Button data-sequence-conceal onClick={() => act({ type: "conceal" })}>
                    {t("收起序列並開始作答", "Conceal sequence and answer")}
                  </Button>
                </div>
              ) : (
                <div data-sequence-choices className="flex flex-wrap gap-2">
                  {round.sequence.map((id) => (
                    <Button
                      key={id}
                      variant="outline"
                      data-sequence-answer={id}
                      onClick={() => act({ type: "answer", id })}
                    >
                      {cards.find((c) => c.cardId === id)?.name}
                    </Button>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                disabled={round.hintsUsed >= 3}
                onClick={() => act({ type: "replay" })}
              >
                {t("重播目前階段提示", "Replay current stage hint")}
              </Button>
              {round.lastCorrect !== null && (
                <p aria-live="polite">
                  {round.lastCorrect
                    ? t("順序正確，繼續下一張。", "Correct order; continue to the next card.")
                    : t(
                        "順序不符，從目前階段第一張再試。",
                        "Order differs; try again from the first card in this stage.",
                      )}
                </p>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
