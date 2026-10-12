import type { CollectionMe, CollectionCatalogue, Bilingual } from "./collection-store";
export interface ThemeJourney {
  status: "local-preview";
  ruleVersion: string;
  catalogueVersion: number;
  completed: number;
  nextPoolId: string | null;
  rewards: false;
  chapters: {
    poolId: string;
    title: Bilingual;
    owned: number;
    total: number;
    complete: boolean;
    stage: string;
    earnedRecordAt: string | null;
  }[];
}
export function previewThemeJourney(
  owner: CollectionMe,
  catalogue: CollectionCatalogue,
): ThemeJourney | null;
