const bilingual = (value) =>
  !!value &&
  ["zh-TW", "en"].every((lang) => typeof value[lang] === "string" && value[lang].trim().length > 0);
export function inspectCatalogue(catalogue, themes, creatorTemplates = []) {
  const duplicate = (values) => values.length !== new Set(values).size;
  const poolIds = new Set(catalogue.pools.map((p) => p.poolId));
  const issues = [];
  if (duplicate(catalogue.pools.map((p) => p.poolId))) issues.push("duplicate-public-pool");
  if (duplicate(catalogue.cards.map((c) => c.cardId))) issues.push("duplicate-public-design");
  if (catalogue.cards.some((c) => !poolIds.has(c.poolId))) issues.push("orphan-public-design");
  const pools = catalogue.pools.map((p) => {
    const definitions = new Set(
      catalogue.cards.filter((c) => c.poolId === p.poolId).map((c) => c.cardId),
    ).size;
    return {
      poolId: p.poolId,
      title: p.title,
      definitions,
      declared: p.visibleDesigns,
      complete: bilingual(p.title) && definitions === p.visibleDesigns && definitions > 0,
    };
  });
  if (pools.some((p) => !p.complete)) issues.push("incomplete-public-album");
  const templates = themes.map((t) => ({
    id: t.id,
    version: t.version,
    complete:
      t.synthetic === true &&
      Number.isSafeInteger(t.version) &&
      t.version > 0 &&
      [t.title, t.story, t.guide, t.bio, t.badge, t.source].every(bilingual) &&
      (t.cardStories === undefined ||
        (Array.isArray(t.cardStories) &&
          t.cardStories.length > 0 &&
          t.cardStories.length <= 12 &&
          t.cardStories.every(bilingual))) &&
      Array.isArray(t.materialReferences),
    missingTranslations: ["title", "story", "guide", "bio", "badge", "source"]
      .filter((field) => !bilingual(t[field]))
      .concat(
        t.cardStories !== undefined &&
          (!Array.isArray(t.cardStories) ||
            !t.cardStories.length ||
            !t.cardStories.every(bilingual))
          ? ["cardStories"]
          : [],
      ),
    materialReviewRequired: Array.isArray(t.materialReferences) && t.materialReferences.length > 0,
    published: false,
  }));
  if (duplicate(templates.map((t) => t.id))) issues.push("duplicate-template");
  if (templates.some((t) => !t.complete)) issues.push("incomplete-template");
  const themeIds = new Set(themes.map((t) => t.id));
  const creatorChecks = creatorTemplates.map((t) => {
    const missing = [];
    if (!themeIds.has(t.seriesId)) missing.push("series-reference");
    if (t.synthetic !== true || !Number.isSafeInteger(t.version) || t.version < 1)
      missing.push("sample-version");
    for (const field of ["workIntro", "source"]) if (!bilingual(t[field])) missing.push(field);
    for (const [field, min, max] of [
      ["process", 1, 12],
      ["questions", 4, 4],
    ])
      if (
        !Array.isArray(t[field]) ||
        t[field].length < min ||
        t[field].length > max ||
        !t[field].every(bilingual)
      )
        missing.push(field);
    if (t.confirmedAnswers !== null || t.collaborator !== null || t.shootDate !== null)
      missing.push("unconfirmed-facts");
    return {
      id: t.id,
      seriesId: t.seriesId,
      version: t.version,
      complete: missing.length === 0,
      missing,
      published: false,
    };
  });
  if (duplicate(creatorChecks.map((t) => t.id))) issues.push("duplicate-creator-template");
  if (creatorChecks.some((t) => !t.complete)) issues.push("incomplete-creator-template");
  return {
    schema: 1,
    ruleVersion: catalogue.version,
    visibilityKey: catalogue.visibilityKey,
    source: "current-public-catalogue-and-fictional-templates",
    pools,
    templates,
    creatorTemplates: creatorChecks,
    issues,
    readOnly: true,
    publicationApproval: false,
  };
}
