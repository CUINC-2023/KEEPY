import { ALBUM, PLAYER, upgradableCards } from "@/data/player";
import { PHYSICAL_COLLECTION } from "@/data/public-hub";
import { TOP100_STATUS, TOP100_TARGET } from "@/data/leaderboard";

export const ACHIEVEMENT_CATEGORIES = [
  "全部",
  "收藏進度",
  "卡池完成",
  "指定卡牌",
  "卡牌成長",
  "創作者收藏",
  "季度限定",
  "排行榜",
  "實體典藏",
  "隱藏",
] as const;

export type AchievementCategory = Exclude<(typeof ACHIEVEMENT_CATEGORIES)[number], "全部">;
export type AchievementState = "已完成" | "進行中" | "未解鎖" | "隱藏";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  state: AchievementState;
  current: number;
  target: number;
  points: number;
  badge: string;
  completedAt?: string;
  rarity: string;
  hidden?: boolean;
}

/**
 * 成就單一資料來源（Demo）：條件、點數、完成狀態、徽章與完成日期。
 * 成就頁、玩家首頁、展示徽章與公開收藏頁皆引用此清單；點數為 Demo 示範值，非正式規則。
 */
export const ACHIEVEMENTS: Achievement[] = [
  { id: "a-album-anniversary", title: "週年全收藏", description: "完成「一週年紀念」卡冊 100%。", category: "卡池完成", state: "已完成", current: 24, target: 24, points: 400, badge: "週年星冠", completedAt: "2026-06-18", rarity: "4.8% 玩家完成" },
  { id: "a-unique-30", title: "三十道收藏光", description: "蒐集 30 張不同卡牌。", category: "收藏進度", state: "已完成", current: 30, target: 30, points: 180, badge: "收藏微光", completedAt: "2026-07-30", rarity: "31.5% 玩家完成" },
  { id: "a-growth-first", title: "初次升級", description: "完成第 1 張卡牌直接升級。", category: "卡牌成長", state: "已完成", current: 1, target: 1, points: 120, badge: "成長初環", completedAt: "2026-08-05", rarity: "27.4% 玩家完成" },
  { id: "a-physical-first", title: "從數位到掌心", description: "完成首次實體典藏兌換資格。", category: "實體典藏", state: "已完成", current: 1, target: 1, points: 280, badge: "典藏印記", completedAt: "2026-07-08", rarity: "6.4% 玩家完成" },
  { id: "a-set-night", title: "星夜組曲", description: "持有夜澄指定卡組的全部卡牌。", category: "指定卡牌", state: "進行中", current: 3, target: 4, points: 240, badge: "星夜樂章", rarity: "12.6% 玩家完成" },
  { id: "a-set-starlight-quartet", title: "星光四重奏", description: "持有星光指定卡組的全部卡牌。", category: "指定卡牌", state: "進行中", current: 3, target: 4, points: 100, badge: "星光樂章", rarity: "12.6% 玩家完成" },
  { id: "a-unique-50", title: "五十道收藏光", description: "蒐集 50 張不同卡牌。", category: "收藏進度", state: "進行中", current: 45, target: 50, points: 120, badge: "收藏稜鏡", rarity: "18.2% 玩家完成" },
  { id: "a-growth-5", title: "成長見證者", description: "將 5 張卡牌直接升級。", category: "卡牌成長", state: "進行中", current: 4, target: 5, points: 90, badge: "成長之環", rarity: "9.7% 玩家完成" },
  { id: "a-pool-top100", title: "百名收藏家", description: "進入任一卡池收藏榜前 100 名。", category: "排行榜", state: TOP100_STATUS.completed ? "已完成" : "進行中", current: TOP100_STATUS.best?.rank ?? 0, target: TOP100_TARGET, points: 80, badge: "百名桂冠", ...(TOP100_STATUS.completed ? { completedAt: TOP100_STATUS.completedAt } : {}), rarity: "8.1% 玩家完成（Demo）" },
  { id: "a-creator-yoru", title: "夜澄觀測者", description: "收藏夜澄跨卡池作品 8 張。", category: "創作者收藏", state: "進行中", current: 6, target: 8, points: 160, badge: "夜空望遠鏡", rarity: "21.3% 玩家完成" },
  { id: "a-season-summer", title: "盛夏留影", description: "完成盛夏收藏日誌的全部節點。", category: "季度限定", state: "進行中", current: 68, target: 100, points: 200, badge: "海風緞帶", rarity: "14.9% 玩家完成" },
  { id: "a-season-starlight", title: "星光首航", description: "於「星光舞台」卡池取得任一卡牌（卡池尚未開放）。", category: "季度限定", state: "未解鎖", current: 0, target: 1, points: 150, badge: "星光導引", rarity: "尚未開放" },
  { id: "a-hidden-01", title: "？？？", description: "條件將在完成後公開。", category: "隱藏", state: "隱藏", current: 0, target: 1, points: 0, badge: "隱藏徽章", rarity: "完成率未公開", hidden: true },
];

export const COMPLETED_ACHIEVEMENTS = ACHIEVEMENTS.filter((item) => item.state === "已完成" && !item.hidden);
export const VISIBLE_ACHIEVEMENTS = ACHIEVEMENTS.filter((item) => !item.hidden);
export const TOTAL_ACHIEVEMENT_POINTS = COMPLETED_ACHIEVEMENTS.reduce((sum, item) => sum + item.points, 0);
/** 預設展示徽章維持原四枚；新完成徽章不自動加入展示 */
export const DEFAULT_SHOWCASE_BADGES = COMPLETED_ACHIEVEMENTS.filter((item) => item.id !== "a-pool-top100").map((item) => item.id).slice(0, 4);
export const DEFAULT_SHOWCASE_CARDS = ALBUM.filter((card) => card.owned).slice(0, 6).map((card) => card.id);

export const PLAYER_PUBLIC_PROFILE = {
  handle: "demo-player",
  collectionLevel: `Lv.${PLAYER.level} 星軌收藏家`,
  collectionScore: 6820,
  completedAlbums: 1,
  seasonPoolId: "p-summer",
  coverTitle: "把每一段創作時刻，收進自己的星圖。",
};

export const PLAYER_NOTIFICATIONS = [
  { id: "n-1", type: "活動", title: "盛夏收藏日誌即將結束", detail: "剩餘 15 天（Demo）" },
  { id: "n-2", type: "卡牌", title: "你有可升級卡牌", detail: `${upgradableCards().length} 張已達 100%` },
  { id: "n-3", type: "典藏", title: "實體典藏資格更新", detail: `${PHYSICAL_COLLECTION.filter((item) => item.state === "可兌換").length} 項可兌換（Mock）` },
];

export function achievementProgress(item: Achievement) {
  if (item.id === "a-pool-top100") return item.state === "已完成" ? 100 : item.current > 0 ? Math.min(100, Math.round((100 / Math.max(100, item.current)) * 100)) : 0;
  return Math.min(100, Math.round((item.current / item.target) * 100));
}
