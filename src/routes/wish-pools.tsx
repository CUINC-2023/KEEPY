import { createFileRoute } from "@tanstack/react-router";
import { VotingPage } from "@/components/participation/ParticipationViews";
export const Route = createFileRoute("/wish-pools")({
  head: () => ({ meta: [{ title: "KEEPY · Participation" }] }),
  component: VotingPage,
});
