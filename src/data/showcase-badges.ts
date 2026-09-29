/**
 * 展示徽章共用 Local Mock 設定。
 * 成就頁 /app/achievements 寫入，公開收藏頁 /collectors/demo-player 唯讀。
 * 只保存在瀏覽器 localStorage，不代表帳號同步或正式公開頁。
 */

import { COMPLETED_ACHIEVEMENTS } from "@/data/player-profile";

export const SHOWCASE_KEY = "pf-achievement-showcase";
export const SHOWCASE_MAX = 8;

/** 可公開展示的徽章：直接取自成就單一資料來源中「已完成且具有徽章」者。 */
export const SHOWCASE_BADGES: ReadonlyArray<{
  id: string;
  badge: string;
  title: string;
  completedAt: string;
  rarity: string;
}> = COMPLETED_ACHIEVEMENTS.filter((a) => a.badge && a.completedAt).map((a) => ({
  id: a.id,
  badge: a.badge,
  title: a.title,
  completedAt: a.completedAt!,
  rarity: a.rarity,
}));

/** Demo 預設展示僅原兩枚；新完成的徽章只列為可選，不自動公開。 */
export const DEFAULT_SHOWCASE_IDS = ["a-album-anniversary", "a-physical-first"];

/**
 * 讀取展示徽章 id 清單。
 * - key 不存在、JSON 錯誤或非陣列 → 回到 Demo 預設兩枚。
 * - 有效陣列（包含空陣列）→ 過濾非字串、重複、未知 id，保留原順序；空陣列維持空。
 */
export function readShowcaseIds(): string[] {
  try {
    const raw = localStorage.getItem(SHOWCASE_KEY);
    if (!raw) return [...DEFAULT_SHOWCASE_IDS];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_SHOWCASE_IDS];
    const known = new Set(SHOWCASE_BADGES.map((b) => b.id));
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const item of parsed) {
      if (typeof item !== "string" || !known.has(item) || seen.has(item)) continue;
      seen.add(item);
      ids.push(item);
      if (ids.length >= SHOWCASE_MAX) break;
    }
    return ids;
  } catch {
    return [...DEFAULT_SHOWCASE_IDS];
  }
}

export function writeShowcaseIds(ids: string[]) {
  try {
    localStorage.setItem(SHOWCASE_KEY, JSON.stringify(ids));
  } catch {
    /* 僅此瀏覽器偏好，寫入失敗時忽略 */
  }
}

export function showcaseBadgeById(id: string) {
  return SHOWCASE_BADGES.find((b) => b.id === id);
}
