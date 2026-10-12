import type { Bilingual } from "./collection-store";
export interface PlayContentPack {
  id: string;
  version: number;
  synthetic: true;
  published: false;
  title: Bilingual;
  source: Bilingual;
  websiteUse: "local-sample-only";
  socialUse: "unconfirmed";
  printUse: "unconfirmed";
  puzzleMaterials?: {
    id: string;
    ref: "geometry-grid";
    size: number;
    sourceRef: { templateId: string; version: number };
    purpose: "local-sample-only";
    alt: Bilingual;
  }[];
  questions: {
    id: string;
    mode: string;
    difficulty: string;
    prompt: Bilingual;
    options: { id: string; label: Bilingual }[];
    answer: string;
    explanation: Bilingual;
    sourceRef: { templateId: string; version: number; chapter: number };
    material: { ref: string; count: number };
  }[];
}
export const PLAY_CONTENT_PACKS: PlayContentPack[];
export function playPackIssues(pack: unknown): string[];
export interface PlayPackHealth {
  schema: 1;
  readOnly: true;
  publicationApproval: false;
  packs: {
    id: string;
    version: number | null;
    questionCount: number;
    issues: string[];
    sharedQuestionLayouts: number;
  }[];
}
export function playPackHealth(packs?: unknown[]): PlayPackHealth;
