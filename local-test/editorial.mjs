// Optional, review-bound editorial extension. Old supply values remain valid.
const languages = ["zh-TW", "en"];
const keys = (v, expected) =>
  v &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  Object.keys(v).sort().join() === expected.slice().sort().join();
const pair = (v) =>
  keys(v, languages) &&
  languages.every(
    (l) => typeof v[l] === "string" && v[l].length <= 12000 && !/<\s*\/?[a-z][^>]*>/i.test(v[l]),
  );
export function validateEditorial(d, value, packageId) {
  if (value.editorial === undefined) return;
  const fail = (message) => {
    throw new d.constructor.DiscoveryError(422, "editorial", message);
  };
  const e = value.editorial;
  if (!Array.isArray(value.materials) || !Array.isArray(value.articleIds))
    fail("Materials and article relations required");
  if (
    !keys(e, ["creatorIntro", "questions", "articles"]) ||
    !pair(e.creatorIntro) ||
    !Array.isArray(e.questions) ||
    e.questions.length !== 4 ||
    !e.questions.every(pair) ||
    !Array.isArray(e.articles) ||
    e.articles.length > 8
  )
    fail("Invalid bilingual editorial package");
  const ids = new Set();
  for (const a of e.articles) {
    if (
      !keys(a, ["id", "category", "title", "summary", "blocks"]) ||
      typeof a.id !== "string" ||
      !/^local-[a-z0-9-]{1,90}$/.test(a.id) ||
      ids.has(a.id) ||
      !["design", "guide", "interview", "behind-scenes"].includes(a.category) ||
      !pair(a.title) ||
      !pair(a.summary) ||
      !Array.isArray(a.blocks) ||
      a.blocks.length > 40
    )
      fail("Invalid article fields or independent ID");
    ids.add(a.id);
    if (!value.articleIds.includes(a.id)) fail("Own article relation required");
    const existing = d.document("discovery").data.items.find((i) => i.id === a.id);
    if (existing && existing.supplyPackId !== packageId)
      fail("Article ID already belongs to other content");
    for (const b of a.blocks) {
      if (["heading", "paragraph"].includes(b.type)) {
        if (!keys(b, ["type", "text"]) || !pair(b.text)) fail("Invalid text block");
      } else if (b.type === "image") {
        if (
          !keys(b, ["type", "materialId", "caption"]) ||
          !pair(b.caption) ||
          !value.materials.some((m) => m.id === b.materialId)
        )
          fail("Image must reference an own allowlisted material");
      } else fail("Only heading, paragraph and material image blocks are accepted");
    }
  }
  // Also reserve IDs across drafts; no later publication can replace another owner's draft.
  for (const row of d.db.prepare("SELECT payload FROM documents WHERE id LIKE 'supply:%'").all()) {
    const p = JSON.parse(row.payload);
    if (
      p.id !== packageId &&
      p.revisions.some((r) => r.value.editorial?.articles.some((a) => ids.has(a.id)))
    )
      fail("Article ID reserved by another package");
  }
}
export function editorialIssues(v) {
  const e = v.editorial;
  if (!e) return [];
  const issues = [],
    required = (p, name) =>
      languages.forEach((l) => {
        if (!p?.[l]?.trim()) issues.push(name + ":" + l);
      });
  required(e.creatorIntro, "creatorIntro");
  e.questions.forEach((q, i) => required(q, "question-" + (i + 1)));
  if (!e.articles.length) issues.push("articles");
  for (const a of e.articles) {
    required(a.title, a.id + ":title");
    required(a.summary, a.id + ":summary");
    if (!a.blocks.some((b) => b.type === "paragraph")) issues.push(a.id + ":body");
    a.blocks.forEach((b, i) =>
      required(b.type === "image" ? b.caption : b.text, a.id + ":block-" + (i + 1)),
    );
  }
  return issues;
}
export function publishEditorial(d, content, p, v, revision) {
  // Add independent discovery records; original catalogue/editorial records stay untouched.
  const active = content.items.find(
    (i) =>
      i.status === "published" &&
      i.supplyPackId &&
      i.supplyPackId !== p.id &&
      i.published?.kind === "series" &&
      i.published.referenceId === p.poolId,
  );
  if (active)
    throw new d.constructor.DiscoveryError(
      409,
      "editorial",
      "Withdraw the other package before replacing this series",
    );
  const original = content.items.find(
    (i) => i.draft.kind === "series" && i.draft.referenceId === p.poolId,
  );
  const creator = content.items.find(
    (i) => i.draft.kind === "creator" && i.draft.referenceId === p.creatorId,
  );
  const base = {
    ...structuredClone(original.draft),
    creatorIds: [p.creatorId],
    poolIds: [p.poolId],
    order: -22,
    releaseAt: v.releaseAt,
    withdrawAt: v.withdrawAt,
  };
  const entries = [
    {
      id: p.id + "-series",
      value: {
        ...base,
        copy: {
          ...base.copy,
          ...v.copy,
          body: v.copy.story,
          period: {
            "zh-TW": "僅本機預覽期間，正式合作與檔期尚未確認。",
            en: "Local preview window only; real collaboration and dates remain unconfirmed.",
          },
        },
        promotion: v.promotion,
        retrospective: v.retrospective,
        materials: structuredClone(v.materials),
      },
    },
    {
      id: p.id + "-creator",
      value: {
        ...base,
        kind: "creator",
        referenceId: p.creatorId,
        category: "guide",
        copy: {
          ...structuredClone(creator.draft.copy),
          summary: v.editorial.creatorIntro,
          body: v.editorial.creatorIntro,
          story: {
            "zh-TW": "訪談題綱，真人回答尚未提供。",
            en: "Interview outline; real answers have not been supplied.",
          },
        },
        questions: v.editorial.questions,
        materials: [],
      },
    },
    ...v.editorial.articles.map((a) => ({
      id: a.id,
      value: {
        ...base,
        kind: "article",
        referenceId: "",
        category: a.category,
        copy: {
          ...structuredClone(base.copy),
          title: a.title,
          summary: a.summary,
          body: Object.fromEntries(
            languages.map((l) => [
              l,
              a.blocks
                .filter((b) => b.type === "paragraph")
                .map((b) => b.text[l])
                .join("\n\n"),
            ]),
          ),
        },
        blocks: a.blocks.map((b) =>
          b.type === "image"
            ? { ...b, material: structuredClone(v.materials.find((m) => m.id === b.materialId)) }
            : b,
        ),
        materials: [],
      },
    })),
  ];
  for (const entry of entries) {
    let item = content.items.find((i) => i.id === entry.id);
    if (item && item.supplyPackId !== p.id)
      throw new d.constructor.DiscoveryError(
        409,
        "editorial",
        "Independent ID collision; no existing content was overwritten",
      );
    if (!item) {
      item = { id: entry.id, draft: entry.value, published: null };
      content.items.push(item);
    }
    item.draft = entry.value;
    item.published = {
      ...structuredClone(entry.value),
      revision,
      publishedAt: d.at(),
      sourcePackId: p.id,
      sourceRevision: p.draftRevision,
    };
    item.supplyPackId = p.id;
    item.status = "published";
  }
  // Removed articles become archived, retaining their published snapshot and histories.
  for (const item of content.items.filter((i) => i.supplyPackId === p.id))
    if (!entries.some((e) => e.id === item.id)) item.status = "archived";
}
