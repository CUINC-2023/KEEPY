import type { SupplyPackage } from "./supply-store";
export function supplyWorkRows(
  packages: SupplyPackage[],
  query?: string,
  filter?: string,
): SupplyPackage[];
