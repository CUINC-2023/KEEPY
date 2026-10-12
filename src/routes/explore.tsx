import { createFileRoute } from "@tanstack/react-router";
import { PublicExplore } from "@/components/content/PublicExplore";
import { normalizeExploreSearch } from "@/lib/explore-search.mjs";
export const Route = createFileRoute("/explore")({
  validateSearch: normalizeExploreSearch,
  component: PublicExplore,
});
