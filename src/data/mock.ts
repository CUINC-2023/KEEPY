// ─────────────────────────────────────────────────────────────
// CU 女神卡 — Mock Data 層
// 僅本地假資料，無任何後端、金流、真實亂數或真實分潤計算。
// ─────────────────────────────────────────────────────────────

/** 卡牌等級（由低到高） */
export const GRADES = [
  "C",
  "U",
  "R",
  "RR",
  "RRR",
  "SR",
  "SSR",
  "HR",
  "UR",
  "O",
] as const;

export type Rarity = (typeof GRADES)[number];

export const gradeIndex = (g: Rarity) => GRADES.indexOf(g);

/** 卡面漸層（對應 styles.css 的 .rarity-grad-*） */
export const GRADE_GRADIENT: Record<Rarity, string> = {
  C: "rarity-grad-c",
  U: "rarity-grad-u",
  R: "rarity-grad-r",
  RR: "rarity-grad-rr",
  RRR: "rarity-grad-rrr",
  SR: "rarity-grad-sr",
  SSR: "rarity-grad-ssr",
  HR: "rarity-grad-hr",
  UR: "rarity-grad-ur",
  O: "rarity-grad-o",
};

/** 高階等級（卡框加上柔金邊） */
export const isHighGrade = (g: Rarity) => gradeIndex(g) >= gradeIndex("SSR");

/** 下一個等級（合成成功用） */
export const nextGrade = (g: Rarity): Rarity =>
  GRADES[Math.min(GRADES.length - 1, gradeIndex(g) + 1)]!;

// ── 統一文案：分潤規則（未核定數字一律不顯示）─────────────
export const SPLIT_POLICY_NOTE = "實際分潤比例依合作合約";
/** 抽卡保底尚未核定，統一使用此說明 */
export const DRAW_PITY_TBD =
  "抽卡保底機制、門檻、適用等級與卡池結束後處理方式皆為 Demo 規則／待定。";
export const SPLIT_SOURCE_NOTE =
  "僅玩家以現金或付費點數完成抽卡的實際消費，才會產生合作女神分潤。免費抽卡、合成、卡牌成長、商城道具與其他遊戲行為均不產生分潤。";

// ── 女神 ───────────────────────────────────────────────────
export interface Goddess {
  id: string;
  name: string;
  title: string;
  grade: Rarity; // 代表卡等級
  element: string;
  silhouette: "a" | "b" | "c" | "d";
  level: number;
  affinity: number;
  status: "live" | "pending" | "resting";
  intro: string;
  tags: string[];
  supporters: number;
  debutAt: string;
  poolIds: string[];
}

