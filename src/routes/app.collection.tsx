import { createFileRoute } from "@tanstack/react-router";
import { CollectionPage } from "@/components/collection/CollectionViews";
export const Route = createFileRoute("/app/collection")({
  head: () => ({ meta: [{ title: "KEEPY · Collection" }] }),
  component: CollectionPage,
});
