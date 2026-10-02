import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { activityById } from "@/data/public-hub";
import { useContent, useLocalHead } from "@/lib/content-store";
import { TextStatus } from "@/components/public/PublicPage";
import { BackLink, RelatedLinks } from "@/components/public/RelatedLinks";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/activities/$activityId")({
  loader: ({ params }) => {
    const item = activityById(params.activityId);
    if (!item) throw notFound();
    return { item };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "找不到活動 — KEEPY" }, { name: "robots", content: "noindex" }] };
    const t = `${loaderData.item.title} — 活動專區 · KEEPY`;
    return { meta: [
      { title: t }, { name: "description", content: loaderData.item.subtitle },
      { property: "og:title", content: t }, { property: "og:description", content: loaderData.item.subtitle },
      { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" },
    ] };
  },
  notFoundComponent: ActivityNotFound,
  component: ActivityDetailPage,
});

function ActivityNotFound() {
  return <div className="mx-auto max-w-3xl space-y-4 py-10 text-center"><h1 className="text-2xl font-black">找不到這個活動</h1><p className="text-sm text-muted-foreground">活動可能已下架或網址有誤（Demo）。</p><Link to="/activities" className="inline-flex font-bold text-primary hover:underline">返回活動列表</Link></div>;
}

function ActivityDetailPage() {
  const { item: base } = Route.useLoaderData();
  const item = useContent().activityById(base.id) ?? { ...base, visible: true };
  useLocalHead(item.visible ? `${item.title} — 活動專區 · KEEPY` : "此內容目前未公開 — KEEPY", item.visible ? item.subtitle : "此內容已在本機後台示範中設為隱藏。");
  if (!item.visible) return <div className="mx-auto max-w-3xl space-y-4 py-10 text-center"><h1 className="text-2xl font-black">此內容目前未公開</h1><p className="text-sm text-muted-foreground">已在後台示範中設為隱藏（僅此瀏覽器本機設定）。</p><Link to="/activities" className="inline-flex font-bold text-primary hover:underline">返回活動列表</Link></div>;
  const tone = item.status === "進行中" ? "live" : item.status === "即將開始" ? "gold" : "default";
  return <article className="mx-auto max-w-3xl space-y-5 overflow-x-clip">
    <BackLink to="/activities" label="返回活動列表" />
    <header className="space-y-3"><div className="flex flex-wrap items-center gap-2"><TextStatus tone={tone}>{item.status}</TextStatus><TextStatus>{item.tag}</TextStatus><span className="demo-chip">Local Mock</span></div><h1 className="text-2xl font-black sm:text-3xl">{item.title}</h1><p className="text-sm text-muted-foreground">{item.subtitle}</p><p className="text-xs tabular-nums text-muted-foreground">活動期間 {item.period}（Demo 日期）</p></header>
    <div className="panel space-y-5 p-5 sm:p-6">
      <section><h2 className="text-sm font-black">活動說明</h2>{item.description?.map((p) => <p key={p} className="mt-2 text-sm leading-relaxed">{p}</p>)}</section>
      <section><h2 className="text-sm font-black">參與方式（Demo）</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{item.participation?.map((p) => <li key={p}>{p}</li>)}</ul></section>
      <section><h2 className="text-sm font-black">獎勵</h2><p className="mt-2 text-sm text-gold">{item.reward}</p></section>
      <Progress value={item.progress} max={100} tone="gold" showLabel label={`展示進度 ${item.progress}%（Demo）`} />
      <p className="text-xs text-muted-foreground">本活動無報名或領獎操作，不會建立任何參與紀錄。</p>
    </div>
    <RelatedLinks items={item.related ?? []} />
  </article>;
}
