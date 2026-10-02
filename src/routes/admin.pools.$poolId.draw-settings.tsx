import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GRADES, poolById, type Rarity } from "@/data/mock";
import {
  ALL_POOLS_TBD,
  DRAW_SCOPES,
  DRAW_VERSION_LOG,
  buildDrawSettings,
} from "@/data/admin";
import { DrawPityPanel } from "@/components/admin/DrawPityPanel";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { StatusTag } from "@/components/ui/status-tag";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { StateSwitcher, StatePlaceholder, useDemoState } from "@/components/ui/state-demo";

export const Route = createFileRoute("/admin/pools/$poolId/draw-settings")({
  head: () => ({
    meta: [
      { title: "抽卡機率設定 — KEEPY管理後台" },
      { name: "description", content: "單一卡池十級機率、等級啟用、卡牌抽取範圍與同等級權重設定面板。（Demo）" },
      { property: "og:title", content: "抽卡機率設定 — KEEPY管理後台" },
      { property: "og:description", content: "單一卡池十級機率、等級啟用、卡牌抽取範圍與同等級權重設定面板。（Demo）" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DrawSettings,
});

function DrawSettings() {
  const { poolId } = Route.useParams();
  const pool = poolById(poolId)!;
  const initial = useMemo(() => buildDrawSettings(pool), [pool]);

  const [state, setState] = useDemoState();
  const [grades, setGrades] = useState(initial.grades);
  const [cards, setCards] = useState(initial.cards);
  const [evenWeight, setEvenWeight] = useState(initial.evenWeight);
  const [confirm, setConfirm] = useState<null | "draft" | "publish">(null);
  const { push } = useToast();

  const total = grades.reduce((s, g) => s + (g.enabled ? g.pct : 0), 0);
  const totalOk = Math.abs(total - 100) < 0.001;
  const dirty =
    evenWeight !== initial.evenWeight ||
    grades.some((g, i) => g.pct !== initial.grades[i]!.pct || g.enabled !== initial.grades[i]!.enabled) ||
    cards.some((c, i) => c.included !== initial.cards[i]!.included || c.weight !== initial.cards[i]!.weight);

  const includedByGrade = (g: Rarity) => cards.filter((c) => c.grade === g && c.included);
  /** 已啟用且機率 > 0，但抽取範圍內沒有任何已納入卡牌的等級 */
  const emptyGrades = grades.filter((g) => g.enabled && g.pct > 0 && includedByGrade(g.grade).length === 0);
  const canSave = totalOk && emptyGrades.length === 0;

  return (
    <div className="space-y-5">
      <StateSwitcher state={state} onChange={setState} />
      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="此卡池尚無抽卡設定" emptyDescription="建立草稿後即可設定十級機率與抽取範圍。" />
      ) : (
        <>
          {/* ── 抽卡範圍 ── */}
          <section className="space-y-3">
            <h2 className="text-lg font-black tracking-wide">抽卡範圍（draw_scope）</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {DRAW_SCOPES.map((s) => (
                <label
                  key={s.key}
                  className={`panel flex gap-3 p-4 ${s.enabled ? "cursor-pointer hairline-gold" : "cursor-not-allowed opacity-70"}`}
                >
                  <input type="radio" name="scope" disabled={!s.enabled} defaultChecked={s.enabled} className="mt-1 accent-[var(--color-primary)]" />
                  <span>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-black">{s.label}</span>
                      <StatusTag tone={s.enabled ? "live" : "resting"} label={s.enabled ? "已啟用" : "尚未啟用"} />
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{s.desc}</span>
                    {!s.enabled && (
                      <span className="mt-2 block space-y-1 text-xs text-muted-foreground">
                        {ALL_POOLS_TBD.map((t) => (
                          <span key={t} className="block">・{t}</span>
                        ))}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              卡池：{pool.name}（{pool.id}）｜玩家只能抽到此卡池內已啟用且列入抽取範圍的卡牌。
            </p>
          </section>

          {/* ── 十級機率 ── */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black tracking-wide">十級機率</h2>
              {dirty && <StatusTag tone="pending" label="有未儲存變更" />}
              <span className={`ml-auto rounded-full px-3 py-1 text-xs font-black tabular-nums ${totalOk ? "bg-primary/15 text-foreground ring-1 ring-primary/30" : "bg-destructive/15 text-destructive ring-1 ring-destructive/40"}`}>
                總和 {total.toFixed(2)}%
              </span>
            </div>
            {!totalOk && (
              <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive">
                已啟用等級的機率總和必須等於 100%，目前為 {total.toFixed(2)}%，無法儲存或發布。
              </p>
            )}
            {emptyGrades.length > 0 && (
              <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive">
                {emptyGrades.map((g) => g.grade).join("、")} 等級已啟用且機率大於 0，但抽取範圍內沒有任何已納入卡牌；每個已啟用等級至少需有 1 張已納入卡牌，否則無法儲存或發布。
              </p>
            )}
            <div className="panel divide-y divide-border/60">
              {grades.map((g, i) => (
                <div key={g.grade} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 p-3 sm:grid-cols-[auto_120px_1fr_auto]">
                  <RarityBadge rarity={g.grade} />
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={g.enabled}
                      onChange={(e) =>
                        setGrades((prev) => prev.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x)))
                      }
                      className="accent-[var(--color-primary)]"
                    />
                    啟用
                  </label>
                  <div className="col-span-3 flex items-center gap-2 sm:col-span-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={g.pct}
                      disabled={!g.enabled}
                      onChange={(e) =>
                        setGrades((prev) => prev.map((x, j) => (j === i ? { ...x, pct: Number(e.target.value) } : x)))
                      }
                      className="w-28 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-sm tabular-nums text-foreground disabled:opacity-40"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                    <div className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-muted sm:block">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(g.pct, 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-right text-xs tabular-nums">
                    {g.enabled && g.pct > 0 && includedByGrade(g.grade).length === 0 ? (
                      <span className="font-semibold text-destructive">無可抽取卡牌</span>
                    ) : (
                      <span className="text-muted-foreground">{includedByGrade(g.grade).length} 張在範圍內</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ── 機率預覽 ── */}
          <section className="space-y-3">
            <h2 className="text-lg font-black tracking-wide">機率預覽</h2>
            <DataTable
              columns={[
                { key: "grade", label: "等級" },
                { key: "pct", label: "等級機率", className: "text-right" },
                { key: "cards", label: "抽取範圍卡牌", className: "text-right" },
                { key: "per", label: "單張卡牌機率（平均權重）", className: "text-right" },
              ]}
              rows={GRADES.map((g) => {
                const row = grades.find((x) => x.grade === g)!;
                const n = includedByGrade(g).length;
                const pct = row.enabled ? row.pct : 0;
                return {
                  grade: <RarityBadge rarity={g} />,
                  pct: <span className="tabular-nums">{pct.toFixed(2)}%</span>,
                  cards: <span className="tabular-nums text-muted-foreground">{n}</span>,
                  per: (
                    <span className="tabular-nums text-muted-foreground">
                      {n > 0 && pct > 0 ? `${(pct / n).toFixed(3)}%` : "—"}
                    </span>
                  ),
                };
              })}
            />
          </section>

          {/* ── 卡牌抽取範圍與權重 ── */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black tracking-wide">卡牌抽取範圍與權重</h2>
              <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={evenWeight}
                  onChange={(e) => setEvenWeight(e.target.checked)}
                  className="accent-[var(--color-primary)]"
                />
                同等級內平均權重（預設）
              </label>
            </div>
            {!evenWeight && (
              <p className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-xs font-semibold text-gold">
                自訂同等級權重為 Demo，實際計算方式尚未核定。
              </p>
            )}
            <DataTable
              columns={[
                { key: "name", label: "卡牌" },
                { key: "grade", label: "等級" },
                { key: "included", label: "進入抽取範圍" },
                { key: "weight", label: "同等級權重", className: "text-right" },
              ]}
              rows={cards.map((c, i) => ({
                name: <span className="font-medium">{c.name}</span>,
                grade: <RarityBadge rarity={c.grade} />,
                included: (
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={c.included}
                      onChange={(e) => setCards((prev) => prev.map((x, j) => (j === i ? { ...x, included: e.target.checked } : x)))}
                      className="accent-[var(--color-primary)]"
                    />
                    {c.included ? "已納入" : "已排除"}
                  </label>
                ),
                weight: (
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={evenWeight ? 1 : c.weight}
                    disabled={evenWeight || !c.included}
                    onChange={(e) => setCards((prev) => prev.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) } : x)))}
                    className="w-20 rounded-xl border border-border bg-muted/40 px-2 py-1 text-right text-xs tabular-nums text-foreground disabled:opacity-40"
                  />
                ),
              }))}
            />
          </section>

          <DrawPityPanel grades={grades} cards={cards} />

          {/* ── 操作 ── */}
          <section className="panel flex flex-wrap items-center gap-2 p-4">
            <button
              onClick={() => setConfirm("draft")}
              disabled={!canSave}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              儲存草稿（Demo）
            </button>
            <button
              onClick={() => setConfirm("publish")}
              disabled={!canSave}
              className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-ink hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              發布（Demo）
            </button>
            <button
              onClick={() => {
                setGrades(initial.grades);
                setCards(initial.cards);
                setEvenWeight(initial.evenWeight);
              }}
              className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              捨棄變更
            </button>
            {dirty && <span className="text-xs font-semibold text-gold">有未儲存變更</span>}
          </section>

          {/* ── 版本紀錄 ── */}
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
              rows={DRAW_VERSION_LOG.map((v) => ({
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
        title={confirm === "publish" ? "發布抽卡設定（Demo）" : "儲存草稿（Demo）"}
        description={
          confirm === "publish"
            ? `機率總和 ${total.toFixed(2)}%。此原型不會真的發布，也不會改動前台卡池或玩家抽卡結果。`
            : "草稿僅存於此原型畫面，不會改動前台資料。"
        }
        confirmLabel={confirm === "publish" ? "模擬發布" : "模擬儲存"}
        tone={confirm === "publish" ? "gold" : "violet"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const p = confirm === "publish";
          setConfirm(null);
          push({
            title: p ? "已模擬發布（Demo）" : "已儲存草稿（Demo）",
            description: "前台資料與玩家紀錄未變更。",
            tone: p ? "gold" : "default",
          });
        }}
      />
    </div>
  );
}
