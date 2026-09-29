import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ALBUM,
  NO_SPLIT_ON_FUSION_NOTE,
  OFFLINE_RESUME_NOTE,
  PRESET_SYNTHESIS_FAIL,
  PRESET_SYNTHESIS_PITY,
  PRESET_SYNTHESIS_SUCCESS,
  SYNTHESIS,
  goddessOf,
  type AlbumCard,
} from "@/data/player";
import { GRADES, POOLS, SHOP_ITEMS, nextGrade, type Rarity } from "@/data/mock";
import { CardFrame } from "@/components/ui/card-frame";
import { Progress } from "@/components/ui/progress";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { StatePlaceholder, StateSwitcher, useDemoState } from "@/components/ui/state-demo";
import { usePlayerSettings } from "@/lib/player-store";
import { useToast } from "@/components/ui/toast";

export const Route = createFileRoute("/app/synthesis")({
  head: () => ({
    meta: [
      { title: "隨機合成 — CU 女神卡" },
      { name: "description", content: "同卡池、同等級卡牌的隨機合成：成功率、道具加成與連續失敗保底進度。" },
      { property: "og:title", content: "隨機合成 — CU 女神卡" },
      { property: "og:description", content: "隨機合成流程原型，合成不產生女神分潤。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SynthesisPage,
});

const NEED = 3;

function SynthesisPage() {
  const [state, setState] = useDemoState();
  const { settings } = usePlayerSettings();
  const { push } = useToast();

  const [poolId, setPoolId] = useState("p-uniform");
  const [grade, setGrade] = useState<Rarity>("R");
  const [picked, setPicked] = useState<string[]>([]);
  const [useItem, setUseItem] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [offline, setOffline] = useState(false);
  const [stashed, setStashed] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "fail" | "pity"; card: AlbumCard } | null>(null);
  const [failStreak, setFailStreak] = useState(SYNTHESIS.failStreak);

  const materials = useMemo(
    () => ALBUM.filter((c) => c.owned && c.poolId === poolId && c.grade === grade),
    [poolId, grade]
  );

  const finalPct = Math.min(100, SYNTHESIS.baseSuccessPct + (useItem ? SYNTHESIS.itemBonusPct : 0));
  const pityReady = failStreak + 1 >= SYNTHESIS.pityAt;

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= NEED ? p : [...p, id]));

  const finish = () => {
    // 預先定義結果，不執行真實亂數
    if (pityReady) {
      setResult({ kind: "pity", card: PRESET_SYNTHESIS_PITY });
      setFailStreak(0);
    } else if (useItem) {
      setResult({ kind: "success", card: PRESET_SYNTHESIS_SUCCESS });
      setFailStreak(0);
    } else {
      setResult({ kind: "fail", card: PRESET_SYNTHESIS_FAIL });
      setFailStreak((f) => f + 1);
    }
  };

  const submit = () => {
    setConfirm(false);
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      if (offline) {
        setStashed(true);
        push({ title: OFFLINE_RESUME_NOTE, description: "合成結果已保留，恢復查看不會重新合成。", tone: "gold" });
        return;
      }
      finish();
    }, 900);
  };

  return (
    <div className="space-y-5">
      <StateSwitcher state={state} onChange={setState} />

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-black sm:text-2xl">隨機合成</h1>
        <span className="demo-chip">Demo</span>
        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
          {NO_SPLIT_ON_FUSION_NOTE}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{SYNTHESIS.note}</p>

      <div className="panel flex flex-wrap items-end gap-3 p-4">
        <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
          卡池（僅能選擇同一卡池）
          <select
            value={poolId}
            onChange={(e) => {
              setPoolId(e.target.value);
              setPicked([]);
            }}
            className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground"
          >
            {POOLS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
          等級（僅能選擇同等級）
          <select
            value={grade}
            onChange={(e) => {
              setGrade(e.target.value as Rarity);
              setPicked([]);
            }}
            className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground"
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <p className="text-[11px] text-muted-foreground">已選 {picked.length} / {NEED} 張素材</p>
      </div>

      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="沒有可用的合成素材" />
      ) : (
        <div className="grid gap-3 lg:grid-cols-[1fr_20rem]">
          <div className="panel p-4 sm:p-5">
            <p className="text-sm font-black">選擇素材</p>
            {materials.length === 0 ? (
              <div className="mt-3">
                <EmptyState title="此卡池／等級沒有可用卡牌" description="換一個卡池或等級再試試。" />
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {materials.map((c) => (
                  <div
                    key={c.id}
                    className={`rounded-2xl p-1 transition-colors ${
                      picked.includes(c.id) ? "ring-2 ring-gold" : "ring-1 ring-border"
                    }`}
                  >
                    <CardFrame
                      goddess={goddessOf(c)}
                      grade={c.grade}
                      cardName={c.name}
                      onClick={() => toggle(c.id)}
                    />
                    <p className="mt-1 px-1 text-[11px] text-muted-foreground">持有 {c.dupes + 1} 張</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel h-fit p-4 sm:p-5">
            <p className="text-sm font-black">成功率</p>
            <dl className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">基礎成功率</dt>
                <dd className="font-bold">{SYNTHESIS.baseSuccessPct}%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">商城道具加成</dt>
                <dd className="font-bold text-gold">{useItem ? `+${SYNTHESIS.itemBonusPct}%` : "未使用"}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5">
                <dt className="text-muted-foreground">最終成功率</dt>
                <dd className="text-base font-black text-violet-gradient">{finalPct}%</dd>
              </div>
            </dl>
            <label className="mt-3 flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-[11px]">
              <input type="checkbox" checked={useItem} onChange={(e) => setUseItem(e.target.checked)} />
              使用「{SHOP_ITEMS[1]!.name}」（{SHOP_ITEMS[1]!.effect}）
            </label>
            <p className="mt-2 text-[11px] text-muted-foreground">{SYNTHESIS.ruleTbd}</p>

            <div className="mt-4">
              <Progress
                value={failStreak}
                max={SYNTHESIS.pityAt}
                tone="gold"
                showLabel
                label={`連續失敗保底 ${failStreak} / ${SYNTHESIS.pityAt}`}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {pityReady ? "下一次合成將觸發保底升級（Demo）。" : "連續失敗累積 10 次即觸發保底取得上一級卡牌。"}
              </p>
            </div>

            <label className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
              <input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} />
              模擬網路中斷
            </label>
            <button
              disabled={submitting || picked.length < NEED}
              onClick={() => setConfirm(true)}
              className="mt-3 w-full rounded-xl bg-gold px-4 py-3 text-sm font-bold text-ink hover:bg-gold/90 disabled:opacity-50"
            >
              {submitting ? "合成中…" : picked.length < NEED ? `請選擇 ${NEED} 張素材` : "送出合成（Demo）"}
            </button>
            {submitting && (
              <p className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                已鎖定按鈕，避免重複送出
              </p>
            )}
            {stashed && (
              <div className="mt-3 rounded-xl border border-gold/40 p-3">
                <p className="text-xs font-bold text-gold">{OFFLINE_RESUME_NOTE}</p>
                <button
                  onClick={() => {
                    setStashed(false);
                    finish();
                  }}
                  className="mt-2 rounded-lg border border-gold/50 px-3 py-1.5 text-[11px] font-bold text-gold"
                >
                  恢復查看結果
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirm}
        title="確認送出合成"
        description={`將投入 ${picked.length} 張 ${grade} 素材，最終成功率 ${finalPct}%。${NO_SPLIT_ON_FUSION_NOTE}。`}
        confirmLabel="確認合成"
        tone="gold"
        onCancel={() => setConfirm(false)}
        onConfirm={submit}
      />

      {result && (
        <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-ink/90 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm text-center">
            <p className="text-xs font-black tracking-[0.4em] text-gold">SYNTHESIS</p>
            <h2 className="mt-1 text-2xl font-black">
              {result.kind === "fail" ? "合成失敗" : result.kind === "pity" ? "保底升級" : "合成成功"}{" "}
              <span className="demo-chip align-middle">Demo</span>
            </h2>
            <div className={`mx-auto mt-5 w-40 ${settings.reduceMotion ? "" : "animate-in fade-in zoom-in-95"}`}>
              <CardFrame goddess={goddessOf(result.card)} grade={result.card.grade} cardName={result.card.name} />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {result.kind === "fail"
                ? "取得該卡池隨機同級卡牌，連續失敗次數 +1。"
                : `取得該卡池隨機上一級卡牌（${nextGrade(grade)} 示意）。`}
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground">{NO_SPLIT_ON_FUSION_NOTE}</p>
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
