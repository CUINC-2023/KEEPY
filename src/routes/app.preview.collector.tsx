import { createFileRoute, Link } from "@tanstack/react-router";
import { CollectorProfileView } from "@/components/public/CollectorProfileView";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/preview/collector")({
  head: () => ({
    meta: [
      { title: "本人預覽公開收藏頁 — PEEKFUTURE 創作者收藏卡平台" },
      { name: "description", content: "以訪客視角預覽自己的公開收藏頁，並快速前往展示內容管理（Demo）。" },
      { property: "og:title", content: "本人預覽公開收藏頁" },
      { property: "og:description", content: "預覽公開收藏頁並管理展示卡與徽章（Demo）。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OwnerPreview,
});

function OwnerPreview() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 overflow-x-clip">
      <section className="panel space-y-3 border-gold/40 p-4" aria-label="本人預覽提示">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-black">本人預覽</h1>
          <span className="demo-chip">登入 Demo · 無真實權限驗證</span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          下方內容與訪客公開頁相同，另外提供管理捷徑。此原型沒有真實登入與帳號權限隔離；設定只保存在此瀏覽器。
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline"><Link to="/app/settings/privacy">返回公開頁設定</Link></Button>
          <Button asChild size="sm" variant="outline"><Link to="/app/settings/privacy" hash="showcase-cards">管理展示卡</Link></Button>
          <Button asChild size="sm" variant="outline"><Link to="/app/achievements">管理展示徽章</Link></Button>
          <Button asChild size="sm" variant="outline"><Link to="/collectors/demo-player">開啟訪客公開頁</Link></Button>
        </div>
      </section>
      <CollectorProfileView mode="owner" />
    </div>
  );
}
