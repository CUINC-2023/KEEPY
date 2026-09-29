// ─────────────────────────────────────────────────────────────
// CU 女神卡 — 合作女神後台 Mock 資料（Batch 3）
// 全部為本地假資料：無後端、無真實結算、無真實電子簽署。
// 分潤金額一律以新台幣顯示，且不設定任何固定分潤比例。
// ─────────────────────────────────────────────────────────────
import { goddessById, SPLIT_POLICY_NOTE } from "@/data/mock";

/** 此 Demo 帳號同時具備的女神身分 */
export const GODDESS_SELF_ID = "g-yoru";
export const goddessSelf = () => goddessById(GODDESS_SELF_ID);

export const COOP = {
  status: "合作中" as "合作中" | "審核中" | "已暫停",
  since: "2026-08-20",
  contractVersion: "v1.2",
  poolIds: ["p-uniform", "p-starlight"],
  poolNames: ["制服序章", "星光舞台"],
  cardCount: 14,
  /** 有效付費抽卡次數（現金或付費點數完成者） */
  paidDrawCount: 2620,
};

/** 收益統一以新台幣顯示；女神不取得平台點數 */
export const REVENUE_CURRENCY_NOTE =
  "收益一律以新台幣（TWD）顯示，合作女神不會獲得平台點數。";
export const REVENUE_CALC_NOTE = `${SPLIT_POLICY_NOTE}；本頁不顯示任何比例數字，金額為 Mock 示意。`;
export const SETTLE_DEMO_NOTE =
  "結算、下載與簽署皆為 Demo，不執行真實提領、真實付款或真實電子簽署。";

/** 不產生分潤的行為（明確排除） */
export const NON_ELIGIBLE_ACTIONS = [
  "贈送點數抽卡",
  "免費抽卡／活動贈抽",
  "卡牌合成",
  "卡牌成長",
  "商城道具購買",
  "其他遊戲內行為",
];

// ── 結算期 ────────────────────────────────────────────────
export type RevenueStatus = "待結算" | "可結算" | "已結算";

export interface RevenuePeriod {
  id: string;
  label: string;
  periodStart: string;
  periodEnd: string;
  status: RevenueStatus;
  poolNames: string[];
  /** 有效付費抽卡次數 */
  paidDrawCount: number;
  /** 符合分潤的實際消費金額（TWD） */
  eligibleSpendTwd: number;
  /** 依合約計算的女神分潤（TWD，Mock） */
  shareTwd: number;
  settledAt?: string;
}

export const REVENUE_PERIODS: RevenuePeriod[] = [
  {
    id: "rp-2609b",
    label: "2026-09 下半月",
    periodStart: "2026-09-16",
    periodEnd: "2026-09-30",
    status: "待結算",
    poolNames: ["制服序章"],
    paidDrawCount: 780,
    eligibleSpendTwd: 78000,
    shareTwd: 5300,
  },
  {
    id: "rp-2609a",
    label: "2026-09 上半月",
    periodStart: "2026-09-01",
    periodEnd: "2026-09-15",
    status: "可結算",
    poolNames: ["制服序章"],
    paidDrawCount: 1840,
    eligibleSpendTwd: 184000,
    shareTwd: 12400,
  },
  {
    id: "rp-2608b",
    label: "2026-08 下半月",
    periodStart: "2026-08-16",
    periodEnd: "2026-08-31",
    status: "已結算",
    poolNames: ["制服序章", "星光舞台"],
    paidDrawCount: 1320,
    eligibleSpendTwd: 139400,
    shareTwd: 9100,
    settledAt: "2026-09-08",
  },
  {
    id: "rp-2608a",
    label: "2026-08 上半月",
    periodStart: "2026-08-01",
    periodEnd: "2026-08-15",
    status: "已結算",
    poolNames: ["星光舞台"],
    paidDrawCount: 640,
    eligibleSpendTwd: 67200,
    shareTwd: 4300,
    settledAt: "2026-08-22",
  },
];

export const periodById = (id: string) =>
  REVENUE_PERIODS.find((p) => p.id === id);

// ── 分潤明細（以訂單為單位）────────────────────────────────
export interface RevenueOrder {
  id: string;
  periodId: string;
  orderNo: string;
  /** 付費抽卡完成時間 */
  drawAt: string;
  poolId: string;
  poolName: string;
  drawType: "單抽" | "十連抽";
  payMethod: "現金" | "付費點數";
  /** 符合分潤的實際消費金額（TWD） */
  eligibleSpendTwd: number;
  /** 依合約計算的女神分潤（TWD，Mock） */
  shareTwd: number;
  status: RevenueStatus;
}