export const GODDESSES: Goddess[] = [
  {
    id: "g-yoru",
    name: "夜澄",
    title: "星夜的低語者",
    grade: "UR",
    element: "星夜",
    silhouette: "a",
    level: 42,
    affinity: 86,
    status: "live",
    intro:
      "以星空與夜色為主題的創作者女神，擅長療癒系語音與深夜直播。卡面以深藍與銀河粒子構成。",
    tags: ["療癒", "深夜電台", "星空"],
    supporters: 12840,
    debutAt: "2025-11-02",
    poolIds: ["p-uniform", "p-starlight"],
  },
  {
    id: "g-akane",
    name: "茜音",
    title: "晨光的祝禱者",
    grade: "SSR",
    element: "晨光",
    silhouette: "b",
    level: 31,
    affinity: 72,
    status: "live",
    intro: "晨間系創作者，卡片以日出、光輝與祝福為核心意象。",
    tags: ["晨間", "歌唱", "祝福"],
    supporters: 8620,
    debutAt: "2025-12-18",
    poolIds: ["p-uniform", "p-starlight"],
  },
  {
    id: "g-mizuki",
    name: "水月",
    title: "月映的詩人",
    grade: "HR",
    element: "月映",
    silhouette: "c",
    level: 27,
    affinity: 64,
    status: "resting",
    intro: "書寫短詩與月夜隨筆的文青系女神，卡片設計充滿和風留白。",
    tags: ["文字", "和風", "夜"],
    supporters: 6150,
    debutAt: "2026-01-09",
    poolIds: ["p-starlight", "p-sakura"],
  },
  {
    id: "g-hinari",
    name: "陽里",
    title: "暖陽的嚮導",
    grade: "SR",
    element: "暖陽",
    silhouette: "d",
    level: 19,
    affinity: 58,
    status: "live",
    intro: "運動與戶外主題創作者，卡片帶有朝氣十足的暖色調。",
    tags: ["運動", "戶外", "元氣"],
    supporters: 3480,
    debutAt: "2026-02-14",
    poolIds: ["p-uniform"],
  },
  {
    id: "g-shion",
    name: "紫苑",
    title: "薄霧的觀測者",
    grade: "RRR",
    element: "薄霧",
    silhouette: "c",
    level: 15,
    affinity: 47,
    status: "pending",
    intro: "科學與占星交錯的知性系女神，正在等待合作審核結果。",
    tags: ["知性", "占星", "科普"],
    supporters: 2130,
    debutAt: "2026-04-01",
    poolIds: ["p-starlight"],
  },
  {
    id: "g-kohaku",
    name: "琥珀",
    title: "微光的收藏家",
    grade: "RR",
    element: "微光",
    silhouette: "b",
    level: 9,
    affinity: 35,
    status: "live",
    intro: "手作雜貨與老物件收藏主題，卡片風格溫暖樸實。",
    tags: ["手作", "雜貨", "日常"],
    supporters: 960,
    debutAt: "2026-05-20",
    poolIds: ["p-uniform", "p-sakura"],
  },
  {
    id: "g-yuki",
    name: "雪乃",
    title: "初雪的見習生",
    grade: "R",
    element: "初雪",
    silhouette: "a",
    level: 4,
    affinity: 20,
    status: "live",
    intro: "剛通過審核的新人女神，以冬日日常為創作主題。",
    tags: ["新人", "冬日", "日常"],
    supporters: 230,
    debutAt: "2026-08-08",
    poolIds: ["p-uniform"],
  },
];

export const goddessById = (id: string): Goddess =>
  GODDESSES.find((g) => g.id === id) ?? GODDESSES[0]!;

// ── 卡池 ───────────────────────────────────────────────────
export interface GradeRate {
  grade: Rarity;
  pct: number;
}

/** 卡池類型（Batch 5：多卡池範本） */
export type PoolKind =
  | "permanent"
  | "limited"
  | "seasonal"
  | "collab"
  | "period"
  | "anniversary";

export const POOL_KIND_LABEL: Record<PoolKind, string> = {
  permanent: "常駐型",
  limited: "限定型",
  seasonal: "季節限定型",
  collab: "合作企劃型",
  period: "期間限定型",
  anniversary: "紀念型",
};

/** 常駐 / 限定 兩大分類（前台篩選用） */
export const poolPermanence = (kind: PoolKind): "permanent" | "limited" =>
  kind === "permanent" ? "permanent" : "limited";

export interface Pool {
  id: string;
  name: string;
  subtitle: string;
  kind: PoolKind;
  status: "live" | "upcoming" | "ended";
  startAt: string;
  endAt: string;
  coverGrade: Rarity; // 主圖漸層取自等級色
  /** 卡池主題色（封面與標籤用，Demo 視覺） */
  themeClass: string;
  themeName: string;
  goddessIds: string[];
  cardCount: number;
  singlePricePoints: number;
  tenPricePoints: number;
  pointsPriceNote: string;
  rates: GradeRate[];
  pityNote: string[];
  featuredCardIds: string[];
  /** 合成條件版本（Mock） */
  synthesisVersion: string;
  description: string;
}

