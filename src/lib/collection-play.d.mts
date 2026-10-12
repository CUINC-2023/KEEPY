export const PLAY_RULE_VERSION: string;
export const MEMORY_RULE_VERSION: string;
export interface MemoryConfig {
  schema: 1;
  variant: "practice" | "limit";
  allowHints: boolean;
}
export function validMemoryConfig(value: unknown): boolean;
export const PLAY_MODES: string[];
export const PLAY_DIFFICULTIES: string[];
export interface MemoryRound {
  schema: 1;
  ruleVersion: string;
  mode: "memory";
  inputIds: string[];
  difficulty: string;
  seed: number;
  cardIds: string[];
  deck: string[];
  open: number[];
  matched: number[];
  moves: number;
  paused: boolean;
  complete: boolean;
  events: { type: string; index?: number }[];
  memoryConfig?: MemoryConfig;
  hintsUsed?: number;
  hintIndexes?: number[];
  moveLimit?: number | null;
  failed?: boolean;
}
export function shuffle<T>(items: T[], seed: number): T[];
export function memoryStart(
  ids: string[],
  difficulty?: string,
  seed?: number,
  config?: MemoryConfig | null,
): MemoryRound;
export function memoryAction(
  state: MemoryRound,
  event: { type: string; index?: number },
): MemoryRound;
export function replayMemory(proof: {
  cardIds: string[];
  difficulty: string;
  seed: number;
  events: MemoryRound["events"];
  memoryConfig?: MemoryConfig;
}): {
  mode: string;
  difficulty: string;
  ruleVersion: string;
  moves: number;
  correct: number;
  total: number;
};
