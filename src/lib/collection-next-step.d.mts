import type { CollectionMe } from "./collection-store";
export function nextCollectionStep(owner: CollectionMe): {
  kind: "explore" | "goals" | "albums" | "showcase";
  reason: string;
};
