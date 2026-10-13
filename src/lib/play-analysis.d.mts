export interface PlayAnalysis {
  schema: 1;
  coverage: string;
  truncated: boolean;
  groups: {
    mode: string;
    difficulty: string;
    ruleVersion: string;
    configuration: string;
    hintPolicy?: "allowed" | "none" | "legacy" | "usage-only";
    hintsUsed: number | null;
    rounds: number;
    correct: number;
    total: number;
    bestMoves: number | null;
  }[];
}
export function validPlayAnalysis(value: unknown): boolean;
