import type { CollectionCatalogue, Bilingual } from "./collection-store";
import type { CollectionTheme, CREATOR_CONTENT_TEMPLATES } from "./collection-samples.mjs";
export interface CatalogueHealth {
  playChecks?: {
    quizReviews?: {
      checked: number;
      incompatible: number;
      legacyWithoutReview: number;
      unavailableSources: number;
      truncated: boolean;
      readOnly: true;
      applied: false;
    };
    checked: number;
    incompatible: number;
    missingReferences: number;
    readOnly: true;
    applied: false;
    autoRepair: false;
  };
  playPacks?: import("./play-packs.mjs").PlayPackHealth;
  profileChecks?: {
    checked: number;
    incompatible: number;
    repairable: number;
    removableSelections: number;
    readOnly: true;
    applied: false;
  };
  schema: 1;
  ruleVersion: number;
  visibilityKey: string;
  source: string;
  pools: {
    poolId: string;
    title: Bilingual;
    definitions: number;
    declared: number;
    complete: boolean;
  }[];
  templates: {
    id: string;
    version: number;
    complete: boolean;
    published: false;
    missingTranslations: string[];
    materialReviewRequired: boolean;
  }[];
  issues: string[];
  creatorTemplates: {
    id: string;
    seriesId: string;
    version: number;
    complete: boolean;
    missing: string[];
    published: false;
  }[];
  readOnly: true;
  publicationApproval: false;
}
export function inspectCatalogue(
  catalogue: CollectionCatalogue,
  themes: CollectionTheme[],
  creatorTemplates?: typeof CREATOR_CONTENT_TEMPLATES,
): CatalogueHealth;
