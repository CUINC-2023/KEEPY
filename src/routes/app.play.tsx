import { createFileRoute } from "@tanstack/react-router";
import { CollectionPlay } from "@/components/collection/CollectionPlay";
export const Route = createFileRoute("/app/play")({
  head: () => ({ meta: [{ title: "KEEPY · Collection play" }] }),
  component: CollectionPlay,
});
