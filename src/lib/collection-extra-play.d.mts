export const PUZZLE_RULE_VERSION: string;
export const SEQUENCE_RULE_VERSION: string;
export interface SequenceEvent {
  type: string;
  id?: string;
}
export interface SequenceRound {
  schema: 1;
  mode: "sequence";
  ruleVersion: string;
  difficulty: string;
  seed: number;
  sequence: string[];
  stage: number;
  input: number;
  moves: number;
  mistakes: number;
  hintsUsed: number;
  showSequence: boolean;
  paused: boolean;
  complete: boolean;
  lastCorrect: boolean | null;
  events: SequenceEvent[];
}
export function sequenceStart(ids: string[], difficulty?: string, seed?: number): SequenceRound;
export function sequenceAction(state: SequenceRound, event: SequenceEvent): SequenceRound;
export interface PuzzleEvent {
  type: string;
  from?: number;
  to?: number;
}
export interface PuzzleRound {
  schema: 1;
  mode: "puzzle";
  ruleVersion: string;
  difficulty: string;
  seed: number;
  cardId: string;
  size: number;
  tiles: number[];
  moves: number;
  hintsUsed: number;
  showHint: boolean;
  paused: boolean;
  complete: boolean;
  events: PuzzleEvent[];
}
export function puzzleStart(ids: string[], difficulty?: string, seed?: number): PuzzleRound;
export function puzzleAction(state: PuzzleRound, event: PuzzleEvent): PuzzleRound;
