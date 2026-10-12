import type { SupplyValue } from "./supply-store";
export interface SupplyCheckItem {
  field: string;
  materialId: string;
  locale: string;
}
export interface SupplyCheck {
  step: number;
  complete: boolean;
  requiredForSubmission: boolean;
  missing: SupplyCheckItem[];
  pending: SupplyCheckItem[];
}
export function supplyChecklist(value: SupplyValue, authorityIssues?: string[]): SupplyCheck[];
