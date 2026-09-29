import { createFileRoute, Link } from "@tanstack/react-router";
import { SEASON, NEXT_SEASON_NODES } from "@/data/public-hub";
import { PublicPage, TextStatus } from "@/components/public/PublicPage";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { seasonCountdown, seasonNodeState, useSeasonClock } from "@/lib/season-time";

export const Route = createFileRoute("/seasons/next")({
  head: () => ({ meta: [
    { title: "下一季預告 — PEEKFUTURE 創作者收藏卡平台" }, { name: "description", content: "查看下一季主題與 T-30 至 T-1 解鎖節點。" },
    { property: "og:title", content: "下一季預告 — PEEKFUTURE 創作者收藏卡平台" }, { property: "og:description", content: "查看下一季主題與解鎖節點。" },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: NextSeasonPage,
});

function NextSeasonPage() {
  const { push } = useToast();
  const now = useSeasonClock();
  return <PublicPage title="下一季預告" description="預告只提供主題與解鎖資訊，不會在開放前顯示抽卡操作。">
    <section className="panel relative overflow-hidden p-6 sm:p-8"><div className="absolute inset-y-0 right-0 w-1/2 rarity-grad-o opacity-20" /><div className="relative max-w-xl"><TextStatus tone="gold">{SEASON.eyebrow}</TextStatus><h2 className="mt-4 text-3xl font-black">{SEASON.title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{SEASON.description}</p><p className="mt-5 text-2xl font-black text-gold" aria-live="off">{seasonCountdown(SEASON.opensAtISO, now)}</p><p className="mt-1 text-xs text-muted-foreground">{SEASON.poolId ? `「星光舞台」預定開放：${SEASON.opensAt}` : SEASON.opensAt}</p><Button className="mt-5" onClick={() => push({ title: "提醒示意（Demo）", description: "不會訂閱、儲存提醒或寄送通知。", tone: "gold" })}>試看提醒示意（Demo）</Button></div></section>
    <p className="rounded-md border border-gold/30 bg-gold/10 p-4 text-sm text-gold">目前未開放抽卡。開放前不提供抽卡操作；卡池頁機率為 Demo 展示版本，不代表正式機率承諾。</p>
    <div className="flex flex-wrap gap-3 text-sm font-bold"><Link to="/pools/$poolId" params={{ poolId: "p-starlight" }} className="text-primary hover:underline">星光舞台卡池資訊 →</Link><Link to="/activities/$activityId" params={{ activityId: "event-stage" }} className="text-primary hover:underline">星光舞台倒數祭 →</Link><Link to="/announcements/$announcementId" params={{ announcementId: "a-2" }} className="text-primary hover:underline">開放預定公告 →</Link><Link to="/pools" className="text-primary hover:underline">查看進行中卡池 →</Link></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{NEXT_SEASON_NODES.map((node) => <article key={node.key} className="panel p-5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xl font-black text-gold">{node.key}</span><TextStatus tone={seasonNodeState(SEASON.opensAtISO, node.daysBefore, now) === "節點時間已到（Demo）" ? "live" : "default"}>{seasonNodeState(SEASON.opensAtISO, node.daysBefore, now)}</TextStatus></div><h3 className="mt-5 font-black">{node.title}</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{node.detail}</p></article>)}</div>
  </PublicPage>;
}