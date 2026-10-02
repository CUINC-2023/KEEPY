// ─────────────────────────────────────────────────────────────
// KEEPY — 玩家模式 Mock 資料（Batch 2；Batch 5 擴充為 6 本卡冊）
// 全部為本地假資料：無後端、無真實金流、無真實亂數。
// 抽卡與合成結果皆為「預先定義」的固定結果。
// ─────────────────────────────────────────────────────────────
import {
  GRADES,
  POOLS,
  POOL_ALBUM_OWNED,
  gradeIndex,
  goddessById,
  poolById,
  type Goddess,
  type Pool,
  type Rarity,
} from "@/data/mock";
import { KEEPY_SAMPLE_CARDS, KEEPY_SAMPLE_POOL_ID } from "@/data/keepy-sample";

/** 點數扣抵順序尚未定案 */
export const POINT_DEDUCT_NOTE = "KP 規劃扣抵：贈點先扣、付費點最後；僅為規格說明，不執行真實扣點。";
export const NO_SPLIT_ON_FUSION_NOTE = "合成不產生女神分潤";
export const NO_SPLIT_ON_GROWTH_NOTE = "卡牌成長不產生女神分潤";
export const OFFLINE_RESUME_NOTE = "已取得結果，可恢復查看";

// ── 卡冊資料（每個卡池的完整卡牌清單 + 持有狀態）───────────────
export interface AlbumCard {
  id: string;
  poolId: string;
  poolName: string;
  goddessId: string;
  grade: Rarity;
  name: string;
  owned: boolean;
  /** 重複卡張數（不含第一張） */
  dupes: number;
  /** 成長值：每張重複卡 +10%，上限 100% */
  growthPct: number;
  /** 新卡標記（近期取得，Mock） */
  isNew: boolean;
  obtainedAt?: string;
  releasedAt: string;
}

/** 重複卡分佈（固定資料，非亂數） */
const DUPE_PATTERN = [
  10, 0, 0, 1, 1, 0, 0, 2, 0, 5,
  0, 1, 0, 0, 4, 0, 2, 0, 0, 1,
  0, 7, 0, 0, 1, 0, 1, 0, 0, 1,
  0, 0, 1, 0, 10, 0, 1,
];

const CARD_TITLES = [
  "放學後的星圖", "晨讀教室", "操場的風", "社辦的午後", "初次值日",
  "制服日常", "頂樓的風鈴", "走廊光斑", "午休的耳機", "雨天的傘",
  "夏季制服", "冬季外套", "圖書室低語", "轉角的目光", "值日生日誌",
  "課後練習", "體育館回音", "自習室夜燈", "校門的黃昏", "櫻並木",
  "舞台前排", "聚光燈下", "後台鏡前", "安可的手勢", "第一束光",
  "銀河安可", "詩與聚光燈", "觀測筆記", "夜行電車", "月映水面",
  "初雪清晨", "手作雜貨", "琥珀色午茶", "祭典金魚", "煙火倒數",
  "夏夜縁側", "深夜電台", "星屑之詩", "薄霧地平線", "終幕告白",
];

/** 各卡池卡牌總數與已持有數（單一來源：卡池 cardCount + POOL_ALBUM_OWNED） */
const POOL_ALBUM_CONFIG: Record<string, { total: number; owned: number }> = Object.fromEntries(
  POOLS.map((p) => [p.id, { total: p.cardCount, owned: POOL_ALBUM_OWNED[p.id] ?? 0 }])
);

/** 等級配置：保證每個等級至少 1 張，其餘偏向低等級（固定演算，非亂數） */
function gradeLayout(total: number): Rarity[] {
  const out: Rarity[] = [...GRADES];
  const fill: Rarity[] = [
    "C", "U", "C", "R", "U", "RR", "C", "R", "RRR", "U",
    "RR", "C", "SR", "R", "U", "RRR", "C", "RR", "SSR", "R",
  ];
  for (let i = out.length; i < total; i++) out.push(fill[i % fill.length]!);
  return out.sort((a, b) => gradeIndex(a) - gradeIndex(b));
}

