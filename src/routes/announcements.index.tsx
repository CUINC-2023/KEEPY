import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useContent } from "@/lib/content-store";
import { PublicPage, TextStatus } from "@/components/public/PublicPage";
import { FilterBar } from "@/components/ui/filter-bar";

export const Route = createFileRoute("/announcements/")({
  head: () => ({ meta: [
    { title: "公告中心 — KEEPY 創作者收藏卡平台" }, { name: "description", content: "平台維護、機率、活動與兌換公告列表。" },
    { property: "og:title", content: "公告中心 — KEEPY 創作者收藏卡平台" }, { property: "og:description", content: "平台維護、機率、活動與兌換公告列表。" },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const [tag, setTag] = useState("全部");
  const all = useContent().announcements.filter((a) => a.visible);
  const rows = tag === "全部" ? all : all.filter((item) => item.tag === tag);
  return <PublicPage title="公告中心" description="依類型查看平台消息；內容為 Local Mock，不代表正式服務時程。">
    <FilterBar filters={["全部", "維護", "卡池", "預告", "規則", "活動", "兌換"].map((key) => ({ key, label: key }))} active={tag} onChange={setTag} />
    {rows.length === 0 && <p className="text-sm text-muted-foreground">目前沒有符合條件的公告（Demo）。</p>}
    <div className="panel divide-y divide-border">{rows.map((item) => <article key={item.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center"><TextStatus tone={item.tag === "維護" ? "gold" : "default"}>{item.tag}</TextStatus><h2 className="min-w-0 flex-1 text-sm font-bold"><Link to="/announcements/$announcementId" params={{ announcementId: item.id }} className="hover:text-primary hover:underline">{item.title}</Link>{item.historical ? <span className="ml-2 text-[11px] font-normal text-muted-foreground">（歷史紀錄）</span> : null}</h2><time className="text-xs tabular-nums text-muted-foreground">{item.date}</time></article>)}</div>
  </PublicPage>;
}