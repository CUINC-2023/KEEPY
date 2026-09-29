import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { GRADES, type Rarity } from "@/data/mock";
import type { DrawCardRow, GradeRuleRow } from "@/data/admin";
import {
  PITY_FIELD_HINTS as H,
  PITY_FOUNDER_TODO,
  POOL_END_LABEL,
  RESET_TRIGGER_LABEL,
  defaultPityConfig,
  demoScenarios,
  simulatePity,
  validatePity,
  validatePublish,
  type DrawPityConfig,
  type PityVersionRecord,
} from "@/data/draw-pity";

const input = "w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground";

function Field({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs font-bold text-foreground">{label}</p>
      {children}
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {hint}{" "}
        <Link to="/faq" hash="draw-pity" className="font-semibold text-primary hover:underline">FAQ</Link>
      </p>
    </div>
  );
}

export function DrawPityPanel({ grades, cards }: { grades: GradeRuleRow[]; cards: DrawCardRow[] }) {
  const [cfg, setCfg] = useState<DrawPityConfig>(defaultPityConfig);
  const [snapshot, setSnapshot] = useState<DrawPityConfig | null>(null);
  const [history, setHistory] = useState<PityVersionRecord[]>([]);
  const [publishErrs, setPublishErrs] = useState<string[] | null>(null);
  const set = (p: Partial<DrawPityConfig>) => { setCfg((c) => ({ ...c, ...p, reviewStatus: c.reviewStatus === "已覆核（Demo）" ? "待覆核" : c.reviewStatus, ...(p.reviewStatus ? { reviewStatus: p.reviewStatus } : {}) })); setPublishErrs(null); };
  const errs = validatePity(cfg, grades, cards);
  const drawableTarget = cfg.targetGrade ? cards.filter((c) => c.grade === cfg.targetGrade && c.included) : [];

  const ssrIds = cards.filter((c) => c.grade === "SSR" && c.included).map((c) => c.id);
  const scenarios = useMemo(() => demoScenarios(ssrIds, "UR"), [ssrIds.join()]);
  const [sid, setSid] = useState(scenarios[1]!.id);
  const sc = scenarios.find((s) => s.id === sid)!;
  const scCards = sc.excludeGrade ? cards.map((c) => (c.grade === sc.excludeGrade ? { ...c, included: false } : c)) : cards;
  const scErrs = validatePity(sc.config, grades, scCards);
  const events = scErrs.length ? [] : simulatePity(sc.config, sc.startCount, sc.draws, sc.natural, scCards);

  return (
    <section className="panel space-y-5 p-4 sm:p-5" aria-labelledby="pity-h">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="pity-h" className="text-lg font-black tracking-wide">抽卡保底規則</h2>
          <span className="demo-chip">未核定／不可發布</span>
          <span className="demo-chip">Local Mock</span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          只處理「抽卡保底」，與合成設定的「連續失敗 10 次保底」無關，兩者計數不互通。設定只存在此頁畫面，不影響前台、玩家帳本或分潤。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="啟用抽卡保底" hint={H.enabled}>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cfg.enabled} onChange={(e) => set({ enabled: e.target.checked })} className="accent-[var(--color-primary)]" />{cfg.enabled ? "啟用（草稿）" : "停用"}</label>
        </Field>
        <Field label="計數範圍" hint={H.scope}>
          <select className={input} value="pool" disabled><option value="pool">該卡池</option></select>
        </Field>
        <Field label="觸發門檻（抽數）" hint={H.threshold}>
          <input className={input} inputMode="numeric" placeholder="未核定" value={cfg.threshold} onChange={(e) => set({ threshold: e.target.value })} aria-label="觸發門檻" />
        </Field>
        <Field label="觸發類型" hint={H.triggerType}>
          <select className={input} value={cfg.triggerType} disabled><option value="at_threshold_min_grade">到達門檻該抽保證至少目標等級</option></select>
        </Field>
        <Field label="保底目標等級" hint={H.targetGrade}>
          <select className={input} value={cfg.targetGrade} onChange={(e) => set({ targetGrade: e.target.value as Rarity | "", targetCardIds: [] })} aria-label="保底目標等級">
            <option value="">未選擇</option>
            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="該等級可抽卡範圍" hint={H.targetCards}>
          {!cfg.targetGrade ? <p className="text-xs text-muted-foreground">請先選目標等級。</p> : drawableTarget.length === 0 ? <p className="text-xs font-semibold text-destructive">此等級沒有在抽取範圍內的卡牌。</p> : (
            <div className="max-h-32 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
              {drawableTarget.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={cfg.targetCardIds.includes(c.id)} onChange={(e) => set({ targetCardIds: e.target.checked ? [...cfg.targetCardIds, c.id] : cfg.targetCardIds.filter((x) => x !== c.id) })} className="accent-[var(--color-primary)]" /><span className="truncate">{c.name}</span></label>
              ))}
            </div>
          )}
        </Field>
        <Field label="抽中目標或更高時重置" hint={H.resetOnHit}>
          <select className={input} value={cfg.resetOnHitOrHigher === null ? "" : String(cfg.resetOnHitOrHigher)} onChange={(e) => set({ resetOnHitOrHigher: e.target.value === "" ? null : e.target.value === "true" })} aria-label="抽中目標或更高時重置">
            <option value="">未選擇</option><option value="true">重置</option><option value="false">不重置</option>
          </select>
        </Field>
        <Field label="觸發後重置方式" hint={H.resetOnTrigger}>
          <select className={input} value={cfg.resetOnTrigger} onChange={(e) => set({ resetOnTrigger: e.target.value as DrawPityConfig["resetOnTrigger"] })} aria-label="觸發後重置方式">
            <option value="">未選擇</option>{Object.entries(RESET_TRIGGER_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="卡池結束後計數" hint={H.poolEnd}>
          <select className={input} value={cfg.poolEndHandling} onChange={(e) => set({ poolEndHandling: e.target.value as DrawPityConfig["poolEndHandling"] })} aria-label="卡池結束後計數">
            <option value="">未選擇</option>{Object.entries(POOL_END_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="規則生效版本" hint={H.version}>
          <input className={input} placeholder="例：pity-v1（Demo）" value={cfg.effectiveVersion} onChange={(e) => set({ effectiveVersion: e.target.value })} aria-label="規則生效版本" />
        </Field>
        <Field label="審核狀態" hint={H.review}>
          <p className="text-sm font-bold">{cfg.reviewStatus}</p>
        </Field>
      </div>

      <div role="status" className={`rounded-xl border p-3 text-xs ${errs.length ? "border-destructive/40 text-destructive" : "border-border text-muted-foreground"}`}>
        {!cfg.enabled ? "保底停用中：不需填寫欄位。" : errs.length ? <ul className="space-y-1">{errs.map((e) => <li key={e}>・{e}</li>)}</ul> : "欄位驗證通過（仍為未核定草稿）。"}
      </div>

      <div className="flex flex-wrap gap-2">
        <button disabled={!cfg.enabled || errs.length > 0} onClick={() => { setSnapshot({ ...cfg }); setCfg((c) => ({ ...c, reviewStatus: "已覆核（Demo）" })); setPublishErrs(null); }} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-40">建立覆核快照（Demo）</button>
        <button onClick={() => setPublishErrs(validatePublish(cfg, snapshot, history, grades, cards))} className="rounded-xl border border-gold/50 px-4 py-2 text-sm font-bold text-gold hover:bg-gold/10">檢查可否發布</button>
        <button disabled={!snapshot || !cfg.effectiveVersion.trim() || history.some((h) => h.version === cfg.effectiveVersion.trim())} onClick={() => snapshot && setHistory((h) => [...h, { version: cfg.effectiveVersion.trim(), snapshot, reviewedAt: "Local Mock", note: "封存覆核快照；舊版本不可覆寫（未發布）" }])} className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted disabled:opacity-40">封存版本快照</button>
        <button onClick={() => { setCfg(defaultPityConfig()); setSnapshot(null); setPublishErrs(null); }} className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted">重設為未核定</button>
      </div>
      {publishErrs && <div role="alert" className="rounded-xl border border-gold/40 p-3 text-xs text-gold"><p className="font-bold">不可發布：</p><ul className="mt-1 space-y-1">{publishErrs.map((e) => <li key={e}>・{e}</li>)}</ul></div>}
      {history.length > 0 && <ul className="space-y-1 text-xs text-muted-foreground">{history.map((h) => <li key={h.version}>・<span className="font-mono">{h.version}</span>：門檻 {h.snapshot.threshold || "—"}／{h.snapshot.targetGrade || "—"}・{h.note}</li>)}</ul>}

      {/* 模擬器 */}
      <div className="space-y-3 border-t border-border pt-4">
        <div className="flex flex-wrap items-center gap-2"><h3 className="font-black">保底模擬器</h3><span className="demo-chip">Demo 範例值・非正式承諾</span></div>
        <p className="text-xs text-muted-foreground">使用獨立測試情境與固定自然結果（非亂數）；自然結果只是等級示意，保底替換才從所選可抽卡產生卡牌。「門檻到達」不等於「保底替換」。不修改玩家帳本或既有固定 11 張結果。</p>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="模擬情境">
          {scenarios.map((s) => <button key={s.id} role="tab" aria-selected={s.id === sid} onClick={() => setSid(s.id)} className={`rounded-full border px-3 py-1 text-xs font-bold ${s.id === sid ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:bg-muted"}`}>{s.label}</button>)}
        </div>
        <p className="text-xs text-muted-foreground">{sc.desc} 設定：門檻 {sc.config.threshold || "（空）"}、目標 {sc.config.targetGrade || "—"}、起始計數 {sc.startCount}、{sc.draws.length === 11 ? "十抽送一抽 +11" : sc.draws.length === 1 ? "單抽 +1" : "無抽卡"}。</p>
        {scErrs.length > 0 ? (
          <div role="alert" className="rounded-xl border border-destructive/40 p-3 text-xs text-destructive"><p className="font-bold">驗證阻擋，不進行模擬：</p><ul>{scErrs.map((e) => <li key={e}>・{e}</li>)}</ul></div>
        ) : sc.poolEnded ? (
          <p className="rounded-xl border border-border p-3 text-xs">卡池結束：未觸發計數 {sc.startCount} → {sc.config.poolEndHandling === "clear" ? "0（清除，不轉移到其他卡池）" : `${sc.startCount}（保留至同池復刻）`}。</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[760px] text-xs">
              <thead className="bg-muted/40 text-muted-foreground"><tr>{["#", "來源", "計數", "自然（等級示意）", "結果", "門檻", "付費 KP", "創作者分潤／原因", "事件"].map((h) => <th key={h} className="px-2 py-1.5 text-left font-semibold">{h}</th>)}</tr></thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.step} className={`border-t border-border ${e.guaranteeApplied ? "bg-gold/10" : e.naturalHitAtThreshold ? "bg-primary/10" : ""}`}>
                    <td className="px-2 py-1.5 tabular-nums">{e.step}</td>
                    <td className="px-2 py-1.5">{e.kind === "bonus" ? "第 11 次（bonus）" : "付費抽"}</td>
                    <td className="px-2 py-1.5 tabular-nums">{e.countBefore} → {e.countAfter}</td>
                    <td className="px-2 py-1.5">{e.natural}</td>
                    <td className="px-2 py-1.5 font-bold">{e.result}{e.guaranteeApplied ? `（保底替換：${e.resultCardName ?? "—"}）` : e.naturalHitAtThreshold ? "（自然命中，非替換）" : ""}</td>
                    <td className="px-2 py-1.5">{e.thresholdReached ? "已到達" : "—"}</td>
                    <td className="px-2 py-1.5">{e.paidKp}</td>
                    <td className="px-2 py-1.5">{e.creatorShare}<span className="block text-muted-foreground">{e.shareReason}</span></td>
                    <td className="px-2 py-1.5 text-muted-foreground">{e.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
        <p className="font-bold text-foreground">待創辦人填定</p>
        <ul className="mt-1 grid gap-1 sm:grid-cols-2">{PITY_FOUNDER_TODO.map((t) => <li key={t}>・{t}</li>)}</ul>
      </div>
    </section>
  );
}
