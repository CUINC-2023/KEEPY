import { useLocalTest } from "@/lib/local-test-client";
import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SYNTHESIS, goddessOf } from "@/data/player";
import { GRADES, POOLS, type Rarity } from "@/data/mock";
import { KEEPY_SAMPLE_POOL_ID } from "@/data/keepy-sample";
import { cardCount, DEMO_MATERIAL_COUNT, type DemoSynthesis } from "@/lib/demo-player-model";
import { synthesizeDemo, useDemoPlayer } from "@/lib/demo-player-store";
import { usePlayerCopy } from "@/lib/player-copy";
import { CardFrame } from "@/components/ui/card-frame";
import { Progress } from "@/components/ui/progress";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useDemoState } from "@/components/ui/state-demo-shared";
import { StatePlaceholder, StateSwitcher } from "@/components/ui/state-demo";

export const Route = createFileRoute("/app/synthesis")({
  head: () => ({ meta: [{ title: "Synthesis / 合成工坊 — KEEPY" }] }),
  component: SynthesisPage,
});
function SynthesisPage() {
  const local = useLocalTest();
  const t = usePlayerCopy();
  const { album, state: demo } = useDemoPlayer();
  const [state, setState] = useDemoState();
  const [poolId, setPoolId] = useState("p-uniform");
  const [grade, setGrade] = useState<Rarity>("R");
  const [picked, setPicked] = useState<string[]>([]);
  const [useItem, setUseItem] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState<DemoSynthesis | null>(null);
  const busy = useRef(false);
  const [error, setError] = useState(false);
  const materials = album.filter((c) => c.owned && c.poolId === poolId && c.grade === grade);
  const failStreak = demo.failures[poolId + ":" + grade] ?? SYNTHESIS.failStreak;
  const finalPct = Math.min(100, SYNTHESIS.baseSuccessPct + (useItem ? SYNTHESIS.itemBonusPct : 0));
  const resultCard = album.find((c) => c.id === result?.cardId);
  const selected = (id: string) => picked.filter((value) => value === id).length;
  const add = (id: string) => {
    const card = materials.find((c) => c.id === id);
    if (card && picked.length < DEMO_MATERIAL_COUNT && selected(id) < cardCount(card))
      setPicked((previous) => [...previous, id]);
  };
  const remove = (id: string) =>
    setPicked((previous) => {
      const index = previous.indexOf(id);
      return previous.filter((_, i) => i !== index);
    });
  const submit = async () => {
    if (busy.current) return;
    busy.current = true;
    setConfirm(false);
    try {
      const output = await synthesizeDemo(poolId, grade, picked, useItem, crypto.randomUUID());
      setError(!output);
      setResult(output);
      setPicked([]);
    } catch {
      setError(true);
    } finally {
      busy.current = false;
    }
  };
  return (
    <div className="space-y-5">
      {local.enabled && (
        <p>
          syntheticLocalTest · SQLite three-card scripted fixture; 0 TEST KP; draw pity unchanged.
          No real assets or approved production probability.
        </p>
      )}
      {local.enabled && demo.lastSynthesis && (
        <Button data-testid="saved-synthesis" onClick={() => setResult(demo.lastSynthesis)}>
          View saved synthesis result
        </Button>
      )}
      <StateSwitcher state={state} onChange={setState} />
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-black sm:text-2xl">{t("合成工坊", "Synthesis")}</h1>
        <span className="demo-chip">Demo</span>
        <span className="text-xs text-muted-foreground">
          {t("合成不產生分潤", "No revenue from synthesis")}
        </span>
      </div>
      <Link to="/app/growth" className="block text-primary underline">
        {t("查看未核定規則與不消耗預覽", "View unapproved rules and no-consumption preview")}
      </Link>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {t(
          "僅限同卡池、同等級素材；成功取得上一級、失敗取得同級。為驗收流程，道具勾選固定示範成功、未勾選示範失敗；累積 10 次失敗觸發示意保底。",
          "Use materials from the same pool and grade. Success yields the next grade; failure yields the same grade. For this scripted preview, the item checkbox demonstrates success and no item demonstrates failure. Ten failures trigger demo pity.",
        )}
      </p>
      <p className="text-xs font-bold text-gold">
        {t(
          "消耗 3 張、成功率、道具加成與保底數值均為示意，正式規則待核定。會消耗示意卡冊素材，不涉及真實資產。",
          "The 3-card cost, probabilities, item bonus and pity values are fixtures pending approval. Demo materials are consumed; no real assets are affected.",
        )}
      </p>
      <div className="panel grid grid-cols-2 gap-3 p-4">
        <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
          {t("卡池", "Pool")}
          <select
            value={poolId}
            onChange={(e) => {
              setPoolId(e.target.value);
              setPicked([]);
            }}
            className="min-h-11 w-full rounded-xl border border-border bg-card px-3 text-foreground"
          >
            {POOLS.filter((p) => p.id !== KEEPY_SAMPLE_POOL_ID).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
          {t("等級", "Grade")}
          <select
            value={grade}
            onChange={(e) => {
              setGrade(e.target.value as Rarity);
              setPicked([]);
            }}
            className="min-h-11 w-full rounded-xl border border-border bg-card px-3 text-foreground"
          >
            {GRADES.filter((g) => g !== "O").map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>
      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle={t("沒有可用素材", "No materials available")} />
      ) : (
        <div className="grid gap-3 lg:grid-cols-[1fr_20rem]">
          <div className="panel p-4 sm:p-5">
            <p className="text-sm font-black">
              {t("選擇素材", "Choose materials")} · {picked.length} / {DEMO_MATERIAL_COUNT}
            </p>
            {!materials.length ? (
              <EmptyState
                title={t("此卡池／等級沒有可用卡牌", "No cards in this pool and grade")}
                description={t(
                  "請先抽卡，或更換卡池／等級。",
                  "Draw cards first, or choose another pool or grade.",
                )}
              />
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {materials.map((c) => (
                  <div
                    key={c.id}
                    className={
                      "rounded-2xl p-1 ring-1 " + (selected(c.id) ? "ring-gold" : "ring-border")
                    }
                  >
                    <CardFrame goddess={goddessOf(c)} grade={c.grade} cardName={c.name} />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("持有", "Owned")} {cardCount(c)} · {t("已選", "Selected")} {selected(c.id)}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        variant="outline"
                        aria-label={t("減少素材", "Remove material") + " " + c.name}
                        disabled={!selected(c.id)}
                        onClick={() => remove(c.id)}
                      >
                        −
                      </Button>
                      <Button
                        variant="outline"
                        aria-label={t("增加素材", "Add material") + " " + c.name}
                        disabled={
                          picked.length >= DEMO_MATERIAL_COUNT || selected(c.id) >= cardCount(c)
                        }
                        onClick={() => add(c.id)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="panel h-fit space-y-3 p-4 sm:p-5">
            <p className="text-sm font-black">{t("成功率（示意）", "Probability preview")}</p>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <dt>{t("基礎", "Base")}</dt>
                <dd>{SYNTHESIS.baseSuccessPct}%</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>{t("道具加成", "Item bonus")}</dt>
                <dd>{useItem ? "+" + SYNTHESIS.itemBonusPct + "%" : "—"}</dd>
              </div>
              <div className="flex justify-between gap-2 border-t border-border pt-2">
                <dt>{t("最終成功率", "Final rate")}</dt>
                <dd className="font-black text-gold">{finalPct}%</dd>
              </div>
            </dl>
            <label className="flex min-h-11 items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={useItem}
                onChange={(e) => setUseItem(e.target.checked)}
              />
              {t("使用道具（固定成功示意）", "Use item (scripted success)")}
            </label>
            <Progress
              value={failStreak}
              max={SYNTHESIS.pityAt}
              tone="gold"
              showLabel
              label={
                t("失敗累積（示意）", "Failures (demo)") +
                " " +
                failStreak +
                " / " +
                SYNTHESIS.pityAt
              }
            />
            <p className="text-xs text-muted-foreground">
              {t(
                "第 10 次失敗路徑示範保底升級；計數依卡池與等級保存。",
                "The tenth failure path demonstrates pity upgrade. Counters are separate for each pool and grade.",
              )}
            </p>
            <Button
              disabled={picked.length !== DEMO_MATERIAL_COUNT}
              onClick={() => setConfirm(true)}
              className="min-h-11 w-full bg-gold text-ink hover:bg-gold/90"
            >
              {t("預覽並確認合成", "Review synthesis")}
            </Button>
            {error && (
              <p role="alert" className="text-xs text-gold">
                {t(
                  "素材不足或已異動，請重新選擇。",
                  "Materials changed or are insufficient. Select them again.",
                )}
              </p>
            )}
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirm}
        title={t("確認消耗示意素材", "Confirm demo material consumption")}
        description={t(
          "將消耗 3 張同卡池、同等級示意素材並取得 1 張結果卡；正式消耗規則待核定。",
          "Consume 3 demo units from the same pool and grade and receive 1 result card. Production costs await approval.",
        )}
        confirmLabel={t("確認合成", "Confirm synthesis")}
        cancelLabel={t("取消", "Cancel")}
        tone="gold"
        onCancel={() => setConfirm(false)}
        onConfirm={submit}
      >
        <ul className="space-y-1 text-xs">
          {[...new Set(picked)].map((id) => (
            <li key={id}>
              {album.find((c) => c.id === id)?.name} × {selected(id)}
            </li>
          ))}
        </ul>
      </ConfirmDialog>
      <Dialog
        open={!!result}
        onOpenChange={(open) => {
          if (!open) setResult(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-2xl">
          <DialogTitle>
            {result?.kind === "fail"
              ? t("合成失敗・取得同級卡", "Failed · same-grade card")
              : result?.kind === "pity"
                ? t("示意保底升級", "Demo pity upgrade")
                : t("合成成功", "Synthesis success")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "示意素材已消耗，結果已同步至本機卡冊。",
              "Demo materials consumed. The result is in your local collection.",
            )}
          </DialogDescription>
          {resultCard && (
            <>
              <div className="mx-auto w-40">
                <CardFrame
                  goddess={goddessOf(resultCard)}
                  grade={resultCard.grade}
                  cardName={resultCard.name}
                />
              </div>
              <p className="text-center text-xs font-bold">
                {resultCard.name} · {resultCard.grade}
              </p>
              <Button asChild onClick={() => setResult(null)}>
                <Link to="/app/cards/$cardId" params={{ cardId: resultCard.id }}>
                  {t("放大與翻面", "Inspect & flip")}
                </Link>
              </Button>
              <Button asChild variant="outline" onClick={() => setResult(null)}>
                <Link to="/app/album/$poolId" params={{ poolId: resultCard.poolId }}>
                  {t("查看卡冊", "View collection")}
                </Link>
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