export const REVENUE_ORDERS: RevenueOrder[] = [
  { id: "ro-01", periodId: "rp-2609b", orderNo: "ORD-26092801", drawAt: "2026-09-28 21:14", poolId: "p-uniform", poolName: "制服序章", drawType: "十連抽", payMethod: "付費點數", eligibleSpendTwd: 900, shareTwd: 62, status: "待結算" },
  { id: "ro-02", periodId: "rp-2609b", orderNo: "ORD-26092704", drawAt: "2026-09-27 12:03", poolId: "p-uniform", poolName: "制服序章", drawType: "單抽", payMethod: "現金", eligibleSpendTwd: 100, shareTwd: 7, status: "待結算" },
  { id: "ro-03", periodId: "rp-2609b", orderNo: "ORD-26092201", drawAt: "2026-09-22 09:41", poolId: "p-uniform", poolName: "制服序章", drawType: "十連抽", payMethod: "付費點數", eligibleSpendTwd: 900, shareTwd: 58, status: "待結算" },
  { id: "ro-04", periodId: "rp-2609b", orderNo: "ORD-26091803", drawAt: "2026-09-18 23:50", poolId: "p-uniform", poolName: "制服序章", drawType: "單抽", payMethod: "付費點數", eligibleSpendTwd: 100, shareTwd: 6, status: "待結算" },
  { id: "ro-05", periodId: "rp-2609a", orderNo: "ORD-26091502", drawAt: "2026-09-15 18:22", poolId: "p-uniform", poolName: "制服序章", drawType: "十連抽", payMethod: "現金", eligibleSpendTwd: 900, shareTwd: 61, status: "可結算" },
  { id: "ro-06", periodId: "rp-2609a", orderNo: "ORD-26091401", drawAt: "2026-09-14 20:07", poolId: "p-uniform", poolName: "制服序章", drawType: "十連抽", payMethod: "付費點數", eligibleSpendTwd: 900, shareTwd: 59, status: "可結算" },
  { id: "ro-07", periodId: "rp-2609a", orderNo: "ORD-26091305", drawAt: "2026-09-13 11:36", poolId: "p-uniform", poolName: "制服序章", drawType: "單抽", payMethod: "付費點數", eligibleSpendTwd: 100, shareTwd: 7, status: "可結算" },
  { id: "ro-08", periodId: "rp-2609a", orderNo: "ORD-26091202", drawAt: "2026-09-12 00:18", poolId: "p-uniform", poolName: "制服序章", drawType: "十連抽", payMethod: "現金", eligibleSpendTwd: 900, shareTwd: 63, status: "可結算" },
  { id: "ro-09", periodId: "rp-2608b", orderNo: "ORD-26083101", drawAt: "2026-08-31 19:45", poolId: "p-starlight", poolName: "星光舞台", drawType: "十連抽", payMethod: "付費點數", eligibleSpendTwd: 1080, shareTwd: 71, status: "已結算" },
  { id: "ro-10", periodId: "rp-2608b", orderNo: "ORD-26082503", drawAt: "2026-08-25 14:02", poolId: "p-uniform", poolName: "制服序章", drawType: "單抽", payMethod: "現金", eligibleSpendTwd: 100, shareTwd: 6, status: "已結算" },
  { id: "ro-11", periodId: "rp-2608a", orderNo: "ORD-26081402", drawAt: "2026-08-14 22:31", poolId: "p-starlight", poolName: "星光舞台", drawType: "十連抽", payMethod: "付費點數", eligibleSpendTwd: 1080, shareTwd: 69, status: "已結算" },
  { id: "ro-12", periodId: "rp-2608a", orderNo: "ORD-26080601", drawAt: "2026-08-06 08:57", poolId: "p-starlight", poolName: "星光舞台", drawType: "單抽", payMethod: "現金", eligibleSpendTwd: 120, shareTwd: 8, status: "已結算" },
];

export const ordersByPeriod = (periodId: string) =>
  REVENUE_ORDERS.filter((o) => o.periodId === periodId);

export const sumShare = (status?: RevenueStatus) =>
  REVENUE_PERIODS.filter((p) => !status || p.status === status).reduce(
    (s, p) => s + p.shareTwd,
    0
  );

