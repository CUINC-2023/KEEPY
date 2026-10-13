import type { PlayQuestion } from "./play-questions.mjs";
export interface MistakesProjection {
  schema: 1;
  source: string;
  actorId: string;
  visibilityKey: string;
  page: number;
  pages: number;
  pageSize: 20;
  total: number;
  legacyWithoutReview: number;
  historyLimited: boolean;
  rows: {
    resultId: string;
    at: string;
    mode: "knowledge" | "observation";
    difficulty: string;
    ruleVersion: string;
    question: PlayQuestion & { selected: string };
  }[];
}
export function validQuizReview(v: unknown): boolean;
export function currentQuizQuestion(saved: unknown, current: unknown): boolean;
export function isMistakesProjection(v: unknown): v is MistakesProjection;
