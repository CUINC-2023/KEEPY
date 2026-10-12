import { createFileRoute } from "@tanstack/react-router";
import { normalizeExploreSearch } from "@/lib/explore-search.mjs";
import { ReadingPage } from "@/components/content/ReadingPage";
export const Route = createFileRoute("/app/reading")({
  validateSearch: normalizeExploreSearch,
  head: () => ({ meta: [{ title: "KEEPY · Read later" }] }),
  component: ReadingPage,
});
