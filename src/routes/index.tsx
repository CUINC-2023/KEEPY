import { PUBLIC_TOTAL_TOP } from "@/data/leaderboard";
import { Fragment, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useContent, type HomeSectionKey } from "@/lib/content-store";
import seasonHero from "@/assets/peekfuture-season-hero.jpg";
import {
  CARDS,
  GODDESSES,
  POOLS,
  goddessById,
  poolById,
  poolCollectProgress,
} from "@/data/mock";
import {
  CREATOR_STORIES,
  IMPORTANT_NOTICE_IDS,
  PHYSICAL_COLLECTION,
  PLATFORM_NAME,
  POPULAR_POOL_RANKING,
  SEASON,
  SERIES_NAME,
} from "@/data/public-hub";
import { seasonCountdown, useSeasonClock } from "@/lib/season-time";
import { CardFrame, GoddessSilhouette } from "@/components/ui/card-frame";
import { CardDetailLink } from "@/components/card/CardDetailLink";
import { PoolCover, PoolStatusTag } from "@/components/ui/pool-cover";
import { Progress } from "@/components/ui/progress";
import { StatePlaceholder, StateSwitcher, useDemoState } from "@/components/ui/state-demo";
import { TextStatus } from "@/components/public/PublicPage";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: `${PLATFORM_NAME} — ${SERIES_NAME}` },
    { name: "description", content: "收藏真人創作者、VTuber、原創角色與聯名 IP 的創作時刻；目前展示女神系列 Local Mock。" },
    { property: "og:title", content: `${PLATFORM_NAME} — ${SERIES_NAME}` },
    { property: "og:description", content: "創作者收藏卡的當季卡池、活動、排行榜與實體典藏資訊中心。" },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: HomePage,
});

function Heading({ eyebrow, title, to }: { eyebrow: string; title: string; to?: "/activities" | "/seasons/next" | "/wish-pools" | "/recruitment" | "/leaderboards" | "/physical-collection" | "/announcements" | "/pools" }) {
  return <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-[11px] font-black text-gold">{eyebrow}</p><h2 className="mt-1 text-xl font-black sm:text-2xl">{title}</h2></div>{to ? <Link to={to} className="shrink-0 text-xs font-bold text-primary hover:underline">查看全部 →</Link> : null}</div>;
}

