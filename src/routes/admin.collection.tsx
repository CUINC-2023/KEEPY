import { createFileRoute } from "@tanstack/react-router";
import { CollectionAdmin } from "@/components/collection/CollectionViews";
export const Route = createFileRoute("/admin/collection")({
  head: () => ({ meta: [{ title: "KEEPY · Collection" }] }),
  component: CollectionAdmin,
});
