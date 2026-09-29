import {
  ANNOUNCEMENTS,
  CARDS,
  LEVEL_RANKING,
  POOL_RANKING,
  POOLS,
  poolCollectProgress,
} from "@/data/mock";

export const PLATFORM_NAME = "PEEKFUTURE 創作者收藏卡平台";
export const SERIES_NAME = "女神系列 Goddess Series";

const nextPool = POOLS.find((pool) => pool.id === "p-starlight");
export const SEASON = {
  eyebrow: "下一季預告 · Demo",
  title: "星光綻放季",
  description: "從真人創作者到 VTuber 與原創角色，收藏每一段值得被記住的創作時刻。",
  opensAt: nextPool ? `${nextPool.startAt} 20:00（台北時間 · Demo）` : "開放資訊待更新（Demo）",
  opensAtISO: nextPool ? `${nextPool.startAt}T20:00:00+08:00` : null,
  poolId: nextPool?.id,
};

export type ActivityStatus = "進行中" | "即將開始" | "已結束";
export const ACTIVITIES: Array<{
  id: string;
  title: string;
  subtitle: string;
  status: ActivityStatus;
  period: string;
  progress: number;
  tag: string;
}> = [
  { id: "event-summer", title: "盛夏收藏日誌", subtitle: "完成指定卡冊節點，解鎖收藏展示徽記。", status: "進行中", period: "2026.09.01—10.05", progress: 68, tag: "收藏任務" },
  { id: "event-stage", title: "星光舞台倒數祭", subtitle: "依序公開卡面剪影、參與創作者與機率版本。", status: "即將開始", period: "2026.10.01—10.15", progress: 25, tag: "季前預告" },
  { id: "event-anniv", title: "一週年收藏展", subtitle: "回顧首年收藏與玩家展示，本活動已結束。", status: "已結束", period: "2026.05.20—06.20", progress: 100, tag: "紀念活動" },
];

export const NEXT_SEASON_NODES = [
  { key: "T-30", daysBefore: 30, title: "主題公開", detail: "預計公開季節名稱、主視覺剪影與預定期間。" },
  { key: "T-14", daysBefore: 14, title: "創作者陣容", detail: "預計公開參與創作者與合作系列。" },
  { key: "T-7", daysBefore: 7, title: "卡面與規則", detail: "預計公開範例卡面、卡數與機率版本。" },
  { key: "T-1", daysBefore: 1, title: "開放前確認", detail: "預計公開最終時間與服務狀態。" },
];

export const WISH_CANDIDATES = [
  { id: "wish-01", name: "城市夜行創作者特輯", category: "真人創作者", votes: 12840, deadline: "2026-10-10", state: "投票中" },
  { id: "wish-02", name: "虛擬歌姬舞台企劃", category: "VTuber", votes: 10620, deadline: "2026-10-10", state: "投票中" },
  { id: "wish-03", name: "原創角色異想圖鑑", category: "原創角色", votes: 8910, deadline: "2026-10-10", state: "投票中" },
  { id: "wish-04", name: "獨立樂團巡演紀念", category: "男性創作者", votes: 7630, deadline: "2026-09-10", state: "結果整理中" },
];

export const RECRUITMENTS = [
  { id: "rec-01", title: "2026 冬季創作者卡池募集", status: "開放諮詢", eligibility: "具公開創作作品與可驗證之本人社群", period: "至 2026-10-31" },
  { id: "rec-02", title: "VTuber 聯名企劃候選募集", status: "即將開始", eligibility: "個人勢、團體或經紀授權窗口", period: "2026-11-01 起" },
  { id: "rec-03", title: "原創角色與聯名 IP 合作", status: "資格確認中", eligibility: "需具角色設定、商用授權與素材使用權", period: "長期受理諮詢" },
];

export const TOTAL_LEADERBOARD = LEVEL_RANKING.map((row, index) => ({
  ...row,
  player: `收藏家 ${String.fromCharCode(65 + index)}${String(index + 1).padStart(2, "0")}`,
  collectionScore: 9820 - index * 610,
}));

