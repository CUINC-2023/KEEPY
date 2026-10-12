import { createFileRoute } from "@tanstack/react-router";
import { ActivitiesPage } from "@/components/participation/ParticipationViews";
export const Route = createFileRoute("/activities/")({
  head: () => ({ meta: [{ title: "KEEPY · Participation" }] }),
  component: ActivitiesPage,
});
