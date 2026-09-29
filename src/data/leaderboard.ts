/**
 * 排行榜單一 Mock 資料來源（0.7.0 預覽版，Demo 示範排名）。
 * 計分規則尚未經正式核定：總榜依總收藏積分、卡池榜依該池不重複卡數與蒐集率。
 * 同分依不重複張數 → 固定 demo id 排序，確保排序穩定。
 */
import { POOLS, POOL_ALBUM_OWNED, poolById, poolCollectProgress } from "@/data/mock";

export const LEADERBOARD_UPDATED_AT = "2026-09-26 12:00（台北時間，Demo 固定時間）";
export const SELF_COLLECTOR_ID = "demo-player";

export interface DemoCollector {
  id: string;
  displayName: string;
  /** 示範玩家是否公開（false 者不顯示名稱與數據） */
  isPublic: boolean;
  showRanking: boolean;
  totalScore: number;
  uniqueCards: number;
  /** 各卡池已收集不重複卡數 */
  poolOwned: Record<string, number>;
}

export const DEMO_COLLECTORS: DemoCollector[] = [
  { id: "demo-c01", displayName: "星野巡", isPublic: true, showRanking: true, totalScore: 9820, uniqueCards: 142, poolOwned: { "p-uniform": 39, "p-summer": 33, "p-night-cherry": 28, "p-anniversary": 24 } },
  { id: "demo-c02", displayName: "月見リン", isPublic: true, showRanking: true, totalScore: 9210, uniqueCards: 131, poolOwned: { "p-uniform": 37, "p-summer": 30, "p-night-cherry": 26, "p-anniversary": 24 } },
  { id: "demo-c03", displayName: "夜行列車", isPublic: true, showRanking: true, totalScore: 9210, uniqueCards: 126, poolOwned: { "p-uniform": 37, "p-summer": 28, "p-night-cherry": 27, "p-anniversary": 22 } },
  { id: "demo-c04", displayName: "白晝夢", isPublic: true, showRanking: true, totalScore: 8540, uniqueCards: 118, poolOwned: { "p-uniform": 34, "p-summer": 27, "p-night-cherry": 24, "p-anniversary": 21 } },
  { id: "demo-c05", displayName: "非公開收藏家", isPublic: false, showRanking: true, totalScore: 8300, uniqueCards: 115, poolOwned: { "p-uniform": 33, "p-summer": 26, "p-night-cherry": 22, "p-anniversary": 20 } },
  { id: "demo-c06", displayName: "旅人・星野", isPublic: true, showRanking: true, totalScore: 7930, uniqueCards: 104, poolOwned: { "p-uniform": 31, "p-summer": 24, "p-night-cherry": 20, "p-anniversary": 18 } },
  { id: "demo-c07", displayName: "琥珀糖", isPublic: true, showRanking: true, totalScore: 7320, uniqueCards: 96, poolOwned: { "p-uniform": 28, "p-summer": 22, "p-night-cherry": 19, "p-anniversary": 16 } },
  { id: "demo-c08", displayName: "不參與排名者", isPublic: true, showRanking: false, totalScore: 7100, uniqueCards: 90, poolOwned: { "p-uniform": 27, "p-summer": 20, "p-night-cherry": 18, "p-anniversary": 15 } },
  { id: "demo-c09", displayName: "初雪計畫", isPublic: true, showRanking: true, totalScore: 6510, uniqueCards: 82, poolOwned: { "p-uniform": 24, "p-summer": 18, "p-night-cherry": 16, "p-anniversary": 14 } },
  { id: "demo-c10", displayName: "薄霧觀測所", isPublic: true, showRanking: true, totalScore: 6120, uniqueCards: 77, poolOwned: { "p-uniform": 22, "p-summer": 16, "p-night-cherry": 15, "p-anniversary": 12 } },
  { id: "demo-c11", displayName: "海鹽汽水", isPublic: true, showRanking: true, totalScore: 5480, uniqueCards: 69, poolOwned: { "p-uniform": 18, "p-summer": 15, "p-night-cherry": 12, "p-anniversary": 10 } },
  { id: "demo-c12", displayName: "紙飛機郵局", isPublic: true, showRanking: true, totalScore: 4960, uniqueCards: 61, poolOwned: { "p-uniform": 16, "p-summer": 12, "p-night-cherry": 11, "p-anniversary": 9 } },
];

