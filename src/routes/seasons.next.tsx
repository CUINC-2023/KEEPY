import { useDiscoveryText } from "@/lib/discovery-copy";
import { DiscoveryHome } from "@/components/content/DiscoveryContent";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/seasons/next")({
  head: () => ({
    meta: [
      { title: "下一季預告 — KEEPY 創作者收藏卡平台" },
      { name: "description", content: "查看已發布的下一季示意企劃；不是合作或上架承諾。" },
      { property: "og:title", content: "下一季預告 — KEEPY 創作者收藏卡平台" },
      { property: "og:description", content: "查看已發布的下一季示意企劃。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NextSeasonPage,
});

function NextSeasonPage() {
  const t = useDiscoveryText();
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <h1 className="text-3xl font-black">{t("下一季預告", "Next season")}</h1>
      <DiscoveryHome nextOnly />
    </div>
  );
}
