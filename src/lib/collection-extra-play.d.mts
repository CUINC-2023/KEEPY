export const PUZZLE_RULE_VERSION: string;
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
