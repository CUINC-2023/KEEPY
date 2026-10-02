import { QaHint } from "@/components/content/QaHint";
import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { POOLS, SPLIT_SOURCE_NOTE, isHighGrade, poolById } from "@/data/mock";
import { KEEPY_SAMPLE_POOL_ID, KEEPY_SAMPLE_NOTE } from "@/data/keepy-sample";
import {
  PLAYER,
  POINT_DEDUCT_NOTE,
  PRESET_SINGLE,
  PRESET_TEN,
  OFFLINE_RESUME_NOTE,
  DEMO_PITY_COUNT_BEFORE,
  pityCountAfter,
  goddessOf,
  type DrawResultItem,
} from "@/data/player";
import { CardFrame } from "@/components/ui/card-frame";
import { DrawCardDialog } from "@/components/card/DrawCardDialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PoolStatusTag } from "@/components/ui/pool-cover";
import { StatePlaceholder, StateSwitcher, useDemoState } from "@/components/ui/state-demo";
import { usePlayerSettings } from "@/lib/player-store";
import { useToast } from "@/components/ui/toast";

export const Route = createFileRoute("/app/draw/$poolId")({
  head: () => ({
    meta: [
      { title: "抽卡 — KEEPY" },
      { name: "description", content: "KEEPY 單抽與十抽送一抽的固定結果 Demo；點數、機率與保底並非正式規則。" },
      { property: "og:title", content: "抽卡 — KEEPY" },
      { property: "og:description", content: "抽卡流程原型，結果為預先定義的 Mock 資料。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DrawPage,
});

type Mode = "single" | "ten";

function DrawPage() {
  const { poolId } = useParams({ from: "/app/draw/$poolId" });
  const pool = poolById(poolId) ?? POOLS[0]!;
  const [state, setState] = useDemoState();
  const { settings } = usePlayerSettings();
  const { push } = useToast();

  const [confirmMode, setConfirmMode] = useState<Mode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<DrawResultItem[] | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [offline, setOffline] = useState(false);
  const [stash, setStash] = useState<DrawResultItem[] | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [systemReduceMotion, setSystemReduceMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduceMotion(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const noMotion = settings.reduceMotion || settings.skipDrawAnimation || systemReduceMotion;

  const run = useCallback(
    (mode: Mode) => {
      setConfirmMode(null);
      setSubmitting(true); // 立即鎖定按鈕，避免重複送出
      const preset = mode === "single" ? PRESET_SINGLE : PRESET_TEN;
      timer.current = setTimeout(() => {
        setSubmitting(false);
        if (offline) {
          // 網路中斷：結果已取得，僅暫存等待恢復查看，不重新抽卡
          setStash(preset);
          push({ title: OFFLINE_RESUME_NOTE, description: "連線異常，結果已保留，可點擊恢復查看。", tone: "gold" });
          return;
        }
        setResults(preset);
        setRevealed(noMotion ? preset.length : 0);
      }, 900);
    },
    [noMotion, offline, push]
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  useEffect(() => {
    if (!results || noMotion || revealed >= results.length) return;
    const t = setTimeout(() => setRevealed((r) => r + 1), isHighGrade(results[revealed]?.card.grade ?? "C") ? 320 : 115);
    return () => clearTimeout(t);
  }, [results, revealed, noMotion]);

  const closed = pool.status !== "live";

  if (pool.id === KEEPY_SAMPLE_POOL_ID) return <div className="panel space-y-3 p-5"><h1 className="text-xl font-black">星光收藏・範例／非正式上架</h1><p className="text-sm text-muted-foreground">{KEEPY_SAMPLE_NOTE} 不提供抽卡或抽卡結果 Demo。</p><Link to="/pools/$poolId" params={{ poolId: pool.id }} className="text-sm font-bold text-primary underline">返回卡池展示</Link></div>;

  return (
    <div className="space-y-5">
      <StateSwitcher state={state} onChange={setState} />

      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="此卡池尚無可抽卡牌" />
      ) : (
        <>
          <div className="panel p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black sm:text-2xl">{pool.name}</h1>
              <PoolStatusTag status={pool.status} />
              <span className="demo-chip">Demo 抽卡</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {pool.subtitle}・{pool.startAt} ～ {pool.endAt}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-gold/30 p-4">
                <p className="text-xs text-muted-foreground">付費點數</p>
                <p className="text-2xl font-black text-gold-gradient">{PLAYER.paidPoints.toLocaleString()}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">現金購買點數，抽卡消費才會產生女神分潤。</p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs text-muted-foreground">贈送點數</p>
                <p className="text-2xl font-black">{PLAYER.freePoints.toLocaleString()}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{POINT_DEDUCT_NOTE}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                disabled={submitting || closed}
                onClick={() => setConfirmMode("single")}
                className="h-auto min-h-11 px-5 py-3"
              >
                {submitting ? "抽卡中…" : `單抽（${pool.singlePricePoints} 點）`}
              </Button>
              <Button
                disabled={submitting || closed}
                onClick={() => setConfirmMode("ten")}
                className="h-auto min-h-11 bg-gold px-5 py-3 text-ink hover:bg-gold/90"
              >
                {submitting ? "抽卡中…" : `十抽送一抽（${pool.tenPricePoints} 點・Demo）`}
              </Button>
              <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-[11px] text-muted-foreground">
                <input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} />
                模擬網路中斷
              </label>
            </div>
      <QaHint id="ten-plus-one" />
            {submitting && (
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                正在產生結果，請勿重複送出…
              </p>
            )}
            {closed && (
              <p className="mt-3 text-xs text-muted-foreground">此卡池目前不可抽卡（{pool.startAt} 開池）。</p>
            )}
            {stash && (
              <div className="mt-4 rounded-2xl border border-gold/40 p-4">
                <p className="text-sm font-bold text-gold">{OFFLINE_RESUME_NOTE}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                   固定 Mock 結果暫存於此畫面；恢復查看不會重新抽卡或扣點。
                </p>
                <button
                  onClick={() => {
                    setResults(stash);
                    setRevealed(noMotion ? stash.length : 0);
                    setStash(null);
                  }}
                  className="mt-3 rounded-xl border border-gold/50 px-4 py-2 text-xs font-bold text-gold hover:bg-gold/10"
                >
                  恢復查看結果
                </button>
              </div>
            )}
          </div>

          {/* 機率、保底與價格 */}
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="panel p-4 sm:p-5">
              <p className="text-sm font-black">等級機率（公開）</p>
              <div className="mt-3 space-y-2">
                {pool.rates.map((r) => (
                  <div key={r.grade} className="flex items-center gap-3">
                    <div className="w-12 shrink-0">
                      <RarityBadge rarity={r.grade} />
                    </div>
                    <Progress value={r.pct} max={25} className="flex-1" tone={r.pct <= 3 ? "gold" : "violet"} />
                    <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {r.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel p-4 sm:p-5">
              <p className="text-sm font-black">保底與價格</p>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
                {pool.pityNote.map((n) => (
                  <li key={n}>・{n}</li>
                ))}
                 <li>・單抽 {pool.singlePricePoints} 點／十抽送一抽 {pool.tenPricePoints} 點（皆為 Demo 點數；十抽送一抽＝付費 10 次，第 11 次不另外收費）。</li>
                <li>・{pool.pointsPriceNote}</li>
                <li>・已核定：第 11 次抽卡計入同卡池保底抽數；抽中的卡為完整正式卡，可合成、可依資格申請實體卡。</li>
                <li className="font-bold text-gold">・抽卡保底：正式規則待核定。</li>
              </ul>
              <Link to="/rules" className="mt-3 inline-block text-xs font-bold text-primary hover:underline">
                查看完整規則 →
              </Link>
            </div>
          </div>

          <p className="panel p-4 text-[11px] leading-relaxed text-muted-foreground">{SPLIT_SOURCE_NOTE}</p>
        </>
      )}

      <ConfirmDialog
        open={confirmMode !== null}
         title={confirmMode === "ten" ? "確認十抽送一抽（Demo）" : "確認單抽（Demo）"}
        description={`將消耗 ${
          confirmMode === "ten" ? pool.tenPricePoints : pool.singlePricePoints
        } 點（Demo，不會真的扣點）。${confirmMode === "ten" ? "付費 10 次，額外 1 次不另外收費，固定結果共 11 張；11 次皆計入同卡池保底抽數（抽卡保底正式規則待核定），第 11 張為完整正式卡。" : "固定結果 1 張。"}${POINT_DEDUCT_NOTE}`}
        confirmLabel="確認抽卡"
        tone="gold"
        onCancel={() => setConfirmMode(null)}
        onConfirm={() => run(confirmMode ?? "single")}
      />

      {results && (
        <DrawResult
          items={results}
          revealed={revealed}
          onSkip={() => setRevealed(results.length)}
          onClose={() => setResults(null)}
          noMotion={noMotion}
        />
      )}
    </div>
  );
}

function DrawResult({
  items,
  revealed,
  onSkip,
  onClose,
  noMotion,
}: {
  items: DrawResultItem[];
  revealed: number;
  onSkip: () => void;
  onClose: () => void;
  noMotion: boolean;
}) {
  const done = revealed >= items.length;
  const newCount = items.filter((i) => i.isNew).length;
  const [selected, setSelected] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    return () => previousFocus.current?.focus();
  }, []);
  useEffect(() => {
    if (selected !== null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key === "Tab") {
        const focusable = Array.from(resultRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]') ?? []).filter((node) => node.offsetParent !== null);
        const first = focusable[0]; const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first && last) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last && first) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, selected]);
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-ink/90 p-4 backdrop-blur-md" role="dialog" aria-modal={selected === null} aria-label="抽卡結果 Demo">
      <div ref={resultRef} aria-hidden={selected !== null} className="mx-auto max-w-3xl py-6">
        <p className="text-center text-xs font-black tracking-[0.4em] text-gold">RESULT</p>
        <h2 className="mt-1 text-center text-2xl font-black">
          抽卡結果 <span className="demo-chip align-middle">Demo</span>
        </h2>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          新卡 {newCount} 張／重複卡 {items.length - newCount} 張・{items.length === 11 ? "十抽送一抽 共 11 張" : "單抽 1 張"}・保底抽數（示意）{DEMO_PITY_COUNT_BEFORE} → {pityCountAfter(items)}・固定 Mock 結果，持有與成長數字只供示意，未入帳
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((it, i) => {
            const show = i < revealed;
            return (
              <div key={it.card.id + i} className={show ? (noMotion ? "" : isHighGrade(it.card.grade) ? "animate-in fade-in zoom-in-95 duration-500" : "animate-in fade-in duration-200") : "invisible"}>
                <button type="button" disabled={!show} onClick={() => setSelected(i)} aria-label={`放大第 ${i + 1} 張 ${it.card.name}，${it.card.grade}`} className={`block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${isHighGrade(it.card.grade) && show && !noMotion ? "reveal-high-grade" : ""}`}>
                  <CardFrame goddess={goddessOf(it.card)} grade={it.card.grade} cardName={it.card.name} />
                </button>
                <div className="mt-1.5 space-y-0.5 text-[11px]">
                  <p className={it.isNew ? "font-bold text-gold" : "font-bold text-muted-foreground"}>
                    第 {i + 1} 張・{it.isNew ? "NEW 新卡" : "重複卡"}{isHighGrade(it.card.grade) && " ✦ 高階卡"}
                  </p>
                  <p className="text-muted-foreground">
                    持有 {it.ownedBefore} → {it.isNew ? 1 : it.ownedBefore + 1} 張
                  </p>
                  <p className="text-muted-foreground">
                    成長值 {it.growthBefore}% → {it.growthAfter}%
                    {it.growthAfter >= 100 && !it.isNew ? "（可升級）" : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {!done && (
            <button onClick={onSkip} className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground">
              略過動畫
            </button>
          )}
           <Button ref={closeRef} onClick={onClose}>
            關閉
           </Button>
          <Link to="/app/album" className="rounded-xl border border-gold/40 px-5 py-2.5 text-sm font-bold text-gold hover:bg-gold/10">
            前往卡冊
          </Link>
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          可於「設定」開啟 Reduce Motion 以停用動畫。
        </p>
      </div>
      {selected !== null && <DrawCardDialog items={items} index={selected} onChange={setSelected} onClose={() => setSelected(null)} />}
    </div>
  );
}
