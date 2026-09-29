import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GRADE_GRADIENT, isHighGrade, DRAW_PITY_TBD } from "@/data/mock";
import { POOL_STATUS_LABEL } from "@/components/ui/pool-cover";
import { GoddessSilhouette } from "@/components/ui/card-frame";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TextStatus } from "@/components/public/PublicPage";
import { EmptyState } from "@/components/ui/empty-state";
import { resolveCardDetail, physicalEligible, type CardDetail } from "@/data/card-detail";
import { KEEPY_SAMPLE_POOL_ID, KEEPY_SAMPLE_NOTE } from "@/data/keepy-sample";
import { missingCardDisplay, useAlbumVisibility } from "@/lib/album-visibility";

export const Route = createFileRoute("/cards/$cardId")({
  head: () => ({
    meta: [
      { title: "卡牌詳情 — PEEKFUTURE 創作者收藏卡平台" },
      { name: "description", content: "查看卡面、稀有度、所屬卡池、取得方式與 Local Mock 收藏狀態。" },
      { property: "og:title", content: "卡牌詳情 — PEEKFUTURE 創作者收藏卡平台" },
      { property: "og:description", content: "卡牌詳情頁：卡面放大檢視、卡牌資訊與收藏狀態 Local Mock。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CardDetailPage,
});

function CardFace({ detail, zoom = false, obscured = false }: { detail: CardDetail; zoom?: boolean; obscured?: boolean }) {
  return (
    <div
      className={`card-frame ${GRADE_GRADIENT[detail.grade]} ${isHighGrade(detail.grade) ? "card-frame-gold-edge" : ""}`}
      role="img"
      aria-label={obscured ? `未持有卡面已隱藏，等級 ${detail.grade}` : `${detail.name}，等級 ${detail.grade}，${detail.art ? "虛構人物示意" : detail.goddess.name} 的卡面${zoom ? "放大檢視" : ""}`}
    >
      <div className={`absolute inset-0 ${!detail.owned && !obscured ? "grayscale opacity-60" : ""}`}>
        {!obscured && detail.art ? <img src={detail.art} alt="" className="h-full w-full object-cover object-center" /> : <GoddessSilhouette variant={detail.goddess.silhouette} />}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-ink/85 to-transparent" />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <RarityBadge rarity={detail.grade} />
        {detail.pool.id === KEEPY_SAMPLE_POOL_ID && <span className="rounded bg-ink/80 px-2 py-1 text-[10px] font-bold text-primary-foreground">範例／非正式上架</span>}
        <span className="hidden max-w-[45%] truncate rounded-md bg-ink/60 px-1.5 py-0.5 text-[11px] font-bold text-primary-foreground backdrop-blur-sm sm:block">
          {detail.pool.name}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-[10px] font-semibold tracking-widest text-gold/90">{obscured ? "KEEPY · Local Mock" : detail.art ? "KEEPY · 虛構卡面" : detail.goddess.element}</p>
        <p className="text-lg font-black leading-tight text-primary-foreground">{obscured ? "卡面已隱藏" : detail.art ? "星光收藏" : detail.goddess.name}</p>
        <p className="truncate text-xs text-primary-foreground/75">{obscured ? "未持有 · 剪影預覽" : detail.name}</p>
      </div>
    </div>
  );
}

function CardDetailPage() {
  const { cardId } = Route.useParams();
  const detail = resolveCardDetail(cardId);
  const [zoomOpen, setZoomOpen] = useState(false);
  const visibility = useAlbumVisibility();
  const obscured = detail ? !detail.owned && missingCardDisplay(visibility, detail.pool.id, detail.grade) === "silhouette" : false;

  useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomOpen]);

  if (!detail) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 overflow-x-clip">
        <EmptyState
          title="找不到這張卡牌"
          description={`卡牌編號「${cardId}」不存在於目前的 Local Mock 資料，或尚未公開。`}
        />
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/pools">回到卡池一覽</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/app/album">回到我的卡冊</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (obscured && detail.pool.id === KEEPY_SAMPLE_POOL_ID) {
    return <div className="mx-auto max-w-3xl space-y-4">
      <span className="demo-chip">Local Mock · 範例／非正式上架</span>
      <div className="mx-auto w-full max-w-[260px]"><CardFace detail={detail} obscured /></div>
      <h1 className="text-xl font-black">卡面已隱藏</h1>
      <p className="text-sm text-muted-foreground">此虛構示例卡尚未上架、不可取得；此瀏覽器設定為剪影預覽，不提供卡面詳情或放大檢視。</p>
      <Button asChild variant="outline"><Link to="/pools/$poolId" params={{ poolId: detail.pool.id }}>返回卡池</Link></Button>
    </div>;
  }

  const nextNeeded = Math.max(0, Math.ceil((100 - detail.growthPct) / 10));
  const specimen = detail.pool.id === KEEPY_SAMPLE_POOL_ID;

  const INFO: [string, string][] = [
    ["系列", specimen ? "KEEPY 虛構卡面範例" : "女神系列 Goddess Series"],
    ["發行季", specimen ? "未上架" : `${detail.pool.name}（${detail.pool.startAt} — ${detail.pool.endAt}）`],
    ["所屬卡池", `${detail.pool.name} · ${specimen ? "非正式上架" : POOL_STATUS_LABEL[detail.pool.status]}`],
    ["卡片編號", detail.serialNo],
    ["發行日", detail.releasedAt],
    ["取得方式", specimen ? "非正式上架，不可取得" : `${detail.pool.name} 抽卡（Demo）／合成產出（Demo 規則）`],
    ["可否合成", specimen ? "不可合成（僅示意）" : detail.grade === "O" ? "O 為最高級，不可再合成" : detail.owned ? "可作為合成素材（同卡池同等級，Demo）" : "需先取得此卡"],
    ["可否直接成長", specimen ? "不可成長（僅示意）" : detail.owned ? (detail.canGrow ? "成長值已達 100%，可直接升級（Demo）" : `尚需 ${nextNeeded} 張重複卡`) : "需先取得此卡"],
    ["實體典藏資格", specimen ? "僅示意，無兌換資格" : physicalEligible(detail) ? "符合實體典藏資格（V1 資格／進度 Mock，不做真實履約）" : "資格條件 Demo／待定"],
  ];

  const MINE: [string, string][] = [
    ["是否持有", detail.owned ? "已持有" : "未持有"],
    ["持有數量", detail.owned ? `${detail.dupes + 1} 張` : "0 張"],
    ["重複卡數量", detail.owned ? `${detail.dupes} 張` : "—"],
    ["首次／最近取得時間", detail.obtainedAt ?? "尚未取得"],
    ["成長進度", detail.owned ? `${detail.growthPct}%` : "—"],
    ["公開展示", detail.owned ? (detail.showcased ? "已設為公開展示（Local Mock）" : "未設為公開展示") : "未持有，無法展示"],
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 overflow-x-clip">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link to="/pools">← 返回卡池一覽</Link>
        </Button>
        <span className="demo-chip">Local Mock</span>
        {specimen && <span className="text-xs font-bold text-gold">{KEEPY_SAMPLE_NOTE}</span>}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="mx-auto w-full max-w-[320px]">
            <CardFace detail={detail} obscured={obscured} />
          </div>
          {!obscured ? <Button className="w-full" variant="outline" onClick={() => setZoomOpen(true)}>
            放大檢視卡面
          </Button> : <p className="text-center text-xs text-muted-foreground">卡面已隱藏 · Local Mock</p>}
        </div>

        <div className="space-y-5">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <RarityBadge rarity={detail.grade} />
              <TextStatus tone={detail.pool.status === "live" ? "live" : "gold"}>
                {specimen ? "範例／非正式上架" : POOL_STATUS_LABEL[detail.pool.status]}
              </TextStatus>
              <TextStatus>{detail.owned ? "已持有" : "未持有"}</TextStatus>
            </div>
            <h1 className="text-2xl font-black sm:text-3xl">{detail.name}</h1>
            <p className="text-sm text-muted-foreground">
              {specimen ? "虛構人物，非合作創作者" : `${detail.goddess.name}（${detail.subtitle}）`} · {detail.pool.name} · 編號 {detail.serialNo}
            </p>
          </header>

          <section className="panel p-4 sm:p-5">
            <h2 className="text-sm font-black">卡牌資訊</h2>
            <dl className="mt-3 space-y-2 text-xs">
              {INFO.map(([k, v]) => (
                <div key={k} className="flex flex-wrap justify-between gap-2 border-b border-border/60 pb-2 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="min-w-0 text-right font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{specimen ? KEEPY_SAMPLE_NOTE : DRAW_PITY_TBD}</p>
          </section>

          <section className="panel p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-black">我的收藏狀態</h2>
              <span className="demo-chip">登入 Demo · Local Mock</span>
            </div>
            <dl className="mt-3 space-y-2 text-xs">
              {MINE.map(([k, v]) => (
                <div key={k} className="flex flex-wrap justify-between gap-2 border-b border-border/60 pb-2 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="min-w-0 text-right font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            {detail.owned ? (
              <Progress
                className="mt-3"
                value={detail.growthPct}
                tone={detail.canGrow ? "gold" : "violet"}
                label="每張重複卡 +10% 成長值，累積 10 張／100% 可直接升一級"
              />
            ) : (
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                未持有卡牌不顯示成長進度；本頁不執行真實扣卡、抽卡、成長或兌換。
              </p>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-black">相關操作</h2>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link to="/pools/$poolId" params={{ poolId: detail.pool.id }}>
                  查看所屬卡池
                </Link>
              </Button>
              {!specimen && <Button asChild size="sm" variant="outline">
                <Link to="/goddesses/$goddessId" params={{ goddessId: detail.goddess.id }}>
                  查看創作者／女神頁
                </Link>
              </Button>}
              {!specimen && detail.canGrow ? (
                <Button asChild size="sm" variant="outline">
                  <Link to="/app/growth">前往指定卡成長（Demo）</Link>
                </Button>
              ) : !specimen ? (
                <Button size="sm" variant="outline" disabled>
                  指定卡成長：{detail.owned ? "成長值未滿 100%" : "未持有"}
                </Button>
              ) : null}
              {!specimen && detail.canSynthesize ? (
                <Button asChild size="sm" variant="outline">
                  <Link to="/app/synthesis">前往合成工坊（Demo）</Link>
                </Button>
              ) : !specimen ? (
                <Button size="sm" variant="outline" disabled>
                  合成工坊：{detail.grade === "O" ? "O 為最高級不可合成" : "未持有"}
                </Button>
              ) : null}
              <Button asChild size="sm" variant="outline"><Link to="/faq">查看 FAQ</Link></Button>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              以上收藏狀態與操作皆為 Local Mock，不會寫入伺服器、不扣點、不真的抽卡、合成或兌換。
            </p>
          </section>
        </div>
      </div>

      {zoomOpen && !obscured ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${detail.name} 卡面放大檢視`}
          onClick={() => setZoomOpen(false)}
        >
          <div className="w-full max-w-[min(90vw,380px)] space-y-3" onClick={(e) => e.stopPropagation()}>
            <CardFace detail={detail} zoom />
            <Button className="w-full" variant="outline" onClick={() => setZoomOpen(false)}>
              關閉放大檢視（Esc）
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
