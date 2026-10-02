import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { dupeCards, goddessOf, NO_SPLIT_ON_GROWTH_NOTE, OFFLINE_RESUME_NOTE, type AlbumCard } from "@/data/player";
import { nextGrade } from "@/data/mock";
import { CardFrame } from "@/components/ui/card-frame";
import { Progress } from "@/components/ui/progress";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { StatePlaceholder, StateSwitcher, useDemoState } from "@/components/ui/state-demo";
import { usePlayerSettings } from "@/lib/player-store";
import { useToast } from "@/components/ui/toast";

export const Route = createFileRoute("/app/growth")({
  head: () => ({
    meta: [
      { title: "指定卡成長 — KEEPY" },
      { name: "description", content: "同女神、同等級、同卡牌的每張重複卡 +10% 成長值，累積 10 張可升一級。" },
      { property: "og:title", content: "指定卡成長 — KEEPY" },
      { property: "og:description", content: "使用重複卡累積成長值並升級指定卡牌（Demo）。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GrowthPage,
});

function GrowthPage() {
  const [state, setState] = useDemoState();
  const { settings } = usePlayerSettings();
  const { push } = useToast();
  const candidates = useMemo(() => dupeCards(), []);
  const [selectedId, setSelectedId] = useState<string | null>(candidates[0]?.id ?? null);
  const [useCount, setUseCount] = useState(1);
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [offline, setOffline] = useState(false);
  const [stashed, setStashed] = useState(false);
  const [result, setResult] = useState<{ card: AlbumCard; before: number; after: number; upgraded: boolean } | null>(null);

  const selected = candidates.find((c) => c.id === selectedId);
  const after = selected ? Math.min(100, selected.growthPct + useCount * 10) : 0;

  const submit = () => {
    if (!selected) return;
    setConfirm(false);
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      if (offline) {
        setStashed(true);
        push({ title: OFFLINE_RESUME_NOTE, description: "成長結果已保留，恢復查看不會重複消耗素材。", tone: "gold" });
        return;
      }
      setResult({ card: selected, before: selected.growthPct, after, upgraded: after >= 100 });
    }, 900);
  };

  return (
    <div className="space-y-5">
      <StateSwitcher state={state} onChange={setState} />

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-black sm:text-2xl">指定卡成長</h1>
        <span className="demo-chip">Demo</span>
        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
          {NO_SPLIT_ON_GROWTH_NOTE}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        投入同女神、同等級、同卡牌的重複卡，每張增加 10% 成長值；累積 10 張／100% 可直接升一級。
      </p>

      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="沒有可用的重複卡" />
      ) : candidates.length === 0 ? (
        <EmptyState title="目前沒有重複卡" description="抽到重複卡後即可在此累積成長值。" />
      ) : (
        <div className="grid gap-3 lg:grid-cols-[1fr_20rem]">
          <div className="panel p-4 sm:p-5">
            <p className="text-sm font-black">選擇要成長的卡牌</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {candidates.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-2xl p-1 transition-colors ${
                    selectedId === c.id ? "ring-2 ring-primary" : "ring-1 ring-border"
                  }`}
                >
                  <CardFrame
                    goddess={goddessOf(c)}
                    grade={c.grade}
                    cardName={c.name}
                    onClick={() => {
                      setSelectedId(c.id);
                      setUseCount(1);
                    }}
                  />
                  <p className="mt-1 px-1 text-[11px] text-muted-foreground">
                    重複卡 {c.dupes} 張・{c.growthPct}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel h-fit p-4 sm:p-5">
            <p className="text-sm font-black">成長預覽</p>
            {selected ? (
              <>
                <div className="mt-3 flex items-center gap-2">
                  <RarityBadge rarity={selected.grade} />
                  <p className="min-w-0 truncate text-sm font-bold">{selected.name}</p>
                </div>
                <label className="mt-4 block text-[11px] text-muted-foreground">
                  投入重複卡張數（最多 {selected.dupes} 張）
                  <input
                    type="range"
                    min={1}
                    max={Math.max(1, selected.dupes)}
                    value={useCount}
                    onChange={(e) => setUseCount(Number(e.target.value))}
                    className="mt-2 w-full accent-[var(--primary)]"
                  />
                </label>
                <p className="text-sm font-bold">投入 {useCount} 張 → +{useCount * 10}%</p>
                <Progress value={after} className="mt-3" showLabel label={`成長值 ${selected.growthPct}% → ${after}%`} tone={after >= 100 ? "gold" : "violet"} />
                {after >= 100 && (
                  <p className="mt-2 text-xs font-bold text-gold">
                    達 100%，可升級為 {nextGrade(selected.grade)}（Demo）
                  </p>
                )}
                <label className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} />
                  模擬網路中斷
                </label>
                <button
                  disabled={submitting}
                  onClick={() => setConfirm(true)}
                  className="mt-3 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? "處理中…" : "送出成長（Demo）"}
                </button>
                {submitting && (
                  <p className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    已鎖定按鈕，避免重複送出
                  </p>
                )}
                {stashed && (
                  <div className="mt-3 rounded-xl border border-gold/40 p-3">
                    <p className="text-xs font-bold text-gold">{OFFLINE_RESUME_NOTE}</p>
                    <button
                      onClick={() => {
                        setStashed(false);
                        setResult({ card: selected, before: selected.growthPct, after, upgraded: after >= 100 });
                      }}
                      className="mt-2 rounded-lg border border-gold/50 px-3 py-1.5 text-[11px] font-bold text-gold"
                    >
                      恢復查看結果
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">請先選擇一張卡牌。</p>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirm}
        title="確認投入重複卡"
        description={`將投入 ${useCount} 張重複卡，成長值 +${useCount * 10}%。此操作為 Demo，不會真的消耗卡牌。`}
        confirmLabel="確認投入"
        onCancel={() => setConfirm(false)}
        onConfirm={submit}
      />

      {result && (
        <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-ink/90 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm text-center">
            <p className="text-xs font-black tracking-[0.4em] text-gold">GROWTH</p>
            <h2 className="mt-1 text-2xl font-black">
              {result.upgraded ? "升級成功" : "成長完成"} <span className="demo-chip align-middle">Demo</span>
            </h2>
            <div className={`mx-auto mt-5 w-40 ${settings.reduceMotion ? "" : "animate-in fade-in zoom-in-95"}`}>
              <CardFrame goddess={goddessOf(result.card)} grade={result.upgraded ? nextGrade(result.card.grade) : result.card.grade} cardName={result.card.name} />
            </div>
            <p className="mt-4 text-sm">
              成長值 {result.before}% → {result.after}%
            </p>
            {result.upgraded && (
              <p className="mt-1 text-sm font-bold text-gold">
                等級 {result.card.grade} → {nextGrade(result.card.grade)}，成長值歸零重新累積
              </p>
            )}
            <p className="mt-3 text-[11px] text-muted-foreground">{NO_SPLIT_ON_GROWTH_NOTE}</p>
            <div className="mt-6 flex justify-center gap-2">
              <button onClick={() => setResult(null)} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
                關閉
              </button>
              <Link to="/app/album" className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-muted-foreground">
                前往卡冊
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