function buildAlbum(): AlbumCard[] {
  const out: AlbumCard[] = [];
  let dupeCursor = 0;
  for (const pool of POOLS) {
    if (pool.id === KEEPY_SAMPLE_POOL_ID) {
      out.push(...KEEPY_SAMPLE_CARDS.map((c) => ({ id: c.id, poolId: pool.id, poolName: pool.name, goddessId: "g-yoru", grade: "SSR" as Rarity, name: c.name, owned: false, dupes: 0, growthPct: 0, isNew: false, releasedAt: "未上架" })));
      continue;
    }
    const cfg = POOL_ALBUM_CONFIG[pool.id] ?? { total: 12, owned: 4 };
    const grades = gradeLayout(cfg.total);
    // 已持有卡牌索引：以固定排序規則取前 owned 個（可重現，不使用亂數）
    const ownedSet = new Set(
      Array.from({ length: cfg.total }, (_, i) => i)
        .sort((a, b) => ((a * 37) % 101) - ((b * 37) % 101))
        .slice(0, cfg.owned)
    );
    const rows: AlbumCard[] = [];
    for (let i = 0; i < cfg.total; i++) {
      const goddessId = pool.goddessIds[i % pool.goddessIds.length]!;
      const goddess = goddessById(goddessId);
      const grade = grades[i]!;
      const owned = ownedSet.has(i);
      const dupes = owned ? (DUPE_PATTERN[dupeCursor % DUPE_PATTERN.length] ?? 0) : 0;
      if (owned) dupeCursor++;
      const month = pool.startAt.slice(0, 7);
      const day = String((i % 27) + 1).padStart(2, "0");
      rows.push({
        id: `${pool.id}-c${String(i + 1).padStart(2, "0")}`,
        poolId: pool.id,
        poolName: pool.name,
        goddessId,
        grade,
        name: `${goddess.name}・${CARD_TITLES[(i * 3) % CARD_TITLES.length]}`,
        owned,
        dupes,
        growthPct: Math.min(100, dupes * 10),
        isNew: false,
        ...(owned ? { obtainedAt: `${month}-${day}` } : {}),
        releasedAt: pool.startAt,
      });
    }
    // 新卡：進行中卡池取最近取得的 2 張（Mock）
    if (pool.status === "live") {
      rows
        .filter((c) => c.owned)
        .sort((a, b) => (a.obtainedAt! < b.obtainedAt! ? 1 : -1))
        .slice(0, 2)
        .forEach((c) => {
          c.isNew = true;
        });
    }
    out.push(...rows);
  }
  return out;
}

export const ALBUM: AlbumCard[] = buildAlbum();

export const albumCardById = (id: string) => ALBUM.find((c) => c.id === id);
export const albumByPool = (poolId: string) =>
  ALBUM.filter((c) => c.poolId === poolId);

export const ownedAlbumCards = () => ALBUM.filter((c) => c.owned);

/** 可升級：成長值已達 100% */
export const upgradableCards = () =>
  ALBUM.filter((c) => c.owned && c.growthPct >= 100);

/** 有重複卡 */
export const dupeCards = () => ALBUM.filter((c) => c.owned && c.dupes > 0);

/** 卡牌格狀態範本（卡冊 UI 用） */
export type AlbumTileState =
  | "new"
  | "upgradable"
  | "dupe"
  | "owned"
  | "missing"
  | "missed-ended"
  | "upcoming-locked";

export function albumTileState(card: AlbumCard, poolStatus: Pool["status"]): AlbumTileState {
  if (card.owned) {
    if (card.isNew) return "new";
    if (card.growthPct >= 100) return "upgradable";
    if (card.dupes > 0) return "dupe";
    return "owned";
  }
  if (poolStatus === "ended") return "missed-ended";
  if (poolStatus === "upcoming") return "upcoming-locked";
  return "missing";
}

export const ALBUM_TILE_LABEL: Record<AlbumTileState, string> = {
  new: "新卡",
  upgradable: "可升級",
  dupe: "有重複卡",
  owned: "已取得",
  missing: "未取得",
  "missed-ended": "活動結束仍未取得",
  "upcoming-locked": "即將開始・尚未開放",
};

export interface PoolAlbumProgress {
  poolId: string;
  poolName: string;
  owned: number;
  total: number;
  pct: number;
  byGrade: { grade: Rarity; owned: number; total: number }[];
  byGoddess: { goddessId: string; name: string; owned: number; total: number }[];
  /** 最高已取得等級 */
  topGrade?: Rarity;
  newCount: number;
  upgradableCount: number;
  dupeCount: number;
  lastObtainedAt?: string;
}

