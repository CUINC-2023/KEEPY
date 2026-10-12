import type { CollectionMe, CollectionCatalogue } from "./collection-store";
export const PLAYER_LEVEL_RULES: Readonly<
  Record<
    "A" | "B",
    Readonly<{ id: string; designXP: number; albumXP: number; step: number; maxLevel: number }>
  >
>;
export interface PlayerLevelPreview {
  status: "local-preview";
  ruleVersion: string;
  candidate: string;
  actorId: string;
  visibilityKey: string;
  catalogueVersion: number;
  rawXP: number;
  xp: number;
  cap: number;
  level: number;
  step: number;
  nextXP: number | null;
  cappedXP: number;
  designs: number;
  albums: number;
  sources: { kind: string; id: string; xp: number }[];
}
export function previewPlayerLevel(
  owner: CollectionMe,
  catalogue: CollectionCatalogue,
  candidate?: "A" | "B",
): PlayerLevelPreview | null;
