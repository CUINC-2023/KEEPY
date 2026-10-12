import { createFileRoute } from "@tanstack/react-router";
import { ParticipationAdminPage } from "@/components/participation/ParticipationViews";
export const Route = createFileRoute("/admin/participation")({
  head: () => ({ meta: [{ title: "KEEPY · Participation" }] }),
  component: ParticipationAdminPage,
});
