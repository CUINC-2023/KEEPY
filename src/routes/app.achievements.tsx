import { createFileRoute } from "@tanstack/react-router";
import { EarnedAchievements } from "@/components/collection/EarnedAchievements";
export const Route = createFileRoute("/app/achievements")({
  head: () => ({
    meta: [
      { title: "已取得成就 — KEEPY" },
      { name: "description", content: "本人已取得成就與自選展示徽章。" },
    ],
  }),
  component: EarnedAchievements,
});
