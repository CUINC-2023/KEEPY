import type { PracticeItem } from "./play-practice.mjs";
export const PRACTICE_PRESETS: readonly { id: string; title: { "zh-TW": string; en: string } }[];
export function practicePreset(id: unknown): PracticeItem[] | null;
