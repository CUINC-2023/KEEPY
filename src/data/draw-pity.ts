/**
 * 抽卡保底規則配置預覽（Local Mock）。
 * 與「合成連續失敗 10 次保底」完全獨立，本模組只處理抽卡保底；數值皆為未核定 Demo。
 */
import { GRADES, type Rarity } from "@/data/mock";
import type { DrawCardRow, GradeRuleRow } from "@/data/admin";

export type PityResetOnTrigger = "" | "zero" | "carry_excess";
export type PityPoolEnd = "" | "clear" | "keep_for_rerun";
export type PityReviewStatus = "未核定" | "待覆核" | "已覆核（Demo）";

export interface DrawPityConfig {
  enabled: boolean;
  /** V1 固定為該卡池 */
  scope: "pool";
  /** 以字串保存以便辨識空值 */
  threshold: string;
  targetGrade: Rarity | "";
  targetCardIds: string[];
  triggerType: "at_threshold_min_grade";
  /** 自然抽中目標或更高時是否重置；null＝未選 */
  resetOnHitOrHigher: boolean | null;
  resetOnTrigger: PityResetOnTrigger;
  poolEndHandling: PityPoolEnd;
  effectiveVersion: string;
  reviewStatus: PityReviewStatus;
}

export interface PityVersionRecord {
  version: string;
  snapshot: DrawPityConfig;
  reviewedAt: string;
  note: string;
}

export const PITY_FAQ_HASH = "draw-pity";

/** 預設：未啟用、未核定、不可發布，不帶任何門檻數值 */
export function defaultPityConfig(): DrawPityConfig {
  return {
    enabled: false,
    scope: "pool",
    threshold: "",
    targetGrade: "",
    targetCardIds: [],
    triggerType: "at_threshold_min_grade",
    resetOnHitOrHigher: null,
    resetOnTrigger: "",
    poolEndHandling: "",
    effectiveVersion: "",
    reviewStatus: "未核定",
  };
}

export const PITY_FIELD_HINTS = {
  enabled: "停用時抽卡不累計保底；與合成失敗保底無關。",
  scope: "V1 只在同一卡池內累計，不跨卡池。",
  threshold: "正整數，達到此抽數的那一抽觸發。",
  targetGrade: "到門檻該抽結果至少此等級；自然已達此等級或更高則保留自然卡。",
  targetCards: "保底替換時從這些目標等級卡牌產生，須在抽取範圍內。",
  triggerType: "到達門檻的那一抽保證至少目標等級。",
  resetOnHit: "自然抽中目標或更高（含到門檻同抽）時是否歸零；不重置時下一檢查點延後一個門檻（待核定）。",
  resetOnTrigger: "只套用於保底替換（自然低於目標）後的計數。",
  poolEnd: "卡池結束後尚未觸發的計數如何處理。",
  version: "每次發布需新版本號，舊版本保留供交易追溯。",
  review: "發布前需建立覆核快照，快照與目前設定一致才可發布。",
} as const;

const gi = (g: Rarity) => GRADES.indexOf(g);
export const gradeAtLeast = (g: Rarity, min: Rarity) => gi(g) >= gi(min);

export function parseThreshold(s: string): number | null {
  if (!/^\d+$/.test(s.trim())) return null;
  const n = Number(s.trim());
  return Number.isSafeInteger(n) && n >= 1 ? n : null;
}

export function sameConfig(a: DrawPityConfig, b: DrawPityConfig) {
  const strip = (c: DrawPityConfig) => JSON.stringify({ ...c, reviewStatus: "", targetCardIds: [...c.targetCardIds].sort() });
  return strip(a) === strip(b);
}

