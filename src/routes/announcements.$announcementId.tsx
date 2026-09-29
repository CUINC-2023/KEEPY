import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { announcementById } from "@/data/public-hub";
import { useContent, useLocalHead } from "@/lib/content-store";
import { TextStatus } from "@/components/public/PublicPage";
import { BackLink, RelatedLinks } from "@/components/public/RelatedLinks";

export const Route = createFileRoute("/announcements/$announcementId")({
  loader: ({ params }) => {
    const item = announcementById(params.announcementId);
    if (!item) throw notFound();
    return { item };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "找不到公告 — PEEKFUTURE" }, { name: "robots", content: "noindex" }] };
    const t = `${loaderData.item.title} — 公告中心 · PEEKFUTURE`;
    return { meta: [
      { title: t }, { name: "description", content: loaderData.item.summary },
      { property: "og:title", content: t }, { property: "og:description", content: loaderData.item.summary },
      { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" },
    ] };
  },
  notFoundComponent: AnnouncementNotFound,
  component: AnnouncementDetailPage,
});

function AnnouncementNotFound() {
  return <div className="mx-auto max-w-3xl space-y-4 py-10 text-center"><h1 className="text-2xl font-black">找不到這則公告</h1><p className="text-sm text-muted-foreground">公告可能已下架或網址有誤（Demo）。</p><Link to="/announcements" className="inline-flex font-bold text-primary hover:underline">返回公告列表</Link></div>;
}

function AnnouncementDetailPage() {
  const { item: base } = Route.useLoaderData();
  const item = useContent().announcementById(base.id) ?? { ...base, visible: true };
  useLocalHead(item.visible ? `${item.title} — 公告中心 · PEEKFUTURE` : "此內容目前未公開 — PEEKFUTURE", item.visible ? item.summary : "此內容已在本機後台示範中設為隱藏。");
  if (!item.visible) return <div className="mx-auto max-w-3xl space-y-4 py-10 text-center"><h1 className="text-2xl font-black">此內容目前未公開</h1><p className="text-sm text-muted-foreground">已在後台示範中設為隱藏（僅此瀏覽器本機設定）。</p><Link to="/announcements" className="inline-flex font-bold text-primary hover:underline">返回公告列表</Link></div>;
  return <article className="mx-auto max-w-3xl space-y-5 overflow-x-clip">
    <BackLink to="/announcements" label="返回公告列表" />
    <header className="space-y-3"><div className="flex flex-wrap items-center gap-2"><TextStatus tone={item.historical ? "default" : "gold"}>{item.tag}</TextStatus>{item.historical ? <TextStatus>歷史紀錄</TextStatus> : null}<span className="demo-chip">Local Mock</span></div><h1 className="text-2xl font-black leading-snug sm:text-3xl">{item.title}</h1><p className="text-xs text-muted-foreground">發布日期 <time dateTime={item.date}>{item.date}</time>（Demo）· 編號 {item.id}</p></header>
    {item.historical ? <p className="rounded-md border border-border bg-muted p-4 text-sm">{item.historical}</p> : null}
    <div className="panel space-y-4 p-5 text-sm leading-relaxed sm:p-6">{item.body.map((p) => <p key={p}>{p}</p>)}</div>
    <RelatedLinks items={item.related} />
  </article>;
}
