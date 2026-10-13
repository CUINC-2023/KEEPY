export interface PracticeItem {
  mode: string;
  difficulty: string;
  hints?: "none" | "allowed";
}
export interface PracticeProjection {
  schema: 1;
  ruleVersion: string;
  items: PracticeItem[];
  startedAt: string;
  paused: boolean;
  completed: number;
  invalidated: boolean;
}
export function validPracticeItems(value: unknown): boolean;
export function validPracticeStored(value: unknown): boolean;
export function validPracticeProjection(value: unknown): boolean;
export function practiceRuleVersion(items: unknown): string;
export function practiceResultMatches(item: PracticeItem, result: unknown): boolean;
