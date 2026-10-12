import type { SupplyPackage } from "./supply-store";
export interface TaskFilters {
  q: string;
  creator: string;
  status: string;
  sort: string;
}
export function taskRows(
  packages: SupplyPackage[],
  filters?: Partial<TaskFilters>,
  locale?: "zh-TW" | "en",
): SupplyPackage[];