export function poolAlbumProgress(poolId: string): PoolAlbumProgress {
  const list = albumByPool(poolId);
  const pool = poolById(poolId);
  const ownedList = list.filter((c) => c.owned);
  const byGrade = GRADES.map((grade) => {
    const g = list.filter((c) => c.grade === grade);
    return { grade, owned: g.filter((c) => c.owned).length, total: g.length };
  }).filter((g) => g.total > 0);
  const goddessIds = Array.from(new Set(list.map((c) => c.goddessId)));
  const byGoddess = goddessIds.map((id) => {
    const g = list.filter((c) => c.goddessId === id);
    return {
      goddessId: id,
      name: poolId === KEEPY_SAMPLE_POOL_ID ? "虛構示意人物" : goddessById(id).name,
      owned: g.filter((c) => c.owned).length,
      total: g.length,
    };
  });
  const topGrade = ownedList
    .map((c) => c.grade)
    .sort((a, b) => gradeIndex(b) - gradeIndex(a))[0];
  const lastObtainedAt = ownedList
    .map((c) => c.obtainedAt!)
    .sort()
    .reverse()[0];
  return {
    poolId,
    poolName: pool?.name ?? poolId,
    owned: ownedList.length,
    total: list.length,
    pct: list.length ? Math.round((ownedList.length / list.length) * 100) : 0,
    byGrade,
    byGoddess,
    ...(topGrade ? { topGrade } : {}),
    newCount: ownedList.filter((c) => c.isNew).length,
    upgradableCount: ownedList.filter((c) => c.growthPct >= 100).length,
    dupeCount: ownedList.filter((c) => c.dupes > 0).length,
    ...(lastObtainedAt ? { lastObtainedAt } : {}),
  };
}

export const ALL_POOL_PROGRESS = POOLS.map((p) => poolAlbumProgress(p.id));

/** 卡冊完成狀態（總覽篩選用） */
export const albumCompletionState = (p: PoolAlbumProgress) =>
  p.owned === 0 ? "none" : p.owned >= p.total ? "done" : "collecting";

// ── 玩家基本資料（統計值由卡冊資料推導，保持一致）──────────────
const TOTAL_UNIQUE = ownedAlbumCards().length;
const TOTAL_CARDS =
  TOTAL_UNIQUE + ownedAlbumCards().reduce((s, c) => s + c.dupes, 0);
const ALBUM_TOTAL = ALBUM.length;

export const PLAYER = {
  name: "橘子收藏家",
  level: 18,
  /** 付費點數（現金購買，抽卡消費才會產生女神分潤） */
  paidPoints: 2400,
  /** 贈送點數（活動贈送，Demo） */
  freePoints: 300,
  /** 卡牌總數（含重複卡） */
  totalCards: TOTAL_CARDS,
  /** 不重複卡牌 */
  uniqueCards: TOTAL_UNIQUE,
  /** 卡冊完成率（由卡冊資料推導） */
  albumCompletionPct: Math.round((TOTAL_UNIQUE / ALBUM_TOTAL) * 100),
  poolRank: { poolId: "p-uniform", poolName: "制服序章", rank: 128 },
  levelRank: 356,
};

/** 最近取得卡牌（依取得時間排序，Mock） */
export const RECENT_CARDS = ownedAlbumCards()
  .slice()
  .sort((a, b) => (a.obtainedAt! < b.obtainedAt! ? 1 : -1))
  .slice(0, 6);

// ── 預先定義抽卡結果（不執行真實亂數）────────────────────────
/**
 * 內部抽卡事件來源（僅供稽核示意，不在卡面／卡冊／結果顯示為次級身分）。
 * bonus = 十抽送一抽的第 11 次：付費 KP 0、創作者分潤 0，但計入同池保底抽數。
 */
export interface DrawEventSource {
  kind: "paid" | "bonus";
  /** 此次抽卡扣除的付費 KP（Demo 示意） */
  paidKp: number;
  /** 此次抽卡產生的創作者分潤基礎（bonus 或保底結果恆為 0） */
  creatorShareBase: number;
  /** 是否計入同卡池保底抽數（已核定：bonus 亦計入） */
  countsTowardPity: true;
  /** 此次是否觸發保底（Demo 固定資料皆為 false；觸發時分潤仍為 0） */
  pityTriggered: boolean;
}

