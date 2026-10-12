import { createFileRoute } from "@tanstack/react-router";
import { PlayerGrowthPage } from "@/components/collection/PlayerGrowthPage";
export const Route = createFileRoute("/app/levels")({
  head: () => ({ meta: [{ title: "KEEPY · Local growth preview" }] }),
  component: PlayerGrowthPage,
});
