import { createFileRoute } from "@tanstack/react-router";
import { PublicCollectionPage } from "@/components/collection/CollectionViews";
export const Route = createFileRoute("/collectors/$collectorId")({
  head: () => ({ meta: [{ title: "KEEPY · Collection" }] }),
  component: Page,
});
function Page() {
  const { collectorId } = Route.useParams();
  return <PublicCollectionPage handle={collectorId} />;
}
