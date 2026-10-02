// ─────────────────────────────────────────────────────────────
// KEEPY — 官方管理後台 Mock 資料（Batch 3）
// 僅本地假資料：儲存草稿、發布、版本紀錄皆為 Demo，不會改動前台。
// ─────────────────────────────────────────────────────────────
import { GRADES, POOLS, type Rarity, type Pool } from "@/data/mock";
import { albumByPool } from "@/data/player";

export const ADMIN_USER = {
  name: "營運・Demo 管理員",
  role: "卡池營運（唯讀＋草稿編輯）",
  permissions: ["卡池檢視", "抽卡設定草稿", "合成設定草稿"],
  restricted: ["正式發布", "分潤比例設定", "玩家帳號調整"],
};

export const ADMIN_PERMISSION_NOTE =
  "此原型為 UI 骨架（Demo）：「內容管理（示範）」的本機儲存可即時影響此瀏覽器的前台預覽，但不會變更其他使用者看到的內容、正式資料或玩家紀錄；其餘管理頁的儲存草稿、發布與版本回溯皆為介面示範，沒有真實發布／回溯。";

// ── 抽卡範圍（V1 僅啟用單一卡池）────────────────────────────
export type DrawScope = "single_pool" | "all_pools";

export const DRAW_SCOPES: {
  key: DrawScope;
  label: string;
  desc: string;
  enabled: boolean;
}[] = [
  {
    key: "single_pool",
    label: "單一卡池",
    desc: "抽卡範圍與機率皆以單一卡池為單位；玩家只能抽到該卡池內已啟用且可抽取的卡牌。",
    enabled: true,
  },
  {
    key: "all_pools",
    label: "全卡池抽卡（規劃中／尚未啟用）",
    desc: "跨卡池抽取的預備架構，資料欄位已預留，尚未開放玩家入口，也不進行抽卡。",
    enabled: false,
  },
];

export const ALL_POOLS_TBD = [
  "納入哪些有效卡池（上架中／已結束／限定）：待定",
  "跨卡池權重如何分配：待定",
  "卡池上架與下架時的抽取範圍處理：待定",
  "保底是否與單一卡池獨立計算：待定",
  "跨卡池抽卡的女神分潤歸屬：待定",
  "跨卡池機率揭露方式與揭露顆粒度：待定",
];

// ── 卡池營運狀態（草稿／已發布）─────────────────────────────
export interface PoolAdminMeta {
  poolId: string;
  publishState: "已發布" | "草稿" | "已發布・有未發布草稿";
  lastEditedBy: string;
  lastEditedAt: string;
  drawSettingsVersion: string;
  synthesisSettingsVersion: string;
  drawSettingsState: SettingState;
  synthesisSettingsState: SettingState;
}

export type SettingState = "已發布" | "草稿";

export const POOL_ADMIN_META: PoolAdminMeta[] = [
  {
    poolId: "p-uniform",
    publishState: "已發布・有未發布草稿",
    lastEditedBy: "營運・Demo 管理員",
    lastEditedAt: "2026-09-19 17:42",
    drawSettingsVersion: "v4",
    synthesisSettingsVersion: "v2",
    drawSettingsState: "草稿",
    synthesisSettingsState: "已發布",
  },
  {
    poolId: "p-starlight",
    publishState: "草稿",
    lastEditedBy: "營運・小星",
    lastEditedAt: "2026-09-18 11:05",
    drawSettingsVersion: "v2",
    synthesisSettingsVersion: "v1",
    drawSettingsState: "草稿",
    synthesisSettingsState: "草稿",
  },
  {
    poolId: "p-summer",
    publishState: "已發布",
    lastEditedBy: "營運・海風班",
    lastEditedAt: "2026-09-01 08:30",
    drawSettingsVersion: "v3",
    synthesisSettingsVersion: "v1",
    drawSettingsState: "已發布",
    synthesisSettingsState: "已發布",
  },
  {
    poolId: "p-kimono",
    publishState: "草稿",
    lastEditedBy: "營運・企劃組",
    lastEditedAt: "2026-09-17 14:20",
    drawSettingsVersion: "v1",
    synthesisSettingsVersion: "v1",
    drawSettingsState: "草稿",
    synthesisSettingsState: "草稿",
  },
  {
    poolId: "p-night-cherry",
    publishState: "已發布",
    lastEditedBy: "營運・夜班",
    lastEditedAt: "2026-08-20 03:10",
    drawSettingsVersion: "v6",
    synthesisSettingsVersion: "v3",
    drawSettingsState: "已發布",
    synthesisSettingsState: "已發布",
  },
  {
    poolId: "p-anniversary",
    publishState: "已發布",
    lastEditedBy: "營運・週年小組",
    lastEditedAt: "2026-06-20 23:59",
    drawSettingsVersion: "v5",
    synthesisSettingsVersion: "v2",
    drawSettingsState: "已發布",
    synthesisSettingsState: "已發布",
  },
];

