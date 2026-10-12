import { createFileRoute } from "@tanstack/react-router";
import { TasksPage } from "@/components/participation/ParticipationViews";
export const Route = createFileRoute("/app/tasks")({
  head: () => ({ meta: [{ title: "KEEPY · Participation" }] }),
  component: TasksPage,
});
