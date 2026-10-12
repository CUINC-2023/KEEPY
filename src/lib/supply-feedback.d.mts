import type { SupplyValue } from "./supply-store";
export interface FeedbackTarget {
  kind: "article" | "material" | "copy";
  id: string;
  field: string;
  locale: string;
}
export interface ReviewFeedback extends FeedbackTarget {
  note: string;
}
export function feedbackTargets(value: SupplyValue): FeedbackTarget[];
export function feedbackIdentity(target: FeedbackTarget): string;
export function resolveFeedback(
  value: SupplyValue,
  target: FeedbackTarget,
): { exists: boolean; value?: unknown };
export function feedbackLocation(target: FeedbackTarget): {
  step: number;
  item: { field: string; materialId: string; locale: string };
};
export function validateFeedback(value: SupplyValue, rows: unknown): boolean;