/** 設定驗證（儲存草稿用）；啟用時所有欄位必填且須與機率設定一致 */
export function validatePity(c: DrawPityConfig, grades: GradeRuleRow[], cards: DrawCardRow[]): string[] {
  if (!c.enabled) return [];
  const errs: string[] = [];
  if (parseThreshold(c.threshold) === null) errs.push("觸發門檻必須是正整數（不可空白、0、小數或負數）。");
  if (!c.targetGrade) errs.push("請選擇保底目標等級。");
  else {
    const g = grades.find((x) => x.grade === c.targetGrade);
    if (!g || !g.enabled || g.pct <= 0) errs.push(`目標等級 ${c.targetGrade} 在機率設定中未啟用或機率為 0。`);
    const drawable = cards.filter((x) => x.grade === c.targetGrade && x.included);
    if (drawable.length === 0) errs.push(`目標等級 ${c.targetGrade} 沒有任何在抽取範圍內的卡牌。`);
    else if (c.targetCardIds.filter((id) => drawable.some((d) => d.id === id)).length === 0)
      errs.push("請至少勾選一張該等級可抽卡牌。");
    if (c.targetCardIds.some((id) => !drawable.some((d) => d.id === id)))
      errs.push("保底可抽卡包含不在抽取範圍或不同等級的卡牌。");
  }
  if (c.resetOnHitOrHigher === null) errs.push("請選擇抽中目標或更高時是否重置。");
  if (!c.resetOnTrigger) errs.push("請選擇觸發後的重置方式。");
  if (!c.poolEndHandling) errs.push("請選擇卡池結束後的計數處理方式。");
  return errs;
}

/** 發布驗證：除設定驗證外，需新版本號、覆核快照且不覆寫舊版本 */
export function validatePublish(
  c: DrawPityConfig,
  snapshot: DrawPityConfig | null,
  history: PityVersionRecord[],
  grades: GradeRuleRow[],
  cards: DrawCardRow[],
): string[] {
  const errs = validatePity(c, grades, cards);
  if (!c.effectiveVersion.trim()) errs.push("請填寫規則生效版本。");
  else if (history.some((h) => h.version === c.effectiveVersion.trim()))
    errs.push(`版本 ${c.effectiveVersion} 已存在；不可覆寫舊交易版本，請建立新版本號。`);
  if (!snapshot) errs.push("尚未建立覆核快照。");
  else if (!sameConfig(snapshot, c)) errs.push("目前設定與覆核快照不同，請重新覆核。");
  if (c.reviewStatus !== "已覆核（Demo）") errs.push("審核狀態須為「已覆核（Demo）」。");
  errs.push("正式數值尚未由創辦人核定：本原型一律不可發布到前台。");
  return errs;
}

// ── 模擬器 ─────────────────────────────────────────────
export type SimDrawKind = "paid" | "bonus";
export type SimReset = "none" | "hit" | "hit_at_threshold" | "trigger";
export interface SimEvent {
  step: number;
  kind: SimDrawKind;
  countBefore: number;
  countAfter: number;
  natural: Rarity;
  result: Rarity;
  /** 保底替換時產生的目標等級卡牌（自然結果只有等級示意） */
  resultCardName: string | null;
  /** 本抽計數到達目前門檻 */
  thresholdReached: boolean;
  /** 自然結果低於目標、以保底卡替換 */
  guaranteeApplied: boolean;
  /** 到達門檻同抽自然已達目標或更高：保留自然卡，非保底替換 */
  naturalHitAtThreshold: boolean;
  reset: SimReset;
  paidKp: "付費" | "0";
  creatorShare: "依原卡合作模式" | "0";
  shareReason: string;
  note: string;
}

export interface SimScenario {
  id: string;
  label: string;
  desc: string;
  config: DrawPityConfig;
  startCount: number;
  draws: SimDrawKind[];
  /** 固定自然結果（非亂數，僅等級示意） */
  natural: Rarity[];
  poolEnded?: boolean;
  /** 測試用：將此等級卡牌全部移出抽取範圍 */
  excludeGrade?: Rarity;
}

/**
 * 語意：到達門檻的那一抽保證「至少目標等級」。
 * - 自然結果已 ≥ 目標：保留自然卡（naturalHitAtThreshold），不算保底替換，重置依 resetOnHitOrHigher。
 *   選「不重置」時計數保留，但本輪門檻視為已滿足，下一次檢查點延後一個門檻，避免之後每抽反覆觸發（Demo 解讀，待核定）。
 * - 自然結果 < 目標：保底替換（guaranteeApplied），從所選可抽卡依序產生目標等級卡，重置依 resetOnTrigger。
 * - 停用：不累計計數。
 */