export const poolMeta = (poolId: string): PoolAdminMeta =>
  POOL_ADMIN_META.find((m) => m.poolId === poolId) ?? { poolId, publishState: "草稿", lastEditedBy: "Local Mock", lastEditedAt: "未編輯", drawSettingsVersion: "無", synthesisSettingsVersion: "無", drawSettingsState: "草稿", synthesisSettingsState: "草稿" };

// ── 抽卡機率設定（單一卡池）─────────────────────────────────
export interface GradeRuleRow {
  grade: Rarity;
  pct: number;
  enabled: boolean;
}

export interface DrawCardRow {
  id: string;
  name: string;
  grade: Rarity;
  goddessId: string;
  /** 是否進入抽取範圍 */
  included: boolean;
  /** 同等級內權重（預設平均 = 1；自訂權重為 Demo） */
  weight: number;
}

export function buildDrawSettings(pool: Pool) {
  const rateMap = new Map(pool.rates.map((r) => [r.grade, r.pct]));
  const grades: GradeRuleRow[] = GRADES.map((g) => ({
    grade: g,
    pct: rateMap.get(g) ?? 0,
    enabled: (rateMap.get(g) ?? 0) > 0,
  }));
  const cards: DrawCardRow[] = albumByPool(pool.id).map((c, i) => ({
    id: c.id,
    name: c.name,
    grade: c.grade,
    goddessId: c.goddessId,
    included: i % 17 !== 5,
    weight: 1,
  }));
  // 一致性規則：已啟用且機率 > 0 的等級，至少要有 1 張卡牌在抽取範圍內
  for (const g of grades) {
    if (!g.enabled || g.pct <= 0) continue;
    const sameGrade = cards.filter((c) => c.grade === g.grade);
    if (sameGrade.length > 0 && !sameGrade.some((c) => c.included)) {
      sameGrade[0]!.included = true;
    }
  }
  return { scope: "single_pool" as DrawScope, grades, cards, evenWeight: true };
}

export const DRAW_PITY_TBD_ITEMS = [
  "保底機制是否採計次、計金額或分段：Demo／待定",
  "保底門檻（抽數）與適用等級：Demo／待定",
  "保底是否跨卡池累積：Demo／待定",
  "卡池結束後保底累積值的處理方式：Demo／待定",
];

// ── 合成條件設定（單一卡池）─────────────────────────────────
export interface SynthGradeRow {
  grade: Rarity;
  /** 是否可作為合成素材等級 */
  enabled: boolean;
  /** 基礎成功率（%） */
  baseRate: number;
}

export function buildSynthesisSettings(pool: Pool) {
  const base: Record<string, number> = {
    C: 60, U: 55, R: 50, RR: 45, RRR: 40, SR: 32, SSR: 24, HR: 16, UR: 10, O: 0,
  };
  const grades: SynthGradeRow[] = GRADES.map((g) => ({
    grade: g,
    enabled: g !== "O",
    baseRate: base[g] ?? 0,
  }));
  return {
    poolId: pool.id,
    /** 素材張數 */
    materialCount: 3,
    samePoolOnly: true,
    sameGradeOnly: true,
    grades,
    itemBoostEnabled: true,
    /** 商城道具加成（僅增加成功率） */
    itemBoostPct: 12,
    /** 連續失敗保底次數（已核定：10 次） */
    pityFailCount: 10,
  };
}

export const SYNTH_RULE_FIXED = [
  "成功：取得該卡池隨機「上一級」卡牌。",
  "失敗：取得該卡池隨機「同級」卡牌。",
  "連續失敗累積 10 次即觸發保底，取得上一級卡牌。",
  "商城道具僅增加合成成功率，不改變其他規則。",
  "合成不產生女神分潤。",
];

export const SYNTH_TBD_ITEMS = [
  "O 卡是否可作為合成素材或合成產出：待定",
  "商城道具加成的疊加上限與疊加方式：待定",
  "正式成功率公式（是否含等級、卡池、活動係數）：待定",
  "保底是否依等級分別累積：待定",
];

