export interface CreatorProfile {
  schema: 1;
  displayName: Record<"zh-TW" | "en", string>;
  tagline: Record<"zh-TW" | "en", string>;
  intro: Record<"zh-TW" | "en", string>;
  links: string[];
}
export interface CreatorProfileProjection {
  actorId: string;
  version: number;
  data: CreatorProfile;
  synthetic: true;
  published: false;
}
export function emptyCreatorProfile(): CreatorProfile;
export function validCreatorProfile(value: unknown): value is CreatorProfile;
export function isCreatorProfileProjection(value: unknown): value is CreatorProfileProjection;