export function simulatePity(
  c: DrawPityConfig,
  startCount: number,
  draws: SimDrawKind[],
  natural: Rarity[],
  cards: DrawCardRow[] = [],
): SimEvent[] {
  const threshold = parseThreshold(c.threshold);
  const target = c.targetGrade || null;
  const active = c.enabled && !!threshold && !!target;
  const pool = cards.filter((x) => c.targetCardIds.includes(x.id) && x.grade === target && x.included);
  let count = startCount;
  let checkpoint = threshold ?? Infinity;
  let pick = 0;
  return draws.map((kind, i) => {
    const nat = natural[i % natural.length] ?? "C";
    const before = count;
    let result: Rarity = nat;
    let resultCardName: string | null = null;
    let thresholdReached = false, guaranteeApplied = false, naturalHitAtThreshold = false;
    let reset: SimReset = "none";
    const notes: string[] = [];
    if (!active) {
      notes.push(c.enabled ? "設定不完整，不累計" : "保底停用：不累計計數");
    } else {
      count += 1; // 每一抽（含第 11 次額外抽卡）+1
      const hit = gradeAtLeast(nat, target!);
      if (count >= checkpoint) {
        thresholdReached = true;
        if (hit) {
          naturalHitAtThreshold = true;
          if (c.resetOnHitOrHigher) { count = 0; checkpoint = threshold!; reset = "hit_at_threshold"; notes.push("到門檻同抽自然達標：保留自然卡，依「抽中重置」歸零"); }
          else { checkpoint = count + threshold!; notes.push("到門檻同抽自然達標：保留自然卡，設定不重置→計數保留，下一檢查點延後一個門檻（待核定）"); }
        } else {
          guaranteeApplied = true;
          result = target!;
          const card = pool[pick++ % Math.max(pool.length, 1)];
          resultCardName = card?.name ?? null;
          count = c.resetOnTrigger === "carry_excess" ? Math.max(0, count - checkpoint) : 0;
          checkpoint = threshold!;
          reset = "trigger";
          notes.push(`保底替換：自然 ${nat} 低於 ${target}，依「${c.resetOnTrigger === "carry_excess" ? "保留餘數" : "歸零"}」處理`);
        }
      } else if (hit && c.resetOnHitOrHigher) {
        count = 0; checkpoint = threshold!; reset = "hit";
        notes.push("自然抽中目標或更高，計數重置");
      }
    }
    if (kind === "bonus") notes.unshift("第 11 次額外抽卡（bonus draw）");
    const zero = kind === "bonus" || guaranteeApplied;
    const shareReason = kind === "bonus"
      ? (guaranteeApplied ? "第 11 次額外抽卡＋保底替換：0" : "第 11 次額外抽卡：付費 KP 0，不分潤")
      : guaranteeApplied ? "保底替換結果不分潤" : "付費自然抽中：依原卡合作模式";
    return {
      step: i + 1, kind, countBefore: before, countAfter: count, natural: nat, result, resultCardName,
      thresholdReached, guaranteeApplied, naturalHitAtThreshold, reset,
      paidKp: kind === "bonus" ? "0" : "付費",
      creatorShare: zero ? "0" : "依原卡合作模式",
      shareReason,
      note: notes.join("；") || "—",
    };
  });
}

/** 自然結果僅為等級示意；本原型無卡牌抽取實作 */
const TEN_PLUS_ONE: SimDrawKind[] = [...Array<SimDrawKind>(10).fill("paid"), "bonus"];
/** 固定自然結果：僅第 7 抽自然出 SSR，其餘為低階 */
const FIXED_NATURAL: Rarity[] = ["C", "U", "C", "R", "C", "U", "SSR", "C", "RR", "U", "C"];

