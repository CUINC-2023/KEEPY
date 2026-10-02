// ─────────────────────────────────────────────────────────────
// KEEPY — 七步卡池建立精靈（Phase 5B）Mock 資料與驗證
// 全部為本地 Demo 草稿：不連後端、不真的發布、不影響既有六個卡池。
// ─────────────────────────────────────────────────────────────
import {
  GRADES,
  POOLS,
  POOL_KIND_LABEL,
  type PoolKind,
  type Rarity,
} from "@/data/mock";

export type MaterialStatus = "none" | "review" | "ready";

export const MATERIAL_STATUS_LABEL: Record<MaterialStatus, string> = {
  none: "未提供",
  review: "待審",
  ready: "可使用",
};

export interface WizardDraft {
  // Step 1
  name: string;
  subtitle: string;
  slug: string;
  kind: PoolKind;
  description: string;
  themeName: string;
  themeClass: string;
  coverGrade: Rarity;
  // Step 2
  startAt: string;
  endAt: string;
  // Step 3
  goddessIds: string[];
  cardPlan: Record<Rarity, number>;
  materialStatus: MaterialStatus;
  // Step 4
  drawScope: "single_pool" | "all_pools";
  rates: Record<Rarity, { enabled: boolean; pct: number }>;
  // Step 5
  synthEnabledGrades: Rarity[];
  synthMaterialCount: Record<Rarity, number | null>;
  synthBaseRate: Record<Rarity, number | null>;
  synthItemBoostPct: number | null;
  // Step 6
  albumTemplateId: string;
  albumCoverLayout: string;
  albumProgressBar: string;
  albumSilhouette: boolean;
  albumLockUnrevealed: boolean;
  albumTotalCards: number;
  // meta
  templateKey: TemplateKey | "none";
  copiedFrom?: string;
  savedAt?: string;
}

export const THEME_OPTIONS = [
  { name: "夜紫羅蘭", cls: "theme-violet", swatch: "bg-primary/70" },
  { name: "星光靛藍", cls: "theme-indigo", swatch: "bg-sky-500/60" },
  { name: "柔金香檳", cls: "theme-gold", swatch: "bg-gold/70" },
  { name: "夜櫻薄粉", cls: "theme-sakura", swatch: "bg-pink-400/60" },
  { name: "海風青碧", cls: "theme-aqua", swatch: "bg-teal-400/60" },
];

export const KIND_OPTIONS = (Object.keys(POOL_KIND_LABEL) as PoolKind[]).map((k) => ({
  key: k,
  label: POOL_KIND_LABEL[k],
}));

const zeroPlan = (): Record<Rarity, number> =>
  GRADES.reduce((a, g) => ({ ...a, [g]: 0 }), {} as Record<Rarity, number>);

const zeroRates = (): Record<Rarity, { enabled: boolean; pct: number }> =>
  GRADES.reduce(
    (a, g) => ({ ...a, [g]: { enabled: false, pct: 0 } }),
    {} as Record<Rarity, { enabled: boolean; pct: number }>
  );

const nullRates = (): Record<Rarity, number | null> =>
  GRADES.reduce((a, g) => ({ ...a, [g]: null }), {} as Record<Rarity, number | null>);

export function emptyDraft(): WizardDraft {
  return {
    name: "",
    subtitle: "",
    slug: "",
    kind: "permanent",
    description: "",
    themeName: THEME_OPTIONS[0]!.name,
    themeClass: THEME_OPTIONS[0]!.cls,
    coverGrade: "SR",
    startAt: "",
    endAt: "",
    goddessIds: [],
    cardPlan: zeroPlan(),
    materialStatus: "none",
    drawScope: "single_pool",
    rates: zeroRates(),
    synthEnabledGrades: [],
    synthMaterialCount: nullRates(),
    synthBaseRate: nullRates(),
    synthItemBoostPct: null,
    albumTemplateId: "atpl-standard",
    albumCoverLayout: "16:9 主題漸層封面 ＋ 狀態標籤 ＋ 期間",
    albumProgressBar: "總進度 ＋ 十級完成度 ＋ 女神完成度",
    albumSilhouette: true,
    albumLockUnrevealed: true,
    albumTotalCards: 0,
    templateKey: "none",
  };
}

// ── 範本帶入（只填結構與示例欄位，示例數值皆為 Demo，可自行修改）──
export type TemplateKey = "permanent" | "limited" | "collaboration" | "rerun";

export const TEMPLATE_KEY_LABEL: Record<TemplateKey, string> = {
  permanent: "常駐卡池",
  limited: "期間限定",
  collaboration: "合作企劃",
  rerun: "復刻卡池",
};

