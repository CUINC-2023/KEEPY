import { QaHint } from "@/components/content/QaHint";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PHYSICAL_COLLECTION } from "@/data/public-hub";
import { PublicPage, TextStatus } from "@/components/public/PublicPage";
import { FilterBar } from "@/components/ui/filter-bar";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/physical-collection")({
  head: () => ({ meta: [
    { title: "實體典藏 — KEEPY 創作者收藏卡平台" }, { name: "description", content: "查看實體典藏資格、素材進度與 Edition 流水號 Mock。" },
    { property: "og:title", content: "實體典藏 — KEEPY 創作者收藏卡平台" }, { property: "og:description", content: "實體典藏資格與進度 Mock。" },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: PhysicalCollectionPage,
});

function PhysicalCollectionPage() {
  const [filter, setFilter] = useState("可兌換"); const rows = PHYSICAL_COLLECTION.filter((item) => item.state === filter);
  return <PublicPage title="實體典藏" description="V1 僅呈現資格與進度 Mock，不處理真實履約、付款或配送；台灣配送為介面示意，海外配送列入後續版本。">
    <FilterBar filters={["可兌換", "接近兌換", "兌換紀錄"].map((key) => ({ key, label: key }))} active={filter} onChange={setFilter} />
    <QaHint id="physical" />
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{rows.map((item) => <article key={item.id} className="panel p-5"><div className="flex items-center justify-between gap-2"><TextStatus tone={item.state === "可兌換" ? "live" : "gold"}>{item.state}</TextStatus><span className="text-xs font-bold text-gold">{item.edition}</span></div><h2 className="mt-5 text-lg font-black">{item.title}</h2><p className="mt-1 text-xs text-muted-foreground">流水號 {item.serial}</p><Progress className="mt-5" value={item.current} max={item.required} tone="gold" showLabel label={`素材進度 ${item.current}/${item.required}`} /><p className="mt-3 text-xs text-muted-foreground">剩餘量 {item.remaining} 份（Mock）</p></article>)}</div>
    <div className="grid gap-3 sm:grid-cols-2"><div className="panel p-5"><h2 className="font-black">台灣配送（Mock）</h2><p className="mt-2 text-sm text-muted-foreground">僅顯示未來流程位置，不收集地址、不建立訂單、不安排寄送。</p></div><div className="panel p-5"><h2 className="font-black">海外配送</h2><p className="mt-2 text-sm text-muted-foreground">後續版本規劃，V1 尚未開放。</p></div></div>
  </PublicPage>;
}