export const POOLS: Pool[] = [
  {
    id: "p-uniform",
    name: "制服序章",
    subtitle: "Uniform Prologue",
    kind: "permanent",
    status: "live",
    startAt: "2026-09-12",
    endAt: "2026-12-31",
    coverGrade: "SSR",
    themeClass: "from-violet-glow/70 via-primary/40 to-ink",
    themeName: "紫羅蘭・校園",
    goddessIds: ["g-yoru", "g-akane", "g-hinari", "g-kohaku", "g-yuki"],
    cardCount: 40,
    singlePricePoints: 100,
    tenPricePoints: 900,
    pointsPriceNote: "點數可由現金購買，價格與方案為 Mock 示意",
    rates: [
      { grade: "O", pct: 0.1 },
      { grade: "UR", pct: 0.4 },
      { grade: "HR", pct: 1.0 },
      { grade: "SSR", pct: 2.5 },
      { grade: "SR", pct: 6.0 },
      { grade: "RRR", pct: 10.0 },
      { grade: "RR", pct: 14.0 },
      { grade: "R", pct: 20.0 },
      { grade: "U", pct: 22.0 },
      { grade: "C", pct: 24.0 },
    ],
    pityNote: [DRAW_PITY_TBD],
    featuredCardIds: ["c-u-01", "c-u-02", "c-u-03", "c-u-04"],
    synthesisVersion: "v2",
    description:
      "常駐型首波卡池，以校園制服為主題，收錄 5 位合作女神的全等級卡面。",
  },
  {
    id: "p-starlight",
    name: "星光舞台",
    subtitle: "Starlight Stage",
    kind: "limited",
    status: "upcoming",
    startAt: "2026-10-15",
    endAt: "2026-11-15",
    coverGrade: "UR",
    themeClass: "from-gold/60 via-primary/35 to-ink",
    themeName: "柔金・舞台燈",
    goddessIds: ["g-yoru", "g-akane", "g-mizuki", "g-shion"],
    cardCount: 32,
    singlePricePoints: 120,
    tenPricePoints: 1080,
    pointsPriceNote: "點數可由現金購買，價格與方案為 Mock 示意",
    rates: [
      { grade: "O", pct: 0.15 },
      { grade: "UR", pct: 0.5 },
      { grade: "HR", pct: 1.2 },
      { grade: "SSR", pct: 3.0 },
      { grade: "SR", pct: 7.0 },
      { grade: "RRR", pct: 11.0 },
      { grade: "RR", pct: 15.0 },
      { grade: "R", pct: 20.15 },
      { grade: "U", pct: 21.0 },
      { grade: "C", pct: 21.0 },
    ],
    pityNote: [DRAW_PITY_TBD, "開池前可先預覽卡牌與機率，開池後才可抽卡。"],
    featuredCardIds: ["c-s-01", "c-s-02", "c-s-03"],
    synthesisVersion: "v1",
    description:
      "限定型卡池，以演唱會舞台燈光為題，包含舞台限定 UR 卡面與動態光效示意。",
  },
  {
    id: "p-summer",
    name: "盛夏海風",
    subtitle: "Summer Breeze",
    kind: "seasonal",
    status: "live",
    startAt: "2026-09-01",
    endAt: "2026-10-05",
    coverGrade: "SR",
    themeClass: "from-cyan-300/40 via-primary/35 to-ink",
    themeName: "海藍・盛夏",
    goddessIds: ["g-akane", "g-hinari", "g-yuki"],
    cardCount: 36,
    singlePricePoints: 110,
    tenPricePoints: 990,
    pointsPriceNote: "點數可由現金購買，價格與方案為 Mock 示意",
    rates: [
      { grade: "O", pct: 0.12 },
      { grade: "UR", pct: 0.48 },
      { grade: "HR", pct: 1.1 },
      { grade: "SSR", pct: 2.8 },
      { grade: "SR", pct: 6.5 },
      { grade: "RRR", pct: 10.5 },
      { grade: "RR", pct: 14.5 },
      { grade: "R", pct: 20.0 },
      { grade: "U", pct: 21.0 },
      { grade: "C", pct: 23.0 },
    ],
    pityNote: [DRAW_PITY_TBD],
    featuredCardIds: [],
    synthesisVersion: "v1",
    description:
      "季節限定型卡池，以夏日海邊與祭典為主題，卡面以海藍與陽光粒子構成。",
  },
  {
    id: "p-kimono",
    name: "和風綺想",
    subtitle: "Kimono Fantasia",
    kind: "collab",
    status: "upcoming",
    startAt: "2026-10-28",
    endAt: "2026-11-30",
    coverGrade: "HR",
    themeClass: "from-rose-300/40 via-primary/30 to-ink",
    themeName: "淡櫻・和風",
    goddessIds: ["g-mizuki", "g-shion", "g-yuki"],
    cardCount: 30,
    singlePricePoints: 130,
    tenPricePoints: 1170,
    pointsPriceNote: "點數可由現金購買，價格與方案為 Mock 示意",
    rates: [
      { grade: "O", pct: 0.2 },
      { grade: "UR", pct: 0.6 },
      { grade: "HR", pct: 1.4 },
      { grade: "SSR", pct: 3.2 },
      { grade: "SR", pct: 7.6 },
      { grade: "RRR", pct: 11.0 },
      { grade: "RR", pct: 15.0 },
      { grade: "R", pct: 19.0 },
      { grade: "U", pct: 20.0 },
      { grade: "C", pct: 22.0 },
    ],
    pityNote: [DRAW_PITY_TBD, "合作企劃卡池的授權範圍與素材規格為 Demo／待定。"],
    featuredCardIds: [],
    synthesisVersion: "v1",
    description:
      "合作企劃型卡池，以和服與夜市綺想為主題，卡面留白帶有日系插畫感。",
  },
  {
    id: "p-night-cherry",
    name: "夜櫻回憶",
    subtitle: "Night Sakura",
    kind: "period",
    status: "ended",
    startAt: "2026-07-01",
    endAt: "2026-08-20",
    coverGrade: "RRR",
    themeClass: "from-fuchsia-300/35 via-primary/25 to-ink",
    themeName: "夜櫻・薄紫",
    goddessIds: ["g-mizuki", "g-kohaku"],
    cardCount: 28,
    singlePricePoints: 100,
    tenPricePoints: 900,
    pointsPriceNote: "已結束，僅供資料查閱",
    rates: [
      { grade: "O", pct: 0.1 },
      { grade: "UR", pct: 0.4 },
      { grade: "HR", pct: 1.0 },
      { grade: "SSR", pct: 2.5 },
      { grade: "SR", pct: 6.0 },
      { grade: "RRR", pct: 10.0 },
      { grade: "RR", pct: 15.0 },
      { grade: "R", pct: 20.0 },
      { grade: "U", pct: 22.0 },
      { grade: "C", pct: 23.0 },
    ],
    pityNote: ["本卡池已結束，卡牌不再發行。", DRAW_PITY_TBD],
    featuredCardIds: [],
    synthesisVersion: "v3",
    description:
      "期間限定型卡池，已於 2026-08-20 結束，卡牌保留於玩家收藏與卡冊中。",
  },
  {
    id: "p-anniversary",
    name: "一週年紀念",
    subtitle: "First Anniversary",
    kind: "anniversary",
    status: "ended",
    startAt: "2026-05-20",
    endAt: "2026-06-20",
    coverGrade: "UR",
    themeClass: "from-amber-200/45 via-gold/25 to-ink",
    themeName: "香檳金・紀念",
    goddessIds: ["g-yoru", "g-kohaku"],
    cardCount: 24,
    singlePricePoints: 100,
    tenPricePoints: 900,
    pointsPriceNote: "已結束，僅供資料查閱",
    rates: [
      { grade: "O", pct: 0.25 },
      { grade: "UR", pct: 0.75 },
      { grade: "HR", pct: 2.0 },
      { grade: "SSR", pct: 4.0 },
      { grade: "SR", pct: 8.0 },
      { grade: "RRR", pct: 12.0 },
      { grade: "RR", pct: 15.0 },
      { grade: "R", pct: 18.0 },
      { grade: "U", pct: 19.0 },
      { grade: "C", pct: 21.0 },
    ],
    pityNote: ["本卡池已結束，卡牌不再發行。", DRAW_PITY_TBD],
    featuredCardIds: [],
    synthesisVersion: "v2",
    description:
      "紀念型卡池，收錄一週年紀念卡面，已結束並完整保留於玩家卡冊。",
  },
  {
    id: "p-keepy-sample", name: "星光收藏", subtitle: "KEEPY · Starlight Collection · 範例／非正式上架",
    kind: "limited", status: "upcoming", startAt: "未開放", endAt: "未定",
    coverGrade: "SSR", themeClass: "from-indigo-900 via-violet-900 to-ink", themeName: "星光・示意",
    goddessIds: [], cardCount: 3, singlePricePoints: 0, tenPricePoints: 0,
    pointsPriceNote: "範例／非正式上架：無定價，不可交易", rates: [],
    pityNote: ["純卡面示意，無抽卡機率或保底承諾。"],
    featuredCardIds: ["c-keepy-01", "c-keepy-02", "c-keepy-03"],
    synthesisVersion: "範例", description: "三張虛構人物卡面，僅供 KEEPY 介面展示；未正式上架、不可抽卡或兌換。",
  },
];

