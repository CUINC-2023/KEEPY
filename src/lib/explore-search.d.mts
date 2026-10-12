import type { DiscoveryItem } from "./discovery-store";
export function isExploreQueryAllowed(search: string): boolean;
export interface ExploreSearch {
  page?: number | undefined;
  focus?: string | undefined;
  returnTo?: "reading" | "journal" | undefined;
  readingSort?: "latest" | "oldest" | undefined;
  q?: string;
  type?: "all" | "series" | "creator" | "article";
  category?: string | undefined;
  creator?: string | undefined;
  pool?: string | undefined;
}
export function normalizeExploreSearch(
  raw: Record<string, unknown> | ExploreSearch,
  items?: DiscoveryItem[],
): ExploreSearch;
export function exploreOptions(items: DiscoveryItem[]): {
  categories: string[];
  creators: DiscoveryItem[];
  pools: DiscoveryItem[];
};
export function filterExploreItems(
  items: DiscoveryItem[],
  search: ExploreSearch,
  publicItems?: DiscoveryItem[],
): DiscoveryItem[];
export function relatedArticles(
  items: DiscoveryItem[],
  item: DiscoveryItem,
  limit?: number,
): DiscoveryItem[];
