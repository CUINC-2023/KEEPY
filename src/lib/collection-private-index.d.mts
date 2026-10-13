import type { CollectionMe, CollectionCatalogue } from "./collection-store";
export interface PrivateIndexPreference {
  schema: 1;
  q: string;
  kind: string;
  sort: string;
  page: number;
}
export const PRIVATE_INDEX_DEFAULT: PrivateIndexPreference;
export function validPrivateIndexPreference(v: unknown): boolean;
export function privateCollectionIndex(
  me: CollectionMe,
  catalogue: CollectionCatalogue,
  p?: PrivateIndexPreference,
  locale?: string,
): {
  total: number;
  pages: number;
  page: number;
  rows: { kind: string; id: string; title: string; summary: string; sourceVersion: number }[];
};