export const poolById = (id: string): Pool | undefined =>
  POOLS.find((p) => p.id === id);

export const poolsByStatus = (status: Pool["status"]) =>
  POOLS.filter((p) => p.status === status);

// ── 卡牌 ───────────────────────────────────────────────────
export interface CardDef {
  id: string;
  poolId: string;
  goddessId: string;
  grade: Rarity;
  name: string;
  releasedAt: string;
  /** Optional artwork for fictional specimen cards only. */
  art?: string;
}

import { KEEPY_SAMPLE_CARDS, KEEPY_SAMPLE_POOL_ID } from "@/data/keepy-sample";

const MANUAL_CARDS: CardDef[] = [
  { id: "c-u-01", poolId: "p-uniform", goddessId: "g-yoru", grade: "UR", name: "夜澄・放學後的星圖", releasedAt: "2026-09-12" },
  { id: "c-u-02", poolId: "p-uniform", goddessId: "g-akane", grade: "SSR", name: "茜音・晨讀教室", releasedAt: "2026-09-12" },
  { id: "c-u-03", poolId: "p-uniform", goddessId: "g-hinari", grade: "SR", name: "陽里・操場的風", releasedAt: "2026-09-12" },
  { id: "c-u-04", poolId: "p-uniform", goddessId: "g-kohaku", grade: "RRR", name: "琥珀・社辦的午後", releasedAt: "2026-09-14" },
  { id: "c-u-05", poolId: "p-uniform", goddessId: "g-yuki", grade: "RR", name: "雪乃・初次值日", releasedAt: "2026-09-16" },
  { id: "c-u-06", poolId: "p-uniform", goddessId: "g-yuki", grade: "C", name: "雪乃・制服日常", releasedAt: "2026-09-16" },
  { id: "c-s-01", poolId: "p-starlight", goddessId: "g-yoru", grade: "O", name: "夜澄・銀河安可", releasedAt: "2026-10-15" },
  { id: "c-s-02", poolId: "p-starlight", goddessId: "g-akane", grade: "HR", name: "茜音・開場第一束光", releasedAt: "2026-10-15" },
  { id: "c-s-03", poolId: "p-starlight", goddessId: "g-mizuki", grade: "SSR", name: "水月・詩與聚光燈", releasedAt: "2026-10-15" },
  { id: "c-s-04", poolId: "p-starlight", goddessId: "g-shion", grade: "SR", name: "紫苑・後台觀測", releasedAt: "2026-10-15" },
  ...KEEPY_SAMPLE_CARDS.map((c) => ({ id: c.id, poolId: KEEPY_SAMPLE_POOL_ID, goddessId: "g-yoru", grade: "SSR" as Rarity, name: c.name, releasedAt: "未上架", art: c.art })),
];