export const NON_RETROACTIVE_NOTE =
  "僅影響發布後的新合成，不追溯既有紀錄（Demo）。";

// ── 版本紀錄（Mock）─────────────────────────────────────────
export interface VersionLogRow {
  id: string;
  version: string;
  at: string;
  by: string;
  action: "儲存草稿" | "發布" | "回溯";
  note: string;
}

export const DRAW_VERSION_LOG: VersionLogRow[] = [
  { id: "dv-4", version: "v4", at: "2026-09-19 17:42", by: "營運・Demo 管理員", action: "儲存草稿", note: "調整 SR／RRR 機率，並排除 1 張卡牌" },
  { id: "dv-3", version: "v3", at: "2026-09-14 10:21", by: "營運・小星", action: "發布", note: "新增 2 張 RRR 卡面進入抽取範圍" },
  { id: "dv-2", version: "v2", at: "2026-09-12 09:00", by: "營運・小星", action: "發布", note: "卡池開池初版機率" },
  { id: "dv-1", version: "v1", at: "2026-09-08 16:30", by: "營運・夜班", action: "儲存草稿", note: "建立卡池抽卡設定" },
];

export const SYNTH_VERSION_LOG: VersionLogRow[] = [
  { id: "sv-2", version: "v2", at: "2026-09-16 13:08", by: "營運・Demo 管理員", action: "儲存草稿", note: "調整 SR 基礎成功率並開啟道具加成" },
  { id: "sv-1", version: "v1", at: "2026-09-12 09:00", by: "營運・小星", action: "發布", note: "合成條件初版（同卡池、同等級；素材張數見該版設定）" },
];

export const ADMIN_POOL_ROWS = POOLS.map((p) => ({ pool: p, meta: poolMeta(p.id) }));

// ── 卡池建立範本（Batch 5，僅複製結構與預設欄位）─────────────
export interface PoolTemplate {
  id: string;
  name: string;
  kindLabel: string;
  summary: string;
  /** 預設欄位（Demo 預設值，可於建立流程調整） */
  defaults: { label: string; value: string }[];
  tbd: string[];
}

export const TEMPLATE_COPY_NOTE =
  "從範本建立只複製卡池結構與預設欄位，不會複製玩家資料、抽卡紀錄、收益或分潤資料（Demo）。";

export const POOL_TEMPLATES: PoolTemplate[] = [
  {
    id: "tpl-permanent",
    name: "常駐卡池",
    kindLabel: "常駐型",
    summary: "長期上架的基礎卡池，適合新玩家入門與基本蒐集。",
    defaults: [
      { label: "抽卡範圍", value: "單一卡池（single_pool）" },
      { label: "期間", value: "開始日固定、結束日長期（可延長）" },
      { label: "卡牌數", value: "40 張（可調整）" },
      { label: "十級機率", value: "沿用常駐基準表，總和 100%" },
      { label: "合成條件", value: "同卡池、同等級；素材張數依各卡池合成設定（Demo／待定）" },
      { label: "卡冊顯示", value: "標準卡冊範本" },
    ],
    tbd: ["常駐卡池的卡牌追加排程：待定", "保底門檻：Demo／待定"],
  },
  {
    id: "tpl-limited",
    name: "期間限定",
    kindLabel: "期間限定型",
    summary: "固定檔期的限定卡池，結束後不再發行卡牌。",
    defaults: [
      { label: "抽卡範圍", value: "單一卡池（single_pool）" },
      { label: "期間", value: "開始與結束日必填（檔期制）" },
      { label: "卡牌數", value: "28 張（可調整）" },
      { label: "十級機率", value: "高等級略高於常駐，總和 100%" },
      { label: "合成條件", value: "同卡池、同等級；素材張數依各卡池合成設定（Demo／待定）" },
      { label: "卡冊顯示", value: "限定卡冊範本（結束後仍可查看）" },
    ],
    tbd: ["結束後保底累積值處理：Demo／待定", "復刻是否沿用原機率：待定"],
  },
  {
    id: "tpl-collab",
    name: "合作企劃",
    kindLabel: "合作企劃型",
    summary: "與外部企劃或主題合作的卡池，素材與授權需另行確認。",
    defaults: [
      { label: "抽卡範圍", value: "單一卡池（single_pool）" },
      { label: "期間", value: "依合作檔期設定" },
      { label: "卡牌數", value: "30 張（可調整）" },
      { label: "十級機率", value: "沿用限定基準表，總和 100%" },
      { label: "合成條件", value: "同卡池、同等級；素材張數依各卡池合成設定（Demo／待定）" },
      { label: "卡冊顯示", value: "限定卡冊範本" },
    ],
    tbd: ["授權範圍與素材規格：待定", "合作方揭露文案：待定", "分潤歸屬依合作合約"],
  },
  {
    id: "tpl-rerun",
    name: "復刻卡池",
    kindLabel: "復刻型",
    summary: "以既有卡池結構復刻，僅複製欄位設定，不帶入任何玩家資料。",
    defaults: [
      { label: "來源卡池", value: "選擇既有卡池（只複製結構）" },
      { label: "抽卡範圍", value: "單一卡池（single_pool）" },
      { label: "卡牌數", value: "沿用來源卡池（可調整）" },
      { label: "十級機率", value: "沿用來源版本，需重新確認總和 100%" },
      { label: "合成條件", value: "沿用來源版本" },
      { label: "卡冊顯示", value: "沿用來源卡冊範本" },
    ],
    tbd: ["復刻卡牌是否與原卡合併計算蒐集：待定", "復刻期間的保底計算：Demo／待定"],
  },
];

