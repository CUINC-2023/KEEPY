import { COLLECTION_THEMES, CREATOR_CONTENT_TEMPLATES } from "./collection-samples.mjs";
/** Explicit text-only reuse. Identity, periods, materials and rights are preserved. */
export function reuseSupplyTemplate(value, templateId, includeCreator = false) {
  const theme = COLLECTION_THEMES.find((t) => t.id === templateId);
  if (!theme?.synthetic || !value?.copy)
    throw new Error("Known fictional template and draft required");
  const creator = CREATOR_CONTENT_TEMPLATES.find((t) => t.seriesId === templateId);
  if (includeCreator && (!creator || !value.editorial))
    throw Error("Existing editorial and known creator template required");
  return {
    ...value,
    copy: {
      ...value.copy,
      story: structuredClone(theme.story),
      goal: structuredClone(theme.guide),
    },
    ...(includeCreator
      ? {
          editorial: {
            ...value.editorial,
            creatorIntro: structuredClone(creator.workIntro),
            questions: structuredClone(creator.questions),
          },
        }
      : {}),
  };
}