/** 獨立測試情境：Demo 範例值，非正式門檻 */
export function demoScenarios(targetCardIds: string[], noTargetGrade: Rarity = "UR"): SimScenario[] {
  const base: DrawPityConfig = {
    ...defaultPityConfig(),
    enabled: true,
    threshold: "40",
    targetGrade: "SSR",
    targetCardIds,
    resetOnHitOrHigher: true,
    resetOnTrigger: "zero",
    poolEndHandling: "clear",
    effectiveVersion: "pity-demo-1",
    reviewStatus: "待覆核",
  };
  return [
    { id: "legal", label: "合法設定・單抽", desc: "Demo 門檻 40，起始 12，單抽不跨門檻。", config: base, startCount: 12, draws: ["paid"], natural: ["U"] },
    { id: "cross11", label: "bonus 強制替換（10+1）", desc: "起始 29，十抽送一抽 +11，第 11 次到達 40 觸發保底，分潤仍為 0。", config: { ...base, resetOnHitOrHigher: false }, startCount: 29, draws: TEN_PLUS_ONE, natural: ["C", "U", "C", "R", "C", "U", "R", "C", "RR", "U", "C"] },
    { id: "reset", label: "觸發後重置再累計", desc: "起始 36，第 4 抽觸發並歸零，之後繼續累計；第 7 抽自然 SSR 再重置。", config: base, startCount: 36, draws: TEN_PLUS_ONE, natural: FIXED_NATURAL },
    { id: "no-target", label: "無可抽目標卡", desc: `測試情境將 ${noTargetGrade} 卡牌全部移出抽取範圍，目標等級沒有可抽卡，驗證應阻擋。`, config: { ...base, targetGrade: noTargetGrade, targetCardIds: [] }, startCount: 0, draws: ["paid"], natural: ["C"], excludeGrade: noTargetGrade },
    { id: "empty", label: "空門檻", desc: "門檻未填，驗證應阻擋，模擬不觸發。", config: { ...base, threshold: "" }, startCount: 0, draws: ["paid"], natural: ["C"] },
    { id: "hit-at-threshold", label: "自然命中＋門檻同抽", desc: "起始 39，第 1 抽到達 40 且自然 SSR：保留自然卡、非保底替換、付費依原卡分潤；依「抽中重置」歸零。", config: base, startCount: 39, draws: ["paid", "paid"], natural: ["SSR", "C"] },
    { id: "hit-no-reset", label: "自然命中＋不重置", desc: "同上但「抽中不重置」：計數保留，下一檢查點延後一個門檻，後續抽不會每抽觸發（待核定解讀）。", config: { ...base, resetOnHitOrHigher: false }, startCount: 39, draws: ["paid", "paid", "paid"], natural: ["SSR", "C", "U"] },
    { id: "paid-forced", label: "付費強制替換", desc: "起始 39，付費抽自然 C，保底替換為所選 SSR 卡，分潤 0。", config: base, startCount: 39, draws: ["paid"], natural: ["C"] },
    { id: "disabled", label: "停用不計數", desc: "保底停用：十抽送一抽不累計計數、不替換。", config: { ...base, enabled: false }, startCount: 5, draws: TEN_PLUS_ONE, natural: FIXED_NATURAL },
    { id: "ended", label: "卡池結束", desc: "卡池結束時計數 18，依 Demo 設定「清除」，不轉移至其他卡池。", config: base, startCount: 18, draws: [], natural: [], poolEnded: true },
  ];
}

export const POOL_END_LABEL: Record<Exclude<PityPoolEnd, "">, string> = {
  clear: "卡池結束後清除計數",
  keep_for_rerun: "保留至同卡池復刻時沿用",
};
export const RESET_TRIGGER_LABEL: Record<Exclude<PityResetOnTrigger, "">, string> = {
  zero: "觸發後歸零",
  carry_excess: "扣除門檻後保留餘數",
};

/** 仍待創辦人填定 */
export const PITY_FOUNDER_TODO = [
  "各卡池是否啟用抽卡保底",
  "觸發門檻抽數",
  "保底目標等級與可抽卡範圍（含權重）",
  "自然抽中目標或更高時是否重置",
  "觸發後重置方式（歸零或保留餘數）",
  "卡池結束後計數處理（清除或保留至復刻）",
  "保底計數在前台是否公開顯示及顯示方式",
  "規則版本變更時既有計數如何承接",
] as const;
