import { Link } from "@tanstack/react-router";
import { CardFrame } from "@/components/ui/card-frame";
import { CardDetailLink } from "@/components/card/CardDetailLink";
import { Progress } from "@/components/ui/progress";
import { StatusTag } from "@/components/ui/status-tag";
import { ALBUM_TILE_LABEL, albumTileState, goddessOf, type AlbumCard } from "@/data/player";
import type { Pool } from "@/data/mock";
import { sampleCardById, KEEPY_SAMPLE_POOL_ID } from "@/data/keepy-sample";
import { missingCardDisplay, useAlbumVisibility } from "@/lib/album-visibility";

const TONE: Record<string, "live" | "gold" | "info" | "pending" | "resting"> = {
  new: "gold",
  upgradable: "gold",
  dupe: "info",
  owned: "live",
  missing: "resting",
  "missed-ended": "resting",
  "upcoming-locked": "pending",
};

/** 卡冊卡牌格範本：已取得／新卡／重複卡／可升級／未取得剪影／結束未取得／尚未開放 */
export function AlbumTile({
  card,
  poolStatus,
  poolName,
}: {
  card: AlbumCard;
  poolStatus: Pool["status"];
  poolName: string;
}) {
  const state = albumTileState(card, poolStatus);
  const visibility = useAlbumVisibility();
  const display = missingCardDisplay(visibility, card.poolId, card.grade);
  const specimen = card.poolId === KEEPY_SAMPLE_POOL_ID;
  const label = card.poolId === KEEPY_SAMPLE_POOL_ID ? "範例／非正式上架" : ALBUM_TILE_LABEL[state];

  const face = (
    <div className="relative">
      <CardFrame
        goddess={goddessOf(card)}
        grade={card.grade}
        cardName={card.owned || specimen ? card.name : "未公開卡面"}
        art={!card.owned && display === "silhouette" ? undefined : sampleCardById(card.id)?.art}
        locked={!card.owned}
        missingDisplay={display}
      />
      <span className="absolute left-1.5 top-1.5">
        <StatusTag tone={TONE[state] ?? "info"} label={label} />
      </span>
    </div>
  );

  return (
    <div>
      {card.owned ? (
        <Link to="/app/cards/$cardId" params={{ cardId: card.id }}>
          {face}
        </Link>
      ) : specimen ? (
        display === "silhouette" ? <>{face}<p className="mt-1 text-xs text-muted-foreground">卡面已隱藏 · Local Mock</p></> : <Link to="/cards/$cardId" params={{ cardId: card.id }}>{face}</Link>
      ) : (
        face
      )}
      {card.owned && <CardDetailLink name={card.name} grade={card.grade} />}
      <div className="mt-1.5 space-y-1">
        {card.owned ? (
          <>
            <p className="text-[11px] text-muted-foreground">
              持有 {card.dupes + 1} 張{card.growthPct >= 100 ? "・可升級" : ""}
              {card.obtainedAt ? `・${card.obtainedAt}` : ""}
            </p>
            <Progress
              value={card.growthPct}
              tone={card.growthPct >= 100 ? "gold" : "violet"}
            />
          </>
        ) : (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {card.poolId === KEEPY_SAMPLE_POOL_ID ? "範例／非正式上架：不可抽卡" : `取得來源：${poolName} 抽卡`}
            {card.poolId === KEEPY_SAMPLE_POOL_ID ? "" : poolStatus === "ended"
              ? "（卡池已結束，不可再抽卡）"
              : poolStatus === "upcoming"
                ? "（開池後開放）"
                : ""}
          </p>
        )}
      </div>
    </div>
  );
}
