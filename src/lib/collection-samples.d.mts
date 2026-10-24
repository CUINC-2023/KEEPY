export interface CollectionTheme {
  cardStories?: { "zh-TW": string; en: string }[];
  coverTone?: "orbit" | "garden" | "tide";
  composition?: "round" | "steps" | "waves" | "triangles" | "bars" | "dots";
  id: string;
  version: number;
  synthetic: boolean;
  title: { "zh-TW": string; en: string };
  story: { "zh-TW": string; en: string };
  guide: { "zh-TW": string; en: string };
  bio: { "zh-TW": string; en: string };
  badge: { "zh-TW": string; en: string };
  source: { "zh-TW": string; en: string };
  materialReferences: string[];
}
export const COLLECTION_THEMES: CollectionTheme[];
export const CREATOR_CONTENT_TEMPLATES: {
  id: string;
  seriesId: string;
  version: number;
  synthetic: true;
  workIntro: { "zh-TW": string; en: string };
  process: { "zh-TW": string; en: string }[];
  questions: { "zh-TW": string; en: string }[];
  confirmedAnswers: null;
  collaborator: null;
  shootDate: null;
  source: { "zh-TW": string; en: string };
}[];
export function collectionSampleCatalog(base: Record<string, unknown>): Record<string, unknown>;
