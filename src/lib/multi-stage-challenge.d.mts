import type { CollectionMe, CollectionCatalogue } from "./collection-store";
export function previewMultiStage(
  owner: CollectionMe,
  catalogue: CollectionCatalogue,
): null | {
  status: "local-preview";
  ruleVersion: string;
  paused: boolean;
  catalogueVersion: number;
  rewards: false;
  reason: string;
  stages: { id: string; met: boolean; prerequisite: string | null }[];
};
