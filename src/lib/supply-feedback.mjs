const locales = ["zh-TW", "en"];
export function feedbackTargets(value) {
  const rows = [];
  const add = (kind, id, field, bilingual = false) => {
    for (const locale of bilingual ? locales : [""]) rows.push({ kind, id, field, locale });
  };
  for (const field of Object.keys(value?.copy ?? {})) add("copy", "", field, true);
  for (const field of ["application", "cardNotes", "promotion", "retrospective"])
    if (value?.[field]) add("copy", "", field, true);
  for (const field of ["releaseAt", "withdrawAt", "partnerId", "creatorId", "poolId", "articleIds"])
    if (value && field in value) add("copy", "", field);
  for (const a of value?.editorial?.articles ?? []) {
    for (const f of ["title", "summary"]) add("article", a.id, f, true);
    for (const f of ["blocks", "category"]) add("article", a.id, f);
  }
  if (value?.editorial) {
    add("copy", "", "creatorIntro", true);
    add("copy", "", "questions");
  }
  for (const m of value?.materials ?? []) {
    for (const f of [
      "ref",
      "version",
      "source",
      "evidence",
      "startAt",
      "endAt",
      "cardId",
      "website",
      "social",
      "print",
    ])
      add("material", m.id, f);
    add("material", m.id, "alt", true);
  }
  return rows;
}
export function feedbackIdentity(target) {
  return [target.kind, target.id, target.field, target.locale].join("|");
}
export function resolveFeedback(value, target) {
  if (!feedbackTargets(value).some((t) => feedbackIdentity(t) === feedbackIdentity(target)))
    return { exists: false };
  const object =
    target.kind === "article"
      ? value.editorial.articles.find((a) => a.id === target.id)
      : target.kind === "material"
        ? value.materials.find((m) => m.id === target.id)
        : value;
  let found;
  if (target.kind === "material" && ["website", "social", "print"].includes(target.field))
    found = object.uses[target.field];
  else if (target.kind === "copy") {
    found = object.copy?.[target.field] ?? object.editorial?.[target.field] ?? object[target.field];
  } else found = object[target.field];
  return { exists: true, value: target.locale ? found?.[target.locale] : found };
}
export function feedbackLocation(target) {
  const step =
    target.kind === "material"
      ? 2
      : target.kind === "article"
        ? 3
        : ({
            partnerId: 1,
            creatorId: 1,
            poolId: 1,
            application: 1,
            cardNotes: 4,
            promotion: 6,
            retrospective: 7,
            releaseAt: 5,
            withdrawAt: 5,
          }[target.field] ?? 3);
  return {
    step,
    item: {
      field: target.field === "ref" ? "reference" : target.field,
      locale: target.locale,
      materialId: target.kind === "copy" ? "" : target.id,
    },
  };
}
export function validateFeedback(value, rows) {
  if (!Array.isArray(rows) || rows.length > 10) return false;
  const allowed = new Set(feedbackTargets(value).map(feedbackIdentity));
  return rows.every(
    (row) =>
      row &&
      typeof row === "object" &&
      !Array.isArray(row) &&
      Object.keys(row).sort().join() === ["field", "id", "kind", "locale", "note"].sort().join() &&
      ["kind", "id", "field", "locale", "note"].every((k) => typeof row[k] === "string") &&
      row.note.trim().length > 0 &&
      row.note.length <= 500 &&
      allowed.has(feedbackIdentity(row)),
  );
}