const planFrom = (pairs: Partial<Record<Rarity, number>>): Record<Rarity, number> => ({
  ...zeroPlan(),
  ...pairs,
});

const ratesFrom = (pairs: Partial<Record<Rarity, number>>) => {
  const r = zeroRates();
  for (const g of GRADES) {
    const pct = pairs[g];
    if (pct !== undefined) r[g] = { enabled: true, pct };
  }
  return r;
};

const BASE_PLAN = planFrom({ C: 10, U: 8, R: 7, RR: 5, RRR: 4, SR: 3, SSR: 2, HR: 1, UR: 1, O: 1 });
const BASE_RATES = ratesFrom({
  C: 34, U: 24, R: 16, RR: 10, RRR: 7, SR: 5, SSR: 2.5, HR: 1, UR: 0.4, O: 0.1,
});

export const TEMPLATE_PRESETS: Record<TemplateKey, Partial<WizardDraft>> = {
  permanent: {
    name: "新常駐卡池（Demo）",
    subtitle: "PERMANENT CHAPTER",
    slug: "p-new-permanent",
    kind: "permanent",
    description: "長期上架的基礎卡池，適合新玩家入門與基本蒐集。（Demo 示例文案，可自行修改）",
    startAt: "2026-10-01",
    endAt: "2027-09-30",
    cardPlan: BASE_PLAN,
    rates: BASE_RATES,
    albumTemplateId: "atpl-standard",
  },
  limited: {
    name: "新期間限定卡池（Demo）",
    subtitle: "LIMITED SEASON",
    slug: "p-new-limited",
    kind: "period",
    description: "固定檔期的限定卡池，結束後不再發行卡牌。（Demo 示例文案，可自行修改）",
    startAt: "2026-10-10",
    endAt: "2026-11-30",
    cardPlan: planFrom({ C: 8, U: 6, R: 5, RR: 3, RRR: 2, SR: 2, SSR: 1, HR: 1, UR: 1, O: 1 }),
    rates: BASE_RATES,
    albumTemplateId: "atpl-limited",
  },
  collaboration: {
    name: "新合作企劃卡池（Demo）",
    subtitle: "COLLAB PROJECT",
    slug: "p-new-collab",
    kind: "collab",
    description: "與外部企劃或主題合作的卡池，素材與授權需另行確認。（Demo 示例文案，可自行修改）",
    startAt: "2026-11-01",
    endAt: "2026-12-15",
    cardPlan: planFrom({ C: 8, U: 6, R: 5, RR: 4, RRR: 3, SR: 2, SSR: 1, HR: 1, UR: 0, O: 0 }),
    rates: ratesFrom({ C: 35, U: 25, R: 17, RR: 11, RRR: 7, SR: 3.5, SSR: 1, HR: 0.5 }),
    albumTemplateId: "atpl-limited",
  },
  rerun: {
    name: "新復刻卡池（Demo）",
    subtitle: "RERUN EDITION",
    slug: "p-new-rerun",
    kind: "limited",
    description: "以既有卡池結構復刻，僅複製欄位設定，不帶入任何玩家資料。（Demo 示例文案，可自行修改）",
    startAt: "2026-12-01",
    endAt: "2027-01-15",
    cardPlan: BASE_PLAN,
    rates: BASE_RATES,
    albumTemplateId: "atpl-standard",
  },
};

export const TEMPLATE_FILL_NOTE =
  "範本只帶入卡池結構與示例欄位；所有示例數值皆為 Demo，可自行修改。不會帶入玩家資料、蒐集進度、抽卡紀錄、收益或分潤資料。";

export const COPY_POOL_NOTE =
  "複製既有卡池只會帶入名稱、類型、期間、女神、卡牌數與機率等結構欄位；不會複製玩家資料、蒐集進度、抽卡紀錄、收益、分潤或合約資料（Demo）。";

export function draftFromTemplate(key: TemplateKey): WizardDraft {
  return { ...emptyDraft(), ...TEMPLATE_PRESETS[key], templateKey: key };
}

/** 從既有卡池複製結構（不含玩家／收益資料） */
export function draftFromPool(poolId: string): WizardDraft {
  const pool = POOLS.find((p) => p.id === poolId);
  const base = emptyDraft();
  if (!pool) return base;
  const rates = zeroRates();
  for (const r of pool.rates) rates[r.grade] = { enabled: r.pct > 0, pct: r.pct };
  const plan = zeroPlan();
  const enabled = GRADES.filter((g) => rates[g].enabled);
  let left = pool.cardCount;
  enabled.forEach((g, i) => {
    const n = i === enabled.length - 1 ? Math.max(1, left) : Math.max(1, Math.round(pool.cardCount / enabled.length));
    plan[g] = n;
    left -= n;
  });
  return {
    ...base,
    name: `${pool.name}（複製草稿・Demo）`,
    subtitle: pool.subtitle,
    slug: `${pool.id}-copy`,
    kind: pool.kind,
    description: pool.description,
    themeName: pool.themeName,
    themeClass: pool.themeClass,
    coverGrade: pool.coverGrade,
    startAt: pool.startAt,
    endAt: pool.endAt,
    goddessIds: [...pool.goddessIds],
    cardPlan: plan,
    rates,
    copiedFrom: pool.id,
  };
}

