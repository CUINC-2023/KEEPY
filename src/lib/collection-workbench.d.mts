import type { CollectionMe, CollectionCard } from "./collection-store";
export interface WorkbenchPreference {
  schema: 1;
  q: string;
  poolId: string;
  rarity: string;
  mode: string;
  sort: string;
  page: number;
}
export const WORKBENCH_DEFAULT: WorkbenchPreference;
export function validWorkbench(p: unknown): p is WorkbenchPreference;
export function collectionWorkbench(
  me: CollectionMe,
  p?: WorkbenchPreference,
): {
  total: number;
  page: number;
  pages: number;
  rows: (CollectionCard & { count: number; everAcquired: boolean })[];
};
