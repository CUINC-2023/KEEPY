import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GRADES,
  GODDESSES,
  POOL_KIND_LABEL,
  POOLS,
  type PoolKind,
  type Rarity,
} from "@/data/mock";
import { ADMIN_USER } from "@/data/admin";
import {
  COPY_POOL_NOTE,
  KIND_OPTIONS,
  MATERIAL_STATUS_LABEL,
  PERSIST_DEMO_NOTE,
  SYNTH_FIXED_RULES,
  TEMPLATE_FILL_NOTE,
  TEMPLATE_KEY_LABEL,
  THEME_OPTIONS,
  WIZARD_STEPS,
  draftFromPool,
  draftFromTemplate,
  emptyDraft,
  finalSynthRate,
  nextGrade,
  perCardPct,
  ratesSum,
  slugValid,
  suggestedStatus,
  totalPlannedCards,
  validateDraft,
  validateStep2,
  type MaterialStatus,
  type TemplateKey,
  type ValidationResult,
  type WizardDraft,
} from "@/data/pool-wizard";
import { saveWizardDraft } from "@/lib/pool-draft-store";
import { StatusTag } from "@/components/ui/status-tag";
import { useToast } from "@/components/ui/toast";
import { StatePlaceholder, StateSwitcher, useDemoState } from "@/components/ui/state-demo";

