import { createFileRoute } from "@tanstack/react-router";
import { PersonalRankingCenter } from "@/components/collection/PersonalRankingCenter";
export const Route = createFileRoute("/app/rankings")({
  head: () => ({ meta: [{ title: "KEEPY · Personal ranking center" }] }),
  component: PersonalRankingCenter,
});
