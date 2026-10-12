import { createFileRoute } from "@tanstack/react-router";
import { PlatformGrowthPage } from "@/components/collection/PlatformGrowthPage";
export const Route = createFileRoute("/app/participation-level")({
  head: () => ({ meta: [{ title: "KEEPY · Local participation preview" }] }),
  component: PlatformGrowthPage,
});
