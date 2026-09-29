// ─────────────────────────────────────────────────────────────
// Phase 6D-1：共用卡牌詳情資料解析（Local Mock）
// 僅整合既有 CARDS / ALBUM / OWNED_CARDS，不新增矛盾卡牌資料。
// ─────────────────────────────────────────────────────────────
import {
  CARDS,
  OWNED_CARDS,
  cardById,
  goddessById,
  gradeIndex,
  poolById,
  type Goddess,
  type Pool,
  type Rarity,
} from "@/data/mock";
import { ALBUM, albumCardById } from "@/data/player";
import { sampleCardById } from "@/data/keepy-sample";

export interface CardDetail {
  id: string;
  name: string;
  /** 卡名副標（女神稱號） */
  subtitle: string;
  grade: Rarity;
  goddess: Goddess;
  pool: Pool;
  /** 卡片編號（系列內序號 Mock） */
  serialNo: string;
  releasedAt: string;
  /** 收藏狀態（Local Mock） */
  owned: boolean;
  dupes: number;
  growthPct: number;
  obtainedAt?: string;
  /** 是否被設為公開展示（Local Mock 預設值） */
  showcased: boolean;
  /** 可否合成：O 為最高級，不可再合成 */
  canSynthesize: boolean;
  /** 可否直接成長（成長值滿 100%） */
  canGrow: boolean;
  art?: string;
}

const seqOf = (poolId: string, id: string) => {
  const inPool = [...ALBUM.filter((c) => c.poolId === poolId).map((c) => c.id), ...CARDS.filter((c) => c.poolId === poolId).map((c) => c.id)];
  const i = inPool.indexOf(id);
  return String((i < 0 ? 0 : i) + 1).padStart(3, "0");
};

export function resolveCardDetail(cardId: string): CardDetail | undefined {
  const album = albumCardById(cardId);
  const def = cardById(cardId);
  const base = album ?? def;
  if (!base) return undefined;

  const pool = poolById(base.poolId);
  if (!pool) return undefined;
  const goddess = goddessById(base.goddessId);

  const legacyOwned = def ? OWNED_CARDS.find((o) => o.cardId === def.id) : undefined;
  const owned = album ? album.owned : Boolean(legacyOwned);
  const dupes = album ? album.dupes : (legacyOwned?.dupes ?? 0);
  const growthPct = album ? album.growthPct : (legacyOwned?.growthPct ?? 0);
  const obtainedAt = album?.obtainedAt ?? legacyOwned?.obtainedAt;

  // 展示卡：沿用卡冊中已取得、成長值最高的前 6 張（與公開頁預設一致）
  const showcaseIds = ALBUM.filter((c) => c.owned)
    .slice(0, 6)
    .map((c) => c.id);

  return {
    id: base.id,
    ...(sampleCardById(base.id) ? { art: sampleCardById(base.id)!.art } : {}),
    name: base.name,
    subtitle: goddess.title,
    grade: base.grade,
    goddess,
    pool,
    serialNo: `${pool.id.toUpperCase()}-${seqOf(pool.id, base.id)}`,
    releasedAt: base.releasedAt,
    owned,
    dupes,
    growthPct,
    ...(obtainedAt ? { obtainedAt } : {}),
    showcased: showcaseIds.includes(base.id),
    canSynthesize: owned && gradeIndex(base.grade) < gradeIndex("O"),
    canGrow: owned && growthPct >= 100,
  };
}

/** 依卡名對應既有共用卡牌 id（Phase 6D-1B 入口串接用；無對應回傳 undefined） */
export const publicCardIdByName = (name: string, grade?: string): string | undefined =>
  CARDS.find((c) => c.name === name && (grade === undefined || c.grade === grade))?.id;

/** 實體典藏資格（Mock 條件：SSR 以上且已取得） */
export const physicalEligible = (d: CardDetail) =>
  d.owned && gradeIndex(d.grade) >= gradeIndex("SSR");
