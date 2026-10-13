import { createFileRoute } from "@tanstack/react-router";
import { CompactHome } from "@/components/content/CompactHome";
import { PLATFORM_NAME, SERIES_NAME } from "@/data/public-hub";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${PLATFORM_NAME} — ${SERIES_NAME}` },
      {
        name: "description",
        content: "創作者收藏卡、故事與無獎勵練習；本機示意／Staging 前端預覽。",
      },
      { property: "og:title", content: `${PLATFORM_NAME} — ${SERIES_NAME}` },
      { property: "og:description", content: "探索公開作品，接續本人收藏與練習。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompactHome,
});