export const POPULAR_POOL_RANKING = POOLS.filter((pool) => pool.id !== "p-keepy-sample")
  .sort((a, b) => poolCollectProgress(b.id).pct - poolCollectProgress(a.id).pct)
  .slice(0, 3)
  .map((pool, index) => ({ rank: index + 1, pool, collectors: 4820 - index * 730 }));

export const PHYSICAL_COLLECTION = [
  { id: "phy-01", cardId: CARDS[0]?.id ?? "c-u-01", title: "星夜典藏版", edition: "Edition 01", serial: "PF-000184", current: 10, required: 10, remaining: 36, state: "可兌換" },
  { id: "phy-02", cardId: CARDS[1]?.id ?? "c-u-02", title: "晨光典藏版", edition: "Edition 01", serial: "尚未配發", current: 8, required: 10, remaining: 52, state: "接近兌換" },
  { id: "phy-03", cardId: CARDS[2]?.id ?? "c-u-03", title: "盛夏紀念版", edition: "Event Edition", serial: "PF-000072", current: 10, required: 10, remaining: 0, state: "兌換紀錄" },
];

export const CREATOR_STORIES = [
  { title: "夜澄：把深夜聲音變成一張可以收藏的記憶", category: "創作者故事", readTime: "4 分鐘" },
  { title: "收藏家 A07 的六冊展示：從第一張 C 到紀念 UR", category: "收藏展示", readTime: "3 分鐘" },
  { title: "一張卡如何誕生：攝影、授權與卡面設計", category: "製作紀錄", readTime: "6 分鐘" },
];

export const PUBLIC_ANNOUNCEMENTS = [
  ...ANNOUNCEMENTS,
  { id: "a-5", date: "2026-09-19", tag: "兌換", title: "實體典藏 V1 資格與進度 Mock 說明" },
  { id: "a-6", date: "2026-09-16", tag: "活動", title: "盛夏收藏日誌最終週節點公開" },
];

export const IMPORTANT_NOTICE_IDS = ["a-4", "a-2", "a-6", "a-5"];
export const IMPORTANT_NOTICES = IMPORTANT_NOTICE_IDS.flatMap((id) => {
  const notice = PUBLIC_ANNOUNCEMENTS.find((item) => item.id === id);
  return notice ? [notice] : [];
});

export const EXISTING_POOL_RANKING = POOL_RANKING;
export const APP_VERSION = "0.13.0（預覽版）";

// ── 0.9.0 官方內容詳情（Local Mock，列表／首頁／詳情同源）──────────────
export type ContentLink = { label: string; kind: "pool" | "activity" | "season" | "announcement" | "rules"; id?: string };
export type AnnouncementDetail = {
  id: string;
  date: string;
  tag: string;
  title: string;
  summary: string;
  body: string[];
  historical?: string;
  related: ContentLink[];
};

const ANNOUNCEMENT_BODY: Record<string, Omit<AnnouncementDetail, "id" | "date" | "tag" | "title">> = {
  "a-1": { summary: "制服序章卡池卡面更新說明。", body: ["「制服序章」卡池新增 2 張 RRR 卡面，已同步顯示於卡池詳情的卡牌列表。", "卡面、張數與上架時間均為 Local Mock 示意；機率展示沿用卡池頁既有 Demo 版本，未新增正式機率承諾。"], related: [{ label: "查看制服序章卡池", kind: "pool", id: "p-uniform" }] },
  "a-2": { summary: "下一季星光舞台預定開放資訊。", body: ["「星光舞台」預定於 2026-10-15 20:00（台北時間）開放，目前尚未開放抽卡。", "卡池頁顯示的機率為 Demo 展示版本，正式機率將以開放時公告為準；本原型不提供任何開放前抽卡操作。"], related: [{ label: "查看下一季預告", kind: "season" }, { label: "查看星光舞台卡池資訊", kind: "pool", id: "p-starlight" }, { label: "星光舞台倒數祭活動", kind: "activity", id: "event-stage" }] },
  "a-3": { summary: "合成保底相關說明（規則待定）。", body: ["本公告原標題提及的合成保底次數屬於未核定規則，於本原型中一律視為 Demo／待定，不代表正式合成機制。", "正式保底門檻、計算方式與適用卡池將於規則核定後另行公告。"], related: [{ label: "查看規則說明", kind: "rules" }] },
  "a-4": { summary: "過去系統維護的歷史紀錄。", historical: "歷史紀錄：本次維護時段已結束，並非目前正在進行的維護。", body: ["2026-09-20 03:00–05:00（台北時間）曾進行例行系統維護（Demo 公告）。", "此為歷史公告，保留供查詢；目前服務狀態請以最新公告為準。本原型沒有真實服務或維護狀態。"], related: [] },
  "a-5": { summary: "實體典藏 V1 資格與進度說明。", body: ["實體典藏頁顯示的素材進度、流水號與兌換狀態皆為 V1 Mock。", "本原型不做真實兌換、寄送或履約，也不蒐集收件資料。"], related: [{ label: "盛夏收藏日誌活動", kind: "activity", id: "event-summer" }] },
  "a-6": { summary: "盛夏收藏日誌最終週節點。", body: ["「盛夏收藏日誌」進入最終週，活動期間至 2026-10-05（Demo）。", "最終週節點與展示徽記為介面示意，獎勵內容尚未正式決定。"], related: [{ label: "查看盛夏收藏日誌", kind: "activity", id: "event-summer" }, { label: "查看盛夏海風卡池", kind: "pool", id: "p-summer" }] },
};