export interface DrawResultItem {
  card: AlbumCard;
  isNew: boolean;
  /** 內部事件來源；UI 不得據此降低卡牌收藏身分 */
  source: DrawEventSource;
  /** 抽卡前持有數 */
  ownedBefore: number;
  /** 抽卡前成長值 */
  growthBefore: number;
  /** 抽卡後成長值 */
  growthAfter: number;
}

function makeResult(cardId: string, isNew: boolean, kind: DrawEventSource["kind"] = "paid", paidKp = 0): DrawResultItem {
  const card = albumCardById(cardId) ?? ALBUM[0]!;
  const ownedBefore = isNew ? 0 : card.dupes + 1;
  const growthBefore = isNew ? 0 : card.growthPct;
  const pityTriggered = false;
  return {
    card,
    isNew,
    source: {
      kind,
      paidKp: kind === "bonus" ? 0 : paidKp,
      creatorShareBase: kind === "bonus" || pityTriggered ? 0 : paidKp,
      countsTowardPity: true,
      pityTriggered,
    },
    ownedBefore,
    growthBefore,
    growthAfter: isNew ? 0 : Math.min(100, growthBefore + 10),
  };
}

const U = (n: number) => `p-uniform-c${String(n).padStart(2, "0")}`;

/** 保底抽數示意起點（Demo，非正式門檻） */
export const DEMO_PITY_COUNT_BEFORE = 23;
/** 每次付費抽的 Demo KP（十抽 = 10 × 此值；第 11 次為 0） */
const DEMO_KP_PER_PAID = 30;

/** 單抽固定結果（Demo） */
export const PRESET_SINGLE: DrawResultItem[] = [makeResult(U(27), true, "paid", DEMO_KP_PER_PAID)];

/** 十抽送一抽：10 次付費＋第 11 次 bonus（內部來源）；結果固定，不更新任何持有、點數或分潤資料。 */
export const PRESET_TEN: DrawResultItem[] = [
  ...[
    [1, false], [4, false], [9, true], [12, false], [16, true],
    [21, false], [25, true], [30, false], [33, true], [39, true],
  ].map(([n, isNew]) => makeResult(U(n as number), isNew as boolean, "paid", DEMO_KP_PER_PAID)),
  makeResult(U(27), true, "bonus"),
];

/** 保底示意計數：每一次抽卡（含第 11 次）皆 +1 */
export function pityCountAfter(items: DrawResultItem[]) {
  return DEMO_PITY_COUNT_BEFORE + items.filter((i) => i.source.countsTowardPity).length;
}

// ── 合成（隨機合成）──────────────────────────────────────────
export const SYNTHESIS = {
  baseSuccessPct: 35,
  /** 商城道具加成（僅增加合成成功率） */
  itemBonusPct: 12,
  /** 連續失敗次數（Mock 進度） */
  failStreak: 6,
  pityAt: 10,
  note: "成功取得該卡池隨機上一級卡牌；失敗取得該卡池隨機同級卡牌；連續失敗累積 10 次即觸發保底取得上一級卡牌。",
  ruleTbd: "道具疊加上限、正式成功率公式尚未核定（Demo／待定）。",
};

/** 預先定義的合成結果（不使用亂數） */
export const PRESET_SYNTHESIS_SUCCESS = albumCardById(U(31))!;
export const PRESET_SYNTHESIS_FAIL = albumCardById(U(14))!;
export const PRESET_SYNTHESIS_PITY = albumCardById(U(37))!;

// ── 錢包 / 儲值方案（全部 Demo）───────────────────────────────
export interface TopUpPlan {
  id: string;
  name: string;
  paidPoints: number;
  bonusPoints: number;
  priceTwd: number;
  tag?: string;
}

export const TOPUP_PLANS: TopUpPlan[] = [
  { id: "t-1", name: "入門包", paidPoints: 300, bonusPoints: 0, priceTwd: 100 },
  { id: "t-2", name: "標準包", paidPoints: 900, bonusPoints: 30, priceTwd: 300, tag: "熱門" },
  { id: "t-3", name: "收藏包", paidPoints: 3000, bonusPoints: 200, priceTwd: 1000 },
  { id: "t-4", name: "典藏包", paidPoints: 9000, bonusPoints: 900, priceTwd: 3000, tag: "最高加贈" },
];

