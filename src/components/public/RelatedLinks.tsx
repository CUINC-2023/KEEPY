import { Link } from "@tanstack/react-router";
import type { ContentLink } from "@/data/public-hub";

const cls = "inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-bold hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function RelatedLink({ item }: { item: ContentLink }) {
  if (item.kind === "pool" && item.id) return <Link to="/pools/$poolId" params={{ poolId: item.id }} className={cls}>{item.label} →</Link>;
  if (item.kind === "activity" && item.id) return <Link to="/activities/$activityId" params={{ activityId: item.id }} className={cls}>{item.label} →</Link>;
  if (item.kind === "announcement" && item.id) return <Link to="/announcements/$announcementId" params={{ announcementId: item.id }} className={cls}>{item.label} →</Link>;
  if (item.kind === "season") return <Link to="/seasons/next" className={cls}>{item.label} →</Link>;
  return <Link to="/rules" className={cls}>{item.label} →</Link>;
}

export function RelatedLinks({ items, empty = "目前沒有相關內容（Demo）。" }: { items: ContentLink[]; empty?: string }) {
  return (
    <section className="panel p-5" aria-labelledby="related-title">
      <h2 id="related-title" className="text-sm font-black">相關內容</h2>
      {items.length ? <div className="mt-3 flex flex-wrap gap-2">{items.map((item) => <RelatedLink key={item.label} item={item} />)}</div> : <p className="mt-3 text-sm text-muted-foreground">{empty}</p>}
    </section>
  );
}

export function BackLink({ to, label }: { to: "/announcements" | "/activities"; label: string }) {
  return <Link to={to} className="inline-flex text-sm font-bold text-primary hover:underline">← {label}</Link>;
}
