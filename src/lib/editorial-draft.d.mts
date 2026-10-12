import type { Editorial } from "./supply-store";
export const ARTICLE_CATEGORIES: string[];
export function blankArticle(category: string, id: string): Editorial["articles"][number];
export function moveItem<T>(items: T[], index: number, delta: number): T[];
