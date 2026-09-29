/**
 * 展示卡共用 Local Mock 設定（Phase 6D-4B）。
 * /app/settings/privacy 寫入，/collectors/demo-player 唯讀。
 * 只保存在瀏覽器 localStorage，不代表帳號同步或正式公開頁。
 */
import { ALBUM, goddessOf, type AlbumCard } from "@/data/player";

export const CARD_SHOWCASE_KEY = "pf-card-showcase-v1";
export const CARD_SHOWCASE_MIN = 3;
export const CARD_SHOWCASE_MAX = 6;

/** 可選展示卡：只有既有卡冊中已持有的卡（單一資料來源） */
export const SHOWCASE_POOL: AlbumCard[] = ALBUM.filter((card) => card.owned);

const OWNED_IDS = new Set(SHOWCASE_POOL.map((c) => c.id));

/** Demo 預設：沿用目前公開頁的六張（卡冊已持有、固定順序） */
export const DEFAULT_CARD_SHOWCASE_IDS: string[] = SHOWCASE_POOL.slice(0, CARD_SHOWCASE_MAX).map((c) => c.id);

export const showcaseCardById = (id: string) => SHOWCASE_POOL.find((c) => c.id === id);

/** 展示卡可讀資訊（名稱、稀有度、卡池、女神）皆來自同一份卡牌資料 */
export const showcaseCardMeta = (card: AlbumCard) => ({
  id: card.id,
  name: card.name,
  grade: card.grade,
  poolId: card.poolId,
  goddess: goddessOf(card),
});

/**
 * 讀取展示卡 id 清單。
 * key 不存在、JSON 損壞，或過濾後有效結果少於 3 張 → 安全回到 Demo 預設六張。
 * 有效陣列會過濾非字串、未知 id、非持有卡與重複值，最多 6 張。
 */
export function readCardShowcaseIds(): string[] {
  try {
    const raw = localStorage.getItem(CARD_SHOWCASE_KEY);
    if (!raw) return [...DEFAULT_CARD_SHOWCASE_IDS];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_CARD_SHOWCASE_IDS];
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const item of parsed) {
      if (typeof item !== "string" || !OWNED_IDS.has(item) || seen.has(item)) continue;
      seen.add(item);
      ids.push(item);
      if (ids.length >= CARD_SHOWCASE_MAX) break;
    }
    return ids.length >= CARD_SHOWCASE_MIN ? ids : [...DEFAULT_CARD_SHOWCASE_IDS];
  } catch {
    return [...DEFAULT_CARD_SHOWCASE_IDS];
  }
}

export function writeCardShowcaseIds(ids: string[]) {
  try {
    localStorage.setItem(CARD_SHOWCASE_KEY, JSON.stringify(ids.slice(0, CARD_SHOWCASE_MAX)));
  } catch {
    /* 僅此瀏覽器偏好，寫入失敗時忽略 */
  }
}
