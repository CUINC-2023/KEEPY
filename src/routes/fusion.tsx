import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FUSION_RECIPES,
  OWNED_CARDS,
  SHOP_ITEMS,
  cardById,
  goddessById,
  nextGrade,
} from "@/data/mock";
import { CardFrame } from "@/components/ui/card-frame";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/layout/AppShell";

export const Route = createFileRoute("/fusion")({
  head: () => ({
    meta: [
      { title: "合成工坊 — CU 女神卡" },
      { name: "description", content: "重複卡成長與隨機卡牌合成，連續失敗 10 次觸發保底升級。" },
      { property: "og:title", content: "合成工坊 — CU 女神卡" },
      { property: "og:description", content: "重複卡成長與隨機卡牌合成，連續失敗 10 次觸發保底升級。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FusionPage,
});

function FusionPage() {
  const [selected, setSelected] = useState<string>("f-random");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [failStreak, setFailStreak] = useState(3);
  const { push } = useToast();
  const { requireLogin } = useAuth();

  const recipe = FUSION_RECIPES.find((r) => r.id === selected)!;
  const dupes = OWNED_CARDS.filter((c) => c.dupes > 0);

  const runFusion = () => {
    setConfirmOpen(false);
    if (recipe.mode === "growth") {
      push({
        title: "成長值已累積（Demo）",
        description: "每張重複卡 +10%，累積 100% 可直接升一級。",
        tone: "gold",
      });
      return;
    }
    // Demo：以失敗次數決定結果，不使用真實亂數
    const next = failStreak + 1;
    if (next >= 10) {
      setFailStreak(0);
      push({
        title: "保底升級觸發！",
        description: "連續失敗 10 次，取得隨機上一級卡牌（Demo）。",
        tone: "gold",
      });
    } else {
      setFailStreak(next);
      push({
        title: "合成失敗",
        description: `取得隨機同級卡牌。連續失敗 ${next} / 10（Demo）`,
      });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-wide">合成工坊</h1>
          <span className="demo-chip">Demo</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          合成與成長不會產生任何合作女神分潤。
          <Link to="/rules" className="ml-1 font-semibold text-primary hover:underline">
            查看完整規則 →
          </Link>
        </p>
      </header>

      {/* ── 保底進度 ── */}
      <section className="panel hairline-gold p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-black">一般合成保底</h2>
          <span className="text-xs font-bold text-gold tabular-nums">
            連續失敗 {failStreak} / 10
          </span>
        </div>
        <Progress className="mt-3" value={failStreak} max={10} tone="gold" />
        <p className="mt-2 text-xs text-muted-foreground">
          連續失敗 10 次時，第 10 次必定觸發保底升級。
        </p>
      </section>

      {/* ── 可用素材 ── */}
      <section>
        <h2 className="mb-3 text-sm font-black tracking-widest text-muted-foreground">
          可用素材（同卡牌重複卡）
        </h2>
        {dupes.length === 0 ? (
          <EmptyState title="沒有可用的重複卡牌" description="抽到重複卡片後，可在此做為成長或合成素材。" />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {dupes.map((o) => {
              const def = cardById(o.cardId);
              return (
                <div key={o.id} className="min-w-0">
                  <CardFrame
                    goddess={goddessById(o.goddessId)}
                    grade={o.grade}
                    cardName={def?.name}
                    level={o.level}
                  />
                  <p className="mt-1.5 text-center text-[11px] font-bold text-gold">
                    ×{o.dupes} 重複 · 成長 {o.growthPct}%
                  </p>
                  <Progress className="mt-1" value={o.growthPct} tone="gold" />
                  {o.growthPct >= 100 && (
                    <p className="mt-1 text-center text-[11px] font-bold text-gold">
                      可升級至 Lv.{o.level + 1}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 合成方式 ── */}
      <section>
        <h2 className="mb-3 text-sm font-black tracking-widest text-muted-foreground">合成方式</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {FUSION_RECIPES.map((r) => {
            const active = selected === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelected(r.id)}
                className={`panel p-5 text-left transition-colors ${
                  active ? "hairline-gold ring-1 ring-gold/40" : "hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-black">{r.name}</h3>
                  {r.mode === "random" && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      SR <span className="text-gold">→</span> <RarityBadge rarity={nextGrade("SR")} />
                    </span>
                  )}
                </div>
                <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                  <li>· {r.inputNote}</li>
                  <li>· {r.successNote}</li>
                  <li>· {r.failNote}</li>
                  <li>· {r.pityNote}</li>
                </ul>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 商城道具 ── */}
      <section>
        <h2 className="mb-3 text-sm font-black tracking-widest text-muted-foreground">
          商城道具（僅增加合成成功率）
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {SHOP_ITEMS.map((i) => (
            <div key={i.id} className="panel p-4">
              <p className="font-bold">{i.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{i.effect}</p>
              <p className="mt-2 text-sm font-black text-gold tabular-nums">{i.pricePoints} 點</p>
              <p className="mt-1 text-[11px] text-muted-foreground">購買為 Demo，不會產生真實付款。</p>
            </div>
          ))}
        </div>
      </section>

      <button
        onClick={() => requireLogin(() => setConfirmOpen(true))}
        className="w-full rounded-xl bg-gradient-to-r from-gold-soft to-gold py-3.5 text-sm font-black text-ink shadow-[0_10px_30px_-12px_var(--gold)] transition-transform hover:scale-[1.01]"
      >
        開始 · {recipe.name}
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title={`執行「${recipe.name}」？`}
        description={`${recipe.inputNote}${recipe.successNote} 此過程無法復原（Demo）。`}
        confirmLabel="確認執行"
        tone="gold"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={runFusion}
      />
    </div>
  );
}
