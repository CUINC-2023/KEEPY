import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useContent } from "@/lib/content-store";
import { PublicPage, TextStatus } from "@/components/public/PublicPage";
import { FilterBar } from "@/components/ui/filter-bar";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/activities/")({
  head: () => ({ meta: [
    { title: "活動專區 — PEEKFUTURE 創作者收藏卡平台" },
    { name: "description", content: "查看進行中、即將開始與已結束的收藏活動（Local Mock）。" },
    { property: "og:title", content: "活動專區 — PEEKFUTURE 創作者收藏卡平台" },
    { property: "og:description", content: "查看收藏活動與解鎖進度。" },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ActivitiesPage,
});

function ActivitiesPage() {
  const [filter, setFilter] = useState("全部");
  const all = useContent().activities.filter((a) => a.visible);
  const rows = filter === "全部" ? all : all.filter((item) => item.status === filter);
  return (
    <PublicPage title="活動專區" description="收藏任務、季前預告與紀念活動都集中在這裡；所有進度與獎勵僅為本機介面示意。">
      <FilterBar filters={["全部", "進行中", "即將開始", "已結束"].map((key) => ({ key, label: key }))} active={filter} onChange={setFilter} />
      <div className="grid gap-3 md:grid-cols-3">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">目前沒有符合條件的活動（Demo）。</p>}
        {rows.map((item) => <article key={item.id} className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><TextStatus tone={item.status === "進行中" ? "live" : item.status === "即將開始" ? "gold" : "default"}>{item.status}</TextStatus><span className="text-xs text-muted-foreground">{item.tag}</span></div>
          <h2 className="mt-5 text-lg font-black"><Link to="/activities/$activityId" params={{ activityId: item.id }} className="hover:text-primary hover:underline">{item.title}</Link></h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.subtitle}</p>
          <p className="mt-5 text-xs tabular-nums text-muted-foreground">{item.period}</p><Progress className="mt-2" value={item.progress} max={100} tone="gold" showLabel label={`展示進度 ${item.progress}%（Demo）`} /><Link to="/activities/$activityId" params={{ activityId: item.id }} className="mt-4 inline-block text-xs font-bold text-primary hover:underline">查看活動詳情 →</Link>
        </article>)}
      </div>
    </PublicPage>
  );
}