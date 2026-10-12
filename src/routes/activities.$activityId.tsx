import { createFileRoute } from "@tanstack/react-router";
import { ActivityDetail } from "@/components/participation/ParticipationViews";
export const Route = createFileRoute("/activities/$activityId")({
  head: () => ({ meta: [{ title: "KEEPY · Participation" }] }),
  component: Page,
});
function Page() {
  const { activityId } = Route.useParams();
  return <ActivityDetail id={activityId} />;
}