/** 本人（demo-player）示範資料：沿用公開頁收藏積分 6,820、不重複 37 張與卡冊進度。 */
export function selfCollector(displayName: string, isPublic: boolean, showRanking: boolean): DemoCollector {
  return {
    id: SELF_COLLECTOR_ID,
    displayName,
    isPublic,
    showRanking,
    totalScore: 6820,
    uniqueCards: 37,
    poolOwned: { ...POOL_ALBUM_OWNED },
  };
}

export const isRankVisible = (c: DemoCollector) => c.isPublic && c.showRanking;

export interface TotalRow { rank: number; collector: DemoCollector }
export interface PoolRow { rank: number; collector: DemoCollector; owned: number; total: number; pct: number }

const byId = (a: DemoCollector, b: DemoCollector) => a.id.localeCompare(b.id);

/** 純函式：總榜。僅納入公開且允許排名者；同分 → 不重複張數 → demo id。 */
export function rankTotal(list: DemoCollector[]): TotalRow[] {
  return list
    .filter(isRankVisible)
    .slice()
    .sort((a, b) => b.totalScore - a.totalScore || b.uniqueCards - a.uniqueCards || byId(a, b))
    .map((collector, i) => ({ rank: i + 1, collector }));
}

/** 純函式：單一卡池榜。不存在卡池回傳 null；該池 0 張者不列入。 */
export function rankPool(list: DemoCollector[], poolId: string): PoolRow[] | null {
  const pool = poolById(poolId);
  if (!pool) return null;
  const total = poolCollectProgress(poolId).total;
  return list
    .filter(isRankVisible)
    .map((collector) => {
      const owned = Math.min(collector.poolOwned[poolId] ?? 0, total);
      return { collector, owned, total, pct: total ? Math.round((owned / total) * 100) : 0 };
    })
    .filter((r) => r.owned > 0)
    .sort((a, b) => b.owned - a.owned || b.collector.uniqueCards - a.collector.uniqueCards || byId(a.collector, b.collector))
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

/** 首頁與榜頁共用的公開總榜（不含依本機設定的本人資料，確保 SSR 同源一致）。 */
export const PUBLIC_TOTAL_TOP = rankTotal(DEMO_COLLECTORS);

export const LEADERBOARD_POOLS = POOLS.map((p) => ({ id: p.id, name: p.name, status: p.status }));

/**
 * 本人名次（單一來源）：與 /leaderboards 相同名單與排序計算。
 * 不公開或不參與排名時回傳 null，避免公開頁與榜單互相矛盾。
 */
export function selfRanks(displayName: string, isPublic: boolean, showRanking: boolean, poolId = "p-uniform") {
  const self = selfCollector(displayName, isPublic, showRanking);
  const list = [...DEMO_COLLECTORS, self];
  const total = rankTotal(list).find((r) => r.collector.id === SELF_COLLECTOR_ID)?.rank ?? null;
  const pool = rankPool(list, poolId)?.find((r) => r.collector.id === SELF_COLLECTOR_ID)?.rank ?? null;
  return { total, pool, poolId, poolName: poolById(poolId)?.name ?? poolId };
}

/**
 * 「百名收藏家」成就判定（單一來源）：以同一份 Demo 名單計算本人在各卡池榜的最佳名次。
 * 判定用實際收藏排名，不受「顯示排名／公開頁」這類展示偏好影響；展示偏好只決定是否對外顯示。
 */
export const TOP100_TARGET = 100;
export function selfBestPoolRank() {
  const list = [...DEMO_COLLECTORS, selfCollector("本人", true, true)];
  let best: { rank: number; poolId: string; poolName: string } | null = null;
  for (const pool of POOLS) {
    const rank = rankPool(list, pool.id)?.find((r) => r.collector.id === SELF_COLLECTOR_ID)?.rank;
    if (rank && (!best || rank < best.rank)) best = { rank, poolId: pool.id, poolName: pool.name };
  }
  return best;
}
export const TOP100_STATUS = (() => {
  const best = selfBestPoolRank();
  return { best, completed: !!best && best.rank <= TOP100_TARGET, completedAt: "2026-09-26" };
})();
