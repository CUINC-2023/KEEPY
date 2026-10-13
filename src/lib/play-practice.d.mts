export interface PracticeItem {
  mode: string;
  difficulty: string;
  hints?: "none" | "allowed";
  rounds?: number;
}
export interface PracticeProjection {
  schema: 1;
  ruleVersion: string;
  items: PracticeItem[];
  startedAt: string;
  paused: boolean;
  completed: number;
  invalidated: boolean;
  roundSummaries?: {
    position: number;
    mode: string;
    difficulty: string;
    ruleVersion: string;
    correct: number;
    total: number;
  }[];
}
export function validPracticeItems(value: unknown): boolean;
export function validPracticeStored(value: unknown): boolean;
export function validPracticeProjection(value: unknown): boolean;
export function practiceRuleVersion(items: unknown): string;
export function practiceResultMatches(item: PracticeItem, result: unknown): boolean;
export function practiceRoundCount(items: PracticeItem[]): number;
export function practiceStep(
  items: PracticeItem[],
  completed: number,
): (PracticeItem & { index: number; round: number }) | null;
