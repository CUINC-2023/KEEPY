const languages = ["zh-TW", "en"];
const validDate = (s) =>
  typeof s === "string" &&
  /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?(?:Z|[+-]\d\d:\d\d)$/.test(s) &&
  Number.isFinite(Date.parse(s));
const filled = (s) => typeof s === "string" && !!s.trim();
export function supplyChecklist(value, authorityIssues = []) {
  const v = value ?? {},
    rows = Array.from({ length: 7 }, (_, i) => ({
      step: i + 1,
      complete: false,
      requiredForSubmission: i !== 6,
      missing: [],
      pending: [],
    }));
  const add = (i, field, materialId = "", locale = "") =>
    rows[i].missing.push({ field, materialId, locale });
  const pair = (i, field, obj) =>
    languages.forEach((l) => {
      if (!filled(obj?.[l])) add(i, field, "", l);
    });
  for (const k of ["partnerId", "creatorId", "poolId"]) if (!filled(v[k])) add(0, k);
  for (const k of ["creator-role", "cooperation", "contract"])
    if (authorityIssues.includes(k)) add(0, k);
  pair(0, "application", v.application);
  if (!v.materials?.length) add(1, "materials");
  for (const m of v.materials ?? []) {
    if (!["season-hero", "text-only"].includes(m.ref)) add(1, "reference", m.id);
    if (!Number.isInteger(m.version) || m.version < 1) add(1, "version", m.id);
    for (const k of ["source", "evidence"]) if (!filled(m[k])) add(1, k, m.id);
    languages.forEach((l) => {
      if (!filled(m.alt?.[l])) add(1, "alt", m.id, l);
    });
    if (m.uses?.website !== "sample-confirmed") add(1, "website", m.id);
    for (const k of ["social", "print"])
      if (m.uses?.[k] === "pending")
        rows[1].pending.push({ field: k, materialId: m.id, locale: "" });
    for (const k of ["startAt", "endAt"]) if (!validDate(m[k])) add(1, k, m.id);
    if (validDate(m.startAt) && validDate(m.endAt) && Date.parse(m.startAt) >= Date.parse(m.endAt))
      add(1, "material-order", m.id);
    if (
      validDate(v.releaseAt) &&
      validDate(v.withdrawAt) &&
      validDate(m.startAt) &&
      validDate(m.endAt) &&
      (Date.parse(m.startAt) > Date.parse(v.releaseAt) ||
        Date.parse(m.endAt) < Date.parse(v.withdrawAt))
    )
      add(1, "coverage", m.id);
  }
  for (const k of ["title", "summary", "story", "goal", "endPolicy"]) pair(2, k, v.copy?.[k]);
  pair(3, "cardNotes", v.cardNotes);
  for (const k of ["releaseAt", "withdrawAt"]) if (!validDate(v[k])) add(4, k);
  if (
    validDate(v.releaseAt) &&
    validDate(v.withdrawAt) &&
    Date.parse(v.releaseAt) >= Date.parse(v.withdrawAt)
  )
    add(4, "publication-order");
  pair(5, "promotion", v.promotion);
  pair(6, "retrospective", v.retrospective);
  if (v.editorial) {
    pair(0, "creatorIntro", v.editorial.creatorIntro);
    v.editorial.questions.forEach((q, i) => pair(0, "question-" + (i + 1), q));
    if (!v.editorial.articles.length) add(2, "articles");
    for (const a of v.editorial.articles) {
      for (const k of ["title", "summary"])
        languages.forEach((l) => {
          if (!filled(a[k]?.[l])) add(2, k, a.id, l);
        });
      if (!a.blocks.some((b) => b.type === "paragraph")) add(2, "body", a.id);
      a.blocks.forEach((b, i) => {
        if (b.type === "image" && !v.materials?.some((m) => m.id === b.materialId))
          add(2, "material-block-" + (i + 1), a.id);
      });
      a.blocks.forEach((b, i) =>
        languages.forEach((l) => {
          if (!filled((b.type === "image" ? b.caption : b.text)?.[l]))
            add(2, "block-" + (i + 1), a.id, l);
        }),
      );
    }
  }
  for (const r of rows) r.complete = r.missing.length === 0;
  return rows;
}