// ── 計算與驗證 ───────────────────────────────────────────────
export const totalPlannedCards = (d: WizardDraft) =>
  GRADES.reduce((s, g) => s + (d.cardPlan[g] || 0), 0);

export const ratesSum = (d: WizardDraft) =>
  Math.round(GRADES.reduce((s, g) => s + (d.rates[g].enabled ? d.rates[g].pct : 0), 0) * 1000) / 1000;

/** 單張平均機率（該等級機率 / 該等級卡牌數） */
export const perCardPct = (d: WizardDraft, g: Rarity) => {
  const n = d.cardPlan[g] || 0;
  if (!d.rates[g].enabled || n <= 0) return null;
  return d.rates[g].pct / n;
};

export const suggestedStatus = (d: WizardDraft, today = "2026-09-20"): string => {
  if (!d.startAt || !d.endAt) return "尚無足夠日期資訊";
  if (today < d.startAt) return "即將開始";
  if (today > d.endAt) return "已結束";
  return "進行中";
};

export const slugValid = (slug: string) => /^p-[a-z0-9-]{2,40}$/.test(slug);

export interface ValidationResult {
  /** 阻擋錯誤：存在時不可完成建立 */
  errors: { step: number; field: string; message: string }[];
  warnings: { step: number; message: string }[];
  tbd: string[];
}

export function validateStep2(d: Pick<WizardDraft, "startAt" | "endAt">) {
  const errors: { step: number; field: string; message: string }[] = [];
  const start = d.startAt.trim();
  const end = d.endAt.trim();
  if (!start) errors.push({ step: 2, field: "startAt", message: "開始日為必填。" });
  if (!end) errors.push({ step: 2, field: "endAt", message: "結束日為必填。" });
  if (start && end) {
    const startTime = Date.parse(`${start}T00:00:00+08:00`);
    const endTime = Date.parse(`${end}T00:00:00+08:00`);
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || startTime >= endTime) {
      errors.push({ step: 2, field: "startAt", message: "開始日必須早於結束日。" });
    }
  }
  return errors;
}

