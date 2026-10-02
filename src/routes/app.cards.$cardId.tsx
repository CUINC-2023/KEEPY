import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ALBUM, albumCardById, goddessOf } from "@/data/player";
import { GRADE_GRADIENT, isHighGrade, SPLIT_SOURCE_NOTE } from "@/data/mock";
import { GoddessSilhouette } from "@/components/ui/card-frame";
import { sampleCardById, KEEPY_SAMPLE_NOTE } from "@/data/keepy-sample";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { usePlayerSettings } from "@/lib/player-store";
import { poolById } from "@/data/mock";

export const Route = createFileRoute("/app/cards/$cardId")({
  head: () => ({
    meta: [
      { title: "卡片觀看器 — KEEPY" },
      { name: "description", content: "滿版檢視卡面、卡牌資料、取得時間、持有數與成長值。" },
      { property: "og:title", content: "卡片觀看器 — KEEPY" },
      { property: "og:description", content: "滿版卡片觀看器，支援縮放示意與前後切換。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CardViewer,
});

const ZOOMS = [1, 1.35, 1.8];

function CardViewer() {
  const { cardId } = useParams({ from: "/app/cards/$cardId" });
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const { settings } = usePlayerSettings();
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduceMotion(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => { setFlipped(false); setZoom(0); }, [cardId]);
  const card = albumCardById(cardId);

  if (!card || !card.owned) {
    return (
      <EmptyState
        title="找不到這張卡牌"
        description="卡牌可能不存在或尚未取得。"
        action={
          <Link to="/app/album" className="text-xs font-bold text-primary hover:underline">
            回到我的卡冊 →
          </Link>
        }
      />
    );
  }

  const owned = ALBUM.filter((c) => c.owned);
  const idx = owned.findIndex((c) => c.id === card.id);
  const prev = idx > 0 ? owned[idx - 1] : undefined;
  const next = idx >= 0 && idx < owned.length - 1 ? owned[idx + 1] : undefined;
  const goddess = goddessOf(card);
  const pool = poolById(card.poolId);
  const reduced = settings.reduceMotion || systemReduceMotion;

  const go = (id: string) => navigate({ to: "/app/cards/$cardId", params: { cardId: id } });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to="/app/album/$poolId"
          params={{ poolId: card.poolId }}
          className="rounded-xl border border-border px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground"
        >
          ← 返回卡冊
        </Link>
        <div className="flex items-center gap-2">
          <button
            disabled={!prev}
            onClick={() => prev && go(prev.id)}
            className="rounded-xl border border-border px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            上一張
          </button>
          <button
            disabled={!next}
            onClick={() => next && go(next.id)}
            className="rounded-xl border border-border px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            下一張
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid place-items-center overflow-hidden bg-ink/60 p-4 sm:p-8">
          <div className="w-full max-w-xs" style={{ perspective: "1000px" }}>
            <Button type="button" variant="ghost" onClick={() => setFlipped((value) => !value)} aria-label={`${card.name}，${flipped ? "顯示正面" : "翻至背面"}`} aria-pressed={flipped} className="block h-auto w-full p-0 focus-visible:ring-2 focus-visible:ring-ring touch-manipulation">
              <div className="relative aspect-[2/3] w-full" style={{ transform: flipped && !reduced ? "rotateY(180deg)" : undefined, transition: reduced ? "none" : "transform .45s ease", transformStyle: "preserve-3d" }}>
                <div className={`${reduced && flipped ? "hidden" : ""} card-frame ${GRADE_GRADIENT[card.grade]} ${isHighGrade(card.grade) ? "card-frame-gold-edge" : ""} absolute inset-0`} style={{ backfaceVisibility: "hidden", transform: `scale(${ZOOMS[zoom]})`, transition: reduced ? "none" : "transform .25s ease" }}>
                  <div className="absolute inset-0">{sampleCardById(card.id)?.art ? <img src={sampleCardById(card.id)?.art} alt="" className="h-full w-full object-cover object-center" /> : <GoddessSilhouette variant={goddess.silhouette} />}</div>
                  <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-ink/85 to-transparent" />
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3"><RarityBadge rarity={card.grade} /><span className="bg-ink/70 px-2 py-1 text-xs text-primary-foreground">{card.poolName}</span></div>
                  <div className="absolute inset-x-0 bottom-0 p-4 text-primary-foreground"><p className="text-xs text-gold">{goddess.element}</p><p className="text-lg font-black">{goddess.name}</p><p className="text-xs">{card.name}</p></div>
                </div>
                <div className={`${reduced ? (flipped ? "" : "hidden") : ""} card-frame absolute inset-0 flex flex-col justify-between border border-gold/50 bg-card p-5 text-left text-card-foreground ${!reduced ? "[backface-visibility:hidden] [transform:rotateY(180deg)]" : ""}`}>
                  <div><p className="text-xs font-bold text-gold">KEEPY · 卡牌背面</p><h2 className="mt-3 text-lg font-black break-words">{card.name}</h2></div>
                  <dl className="space-y-2 text-xs"><div><dt className="text-muted-foreground">等級</dt><dd className="font-bold">{card.grade}</dd></div><div><dt className="text-muted-foreground">卡池</dt><dd className="font-bold">{card.poolName}</dd></div><div><dt className="text-muted-foreground">版本</dt><dd className="font-bold">{pool?.synthesisVersion ?? "Demo"} · Demo 卡面</dd></div><div><dt className="text-muted-foreground">持有</dt><dd className="font-bold">{card.dupes + 1} 張（Local Mock）</dd></div></dl>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">卡冊示意，不代表真實資產、交易或正式發行。</p>
                </div>
              </div>
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" onClick={() => setFlipped((value) => !value)}>{flipped ? "查看正面" : "翻至背面"}</Button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">縮放示意</span>
            {ZOOMS.map((z, i) => (
              <Button
                key={z}
                onClick={() => setZoom(i)}
                variant={zoom === i ? "secondary" : "outline"} size="sm" aria-pressed={zoom === i}
              >
                ×{z}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="panel p-4 sm:p-5">
          <p className="text-sm font-black">卡牌資料</p>
          <dl className="mt-3 space-y-2 text-xs">
            {[
              ["卡牌名稱", card.name],
              ["所屬卡池", card.poolName],
              ["女神", `${goddess.name}（${goddess.title}）`],
              ["等級", card.grade],
              ["發行日", card.releasedAt],
              ["取得時間", card.obtainedAt ?? "尚未取得"],
              ["持有數", `${card.dupes + 1} 張（重複卡 ${card.dupes} 張）`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-border/60 pb-2">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="panel p-4 sm:p-5">
          <p className="text-sm font-black">成長值</p>
          <p className="mt-2 text-3xl font-black text-violet-gradient">{card.growthPct}%</p>
          <Progress
            value={card.growthPct}
            className="mt-2"
            tone={card.growthPct >= 100 ? "gold" : "violet"}
            label="每張重複卡 +10%，累積 10 張／100% 可升一級"
          />
          {card.growthPct >= 100 ? (
            <Link
              to="/app/growth"
              className="mt-4 inline-block rounded-xl bg-gold px-4 py-2 text-xs font-bold text-ink hover:bg-gold/90"
            >
              前往升級（Demo）
            </Link>
          ) : (
            <p className="mt-4 text-[11px] text-muted-foreground">
              還需 {Math.ceil((100 - card.growthPct) / 10)} 張重複卡即可升一級。
            </p>
          )}
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">{SPLIT_SOURCE_NOTE}</p>
        </div>
      </div>
    </div>
  );
}
