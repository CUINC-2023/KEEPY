import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useContent } from "@/lib/content-store";
import { PublicPage, TextStatus } from "@/components/public/PublicPage";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/wish-pools")({
  head: () => ({ meta: [
    { title: "許願卡池 — KEEPY 創作者收藏卡平台" }, { name: "description", content: "瀏覽官方候選許願卡池、候選說明與示範投票規則。" },
    { property: "og:title", content: "許願卡池 — KEEPY 創作者收藏卡平台" }, { property: "og:description", content: "官方候選許願卡池與示範投票規則。" },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: WishPoolsPage,
});

const RULES = ["只提供官方候選項目，不開放自由輸入人物姓名。", "票數為 Demo 示範數字，不會因操作而改變。", "投票結果不等於承諾合作、上架或開池時程。", "本頁不蒐集任何個資，也不需要登入。"];

function WishPoolsPage() {
  const [picked, setPicked] = useState<string | null>(null);
  const wishes = useContent().wishes;
  return <PublicPage title="許願卡池" description="查看官方候選企劃與說明；投票目前僅為介面示意，未開放真實投票。">
    <div className="rounded-md border border-gold/30 bg-gold/10 p-4 text-sm text-gold" role="note">目前未開放真實投票：選擇候選只會在畫面上標示「示意選擇」，不會儲存、不會累計票數，重新整理即清除。</div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{wishes.length ? wishes.map((item) => {
      const open = item.state === "投票中"; const detail = item;
      return <article key={item.id} className="panel p-5"><div className="flex flex-wrap items-center justify-between gap-2"><TextStatus tone={open ? "live" : "default"}>{item.state}</TextStatus><span className="text-xs text-muted-foreground">{item.category}</span></div>
        <h2 className="mt-5 text-lg font-black">{item.name}</h2>
        {detail ? <><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail.summary}</p><p className="mt-2 text-xs text-muted-foreground">查看方式：{detail.howToView}</p></> : null}
        <p className="mt-3 text-2xl font-black tabular-nums">{item.votes.toLocaleString()} <span className="text-xs text-muted-foreground">票（Demo 固定示範數）</span></p><p className="mt-1 text-xs text-muted-foreground">截止 {item.deadline}（Demo）</p>
        <Button className="mt-5 w-full" variant={picked === item.id ? "secondary" : "outline"} disabled={!open} aria-pressed={picked === item.id} onClick={() => setPicked(picked === item.id ? null : item.id)}>{!open ? "投票已截止" : picked === item.id ? "已示意選擇（未送出）" : "示意選擇（不計票）"}</Button>
      </article>; }) : <p className="text-sm text-muted-foreground">目前沒有官方候選項目（Demo）。</p>}</div>
    <section className="panel p-5"><h2 className="text-lg font-black">規則說明</h2><ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{RULES.map((r) => <li key={r}>{r}</li>)}</ul><div className="mt-4 flex flex-wrap gap-3 text-sm font-bold"><Link to="/seasons/next" className="text-primary hover:underline">查看下一季預告 →</Link><Link to="/recruitment" className="text-primary hover:underline">創作者合作募集 →</Link></div></section>
  </PublicPage>;
}