/** 每個卡池的可視化範例卡牌名稱（虛構內容） */
const POOL_CARD_TITLES: Record<string, string[]> = {
  "p-uniform": ["頂樓的風鈴", "走廊光斑", "午休的耳機", "雨天的傘", "值日生日誌", "圖書室低語"],
  "p-starlight": ["舞台前排", "聚光燈下", "後台鏡前", "安可的手勢", "第一束光", "星屑之詩"],
  "p-summer": ["海風的裙擺", "午後汽水", "沙灘腳印", "祭典金魚", "煙火倒數", "夏夜縁側", "防波堤黃昏", "泳池折光", "冰棒對半", "日落公車"],
  "p-kimono": ["緣日浴衣", "紙傘微光", "神社石階", "風鈴小徑", "夜市面具", "和室午茶", "簪花側臉", "楓葉迴廊", "御守之約", "初詣清晨"],
  "p-night-cherry": ["夜櫻並木", "花瓣風信", "石燈籠下", "河岸倒影", "夜行電車", "櫻雨告白", "月映水面", "終幕的手", "落花枕", "春宵獨白"],
  "p-anniversary": ["一週年蛋糕", "感謝的花束", "紀念徽章", "回顧相簿", "香檳金幕", "初心的頁", "祝賀煙火", "紀念寫真", "來自玩家的信", "第一年的光"],
};