// ── 數位合約 ──────────────────────────────────────────────
export interface Contract {
  id: string;
  title: string;
  version: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: "已簽署" | "待簽署" | "已到期";
  signedAt?: string;
  scope: string[];
  sections: { heading: string; body: string }[];
}

export const CONTRACTS: Contract[] = [
  {
    id: "ct-102",
    title: "女神合作條款",
    version: "v1.2",
    effectiveFrom: "2026-09-01",
    effectiveTo: "2027-08-31",
    status: "已簽署",
    signedAt: "2026-08-20",
    scope: ["制服序章", "星光舞台"],
    sections: [
      { heading: "合作範圍", body: "合作女神授權平台於指定卡池內發行其形象卡牌，卡池與卡牌數量以後台上架紀錄為準。" },
      { heading: "分潤來源", body: "僅玩家以現金或付費點數完成抽卡的實際消費，才會計入分潤基礎。贈送點數抽卡、免費抽卡、合成、卡牌成長與商城道具皆不計入。" },
      { heading: "分潤計算", body: "實際分潤比例依合作合約約定，介面不顯示未核定比例。分潤一律以新台幣計算，不以平台點數發放。" },
      { heading: "結算週期", body: "以半月為一結算期；結算流程、付款方式與時程於原型階段皆為 Demo。" },
      { heading: "素材與肖像", body: "形象圖與卡牌素材之授權範圍、修改權限與下架流程依合約附件（Mock）。" },
    ],
  },
  {
    id: "ct-103",
    title: "卡池追加合作附約",
    version: "v1.3（草案）",
    effectiveFrom: "2026-10-15",
    effectiveTo: "2027-08-31",
    status: "待簽署",
    scope: ["星光舞台"],
    sections: [
      { heading: "附約目的", body: "追加「星光舞台」卡池之限定卡面授權，卡牌張數與上架時間依後台設定。" },
      { heading: "分潤來源", body: "與主約一致：僅付費抽卡的實際消費產生分潤。" },
      { heading: "簽署方式", body: "原型階段不提供真實電子簽署；按下簽署僅顯示 Demo 流程與狀態變化示意。" },
    ],
  },
  {
    id: "ct-101",
    title: "女神合作條款",
    version: "v1.1",
    effectiveFrom: "2026-06-01",
    effectiveTo: "2026-08-31",
    status: "已到期",
    signedAt: "2026-05-24",
    scope: ["夜櫻回憶"],
    sections: [
      { heading: "合作範圍", body: "已到期版本，僅供查閱。" },
      { heading: "分潤來源", body: "與現行版本一致：僅付費抽卡的實際消費產生分潤。" },
    ],
  },
];

export const contractById = (id: string) => CONTRACTS.find((c) => c.id === id);

// ── 公開資料與素材狀態（Mock）──────────────────────────────
export const GODDESS_PROFILE_DRAFT = {
  displayName: "夜澄",
  title: "星夜的低語者",
  intro:
    "以星空與夜色為主題的創作者女神，擅長療癒系語音與深夜直播。卡面以深藍與銀河粒子構成。",
  tags: ["療癒", "深夜電台", "星空"],
  links: [
    { label: "官方社群 A", url: "https://example.com/demo-a" },
    { label: "官方社群 B", url: "https://example.com/demo-b" },
    { label: "影音頻道", url: "https://example.com/demo-v" },
  ],
};

export const PROFILE_MATERIALS = [
  { id: "m-1", name: "主視覺形象圖", spec: "2048×2732（3:4）", status: "已通過" as const, updatedAt: "2026-09-02" },
  { id: "m-2", name: "卡牌素材・制服序章", spec: "2:3 卡面 ×6", status: "已通過" as const, updatedAt: "2026-09-10" },
  { id: "m-3", name: "卡牌素材・星光舞台", spec: "2:3 卡面 ×4", status: "審核中" as const, updatedAt: "2026-09-19" },
  { id: "m-4", name: "動態光效素材", spec: "MP4／透明序列", status: "待補件" as const, updatedAt: "2026-09-16" },
];

export const GODDESS_TBD = [
  "分潤比例與級距：依合作合約，介面不顯示未核定數字",
  "結算週期與付款時程：Demo／待定",
  "提領門檻、手續費與稅務處理：待定",
  "電子簽署服務與法律效力流程：待定",
  "素材退版與卡牌下架後的分潤處理：待定",
];
