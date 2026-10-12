import type { CollectionMe, CollectionCatalogue, Bilingual } from "./collection-store";
export interface PlayQuestion {
  id: string;
  cardId: string;
  poolId: string;
  cardVersion: number;
  sourceVersion: number;
  source: string;
  prompt: Bilingual;
  options: { id: string; label: Bilingual }[];
  answer: string;
  explanation: Bilingual;
}
export interface QuizRound {
  schema: 1;
  ruleVersion: string;
  difficulty: string;
  seed: number;
  questions: PlayQuestion[];
  answers: string[];
  paused: boolean;
  complete: boolean;
}
export function playQuestions(
  owner: CollectionMe,
  catalogue: CollectionCatalogue,
  mode?: string,
): PlayQuestion[];
export function quizStart(questions: PlayQuestion[], difficulty?: string, seed?: number): QuizRound;
export function quizAnswer(state: QuizRound, answer: string): QuizRound;