export function validateDraft(d: WizardDraft, usedSlugs: string[]): ValidationResult {
  const errors: { step: number; field: string; message: string }[] = [];
  const warnings: { step: number; message: string }[] = [];
  const tbd: string[] = [];

  // Step 1
  if (!d.name.trim()) errors.push({ step: 1, field: "name", message: "卡池中文名稱為必填。" });
  if (!d.slug.trim()) errors.push({ step: 1, field: "slug", message: "poolId／slug 為必填。" });
  else if (!slugValid(d.slug))
    errors.push({ step: 1, field: "slug", message: "slug 格式須為 p- 開頭的小寫英數與連字號（例：p-new-limited）。" });
  else if (usedSlugs.includes(d.slug))
    errors.push({ step: 1, field: "slug", message: `poolId「${d.slug}」已存在，請改用其他 slug。` });
  if (!d.subtitle.trim()) warnings.push({ step: 1, message: "英文副標尚未填寫（僅影響封面視覺）。" });
  if (!d.description.trim()) warnings.push({ step: 1, message: "卡池簡介尚未填寫。" });

  // Step 2
  errors.push(...validateStep2(d));

  // Step 3
  if (d.goddessIds.length === 0) errors.push({ step: 3, field: "goddessIds", message: "至少需選擇 1 位參與女神。" });
  const total = totalPlannedCards(d);
  if (total < 1) errors.push({ step: 3, field: "cardTotal", message: "卡牌總數至少需 1 張。" });
  if (d.materialStatus !== "ready")
    warnings.push({ step: 3, message: `素材狀態為「${MATERIAL_STATUS_LABEL[d.materialStatus]}」（原型不做真實上傳）。` });

  // Step 4
  const sum = ratesSum(d);
  if (Math.abs(sum - 100) > 0.001)
    errors.push({ step: 4, field: "ratesTotal", message: `已啟用等級機率總和為 ${sum}%，必須等於 100%。` });
  for (const g of GRADES) {
    const r = d.rates[g];
    if (r.enabled && r.pct > 0 && (d.cardPlan[g] || 0) < 1)
      errors.push({ step: 4, field: `range-${g}`, message: `等級 ${g} 已啟用且機率 ${r.pct}%，但抽取範圍內沒有卡牌（至少需 1 張）。` });
  }
  tbd.push("抽卡保底機制、門檻、適用等級與卡池結束後處理方式：Demo／待定");
  tbd.push("全卡池抽卡（納入範圍、跨卡池權重、分潤歸屬、機率揭露）：規劃中／尚未啟用");

  // Step 5
  if (d.synthEnabledGrades.length === 0)
    errors.push({ step: 5, field: "synthGrades", message: "至少需選擇 1 個可合成等級。" });
  if (d.synthEnabledGrades.includes("O"))
    errors.push({ step: 5, field: "synthGrades", message: "O 為最高級，不可再往上合成，請取消 O 等級。" });
  for (const g of d.synthEnabledGrades) {
    const count = d.synthMaterialCount[g];
    if (count === null)
      errors.push({ step: 5, field: `synthCount-${g}`, message: `等級 ${g} 的素材張數尚未輸入（Demo／待定），必須填寫。` });
    else if (!Number.isInteger(count) || count < 1)
      errors.push({ step: 5, field: `synthCount-${g}`, message: `等級 ${g} 的素材張數必須為 1 以上的正整數。` });
    const rate = d.synthBaseRate[g];
    if (rate === null)
      errors.push({ step: 5, field: `synth-${g}`, message: `等級 ${g} 的基礎成功率尚未輸入（Demo／待定），必須填寫。` });
    else if (!Number.isFinite(rate) || rate < 0 || rate > 100)
      errors.push({ step: 5, field: `synth-${g}`, message: `等級 ${g} 的基礎成功率必須介於 0–100%。` });
  }
  if (d.synthItemBoostPct !== null && (d.synthItemBoostPct < 0 || d.synthItemBoostPct > 100))
    errors.push({ step: 5, field: "synthItemBoostPct", message: "商城道具加成必須介於 0–100%。" });
  if (d.synthItemBoostPct === null) tbd.push("商城道具加成幅度：Demo／待定（未輸入）");
  tbd.push("O 卡為最高級不可再往上合成；O 卡是否可作為素材：待定");
  tbd.push("商城道具加成疊加上限與正式成功率公式：待定");
  tbd.push("素材張數與各等級成功率皆為 Demo 示例，正式數值待核定。");

  // Step 6
  if (!d.albumTemplateId) errors.push({ step: 6, field: "albumTemplateId", message: "請選擇卡冊範本。" });
  if (d.albumTotalCards !== total)
    errors.push({ step: 6, field: "albumTotalCards", message: `卡冊總數（${d.albumTotalCards}）必須與卡牌總數（${total}）一致。` });

  return { errors, warnings, tbd };
}

export const SYNTH_FIXED_RULES = [
  "僅能使用同一卡池、同等級卡牌作為素材。",
  "成功：取得該卡池隨機「上一級」卡牌。",
  "失敗：取得該卡池隨機「同級」卡牌。",
  "連續失敗累積 10 次即觸發保底，取得上一級卡牌。",
  "商城道具僅增加合成成功率，不改變其他規則。",
  "合成不產生女神分潤。",
  "O 為最高級，不可再往上合成。",
];

export const WIZARD_STEPS = [
  { n: 1, label: "基本資訊" },
  { n: 2, label: "期間與狀態" },
  { n: 3, label: "女神與卡牌" },
  { n: 4, label: "抽卡範圍與機率" },
  { n: 5, label: "合成條件" },
  { n: 6, label: "卡冊顯示" },
  { n: 7, label: "預覽與驗證" },
];

export const PERSIST_DEMO_NOTE =
  "草稿僅存在本機瀏覽器（Demo 行為）：重新整理後可能保留，但伺服器並未儲存任何資料，也不會正式發布。";

/** 上一級（O 為最高級，回傳 null） */
export const nextGrade = (g: Rarity): Rarity | null => {
  const i = GRADES.indexOf(g);
  return i >= 0 && i < GRADES.length - 1 ? GRADES[i + 1]! : null;
};

/** 最終成功率預覽（Demo：基礎 ＋ 道具加成，上限 100%） */
export const finalSynthRate = (base: number | null, boost: number | null) => {
  if (base === null) return null;
  return Math.min(100, Math.round((base + (boost ?? 0)) * 100) / 100);
};

export const CREATE_DRAFT_CONFIRM_NOTE =
  "這只會建立一筆「本機 Demo 草稿」：不會正式發布、伺服器沒有任何儲存，也不會影響玩家資料、收益、分潤或既有六個卡池。";
