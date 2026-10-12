import { createFileRoute } from "@tanstack/react-router";
import { DiscoveryAdmin } from "@/components/content/DiscoveryAdmin";
export const Route = createFileRoute("/admin/discovery")({
  head: () => ({
    meta: [
      { title: "KEEPY · Content & discovery · Local Test" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DiscoveryAdmin,
});
