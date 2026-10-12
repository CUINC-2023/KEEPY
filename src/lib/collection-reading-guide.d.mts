export const READING_GUIDES: {
  id: string;
  title: { "zh-TW": string; en: string };
  steps: { "zh-TW": string; en: string }[];
}[];
export interface ReadingGuide {
  schema: 1;
  template: string;
  poolId: string;
  step: number;
}
export function validReadingGuide(value: unknown): boolean;