/** 每個卡池補齊至 10 張可視化範例卡牌（固定資料，非亂數） */
function buildFeaturedCards(): CardDef[] {
  const out: CardDef[] = [...MANUAL_CARDS];
  const ladder: Rarity[] = ["C", "U", "R", "RR", "RRR", "SR", "SSR", "HR", "UR", "O"];
  for (const pool of POOLS) {
    if (pool.id === KEEPY_SAMPLE_POOL_ID) continue;
    const titles = POOL_CARD_TITLES[pool.id] ?? [];
    const existing = out.filter((c) => c.poolId === pool.id).length;
    for (let i = existing; i < 10; i++) {
      const goddessId = pool.goddessIds[i % pool.goddessIds.length]!;
      const goddess = goddessById(goddessId);
      const title = titles[(i + existing) % Math.max(1, titles.length)] ?? "剪影範本";
      out.push({
        id: `${pool.id}-f${String(i + 1).padStart(2, "0")}`,
        poolId: pool.id,
        goddessId,
        grade: ladder[i % ladder.length]!,
        name: `${goddess.name}・${title}`,
        releasedAt: pool.startAt,
      });
    }
  }
  return out;
}

export const CARDS: CardDef[] = buildFeaturedCards();

export const cardById = (id: string) => CARDS.find((c) => c.id === id);
export const cardsByPool = (poolId: string) =>
  CARDS.filter((c) => c.poolId === poolId);
export const LATEST_CARDS = [...CARDS]
  .sort((a, b) => (a.releasedAt < b.releasedAt ? 1 : -1))
  .slice(0, 6);

// ── 玩家收藏 ───────────────────────────────────────────────
export interface OwnedCard {
  id: string;
  cardId: string;
  goddessId: string;
  grade: Rarity;
  level: number;
  /** 同女神同等級同卡牌的重複卡：每張 10% 成長值 */
  dupes: number;
  growthPct: number;
  obtainedAt: string;
}

export const OWNED_CARDS: OwnedCard[] = [
  { id: "o-001", cardId: "c-u-01", goddessId: "g-yoru", grade: "UR", level: 4, dupes: 6, growthPct: 60, obtainedAt: "2026-09-13" },
  { id: "o-002", cardId: "c-u-02", goddessId: "g-akane", grade: "SSR", level: 3, dupes: 2, growthPct: 20, obtainedAt: "2026-09-14" },
  { id: "o-003", cardId: "c-u-03", goddessId: "g-hinari", grade: "SR", level: 2, dupes: 9, growthPct: 90, obtainedAt: "2026-09-15" },
  { id: "o-004", cardId: "c-u-04", goddessId: "g-kohaku", grade: "RRR", level: 2, dupes: 3, growthPct: 30, obtainedAt: "2026-09-16" },
  { id: "o-005", cardId: "c-u-05", goddessId: "g-yuki", grade: "RR", level: 1, dupes: 0, growthPct: 0, obtainedAt: "2026-09-17" },
  { id: "o-006", cardId: "c-u-06", goddessId: "g-yuki", grade: "C", level: 1, dupes: 1, growthPct: 10, obtainedAt: "2026-09-18" },
];

