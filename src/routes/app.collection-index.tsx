import { createFileRoute } from "@tanstack/react-router";
import { CollectionPrivateIndex } from "@/components/collection/CollectionPrivateIndex";
export const Route = createFileRoute("/app/collection-index")({
  component: CollectionPrivateIndex,
});
