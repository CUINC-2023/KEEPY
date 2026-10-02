import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { poolById } from "@/data/mock";
import {
  NON_RETROACTIVE_NOTE,
  SYNTH_RULE_FIXED,
  SYNTH_TBD_ITEMS,
  SYNTH_VERSION_LOG,
  buildSynthesisSettings,
} from "@/data/admin";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { StatusTag } from "@/components/ui/status-tag";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { StateSwitcher, StatePlaceholder, useDemoState } from "@/components/ui/state-demo";

export const Route = createFileRoute("/admin/pools/$poolId/synthesis-settings")({
  head: () => ({
    meta: [
      { title: "合成條件設定 — KEEPY管理後台" },
      { name: "description", content: "單一卡池合成素材張數、基礎成功率、道具加成與連續失敗保底設定面板。（Demo）" },
      { property: "og:title", content: "合成條件設定 — KEEPY管理後台" },
      { property: "og:description", content: "單一卡池合成素材張數、基礎成功率、道具加成與連續失敗保底設定面板。（Demo）" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SynthesisSettings,
});

function SynthesisSettings() {
  const { poolId } = Route.useParams();
  const pool = poolById(poolId)!;
  const initial = useMemo(() => buildSynthesisSettings(pool), [pool]);

  const [state, setState] = useDemoState();
  const [grades, setGrades] = useState(initial.grades);
  const [materialCount, setMaterialCount] = useState(initial.materialCount);
  const [samePoolOnly, setSamePoolOnly] = useState(initial.samePoolOnly);
  const [sameGradeOnly, setSameGradeOnly] = useState(initial.sameGradeOnly);
  const [itemBoostEnabled, setItemBoostEnabled] = useState(initial.itemBoostEnabled);
  const [itemBoostPct, setItemBoostPct] = useState(initial.itemBoostPct);
  const [confirm, setConfirm] = useState<null | "draft" | "publish">(null);
  const { push } = useToast();

  const changes: string[] = [];
  if (materialCount !== initial.materialCount) changes.push(`素材張數 ${initial.materialCount} → ${materialCount} 張`);
  if (samePoolOnly !== initial.samePoolOnly) changes.push(`同一卡池限制 ${initial.samePoolOnly ? "開" : "關"} → ${samePoolOnly ? "開" : "關"}`);
  if (sameGradeOnly !== initial.sameGradeOnly) changes.push(`同等級限制 ${initial.sameGradeOnly ? "開" : "關"} → ${sameGradeOnly ? "開" : "關"}`);
  if (itemBoostEnabled !== initial.itemBoostEnabled) changes.push(`商城道具加成 ${initial.itemBoostEnabled ? "啟用" : "停用"} → ${itemBoostEnabled ? "啟用" : "停用"}`);
  if (itemBoostPct !== initial.itemBoostPct) changes.push(`道具加成 ${initial.itemBoostPct}% → ${itemBoostPct}%`);
  grades.forEach((g, i) => {
    const o = initial.grades[i]!;
    if (g.baseRate !== o.baseRate) changes.push(`${g.grade} 基礎成功率 ${o.baseRate}% → ${g.baseRate}%`);
    if (g.enabled !== o.enabled) changes.push(`${g.grade} 可合成 ${o.enabled ? "開" : "關"} → ${g.enabled ? "開" : "關"}`);
  });
  const dirty = changes.length > 0;

  return (
    <div className="space-y-5">
      <StateSwitcher state={state} onChange={setState} />
      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="此卡池尚無合成設定" emptyDescription="建立草稿後即可設定素材與成功率。" />
      ) : (
        <>
          <section className="panel hairline-gold space-y-1.5 p-5 text-sm leading-relaxed text-muted-foreground">
            <p className="font-black text-foreground">已核定規則（不可變更）</p>
            {SYNTH_RULE_FIXED.map((r) => (
              <p key={r} className="flex gap-2"><span className="text-gold">◆</span>{r}</p>
            ))}
          </section>

          {/* ── 基本條件 ── */}
          <section className="panel grid gap-4 p-5 sm:grid-cols-2">
            <label className="text-xs text-muted-foreground">
              素材張數
              <input
                type="number"
                min={2}
                max={10}
                value={materialCount}
                onChange={(e) => setMaterialCount(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm tabular-nums text-foreground"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              連續失敗保底次數（已核定）
              <input
                value={initial.pityFailCount}
                readOnly
                className="mt-1 w-full cursor-not-allowed rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm tabular-nums text-muted-foreground"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={samePoolOnly} onChange={(e) => setSamePoolOnly(e.target.checked)} className="accent-[var(--color-primary)]" />
              限同一卡池素材
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={sameGradeOnly} onChange={(e) => setSameGradeOnly(e.target.checked)} className="accent-[var(--color-primary)]" />
              限同等級素材
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={itemBoostEnabled} onChange={(e) => setItemBoostEnabled(e.target.checked)} className="accent-[var(--color-primary)]" />
              啟用商城道具加成（僅增加成功率）
            </label>
            <label className="text-xs text-muted-foreground">
              道具加成（%）
              <input
                type="number"
                min={0}
                max={100}
                value={itemBoostPct}
                disabled={!itemBoostEnabled}
                onChange={(e) => setItemBoostPct(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm tabular-nums text-foreground disabled:opacity-40"
              />
            </label>
          </section>

          {/* ── 各等級成功率 ── */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black tracking-wide">各等級基礎成功率與最終成功率預覽</h2>
              {dirty && <StatusTag tone="pending" label="有未儲存變更" />}
            </div>
            <div className="panel divide-y divide-border/60">
              {grades.map((g, i) => {
                const final = Math.min(100, g.baseRate + (itemBoostEnabled ? itemBoostPct : 0));
                return (
                  <div key={g.grade} className="grid grid-cols-[auto_1fr] items-center gap-3 p-3 sm:grid-cols-[auto_120px_1fr_auto]">
                    <RarityBadge rarity={g.grade} />
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={g.enabled}
                        onChange={(e) => setGrades((prev) => prev.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x)))}
                        className="accent-[var(--color-primary)]"
                      />
                      可合成
                    </label>
                    <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={g.baseRate}
                        disabled={!g.enabled}
                        onChange={(e) => setGrades((prev) => prev.map((x, j) => (j === i ? { ...x, baseRate: Number(e.target.value) } : x)))}
                        className="w-24 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-sm tabular-nums text-foreground disabled:opacity-40"
                      />
                      <span className="text-xs text-muted-foreground">% 基礎</span>
                    </div>
                    <span className="text-right text-xs tabular-nums text-muted-foreground">
                      最終 {g.enabled ? `${final}%` : "—"}
                      {g.grade === "O" && <span className="ml-1 text-gold">O 卡是否可合成：待定</span>}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              最終成功率＝基礎成功率＋道具加成（Demo 計算方式，正式公式待定）。
            </p>
          </section>

          {/* ── 影響摘要 ── */}
          <section className="panel space-y-2 p-5">
            <p className="font-black">變更影響摘要</p>
            {dirty ? (
              <ul className="space-y-1 text-sm text-muted-foreground">
                {changes.map((c) => (
                  <li key={c}>・{c}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">目前沒有變更。</p>
            )}
            <p className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-xs font-semibold text-gold">
              {NON_RETROACTIVE_NOTE}
            </p>
          </section>

          <section className="panel flex flex-wrap items-center gap-2 p-4">
            <button
              onClick={() => setConfirm("draft")}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              儲存草稿（Demo）
            </button>
            <button
              onClick={() => setConfirm("publish")}
              className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-ink hover:bg-gold/90"
            >
              發布（Demo）
            </button>
            <button
              onClick={() => {
                setGrades(initial.grades);
                setMaterialCount(initial.materialCount);
                setSamePoolOnly(initial.samePoolOnly);
                setSameGradeOnly(initial.sameGradeOnly);
                setItemBoostEnabled(initial.itemBoostEnabled);
                setItemBoostPct(initial.itemBoostPct);
              }}
              className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              捨棄變更
            </button>
          </section>

          <section className="panel p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">待決策項目</p>
            <ul className="mt-1 space-y-1">
              {SYNTH_TBD_ITEMS.map((t) => (
                <li key={t}>・{t}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black tracking-wide">版本紀錄（Mock）</h2>
            <DataTable
              columns={[
                { key: "version", label: "版本" },
                { key: "action", label: "動作" },
                { key: "by", label: "操作者" },
                { key: "at", label: "時間" },
                { key: "note", label: "說明" },
              ]}
              rows={SYNTH_VERSION_LOG.map((v) => ({
                version: <span className="font-mono text-xs">{v.version}</span>,
                action: <StatusTag tone={v.action === "發布" ? "live" : "info"} label={v.action} />,
                by: <span className="text-muted-foreground">{v.by}</span>,
                at: <span className="tabular-nums text-muted-foreground">{v.at}</span>,
                note: <span className="text-muted-foreground">{v.note}</span>,
              }))}
            />
          </section>
        </>
      )}

      <ConfirmDialog
        open={confirm !== null}
        title={confirm === "publish" ? "發布合成設定（Demo）" : "儲存草稿（Demo）"}
        description={`${changes.length} 項變更。${NON_RETROACTIVE_NOTE}此原型不會真的發布，也不會改動前台或玩家紀錄。`}
        confirmLabel={confirm === "publish" ? "模擬發布" : "模擬儲存"}
        tone={confirm === "publish" ? "gold" : "violet"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const p = confirm === "publish";
          setConfirm(null);
          push({
            title: p ? "已模擬發布（Demo）" : "已儲存草稿（Demo）",
            description: "僅影響發布後的新合成（Demo），不追溯既有紀錄。",
            tone: p ? "gold" : "default",
          });
        }}
      />
    </div>
  );
}