export const LOCKED_GODDESS_IDS = GODDESSES.filter(
  (g) => !OWNED_CARDS.some((c) => c.goddessId === g.id)
).map((g) => g.id);

/** 目前進行中卡池的蒐集進度 */
/** 各卡池玩家已取得張數（Batch 5 核定 Mock 數值，分母為卡冊完整總數 pool.cardCount） */
export const POOL_ALBUM_OWNED: Record<string, number> = {
  "p-uniform": 18,
  "p-starlight": 0,
  "p-summer": 12,
  "p-kimono": 0,
  "p-night-cherry": 21,
  "p-anniversary": 24,
};

/** 卡冊蒐集進度：一律使用卡冊完整總數為分母，不使用可視化範例卡牌數 */
export const poolCollectProgress = (poolId: string) => {
  const total = poolById(poolId)?.cardCount ?? cardsByPool(poolId).length;
  const owned = POOL_ALBUM_OWNED[poolId] ?? 0;
  /** 已繪製的範例卡面數量（僅用於預覽區說明，不作為完成率分母） */
  const previewCount = cardsByPool(poolId).length;
  return {
    owned,
    total,
    previewCount,
    pct: total ? Math.round((owned / total) * 100) : 0,
  };
};

// ── 收益（女神後台，新台幣，僅付費抽卡消費產生）─────────────
export interface EarningsRecord {
  id: string;
  period: string;
  poolName: string;
  goddessId: string;
  paidDrawCount: number;
  amountTwd: number;
  status: "待結算" | "可結算" | "已結算";
}

export const EARNINGS: EarningsRecord[] = [
  { id: "e-101", period: "2026-09 上半月", poolName: "制服序章", goddessId: "g-yoru", paidDrawCount: 1840, amountTwd: 12400, status: "可結算" },
  { id: "e-102", period: "2026-09 上半月", poolName: "制服序章", goddessId: "g-akane", paidDrawCount: 1260, amountTwd: 8600, status: "可結算" },
  { id: "e-103", period: "2026-09 下半月", poolName: "制服序章", goddessId: "g-yoru", paidDrawCount: 780, amountTwd: 5300, status: "待結算" },
  { id: "e-104", period: "2026-08", poolName: "夜櫻回憶", goddessId: "g-mizuki", paidDrawCount: 2110, amountTwd: 14200, status: "已結算" },
  { id: "e-105", period: "2026-07", poolName: "夜櫻回憶", goddessId: "g-kohaku", paidDrawCount: 640, amountTwd: 4300, status: "已結算" },
];

// ── 合成 ───────────────────────────────────────────────────
export interface FusionRecipe {
  id: string;
  name: string;
  mode: "random" | "growth";
  inputNote: string;
  successNote: string;
  failNote: string;
  pityNote: string;
}

export const FUSION_RECIPES: FusionRecipe[] = [
  {
    id: "f-random",
    name: "隨機卡牌合成",
    mode: "random",
    inputNote: "投入同卡池的卡牌作為素材。",
    successNote: "成功時取得該卡池隨機「上一級」卡牌。",
    failNote: "失敗時取得隨機「同級」卡牌，素材不會歸還。",
    pityNote: "一般合成連續失敗 10 次，第 10 次觸發保底升級。",
  },
  {
    id: "f-growth",
    name: "重複卡成長",
    mode: "growth",
    inputNote: "投入同女神、同等級、同卡牌的重複卡。",
    successNote: "每張重複卡累積 10% 成長值，累積 10 張／100% 直接升一級。",
    failNote: "成長不會失敗，也不會產生分潤。",
    pityNote: "成長值上限為 100%，達成後立即升級並歸零重新累積。",
  },
];

