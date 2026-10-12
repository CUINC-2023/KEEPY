import { type CardDef, type Pool } from "@/data/mock";
import { missingCardDisplay, type AlbumVisibilityOverrides } from "@/lib/album-visibility";

export const POOL_STATUS_LABEL: Record<Pool["status"], string> = {
  live: "進行中",
  upcoming: "即將開始",
  ended: "已結束",
};

export function coverCardDisplay(
  card: CardDef | undefined,
  owned: boolean,
  visibility: AlbumVisibilityOverrides,
) {
  if (!card) return "silhouette";
  if (owned) return "color";
  return missingCardDisplay(visibility, card.poolId, card.grade);
}