export const ANNOUNCEMENT_DETAILS: AnnouncementDetail[] = PUBLIC_ANNOUNCEMENTS.map((item) => ({
  ...item,
  ...(ANNOUNCEMENT_BODY[item.id] ?? { summary: item.title, body: ["公告正文待更新（Demo）。"], related: [] }),
}));
export const announcementById = (id: string) => ANNOUNCEMENT_DETAILS.find((item) => item.id === id);

export type ActivityDetail = {
  id: string;
  description: string[];
  participation: string[];
  reward: string;
  related: ContentLink[];
};
const ACTIVITY_BODY: Record<string, ActivityDetail> = {
  "event-summer": { id: "event-summer", description: ["以「盛夏海風」卡池卡冊為主題的收藏任務，完成指定卡冊節點即可在介面上看到展示徽記。"], participation: ["瀏覽盛夏海風卡池與卡冊進度", "卡冊節點達成條件為 Demo 示意，無需報名"], reward: "展示徽記（Demo／獎勵內容待定，未正式決定）", related: [{ label: "盛夏海風卡池", kind: "pool", id: "p-summer" }, { label: "最終週節點公告", kind: "announcement", id: "a-6" }] },
  "event-stage": { id: "event-stage", description: ["星光舞台開放前的倒數活動，將依序公開卡面剪影、參與創作者與機率版本。"], participation: ["追蹤下一季預告頁的解鎖節點", "活動尚未開始，目前無任何參與或報名操作"], reward: "尚未公布（Demo／待定）", related: [{ label: "下一季預告", kind: "season" }, { label: "星光舞台卡池資訊", kind: "pool", id: "p-starlight" }, { label: "開放預定公告", kind: "announcement", id: "a-2" }] },
  "event-anniv": { id: "event-anniv", description: ["回顧首年收藏與玩家展示的紀念活動，本活動已結束，僅保留紀錄。"], participation: ["活動已結束，無法參與"], reward: "已結束（歷史 Demo 紀錄，不再發放）", related: [{ label: "一週年紀念卡池", kind: "pool", id: "p-anniversary" }] },
};
export const activityById = (id: string) => {
  const base = ACTIVITIES.find((item) => item.id === id);
  return base ? { ...base, ...ACTIVITY_BODY[base.id] } : undefined;
};

export const WISH_DETAILS: Record<string, { summary: string; howToView: string }> = {
  "wish-01": { summary: "以城市夜景與街頭攝影為主題的真人創作者特輯候選。", howToView: "候選內容為官方企劃描述，不代表已取得任何創作者同意。" },
  "wish-02": { summary: "以虛擬歌姬舞台演出為主題的 VTuber 企劃候選。", howToView: "需經紀或本人授權確認後才可能進入企劃。" },
  "wish-03": { summary: "原創角色設定集與異想圖鑑主題候選。", howToView: "需確認角色設定與商用授權。" },
  "wish-04": { summary: "獨立樂團巡演紀念主題，投票已截止並整理中。", howToView: "結果整理中，不代表已確定合作。" },
};