// ── 商城道具（僅增加合成成功率）─────────────────────────────
export const SHOP_ITEMS = [
  { id: "i-1", name: "合成穩定劑 I", effect: "合成成功率 +5%", pricePoints: 120 },
  { id: "i-2", name: "合成穩定劑 II", effect: "合成成功率 +12%", pricePoints: 300 },
  { id: "i-3", name: "星光觸媒", effect: "合成成功率 +20%", pricePoints: 680 },
];

// ── 排行榜 ─────────────────────────────────────────────────
export interface PoolRankRow {
  rank: number;
  player: string;
  poolId: string;
  ownedCards: number;
  totalCards: number;
}

export interface LevelRankRow {
  rank: number;
  player: string;
  level: number;
  topGrade: Rarity;
}

export const POOL_RANKING: PoolRankRow[] = [
  { rank: 1, player: "星野巡", poolId: "p-uniform", ownedCards: 46, totalCards: 48 },
  { rank: 2, player: "月見リン", poolId: "p-uniform", ownedCards: 44, totalCards: 48 },
  { rank: 3, player: "夜行列車", poolId: "p-uniform", ownedCards: 41, totalCards: 48 },
  { rank: 4, player: "白晝夢", poolId: "p-uniform", ownedCards: 38, totalCards: 48 },
  { rank: 5, player: "旅人・星野", poolId: "p-uniform", ownedCards: 35, totalCards: 48 },
  { rank: 6, player: "琥珀糖", poolId: "p-uniform", ownedCards: 31, totalCards: 48 },
  { rank: 7, player: "初雪計畫", poolId: "p-uniform", ownedCards: 28, totalCards: 48 },
  { rank: 8, player: "薄霧觀測所", poolId: "p-uniform", ownedCards: 24, totalCards: 48 },
];

export const LEVEL_RANKING: LevelRankRow[] = [
  { rank: 1, player: "星野巡", level: 88, topGrade: "O" },
  { rank: 2, player: "夜行列車", level: 81, topGrade: "UR" },
  { rank: 3, player: "月見リン", level: 76, topGrade: "UR" },
  { rank: 4, player: "白晝夢", level: 70, topGrade: "HR" },
  { rank: 5, player: "旅人・星野", level: 64, topGrade: "UR" },
  { rank: 6, player: "琥珀糖", level: 59, topGrade: "SSR" },
  { rank: 7, player: "初雪計畫", level: 52, topGrade: "SSR" },
  { rank: 8, player: "薄霧觀測所", level: 47, topGrade: "SR" },
];

// ── 公告 ───────────────────────────────────────────────────
export const ANNOUNCEMENTS = [
  { id: "a-1", date: "2026-09-18", tag: "卡池", title: "「制服序章」新增 2 張 RRR 卡面" },
  { id: "a-2", date: "2026-09-15", tag: "預告", title: "「星光舞台」將於 10/15 開池，機率已公開" },
  { id: "a-3", date: "2026-09-10", tag: "規則", title: "合成保底次數說明更新：連續失敗 10 次觸發" },
  { id: "a-4", date: "2026-09-02", tag: "維護", title: "9/20 03:00–05:00 系統維護（Demo 公告）" },
];

// ── 玩家 ───────────────────────────────────────────────────
export const PLAYER_PROFILE = {
  name: "旅人・星野",
  level: 64,
  points: 2480, // 付費點數（Mock）
  goddessModeUnlocked: true,
  activeMode: "player" as "player" | "goddess",
  collectionCount: OWNED_CARDS.length,
  collectionTotal: CARDS.length,
};

// ── Demo 假抽卡（固定可重現，不使用真實亂數）─────────────────
export function mockDrawOnce(offset: number = 0, poolId = "p-uniform"): CardDef {
  const list = cardsByPool(poolId);
  if (list.length === 0) return CARDS[0]!;
  return list[(offset * 3 + 1) % list.length]!;
}

export function mockDrawTen(poolId = "p-uniform"): CardDef[] {
  // Legacy fixed fixture: ten paid examples plus one bonus draw (full card, counts toward pity); no real draw or debit.
  return Array.from({ length: 11 }, (_, i) => mockDrawOnce(i, poolId));
}