export const Route = createFileRoute("/admin/pools/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    template: typeof search["template"] === "string" ? (search["template"] as string) : undefined,
    copy: typeof search["copy"] === "string" ? (search["copy"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "建立卡池精靈 — CU 女神卡管理後台" },
      {
        name: "description",
        content:
          "七步卡池建立精靈：基本資訊、期間與狀態、女神與卡牌、抽卡範圍與機率、合成條件、卡冊顯示、預覽與驗證，僅本地 Demo 草稿。",
      },
      { property: "og:title", content: "建立卡池精靈 — CU 女神卡管理後台" },
      { property: "og:description", content: "七步建立卡池 Demo 草稿，不會正式發布。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PoolWizard,
});

/** 目前啟用 Step 1–5（Phase 5B-2A）；Step 6–7 下一批完成 */
const ENABLED_MAX_STEP = 5;

const TEMPLATE_KEYS: TemplateKey[] = ["permanent", "limited", "collaboration", "rerun"];

function initialDraft(template?: string, copy?: string): WizardDraft {
  if (copy) return draftFromPool(copy);
  if (template && (TEMPLATE_KEYS as string[]).includes(template))
    return draftFromTemplate(template as TemplateKey);
  return emptyDraft();
}

const labelCls = "text-[11px] font-bold text-muted-foreground";
const inputCls =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60";

function PoolWizard() {
  const { template, copy } = Route.useSearch();
  const { push } = useToast();
  const [state, setState] = useDemoState();
  const [step, setStep] = useState(1);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState(1);
  const [attemptedSteps, setAttemptedSteps] = useState<number[]>([]);
  const [draft, setDraft] = useState<WizardDraft>(() => initialDraft(template, copy));
  const draftRef = useRef(draft);
  const [dirty, setDirty] = useState(false);
  const [draftSlugs] = useState<string[]>(() => []);

  const replaceDraft = (next: WizardDraft) => {
    draftRef.current = next;
    setDraft(next);
  };

  const updateDraft = (updater: (current: WizardDraft) => WizardDraft) => {
    const next = updater(draftRef.current);
    replaceDraft(next);
    setDirty(true);
  };


  const set = <K extends keyof WizardDraft>(key: K, value: WizardDraft[K]) => {
    updateDraft((current) => ({ ...current, [key]: value }));
  };

  // 離開未儲存提醒
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const usedSlugs = useMemo(
    () => [...POOLS.map((p) => p.id), ...draftSlugs],
    [draftSlugs]
  );
  const result = useMemo(() => validateDraft(draft, usedSlugs), [draft, usedSlugs]);
  const stepErrors = (n: number) => result.errors.filter((e) => e.step === n);
  const visibleStepErrors = (n: number) => (attemptedSteps.includes(n) ? stepErrors(n) : []);
  const fieldError = (n: number, field: string) => visibleStepErrors(n).find((e) => e.field === field)?.message;
  const total = totalPlannedCards(draft);
  const sum = ratesSum(draft);


  const autoSlug = (name: string) =>
    "p-" +
    (name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "pool");

  const focusFirstError = (errors: ValidationResult["errors"]) => {
    const first = errors[0];
    if (!first) return;
    window.requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(`[data-validation-field="${first.field}"]`);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus({ preventScroll: true });
    });
  };

  const currentStepErrors = (n: number, form: WizardDraft = draftRef.current) => {
    if (n === 2) return validateStep2(form);
    return validateDraft(form, usedSlugs).errors.filter((error) => error.step === n);
  };

  // 前進時一律重新驗證「目前步驟」及所有前置步驟，任何阻擋錯誤都 return，不切換步驟
  const gateForward = (target: number) => {
    const form = draftRef.current;
    for (let n = 1; n <= Math.min(target - 1, ENABLED_MAX_STEP); n += 1) {
      const errs = currentStepErrors(n, form);
      if (errs.length > 0) {
        setAttemptedSteps((steps) => (steps.includes(n) ? steps : [...steps, n]));
        setMaxUnlockedStep((current) => Math.min(current, n));
        if (step !== n) setStep(n);
        focusFirstError(errs);
        return false;
      }
    }
    return true;
  };

  const validateAndAdvance = () => {
    const form = draftRef.current;
    const errors = currentStepErrors(step, form);
    setAttemptedSteps((steps) => (steps.includes(step) ? steps : [...steps, step]));
    if (errors.length > 0) {
      focusFirstError(errors);
      return;
    }
    if (step === ENABLED_MAX_STEP) {
      push({
        title: "Step 5 驗證通過",
        description: "Step 6 下一批完成；本批尚不提供建立草稿。",
      });
      return;
    }
    const next = Math.min(ENABLED_MAX_STEP, step + 1);
    if (!gateForward(next)) return;
    setMaxUnlockedStep((current) => Math.max(current, next));
    setStep(next);
  };

  const navigateToStep = (target: number) => {
    if (target > step) {
      if (!gateForward(target)) return;
      setMaxUnlockedStep((current) => Math.max(current, target));
      setStep(target);
      return;
    }
    setStep(target);
  };


  if (!ADMIN_USER.permissions.includes("抽卡設定草稿")) {
    return (
      <StatePlaceholder state="denied" />
    );
  }

  return (
    <div className="space-y-5 pb-24 sm:pb-0">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-wide">建立卡池精靈</h1>
          <span className="demo-chip">Demo</span>
          <StatusTag tone="pending" label="草稿（不會正式發布）" />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          七步流程，目前啟用 Step 1–5（合成條件）；Step 6–7 下一批完成，本批不提供建立草稿。所有內容僅為本地 Demo 草稿，不會正式發布，也不會影響既有六個卡池、玩家資料、收益或分潤。
        </p>
        {draft.templateKey !== "none" && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            已帶入範本：{TEMPLATE_KEY_LABEL[draft.templateKey as TemplateKey]}｜{TEMPLATE_FILL_NOTE}
          </p>
        )}
        {draft.copiedFrom && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            複製來源：{draft.copiedFrom}｜{COPY_POOL_NOTE}
          </p>
        )}
      </header>


      <StateSwitcher state={state} onChange={setState} />

      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="尚無草稿資料" emptyDescription="從範本或空白草稿開始建立。" />
      ) : (
        <>
          {/* 七步進度列 */}
          <nav className="panel flex gap-1.5 overflow-x-auto p-2">
            {WIZARD_STEPS.map((s) => {
              const locked = s.n > ENABLED_MAX_STEP;
              const errs = stepErrors(s.n).length;
              const active = step === s.n;
              return (
                <button
                  key={s.n}
                  disabled={locked}
                  onClick={() => navigateToStep(s.n)}
                  title={locked ? "下一批完成" : s.n > maxUnlockedStep ? "請先完成前一個步驟" : undefined}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold transition-colors ${
                    locked
                      ? "cursor-not-allowed text-muted-foreground opacity-50"
                      : active
                        ? "bg-primary/20 text-foreground"
                        : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] tabular-nums">
                    {s.n}
                  </span>
                  {s.label}
                  {locked && <span className="text-[10px]">（下一批完成）</span>}
                  {!locked && errs > 0 && <span className="text-destructive">●</span>}
                </button>
              );
            })}
          </nav>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span>{dirty ? "尚有未儲存變更" : "目前沒有未儲存變更"}</span>
            <button
              onClick={() => {
                saveWizardDraft({ ...draft, savedAt: new Date().toISOString() });
                setDirty(false);
                push({ title: "已儲存草稿（Demo）", description: PERSIST_DEMO_NOTE });
              }}
              className="rounded-lg border border-border px-2.5 py-1 font-bold hover:text-foreground"
            >
              手動儲存草稿
            </button>
            <span>既有六個卡池不會被修改。</span>
          </div>

          {/* ── Step 1 基本資訊 ── */}
          {step === 1 && (
            <section className="panel space-y-4 p-4 sm:p-5">
              <h2 className="text-sm font-black tracking-widest text-muted-foreground">Step 1 基本資訊</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={labelCls}>卡池中文名稱（必填）</span>
                  <input
                    data-validation-field="name"
                    aria-invalid={Boolean(fieldError(1, "name"))}
                    className={`${inputCls} ${fieldError(1, "name") ? "border-destructive" : ""}`}
                    value={draft.name}
                    onInput={(e) => {
                      const name = e.currentTarget.value;
                      updateDraft((current) => ({
                        ...current,
                        name,
                        slug: current.slug || autoSlug(name),
                      }));
                    }}
                    placeholder="例：星海序曲"
                  />
                  <FieldError message={fieldError(1, "name")} />
                </label>
                <label className="block">
                  <span className={labelCls}>英文副標</span>
                  <input className={inputCls} value={draft.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
                </label>
                <label className="block">
                  <span className={labelCls}>poolId／slug（自動產生，可修改）</span>
                  <input
                    data-validation-field="slug"
                    aria-invalid={Boolean(fieldError(1, "slug"))}
                    className={`${inputCls} ${fieldError(1, "slug") ? "border-destructive" : ""}`}
                    value={draft.slug}
                    onChange={(e) => set("slug", e.target.value)}
                  />
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    格式：p- 開頭的小寫英數與連字號（例：p-new-limited）
                    {draft.slug && !slugValid(draft.slug) && (
                      <span className="ml-1 font-bold text-destructive">格式不符</span>
                    )}
                  </span>
                  <FieldError message={fieldError(1, "slug")} />
                </label>
                <label className="block">
                  <span className={labelCls}>卡池類型</span>
                  <select className={inputCls} value={draft.kind} onChange={(e) => set("kind", e.target.value as PoolKind)}>
                    {KIND_OPTIONS.map((k) => (
                      <option key={k.key} value={k.key}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className={labelCls}>卡池簡介</span>
                <textarea
                  className={`${inputCls} min-h-20`}
                  value={draft.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </label>
              <div>
                <span className={labelCls}>主題色</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {THEME_OPTIONS.map((t) => (
                    <button
                      key={t.cls}
                      onClick={() => {
                        updateDraft((current) => ({ ...current, themeName: t.name, themeClass: t.cls }));
                      }}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${
                        draft.themeClass === t.cls
                          ? "border-primary/60 bg-primary/10"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      <span className={`h-3.5 w-3.5 rounded-full ${t.swatch}`} />
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className={labelCls}>封面 Mock 預覽</span>
                <div className="mt-2 flex aspect-video max-w-md items-end rounded-2xl bg-gradient-to-br from-primary/40 via-primary/10 to-gold/20 p-4">
                  <div>
                    <p className="text-lg font-black">{draft.name || "（尚未命名）"}</p>
                    <p className="text-[11px] tracking-widest text-muted-foreground">
                      {draft.subtitle || "SUBTITLE"}｜{POOL_KIND_LABEL[draft.kind]}｜{draft.themeName}
                    </p>
                  </div>
                </div>
              </div>
              <StepErrors errors={visibleStepErrors(1)} />
            </section>
          )}

          {/* ── Step 2 期間與狀態 ── */}
          {step === 2 && (
            <section className="panel space-y-4 p-4 sm:p-5">
              <h2 className="text-sm font-black tracking-widest text-muted-foreground">Step 2 期間與狀態</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className={labelCls}>開始日（必填）</span>
                  <input
                    data-validation-field="startAt"
                    aria-invalid={Boolean(fieldError(2, "startAt"))}
                    type="date"
                    className={`${inputCls} ${fieldError(2, "startAt") ? "border-destructive" : ""}`}
                    value={draft.startAt}
                    onInput={(e) => set("startAt", e.currentTarget.value)}
                  />
                  <FieldError message={fieldError(2, "startAt")} />
                </label>
                <label className="block">
                  <span className={labelCls}>結束日（必填）</span>
                  <input
                    data-validation-field="endAt"
                    aria-invalid={Boolean(fieldError(2, "endAt"))}
                    type="date"
                    className={`${inputCls} ${fieldError(2, "endAt") ? "border-destructive" : ""}`}
                    value={draft.endAt}
                    onInput={(e) => set("endAt", e.currentTarget.value)}
                  />
                  <FieldError message={fieldError(2, "endAt")} />
                </label>
                <div>
                  <span className={labelCls}>時區</span>
                  <p className={`${inputCls} bg-muted/40`}>Asia/Taipei（固定）</p>
                </div>
              </div>
              <div className="rounded-xl bg-muted/40 p-3 text-xs">
                <p className="font-bold">前台狀態預覽（依日期建議）</p>
                <p className="mt-1 text-muted-foreground">
                  建議狀態：<span className="font-black text-foreground">{suggestedStatus(draft)}</span>
                  ；管理員可保留為草稿，本原型不提供正式發布。
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                受限權限：{ADMIN_USER.restricted.join("、")}，因此不顯示任何可執行的正式發布按鈕。
              </p>
              <StepErrors errors={visibleStepErrors(2)} />
            </section>
          )}

          {/* ── Step 3 女神與卡牌 ── */}
          {step === 3 && (
            <section className="panel space-y-4 p-4 sm:p-5">
              <h2 className="text-sm font-black tracking-widest text-muted-foreground">Step 3 女神與卡牌</h2>
              <div data-validation-field="goddessIds" tabIndex={-1}>
                <span className={labelCls}>參與女神（至少 1 位）</span>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {GODDESSES.map((g) => {
                    const on = draft.goddessIds.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        onClick={() => updateDraft((current) => ({
                          ...current,
                          goddessIds: current.goddessIds.includes(g.id)
                            ? current.goddessIds.filter((id) => id !== g.id)
                            : [...current.goddessIds, g.id],
                        }))}
                        className={`rounded-xl border p-3 text-left text-xs ${
                          on ? "border-primary/60 bg-primary/10" : "border-border text-muted-foreground"
                        }`}
                      >
                        <span className="font-black text-foreground">{g.name}</span>
                        <span className="ml-1">{g.title}</span>
                      </button>
                    );
                  })}
                </div>
                <FieldError message={fieldError(3, "goddessIds")} />
              </div>

              <div data-validation-field="cardTotal" tabIndex={-1}>
                <span className={labelCls}>各等級卡牌數量規劃（Mock 卡位，至少 1 張）</span>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {GRADES.map((g) => (
                    <label key={g} className="rounded-xl bg-muted/40 p-2">
                      <span className="text-[11px] font-black">{g}</span>
                      <input
                        type="number"
                        min={0}
                        className={inputCls}
                        value={draft.cardPlan[g]}
                        onInput={(e) => {
                          const value = Math.max(0, Number(e.currentTarget.value) || 0);
                          updateDraft((current) => ({
                            ...current,
                            cardPlan: { ...current.cardPlan, [g]: value },
                          }));
                        }}
                      />
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  卡牌總數：<span className="font-black tabular-nums text-foreground">{total}</span> 張
                </p>
                <FieldError message={fieldError(3, "cardTotal")} />
              </div>

              <div>
                <span className={labelCls}>素材狀態（原型不做真實上傳）</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(Object.keys(MATERIAL_STATUS_LABEL) as MaterialStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => set("materialStatus", s)}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                        draft.materialStatus === s
                          ? "border-primary/60 bg-primary/10"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {MATERIAL_STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
              <StepErrors errors={visibleStepErrors(3)} />
            </section>
          )}

          {/* ── Step 4 抽卡範圍與機率 ── */}
          {step === 4 && (
            <section className="panel space-y-4 p-4 sm:p-5">
              <h2 className="text-sm font-black tracking-widest text-muted-foreground">Step 4 抽卡範圍與機率</h2>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-xl border border-primary/60 bg-primary/10 px-3 py-2 text-xs font-bold">
                  單一卡池（single_pool・V1 固定）
                </span>
                <button
                  disabled
                  className="cursor-not-allowed rounded-xl border border-border px-3 py-2 text-xs font-bold text-muted-foreground opacity-50"
                >
                  全卡池抽卡（規劃中／尚未啟用）
                </button>
              </div>

              <div data-validation-field="ratesTotal" tabIndex={-1} className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="px-2 py-2 text-left">等級</th>
                      <th className="px-2 py-2 text-left">啟用</th>
                      <th className="px-2 py-2 text-right">機率（%）</th>
                      <th className="px-2 py-2 text-right">卡牌數</th>
                      <th className="px-2 py-2 text-right">單張平均機率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GRADES.map((g) => {
                      const r = draft.rates[g];
                      const per = perCardPct(draft, g);
                      const bad = r.enabled && r.pct > 0 && (draft.cardPlan[g] || 0) < 1;
                      return (
                        <tr key={g} data-validation-field={`range-${g}`} tabIndex={-1} className="border-t border-border/60">
                          <td className="px-2 py-2 font-black">{g}</td>
                          <td className="px-2 py-2">
                            <input
                              type="checkbox"
                              checked={r.enabled}
                              onChange={(e) => {
                                const enabled = e.currentTarget.checked;
                                updateDraft((current) => ({
                                  ...current,
                                  rates: {
                                    ...current.rates,
                                    [g]: { ...current.rates[g], enabled },
                                  },
                                }));
                              }}
                            />
                          </td>
                          <td className="px-2 py-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min={0}
                              disabled={!r.enabled}
                              className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-right tabular-nums disabled:opacity-40"
                              value={r.pct}
                              onInput={(e) => {
                                const pct = Math.max(0, Number(e.currentTarget.value) || 0);
                                updateDraft((current) => ({
                                  ...current,
                                  rates: {
                                    ...current.rates,
                                    [g]: { ...current.rates[g], pct },
                                  },
                                }));
                              }}
                            />
                          </td>
                          <td className={`px-2 py-2 text-right tabular-nums ${bad ? "font-bold text-destructive" : ""}`}>
                            {draft.cardPlan[g] || 0}
                            {bad && <span className="ml-1">無可抽卡牌</span>}
                          </td>
                          <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">
                            {per === null ? "—" : `${per.toFixed(3)}%`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className={`text-sm font-black ${Math.abs(sum - 100) > 0.001 ? "text-destructive" : "text-foreground"}`}>
                已啟用等級機率總和：{sum}%（必須等於 100%）
              </p>
              <FieldError message={fieldError(4, "ratesTotal")} />
              {visibleStepErrors(4)
                .filter((error) => error.field.startsWith("range-"))
                .map((error) => <FieldError key={error.field} message={error.message} />)}
              <p className="text-[11px] text-muted-foreground">
                抽卡保底機制、門檻、適用等級與卡池結束後處理方式皆為 Demo 規則／待定，此處不填入任何未核定數字。
              </p>
              <StepErrors errors={visibleStepErrors(4)} />
            </section>
          )}

          {/* ── Step 5 合成條件 ── */}
          {step === 5 && (
            <section className="panel space-y-4 p-4 sm:p-5">
              <h2 className="text-sm font-black tracking-widest text-muted-foreground">Step 5 合成條件</h2>
              <p className="text-xs text-muted-foreground">
                合成範圍固定為本卡池（{draft.name || "（尚未命名）"}／{draft.slug || "p-…"}）；僅能使用同一卡池、同等級卡牌作為素材。
              </p>

              <div data-validation-field="synthGrades" tabIndex={-1}>
                <span className={labelCls}>可合成等級（O 為最高級，不可再往上合成）</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {GRADES.map((g) => {
                    const disabled = g === "O";
                    const on = draft.synthEnabledGrades.includes(g);
                    return (
                      <button
                        key={g}
                        disabled={disabled}
                        onClick={() =>
                          updateDraft((current) => ({
                            ...current,
                            synthEnabledGrades: current.synthEnabledGrades.includes(g)
                              ? current.synthEnabledGrades.filter((x) => x !== g)
                              : [...current.synthEnabledGrades, g],
                          }))
                        }
                        className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                          disabled
                            ? "cursor-not-allowed border-border text-muted-foreground opacity-40"
                            : on
                              ? "border-primary/60 bg-primary/10"
                              : "border-border text-muted-foreground"
                        }`}
                      >
                        {g}
                        {disabled && <span className="ml-1 text-[10px]">最高級</span>}
                      </button>
                    );
                  })}
                </div>
                <FieldError message={fieldError(5, "synthGrades")} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={labelCls}>商城道具加成（Demo 預覽，只增加成功率）</span>
                  <input
                    data-validation-field="synthItemBoostPct"
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    className={`${inputCls} ${fieldError(5, "synthItemBoostPct") ? "border-destructive" : ""}`}
                    value={draft.synthItemBoostPct ?? ""}
                    onInput={(e) => {
                      const raw = e.currentTarget.value.trim();
                      const value = raw === "" ? null : Number(raw) || 0;
                      updateDraft((current) => ({ ...current, synthItemBoostPct: value }));
                    }}
                    placeholder="未輸入＝Demo／待定"
                  />
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    範本帶入的示例值皆為 Demo，可清空；清空後顯示 Demo／待定。
                  </span>
                  <FieldError message={fieldError(5, "synthItemBoostPct")} />
                </label>
              </div>


              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="px-2 py-2 text-left">等級</th>
                      <th className="px-2 py-2 text-left">成功取得</th>
                      <th className="px-2 py-2 text-right">素材張數（Demo）</th>
                      <th className="px-2 py-2 text-right">基礎成功率（%）</th>
                      <th className="px-2 py-2 text-right">最終成功率（含道具・Demo）</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.synthEnabledGrades.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-2 py-4 text-center text-muted-foreground">
                          尚未選擇可合成等級（Demo／待定）
                        </td>
                      </tr>
                    ) : (
                      GRADES.filter((g) => draft.synthEnabledGrades.includes(g)).map((g) => {
                        const base = draft.synthBaseRate[g];
                        const count = draft.synthMaterialCount[g];
                        const final = finalSynthRate(base, draft.synthItemBoostPct);
                        const up = nextGrade(g as Rarity);
                        return (
                          <tr key={g} className="border-t border-border/60">
                            <td className="px-2 py-2 font-black">{g}</td>
                            <td className="px-2 py-2 text-muted-foreground">
                              {up ? `本卡池隨機 ${up} 卡` : "—"}
                            </td>
                            <td className="px-2 py-2 text-right">
                              <input
                                data-validation-field={`synthCount-${g}`}
                                aria-invalid={Boolean(fieldError(5, `synthCount-${g}`))}
                                type="number"
                                min={1}
                                step="1"
                                className={`w-20 rounded-lg border bg-background px-2 py-1 text-right tabular-nums ${
                                  fieldError(5, `synthCount-${g}`) ? "border-destructive" : "border-border"
                                }`}
                                value={count ?? ""}
                                onInput={(e) => {
                                  const raw = e.currentTarget.value.trim();
                                  const value = raw === "" ? null : Number(raw);
                                  updateDraft((current) => ({
                                    ...current,
                                    synthMaterialCount: { ...current.synthMaterialCount, [g]: value },
                                  }));
                                }}
                                placeholder="待定"
                              />
                            </td>
                            <td className="px-2 py-2 text-right">
                              <input
                                data-validation-field={`synth-${g}`}
                                aria-invalid={Boolean(fieldError(5, `synth-${g}`))}
                                type="number"
                                min={0}
                                max={100}
                                step="0.1"
                                className={`w-24 rounded-lg border bg-background px-2 py-1 text-right tabular-nums ${
                                  fieldError(5, `synth-${g}`) ? "border-destructive" : "border-border"
                                }`}
                                value={base ?? ""}
                                onInput={(e) => {
                                  const raw = e.currentTarget.value.trim();
                                  const value = raw === "" ? null : Number(raw);
                                  updateDraft((current) => ({
                                    ...current,
                                    synthBaseRate: { ...current.synthBaseRate, [g]: value },
                                  }));
                                }}
                                placeholder="待定"
                              />
                            </td>
                            <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">
                              {count === null || base === null
                                ? "Demo／待定"
                                : `${final}%（${count} 張素材）`}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <ul className="space-y-1 rounded-xl bg-muted/40 p-3 text-[11px] text-muted-foreground">
                {SYNTH_FIXED_RULES.map((r) => (
                  <li key={r}>・{r}</li>
                ))}
                <li>・素材張數與各等級成功率皆為 Demo 示例，正式數值待核定。</li>
              </ul>
              <StepErrors errors={visibleStepErrors(5)} />
            </section>
          )}

          {/* Step 6–7：下一批完成 */}


          {/* 操作列（手機底部固定單欄） */}
          <div className="fixed inset-x-0 bottom-16 z-50 flex items-center gap-2 border-t border-border bg-background/95 p-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground disabled:opacity-40"
            >
              上一步
            </button>
            <button
              onClick={validateAndAdvance}
              className="rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground"
            >
              {step >= ENABLED_MAX_STEP ? "驗證全部步驟" : "下一步"}
            </button>
            <Link to="/admin/pools" className="ml-auto text-[11px] font-bold text-muted-foreground hover:text-foreground">
              回到卡池管理
            </Link>
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">{PERSIST_DEMO_NOTE}</p>

        </>
      )}
    </div>
  );
}

function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return <p className="mt-1 text-[11px] font-bold text-destructive">{message}</p>;
}

function StepErrors({ errors }: { errors: { step: number; field: string; message: string }[] }) {
  if (errors.length === 0) return null;
  return (
    <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-[11px] font-bold text-destructive">
      <p className="mb-1">請修正以下問題後再繼續：</p>
      <ul className="space-y-1">
      {errors.map((e, i) => (
        <li key={i}>{e.message}</li>
      ))}
      </ul>
    </div>
  );
}