function HomePage() {
  const [state, setState] = useDemoState();
  const content = useContent();
  const notices = IMPORTANT_NOTICE_IDS.flatMap((id) => { const n = content.announcementById(id); return n && n.visible ? [n] : []; });
  const activities = content.activities.filter((a) => a.visible);
  const now = useSeasonClock();
  const nextPool = SEASON.poolId ? poolById(SEASON.poolId) : undefined;
  const nextTime = SEASON.opensAtISO ? Date.parse(SEASON.opensAtISO) : NaN;
  const nextTimeReached = now !== null && Number.isFinite(nextTime) && now >= nextTime;
  const seasonPools = POOLS.filter((pool) => pool.status === "live");
  const cards = CARDS.slice(0, 6);
  const blocks: Record<HomeSectionKey, ReactNode> = {
    "notices": <><section><Heading eyebrow="P0 · LIVE UPDATE" title="重要公告" to="/announcements" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{notices.length ? notices.map((notice) => <article key={notice.id} className="panel min-w-0 p-4"><div className="flex items-center justify-between gap-2"><TextStatus tone={notice.tag === "維護" ? "default" : "gold"}>{notice.tag}{notice.tag === "維護" ? " · 歷史紀錄" : ""}</TextStatus><span className="text-[11px] text-muted-foreground">{notice.date} · Demo</span></div><h3 className="mt-3 text-sm font-bold leading-relaxed">{notice.title}</h3><Link to="/announcements/$announcementId" params={{ announcementId: notice.id }} className="mt-4 inline-block text-xs font-bold text-primary hover:underline">閱讀公告 →</Link></article>) : <p className="text-sm text-muted-foreground">目前沒有公告（Demo）。</p>}</div></section></>,
    "pools": <><section><Heading eyebrow="P0 · SEASON POOLS" title="當季進行中卡池" to="/pools" /><div className="grid gap-4 md:grid-cols-2">{seasonPools.length ? seasonPools.map((pool) => { const progress = poolCollectProgress(pool.id); return <article key={pool.id} className="panel overflow-hidden p-3"><PoolCover pool={pool} className="aspect-[16/10]" /><div className="p-3"><div className="flex flex-wrap items-center justify-between gap-2"><PoolStatusTag status={pool.status} /><span className="text-xs text-muted-foreground">{pool.cardCount} 張</span></div><p className="mt-3 text-xs text-muted-foreground">期間 {pool.startAt}—{pool.endAt}（Demo）</p><Progress className="mt-3" value={progress.owned} max={progress.total} tone="gold" showLabel label={`卡冊 ${progress.owned}/${progress.total}`} /><p className="mt-3 text-xs text-muted-foreground">單抽 {pool.singlePricePoints}／十連 {pool.tenPricePoints} 點（Demo）</p><div className="mt-4 flex flex-wrap gap-2"><Button asChild size="sm"><Link to="/pools/$poolId" params={{ poolId: pool.id }}>查看{pool.name}</Link></Button><Button asChild size="sm" variant="outline"><Link to="/pools/$poolId" params={{ poolId: pool.id }}>機率規則</Link></Button></div></div></article>; }) : <p className="text-sm text-muted-foreground">目前沒有進行中的卡池（Demo）。</p>}</div></section></>,
    "activities": <><section><Heading eyebrow="P1 · EVENTS" title="活動專區" to="/activities" /><div className="grid gap-3 md:grid-cols-3">{activities.length ? activities.map((item) => <article key={item.id} className="panel p-5"><TextStatus tone={item.status === "進行中" ? "live" : item.status === "即將開始" ? "gold" : "default"}>{item.status}</TextStatus><h3 className="mt-5 text-lg font-black">{item.title}</h3><p className="mt-2 text-sm text-muted-foreground">{item.subtitle}</p><p className="mt-5 text-xs text-gold">{item.period} · Demo</p><Link to="/activities/$activityId" params={{ activityId: item.id }} className="mt-4 inline-block text-xs font-bold text-primary hover:underline">查看活動詳情 →</Link></article>) : <p className="text-sm text-muted-foreground">目前沒有活動（Demo）。</p>}</div></section></>,
    "season-wish": <><section className="grid gap-6 lg:grid-cols-2"><div className="min-w-0"><Heading eyebrow="P1 · NEXT SEASON" title="下一季預告" to="/seasons/next" /><div className="panel relative min-h-72 overflow-hidden p-6"><div className="absolute inset-y-0 right-0 w-2/5 opacity-30 rarity-grad-o"><GoddessSilhouette variant="c" /></div><div className="relative max-w-sm"><TextStatus tone="gold">{nextTimeReached ? "開放資訊待更新 · Demo" : "尚未開放抽卡 · Demo"}</TextStatus><h3 className="mt-5 text-2xl font-black">{nextPool?.name ?? SEASON.title}</h3><p className="mt-2 text-sm text-muted-foreground">{SEASON.title} · 預定 {SEASON.opensAt}</p><p className="mt-6 text-xl font-black text-gold" aria-live="off">{seasonCountdown(SEASON.opensAtISO, now)}</p><Button asChild className="mt-5"><Link to="/seasons/next">查看預告與解鎖節點</Link></Button></div></div></div>
        <div className="min-w-0"><Heading eyebrow="P1 · WISH LIST" title="許願卡池" to="/wish-pools" /><div className="panel p-5"><p className="text-xs text-muted-foreground">官方候選 · 不開放自由輸入姓名</p>{content.wishes.length ? content.wishes.slice(0, 3).map((item, index) => <div key={item.id} className="flex items-center gap-3 border-b border-border py-4 last:border-0"><span className="text-lg font-black text-gold">0{index + 1}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold">{item.name}</p><p className="text-xs text-muted-foreground">{item.category} · {item.votes.toLocaleString()} 票（Demo）</p></div></div>) : <p className="py-5 text-sm text-muted-foreground">目前沒有官方候選項目（Demo）。</p>}<Button asChild className="mt-4 w-full"><Link to="/wish-pools">前往許願卡池投票頁（Demo）</Link></Button><p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">投票僅在投票頁示意，不等於承諾合作或上架。</p></div></div></section></>,
    "recruit-rank": <><section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><div><Heading eyebrow="P1 · RECRUITMENT" title="卡池募集" to="/recruitment" /><div className="panel p-6"><div className="flex flex-wrap gap-2"><TextStatus tone="live">冬季募集開放諮詢</TextStatus><TextStatus>真人／VTuber／原創角色／聯名 IP</TextStatus></div><h3 className="mt-5 text-xl font-black">讓創作成為可長期收藏的作品</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">須確認肖像權、攝影著作權與第三方角色 IP 授權；本原型不收集檔案或建立真實送件。</p><Button asChild className="mt-5"><Link to="/recruitment">查看申請流程</Link></Button></div></div>
         <div className="min-w-0"><Heading eyebrow="P1 · RANKING" title="排行榜摘要" to="/leaderboards" /><div className="panel p-5"><p className="text-xs font-bold text-gold">收藏總榜前三</p>{PUBLIC_TOTAL_TOP.length ? PUBLIC_TOTAL_TOP.slice(0, 3).map((row) => <div key={row.collector.id} className="flex items-center gap-3 py-3"><span className="w-6 font-black text-gold">{row.rank}</span><span className="min-w-0 flex-1 truncate text-sm font-bold">{row.collector.displayName}</span><span className="text-xs tabular-nums text-muted-foreground">{row.collector.totalScore.toLocaleString()} 分</span></div>) : <p className="py-3 text-sm text-muted-foreground">目前沒有公開排名（Demo）。</p>}<p className="text-[11px] text-muted-foreground">{content.leaderboardNote}（與排行榜頁同源）</p><p className="mt-3 border-t border-border pt-4 text-xs font-bold text-gold">熱門卡池展示</p>{POPULAR_POOL_RANKING.map((row) => <div key={row.pool.id} className="flex items-center gap-3 py-2 text-sm"><span className="w-6 font-black">{row.rank}</span><span className="min-w-0 flex-1 truncate">{row.pool.name}</span><span className="text-xs text-muted-foreground">{row.collectors.toLocaleString()} 位收藏家</span></div>)}<p className="mt-2 text-[11px] text-muted-foreground">人氣數為獨立 Demo 示意，並非玩家排行榜或真實收藏家統計。</p></div></div></section></>,
    "cards": <><section><Heading eyebrow="P2 · CARDS" title="新卡與熱門卡" to="/pools" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{cards.map((card) => <div key={card.id} className="min-w-0"><CardFrame goddess={goddessById(card.goddessId)} grade={card.grade} cardName={card.name} /><p className="mt-2 truncate text-[11px] text-muted-foreground">{card.name}</p><CardDetailLink name={card.name} grade={card.grade} /></div>)}</div></section></>,
    "physical": <><section><Heading eyebrow="P2 · PHYSICAL" title="實體典藏" to="/physical-collection" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{PHYSICAL_COLLECTION.map((item) => <article key={item.id} className="panel p-5"><div className="flex items-center justify-between gap-2"><TextStatus tone={item.state === "可兌換" ? "live" : "gold"}>{item.state}</TextStatus><span className="text-xs font-bold text-gold">{item.edition}</span></div><h3 className="mt-5 font-black">{item.title}</h3><p className="mt-1 text-xs text-muted-foreground">流水號 {item.serial}</p><Progress className="mt-4" value={item.current} max={item.required} tone="gold" showLabel label={`素材 ${item.current}/${item.required}`} /><p className="mt-3 text-[11px] text-muted-foreground">V1 資格／進度 Mock，不做真實履約。</p></article>)}</div></section></>,
    "stories": <><section><Heading eyebrow="P2 · STORIES" title="創作者故事／收藏展示" /><div className="grid gap-3 md:grid-cols-3">{CREATOR_STORIES.map((story, index) => <article key={story.title} className="panel overflow-hidden"><div className={`h-28 rarity-grad-${["ur", "ssr", "hr"][index]}`} /><div className="p-5"><TextStatus>{story.category}</TextStatus><h3 className="mt-4 font-black leading-relaxed">{story.title}</h3><p className="mt-3 text-xs text-muted-foreground">閱讀時間 {story.readTime} · Demo 內容</p></div></article>)}</div></section></>,
  };
  return <div className="mx-auto max-w-6xl space-y-12 overflow-x-clip">
    <StateSwitcher state={state} onChange={setState} />
    {state !== "ok" ? <StatePlaceholder state={state} emptyTitle="目前沒有首頁內容" /> : <>
      <section className="relative min-h-[420px] overflow-hidden rounded-md border border-border sm:min-h-[490px]">
        <img src={seasonHero} alt="星光舞台下一季預告主視覺，展示真人創作者、音樂人與虛擬角色" width={1600} height={900} className="absolute inset-0 h-full w-full object-cover object-[62%_center]" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/75 to-ink/10" />
        <div className="relative flex min-h-[420px] max-w-2xl flex-col justify-end p-6 text-primary-foreground sm:min-h-[490px] sm:p-10">
          <div className="flex flex-wrap gap-2"><TextStatus tone="gold">{SEASON.eyebrow}</TextStatus><span className="demo-chip">Local Mock</span></div>
          <p className="mt-5 text-xs font-black text-gold">{PLATFORM_NAME}</p><h1 className="mt-2 text-4xl font-black leading-tight sm:text-6xl">{SEASON.title}</h1>
          <p className="mt-3 text-sm font-bold text-primary-foreground/90">{SERIES_NAME} · {nextPool?.name ?? "下一季卡池"}{nextTimeReached ? "開放資訊待更新（Demo）" : "尚未開放抽卡"}</p><p className="mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/75 sm:text-base">{content.heroDescription}</p>
          <div className="mt-7 flex flex-wrap gap-3"><Button asChild size="lg"><Link to="/pools">查看進行中卡池</Link></Button><Button asChild size="lg" variant="secondary" className="border border-primary-foreground/30 bg-ink text-primary-foreground hover:bg-ink/80"><Link to="/seasons/next">下一季預告</Link></Button></div>
          <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-2"><div><p className="text-xs text-primary-foreground/70">{nextPool?.name ?? "下一季卡池"}預定開放 · Demo</p><p className="text-xl font-black text-gold" aria-live="off">{seasonCountdown(SEASON.opensAtISO, now)}</p></div><p className="text-xs text-primary-foreground/70">{SEASON.opensAt}</p></div>
        </div>
      </section>

      {content.homeSections.filter((s) => s.visible).map((s) => <Fragment key={s.key}>{blocks[s.key]}</Fragment>)}
      <footer className="border-t border-border py-8 text-sm text-muted-foreground"><p className="font-bold text-foreground">{PLATFORM_NAME}</p><p className="mt-1">{SERIES_NAME} · 組織歸屬 PEEKFUTURE · 正式母品牌待決策</p><p className="mt-3 text-xs">本網站為 Local Mock UI 原型，無後端、真實登入、金流、抽卡、通知、上傳或履約。</p></footer>
    </>}
  </div>;
}