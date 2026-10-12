import { useLocalTest } from "@/lib/local-test-client";
import { usePlayerUiText } from "@/lib/player-ui-text";
import { QaHint } from "@/components/content/QaHint";
import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { isHighGrade, poolById } from "@/data/mock";
import { KEEPY_SAMPLE_POOL_ID } from "@/data/keepy-sample";
import { PLAYER, goddessOf, type DrawResultItem } from "@/data/player";
import { type DemoDraw, canDemoDraw } from "@/lib/demo-player-model";
import { drawDemo, markDrawViewed, useDemoPlayer } from "@/lib/demo-player-store";
import { usePlayerCopy } from "@/lib/player-copy";
import { CardFrame } from "@/components/ui/card-frame";
import { DrawCardDialog } from "@/components/card/DrawCardDialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PoolStatusTag } from "@/components/ui/pool-cover";
import { useDemoState } from "@/components/ui/state-demo-shared";
import { StatePlaceholder, StateSwitcher } from "@/components/ui/state-demo";
import { usePlayerSettings } from "@/lib/player-store-shared";

export const Route = createFileRoute("/app/draw/$poolId")({
  head: () => ({ meta: [{ title: "Demo draw / 示意抽卡 — KEEPY" }] }),
  component: DrawRoute,
});
function DrawRoute() {
  const { poolId } = Route.useParams();
  return <DrawPage key={poolId} poolId={poolId} />;
}
type Mode = "single" | "ten";
function DrawPage({ poolId }: { poolId: string }) {
  const local = useLocalTest();
  const t = usePlayerCopy();
  const pool = poolById(poolId);
  const { state: demo } = useDemoPlayer();
  const [state, setState] = useDemoState();
  const { settings } = usePlayerSettings();
  const [confirmMode, setConfirmMode] = useState<Mode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [results, setResults] = useState<DemoDraw | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState("");
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);
  const pending = demo.lastDraw && !demo.lastDraw.viewed ? demo.lastDraw : null;
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const noMotion = settings.reduceMotion || settings.skipDrawAnimation || systemReduceMotion;
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (!results || noMotion || revealed >= results.items.length) return;
    const id = setTimeout(
      () => setRevealed((v) => v + 1),
      isHighGrade(results.items[revealed]?.card.grade ?? "C") ? 320 : 115,
    );
    return () => clearTimeout(id);
  }, [results, noMotion, revealed]);
  const view = (draw: DemoDraw) => {
    markDrawViewed(draw.id);
    setResults(draw);
    setRevealed(noMotion ? draw.items.length : 0);
  };
  const run = (mode: Mode) => {
    if (busy.current || !canDemoDraw(poolId) || pending) return;
    busy.current = true;
    setSubmitting(true);
    setConfirmMode(null);
    setError("");
    const id = crypto.randomUUID();
    timer.current = setTimeout(async () => {
      let draw: DemoDraw | null = null;
      try {
        draw = await drawDemo(poolId, mode, id);
      } catch (error) {
        setError(String(error));
        busy.current = false;
        setSubmitting(false);
        return;
      }
      busy.current = false;
      setSubmitting(false);
      if (!draw) {
        setError(
          t(
            "操作未套用，請先查看已保留的結果。",
            "The draw was not applied. Check the saved result first.",
          ),
        );
        return;
      }
      if (!offline) view(draw);
    }, 900);
  };
  if (!pool)
    return <StatePlaceholder state="empty" emptyTitle={t("找不到此卡池", "Pool not found")} />;
  if (pool.id === KEEPY_SAMPLE_POOL_ID)
    return (
      <div className="panel space-y-3 p-5">
        <h1 className="text-xl font-black">
          {t("星光收藏・範例／非正式上架", "Starlight collection · unreleased sample")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(
            "虛構示例卡不可抽卡、合成或申請實體卡。",
            "Unreleased sample cards cannot be drawn, synthesized or requested as physical cards.",
          )}
        </p>
        <Link to="/pools/$poolId" params={{ poolId }} className="text-primary underline">
          {t("返回卡池展示", "Return to pool")}
        </Link>
      </div>
    );
  const disabled =
    (local.enabled && (!local.summary || local.loading || poolId !== "p-uniform")) ||
    submitting ||
    !canDemoDraw(poolId) ||
    !!pending ||
    !!results;
  return (
    <div className="space-y-5">
      <StateSwitcher state={state} onChange={setState} />
      {state !== "ok" ? (
        <StatePlaceholder
          state={state}
          emptyTitle={t("此卡池尚無可抽卡牌", "No cards available")}
        />
      ) : (
        <>
          <div className="panel p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black sm:text-2xl">{pool.name}</h1>
              <PoolStatusTag status={pool.status} />
              <span className="demo-chip">{t("示意抽卡", "Demo draw")}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {pool.subtitle} · {pool.startAt} — {pool.endAt}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-gold/30 p-4">
                <p className="text-xs text-muted-foreground">
                  {local.enabled
                    ? "TEST KP (server balance)"
                    : t("付費點數（未扣點）", "Paid KP (unchanged)")}
                </p>
                <p className="text-2xl font-black text-gold-gradient">
                  {(local.enabled
                    ? (local.summary?.user.balance ?? 0)
                    : PLAYER.paidPoints
                  ).toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs text-muted-foreground">
                  {t("贈送點數（未扣點）", "Bonus KP (unchanged)")}
                </p>
                <p className="text-2xl font-black">
                  {(local.enabled ? 0 : PLAYER.freePoints).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                disabled={disabled}
                onClick={() => setConfirmMode("single")}
                className="h-auto min-h-11 px-5 py-3"
              >
                {submitting
                  ? t("抽卡中…", "Drawing…")
                  : t("單抽", "Single draw") +
                    " (" +
                    (local.enabled ? 100 : pool.singlePricePoints) +
                    (local.enabled ? " TEST KP · syntheticLocalTest)" : " KP · Demo)")}
              </Button>
              <Button
                disabled={disabled}
                onClick={() => setConfirmMode("ten")}
                className="h-auto min-h-11 bg-gold px-5 py-3 text-ink hover:bg-gold/90"
              >
                {submitting
                  ? t("抽卡中…", "Drawing…")
                  : t("十抽送一抽", "10 + 1 draws") +
                    " (" +
                    (local.enabled ? 900 : pool.tenPricePoints) +
                    (local.enabled ? " TEST KP · syntheticLocalTest)" : " KP · Demo)")}
              </Button>
              <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={offline}
                  disabled={submitting}
                  onChange={(e) => setOffline(e.target.checked)}
                />
                {t("模擬網路中斷", "Simulate interrupted connection")}
              </label>
            </div>
            <QaHint id="ten-plus-one" />
            {submitting && (
              <p role="status" className="mt-3 text-xs text-muted-foreground">
                {t("正在準備固定結果，請稍候…", "Preparing scripted results…")}
              </p>
            )}
            {!canDemoDraw(poolId) && (
              <p className="mt-3 text-xs text-muted-foreground">
                {t("此卡池目前不可抽卡。", "This pool is not open for draws.")}
              </p>
            )}
            {error && (
              <p role="alert" className="mt-3 text-xs text-gold">
                {error}
              </p>
            )}
            {pending && (
              <div className="mt-4 space-y-2 rounded-2xl border border-gold/40 p-4">
                <p className="font-bold text-gold">
                  {t("已取得結果，可恢復查看", "Results saved — resume viewing")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "已更新本機示意收藏；重載或恢復查看不會再次取得卡牌。",
                    "The demo collection is already updated. Reloading or resuming will not grant cards again.",
                  )}
                </p>
                {pending.poolId === poolId ? (
                  <Button variant="outline" onClick={() => view(pending)}>
                    {t("恢復查看結果", "Resume results")}
                  </Button>
                ) : (
                  <Link
                    to="/app/draw/$poolId"
                    params={{ poolId: pending.poolId }}
                    className="text-primary underline"
                  >
                    {t("前往已保留結果的卡池", "Open the pool with saved results")}
                  </Link>
                )}
              </div>
            )}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="panel p-4 sm:p-5">
              <p className="text-sm font-black">
                {t("等級機率（示意）", "Grade probabilities (demo)")}
              </p>
              <div className="mt-3 space-y-2">
                {pool.rates.map((r) => (
                  <div key={r.grade} className="flex items-center gap-3">
                    <div className="w-12 shrink-0">
                      <RarityBadge rarity={r.grade} />
                    </div>
                    <Progress
                      value={r.pct}
                      max={25}
                      className="flex-1"
                      tone={r.pct <= 3 ? "gold" : "violet"}
                    />
                    <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {r.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel space-y-3 p-4 sm:p-5">
              <p className="text-sm font-black">
                {t("保底與價格（待核定）", "Pity & pricing (pending approval)")}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t(
                  "十抽送一抽固定顯示 11 張，第 11 張與其他卡牌有相同收藏、合成及資格申請身分；11 次均計入同卡池的示意保底計數。",
                  "10 + 1 returns 11 scripted cards. The 11th card has the same collection, synthesis and eligibility status. All 11 count toward the pool's demo pity counter.",
                )}
              </p>
              <p className="text-xs font-bold text-gold">
                {t(
                  "正式保底門檻與分潤計算基礎待核定。此流程不扣點、不產生分潤。",
                  "Production pity thresholds and revenue calculations await approval. This preview charges no KP and generates no revenue.",
                )}
              </p>
              <Link to="/rules" className="text-xs font-bold text-primary underline">
                {t("查看完整規則", "View rules")}
              </Link>
            </div>
          </div>
        </>
      )}
      <ConfirmDialog
        open={confirmMode !== null}
        title={t("確認示意抽卡", "Confirm demo draw")}
        description={
          local.enabled
            ? "syntheticLocalTest: server RNG, atomic TEST KP debit and SQLite ledger. Single 100 / 10+1 900 TEST KP. No real payment."
            : t(
                "即將取得固定示意結果並更新本機卡冊。畫面價格僅供示意，不扣點、不入正式帳本。",
                "Scripted results will update this browser's demo collection. The displayed price is illustrative; no KP is charged or ledger created.",
              ) +
              " " +
              (confirmMode === "ten" ? "10 + 1 = 11" : "1")
        }
        confirmLabel={t("確認抽卡", "Confirm draw")}
        cancelLabel={t("取消", "Cancel")}
        tone="gold"
        onCancel={() => setConfirmMode(null)}
        onConfirm={() => run(confirmMode ?? "single")}
      />
      {results && (
        <DrawResult
          items={results.items}
          revealed={revealed}
          before={results.before}
          after={results.after}
          poolId={poolId}
          onSkip={() => setRevealed(results.items.length)}
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
  before,
  after,
  poolId,
}: {
  items: DrawResultItem[];
  revealed: number;
  onSkip: () => void;
  onClose: () => void;
  noMotion: boolean;
  before: number;
  after: number;
  poolId: string;
}) {
  const tx = usePlayerUiText();
  const local = useLocalTest();
  const t = usePlayerCopy();
  const done = revealed >= items.length;
  const newCount = items.filter((i) => i.isNew).length;
  const [selected, setSelected] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    previousFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus();
    };
  }, []);
  useEffect(() => {
    if (selected !== null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "Tab") {
        const focusable = Array.from(
          resultRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), a[href]") ?? [],
        ).filter((node) => node.offsetParent !== null);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first && last) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last && first) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, selected]);
  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-ink/90 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal={selected === null}
      aria-label={tx("抽卡結果 Demo")}
    >
      <div ref={resultRef} aria-hidden={selected !== null} className="mx-auto max-w-3xl py-6">
        <p className="text-center text-xs font-black tracking-[0.4em] text-gold">RESULT</p>
        <h2 className="mt-1 text-center text-2xl font-black">
          {tx("抽卡結果")}
          <span className="demo-chip align-middle">Demo</span>
        </h2>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {tx("新卡")}
          {newCount}
          {tx("張／重複卡")}
          {items.length - newCount}
          {tx("張・")}
          {items.length === 11 ? tx("十抽送一抽 共 11 張") : tx("單抽 1 張")}
          {tx("・保底抽數（示意）")}
          {before} → {after}・
          {local.enabled
            ? "syntheticLocalTest: SQLite collection and TEST KP ledger updated."
            : t(
                "本機示意收藏已更新，未扣 KP",
                "Local demo collection updated. No KP charged or financial ledger created.",
              )}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((it, i) => {
            const show = i < revealed;
            return (
              <div
                key={it.card.id + i}
                className={
                  show
                    ? noMotion
                      ? ""
                      : isHighGrade(it.card.grade)
                        ? "animate-in fade-in zoom-in-95 duration-500"
                        : "animate-in fade-in duration-200"
                    : "invisible"
                }
              >
                <button
                  type="button"
                  disabled={!show}
                  onClick={() => setSelected(i)}
                  aria-label={tx(`放大第 ${i + 1} 張 ${it.card.name}，${it.card.grade}`)}
                  className={`block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${isHighGrade(it.card.grade) && show && !noMotion ? "reveal-high-grade" : ""}`}
                >
                  <CardFrame
                    goddess={goddessOf(it.card)}
                    grade={it.card.grade}
                    cardName={it.card.name}
                  />
                </button>
                <div className="mt-1.5 space-y-0.5 text-[11px]">
                  <p
                    className={it.isNew ? "font-bold text-gold" : "font-bold text-muted-foreground"}
                  >
                    {tx("第")}
                    {i + 1}
                    {tx("張・")}
                    {it.isNew ? tx("NEW 新卡") : tx("重複卡")}
                    {isHighGrade(it.card.grade) && tx(" ✦ 高階卡")}
                  </p>
                  <p className="text-muted-foreground">
                    {tx("持有")}
                    {it.ownedBefore} → {it.isNew ? 1 : it.ownedBefore + 1}
                    {tx("張")}
                  </p>
                  <p className="text-muted-foreground">
                    {tx("成長值")}
                    {it.growthBefore}% → {it.growthAfter}%
                    {it.growthAfter >= 100 && !it.isNew ? tx("（可升級）") : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {!done && (
            <button
              onClick={onSkip}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground"
            >
              {tx("略過動畫")}
            </button>
          )}
          <Button ref={closeRef} onClick={onClose}>
            {tx("關閉")}
          </Button>
          <Link
            to="/app/album/$poolId"
            params={{ poolId }}
            onClick={onClose}
            className="rounded-xl border border-gold/40 px-5 py-2.5 text-sm font-bold text-gold hover:bg-gold/10"
          >
            {tx("前往卡冊")}
          </Link>
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          {tx("可於「設定」開啟 Reduce Motion 以停用動畫。")}
        </p>
      </div>
      {selected !== null && (
        <DrawCardDialog
          items={items}
          index={selected}
          onChange={setSelected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
