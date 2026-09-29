import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useToast } from "@/components/ui/toast";
import { CollectorProfileView } from "@/components/public/CollectorProfileView";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/collectors/demo-player")({
  head: () => ({
    meta: [
      { title: "橘子收藏家的公開收藏頁 — PEEKFUTURE 創作者收藏卡平台" },
      { name: "description", content: "橘子收藏家的公開展示卡、徽章、卡冊進度與實體典藏紀錄。" },
      { property: "og:title", content: "橘子收藏家的公開收藏頁" },
      { property: "og:description", content: "查看展示卡、收藏徽章與當季收藏進度。" },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VisitorCollectorPage,
});

const VISITOR_PATH = "/collectors/demo-player";

function VisitorCollectorPage() {
  // 乾淨訪客網址：只用 origin + 固定路徑，不帶任何 query/hash/token/本機資料
  const [url, setUrl] = useState(VISITOR_PATH);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const { push } = useToast();
  useEffect(() => setUrl(`${window.location.origin}${VISITOR_PATH}`), []);

  function legacyCopy(text: string) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    document.body.removeChild(area);
    return ok;
  }

  async function copy() {
    let ok = false;
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(url); ok = true; } catch { ok = false; }
    }
    if (!ok) ok = legacyCopy(url);
    if (ok) {
      setFeedback({ ok: true, text: "已複製公開頁網址到剪貼簿。" });
      push({ title: "已複製公開頁網址", description: "其他裝置開啟會看到該裝置的預設 Demo 內容。", tone: "gold" });
    } else {
      setFeedback({ ok: false, text: "瀏覽器拒絕寫入剪貼簿，未複製。請手動選取上方網址。" });
      push({ title: "複製失敗", description: "請手動選取網址複製。" });
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 overflow-x-clip">
      <div className="flex flex-wrap items-center gap-2">
        <span className="demo-chip">Demo · 僅此瀏覽器</span>
      </div>
      <CollectorProfileView mode="visitor" />
      <section className="panel space-y-2 p-4" aria-label="公開頁網址">
        <p className="text-xs font-bold">公開頁網址</p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 max-w-full flex-1 select-all break-all rounded-md bg-muted px-2 py-1.5 text-[11px]">{url}</code>
          <Button size="sm" variant="outline" onClick={copy}>複製網址</Button>
        </div>
        <p role="status" aria-live="polite" className={`text-[11px] ${feedback?.ok === false ? "text-destructive" : "text-gold"}`}>{feedback?.text ?? ""}</p>
        <p className="text-[11px] text-muted-foreground">Demo：內容只存在此瀏覽器，其他裝置開啟同網址會看到該裝置的預設 Demo 資料，並非真正跨裝置分享。</p>
      </section>
    </div>
  );
}
