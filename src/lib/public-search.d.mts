import type { DiscoveryItem } from "./discovery-store";
export function publicContentSearch(
  items: DiscoveryItem[],
  query?: string,
  type?: string,
  locale?: "zh-TW" | "en",
  filters?: import("./explore-search.mjs").ExploreSearch,
): DiscoveryItem[];