/** 建立卡池流程（全部為 Demo 草稿，不會真的發布） */
export const CREATE_POOL_STEPS = [
  { key: "basic", label: "基本資訊", desc: "卡池名稱、英文副標、類型、主題色與說明文案。" },
  { key: "schedule", label: "期間與狀態", desc: "開始與結束日期、前台狀態（進行中／即將開始／已結束）。" },
  { key: "cards", label: "女神與卡牌", desc: "參與女神、卡牌總數與各等級卡面清單。" },
  { key: "rates", label: "抽卡機率", desc: "十級機率輸入，已啟用等級總和必須等於 100%。" },
  { key: "synthesis", label: "合成條件", desc: "可合成等級、素材張數（依卡池設定）、基礎成功率與連續失敗 10 次保底。" },
  { key: "album", label: "卡冊顯示", desc: "選擇卡冊範本、封面配置、進度欄與鎖定規則。" },
  { key: "preview", label: "預覽", desc: "檢查一致性後儲存為 Demo 草稿（不會真的發布）。" },
];

// ── 卡冊 UI 範本（Batch 5）───────────────────────────────────
export interface AlbumTemplate {
  id: string;
  name: string;
  useCase: string;
  cover: string;
  progressBar: string;
  tileStates: string[];
  lockRule: string;
}

export const ALBUM_TEMPLATES: AlbumTemplate[] = [
  {
    id: "atpl-standard",
    name: "標準卡冊",
    useCase: "常駐卡池，長期蒐集。",
    cover: "16:9 主題漸層封面 ＋ 狀態標籤 ＋ 期間",
    progressBar: "總進度（已取得／總數）＋ 十級完成度 ＋ 女神完成度",
    tileStates: ["已取得", "新卡", "重複卡", "可升級", "未取得剪影"],
    lockRule: "未取得只顯示剪影與所屬卡池、取得來源，不顯示完整卡面。",
  },
  {
    id: "atpl-limited",
    name: "限定卡冊",
    useCase: "期間限定與合作企劃卡池。",
    cover: "16:9 封面 ＋ 檔期倒數／結束標記",
    progressBar: "總進度 ＋ 檔期內取得數 ＋ 十級完成度",
    tileStates: ["已取得", "新卡", "重複卡", "可升級", "活動結束仍未取得", "即將開始尚未開放"],
    lockRule: "即將開始時卡格全鎖；結束後未取得標示「活動結束仍未取得」，不可再抽卡。",
  },
  {
    id: "atpl-complete",
    name: "紀念完成卡冊",
    useCase: "紀念型卡池或已完成蒐集的卡冊。",
    cover: "香檳金完成封面 ＋ 完成率 100% 徽章",
    progressBar: "完成度 100% 樣式 ＋ 完成時間 ＋ 最高等級",
    tileStates: ["已取得", "重複卡", "可升級"],
    lockRule: "全部取得後不再顯示鎖定卡格；重複卡仍可用於成長。",
  },
];

export const ALBUM_TEMPLATE_NOTE =
  "卡冊範本僅為 UI 與資料結構示意，不影響玩家既有卡冊資料（Demo）。";
