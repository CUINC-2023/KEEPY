export interface SupplyDifference {
  path: string;
  kind: "added" | "changed" | "removed";
  before: string | null;
  after: string | null;
}
export function supplyDiff(before: unknown, after: unknown): SupplyDifference[];