export interface OrderRow {
  id: string;
  createdAt: string;
  plan: string;
  amountTwd: number;
  method: string;
  status: "已完成" | "處理中" | "已退款";
}

export const ORDERS: OrderRow[] = [
  { id: "D-20260918-014", createdAt: "2026-09-18 21:04", plan: "標準包 900+30", amountTwd: 300, method: "信用卡（Demo）", status: "已完成" },
  { id: "D-20260914-208", createdAt: "2026-09-14 12:31", plan: "收藏包 3000+200", amountTwd: 1000, method: "信用卡（Demo）", status: "已完成" },
  { id: "D-20260910-077", createdAt: "2026-09-10 09:22", plan: "入門包 300", amountTwd: 100, method: "超商代碼（Demo）", status: "處理中" },
  { id: "D-20260902-031", createdAt: "2026-09-02 18:45", plan: "入門包 300", amountTwd: 100, method: "信用卡（Demo）", status: "已退款" },
];

export interface PointLedgerRow {
  id: string;
  createdAt: string;
  type: "儲值" | "抽卡" | "活動贈送" | "道具" | "退款";
  detail: string;
  paidDelta: number;
  freeDelta: number;
}

export const POINT_LEDGER: PointLedgerRow[] = [
  { id: "l-1", createdAt: "2026-09-19 22:10", type: "抽卡", detail: "制服序章 十抽送一抽（歷史 Demo 示例；第 11 張不扣點）", paidDelta: -900, freeDelta: 0 },
  { id: "l-2", createdAt: "2026-09-19 21:58", type: "抽卡", detail: "制服序章 單抽", paidDelta: -100, freeDelta: 0 },
  { id: "l-3", createdAt: "2026-09-18 21:04", type: "儲值", detail: "標準包 900+30（Demo）", paidDelta: 900, freeDelta: 30 },
  { id: "l-4", createdAt: "2026-09-17 10:00", type: "活動贈送", detail: "登入活動贈送點數", paidDelta: 0, freeDelta: 100 },
  { id: "l-5", createdAt: "2026-09-16 20:12", type: "道具", detail: "合成穩定劑 II", paidDelta: -300, freeDelta: 0 },
  { id: "l-6", createdAt: "2026-09-14 12:31", type: "儲值", detail: "收藏包 3000+200（Demo）", paidDelta: 3000, freeDelta: 200 },
  { id: "l-7", createdAt: "2026-09-02 18:45", type: "退款", detail: "訂單 D-20260902-031 退款（Demo）", paidDelta: -300, freeDelta: 0 },
];

export interface DrawHistoryRow {
  id: string;
  createdAt: string;
  poolName: string;
  mode: "單抽" | "十抽送一抽";
  costPoints: number;
  topGrade: Rarity;
  newCards: number;
}

export const DRAW_HISTORY: DrawHistoryRow[] = [
  { id: "h-1", createdAt: "2026-09-19 22:10", poolName: "制服序章", mode: "十抽送一抽", costPoints: 900, topGrade: "SSR", newCards: 5 },
  { id: "h-2", createdAt: "2026-09-19 21:58", poolName: "制服序章", mode: "單抽", costPoints: 100, topGrade: "RR", newCards: 1 },
  { id: "h-3", createdAt: "2026-09-18 23:40", poolName: "盛夏海風", mode: "十抽送一抽", costPoints: 990, topGrade: "SR", newCards: 3 },
  { id: "h-4", createdAt: "2026-09-17 20:05", poolName: "盛夏海風", mode: "單抽", costPoints: 110, topGrade: "R", newCards: 0 },
  { id: "h-5", createdAt: "2026-08-15 19:22", poolName: "夜櫻回憶", mode: "十抽送一抽", costPoints: 900, topGrade: "HR", newCards: 4 },
];

// ── 尚待決策清單（畫面標示待定用）──────────────────────────────
export const TBD_ITEMS = [
  "付費點數與贈送點數的扣抵順序",
  "正式抽卡保底次數與保底等級",
  "玩家經驗值與等級成長公式",
  "排行榜計分公式與結算週期",
  "O 等級卡牌的取得方式與限制",
  "商城道具成功率加成的疊加上限",
];

export const goddessOf = (card: AlbumCard): Goddess => goddessById(card.goddessId);
