import type { CollectionMe } from "./collection-store";
import type { ParticipationMe, ParticipationPublic } from "./participation-store";
export const PLATFORM_LEVEL_RULE: Readonly<{ id: string; cap: number; kinds: readonly string[] }>;
export interface PlatformLevelPreview {
  reasons: { id: string; code: string; snapshotVersion: number | null }[];
  status: "local-preview";
  ruleVersion: string;
  actorId: string;
  participationVersion: number;
  completed: number;
  cap: number;
  stage: number;
  sources: { id: string; ruleVersion: number; completedAt: string }[];
}
export function previewPlatformLevel(
  owner: ParticipationMe,
  collection: CollectionMe,
  participation: ParticipationPublic,
): PlatformLevelPreview | null;
