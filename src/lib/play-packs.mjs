import { COLLECTION_THEMES } from "./collection-samples.mjs";
const bi = (zh, en) => ({ "zh-TW": zh, en });
export const PLAY_CONTENT_PACKS = COLLECTION_THEMES.filter(
  (t) =>
    t.id.startsWith("local-demo-121-") ||
    t.id.startsWith("local-demo-156-") ||
    t.id.startsWith("local-demo-176-"),
).map((t) => ({
  id: "play-pack-" + t.id,
  version: 1,
  synthetic: true,
  published: false,
  title: t.title,
  source: t.source,
  websiteUse: "local-sample-only",
  socialUse: "unconfirmed",
  printUse: "unconfirmed",
  ...(t.id.startsWith("local-demo-176-")
    ? {
        puzzleMaterials: [2, 3, 4].map((size) => ({
          id: t.id + "-puzzle-" + size,
          ref: "geometry-grid",
          size,
          sourceRef: { templateId: t.id, version: t.version },
          purpose: "local-sample-only",
          alt: bi(
            "本機幾何拼圖示意：" + size + "×" + size,
            "Local geometric puzzle sample: " + size + "×" + size,
          ),
        })),
      }
    : {}),
  questions: [
    ...t.cardStories.map((s, i) => ({
      id: t.id + "-knowledge-" + i,
      mode: "knowledge",
      difficulty: "easy",
      prompt: bi(
        "這段範本文字屬於哪個故事章節？ " + s["zh-TW"],
        "Which sample story chapter contains this text? " + s.en,
      ),
      options: [0, 1, 2].map((n) => ({
        id: String(n + 1),
        label: bi("章節" + (n + 1), "Chapter " + (n + 1)),
      })),
      answer: String(i + 1),
      explanation: s,
      sourceRef: { templateId: t.id, version: t.version, chapter: i + 1 },
      material: { ref: "text-only", count: 0 },
    })),
    ...[1, 2, 3].map((n) => ({
      id: t.id + "-observation-" + n,
      mode: "observation",
      difficulty: "easy",
      prompt: bi(
        "觀察這個幾何示意版型，有幾個圓形？",
        "Observe this geometric sample layout: how many circles?",
      ),
      options: [1, 2, 3].map((m) => ({ id: String(m), label: bi(String(m), String(m)) })),
      answer: String(n),
      explanation: bi(
        "目前版型有" + n + "個圓形，來源為本機幾何圖文示意，不是真人照片。",
        "This layout has " +
          n +
          " circles, sourced from a local geometric sample, not a real photograph.",
      ),
      sourceRef: { templateId: t.id, version: t.version, chapter: n },
      material: { ref: "geometry-circles", count: n },
    })),
  ],
}));
const bilingual = (v) =>
  !!v && ["zh-TW", "en"].every((l) => typeof v[l] === "string" && v[l].trim());
export function playPackIssues(pack) {
  const issues = [];
  if (
    !pack ||
    pack.synthetic !== true ||
    pack.published !== false ||
    !Number.isSafeInteger(pack.version) ||
    pack.version < 1
  )
    issues.push("sample-version");
  if (!bilingual(pack?.title) || !bilingual(pack?.source)) issues.push("pack-translation");
  if (
    pack?.websiteUse !== "local-sample-only" ||
    pack?.socialUse !== "unconfirmed" ||
    pack?.printUse !== "unconfirmed"
  )
    issues.push("unconfirmed-use");
  const questions = Array.isArray(pack?.questions) ? pack.questions : [];
  if (
    pack?.puzzleMaterials !== undefined &&
    (!Array.isArray(pack.puzzleMaterials) ||
      pack.puzzleMaterials.length !== 3 ||
      new Set(pack.puzzleMaterials.map((m) => m?.id)).size !== 3 ||
      pack.puzzleMaterials.some(
        (m) =>
          !m ||
          Object.keys(m).sort().join() !== "alt,id,purpose,ref,size,sourceRef" ||
          typeof m.id !== "string" ||
          m.id.length > 128 ||
          m.ref !== "geometry-grid" ||
          ![2, 3, 4].includes(m.size) ||
          m.purpose !== "local-sample-only" ||
          !bilingual(m.alt) ||
          !COLLECTION_THEMES.some(
            (t) => t.id === m.sourceRef?.templateId && t.version === m.sourceRef?.version,
          ),
      ))
  )
    issues.push("puzzle-material");
  if (!questions.length || questions.length > 40) issues.push("question-count");
  if (new Set(questions.map((q) => q?.id)).size !== questions.length)
    issues.push("duplicate-question");
  for (const q of questions) {
    if (!q || typeof q !== "object") {
      issues.push("question-schema");
      continue;
    }
    if (
      !q ||
      !bilingual(q.prompt) ||
      !bilingual(q.explanation) ||
      !["knowledge", "observation"].includes(q.mode) ||
      !["easy", "standard", "hard"].includes(q.difficulty)
    )
      issues.push("question-translation-or-type");
    if (
      !Array.isArray(q?.options) ||
      q.options.length < 2 ||
      q.options.length > 6 ||
      new Set(q.options.map((o) => o?.id)).size !== q.options.length ||
      !q.options.every((o) => o && typeof o.id === "string" && bilingual(o.label)) ||
      !q.options.some((o) => o?.id === q.answer)
    )
      issues.push("answer-or-options");
    const theme = COLLECTION_THEMES.find((t) => t.id === q?.sourceRef?.templateId);
    if (
      !theme ||
      q.sourceRef.version !== theme.version ||
      !Number.isInteger(q.sourceRef.chapter) ||
      q.sourceRef.chapter < 1 ||
      q.sourceRef.chapter > (theme.cardStories?.length ?? 0)
    )
      issues.push("source-relation");
    if (
      !["text-only", "geometry-circles"].includes(q?.material?.ref) ||
      (q.material.ref === "geometry-circles" &&
        (![1, 2, 3].includes(q.material.count) || q.answer !== String(q.material.count)))
    )
      issues.push("material-or-answer");
  }
  return [...new Set(issues)];
}
export function playPackHealth(packs = PLAY_CONTENT_PACKS) {
  const seen = new Map(),
    ids = packs.map((p) => p?.id);
  for (const p of packs)
    for (const q of Array.isArray(p?.questions) ? p.questions : []) {
      if (!q || typeof q !== "object") continue;
      const key = JSON.stringify([q.mode, q.prompt, q.options, q.answer, q.material]);
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
  return {
    schema: 1,
    readOnly: true,
    publicationApproval: false,
    packs: packs.map((p) => ({
      id: p?.id ?? "unknown",
      version: p?.version ?? null,
      questionCount: Array.isArray(p?.questions) ? p.questions.length : 0,
      issues: [
        ...playPackIssues(p),
        ...(ids.filter((id) => id === p?.id).length > 1 ? ["duplicate-pack"] : []),
      ],
      sharedQuestionLayouts: (Array.isArray(p?.questions) ? p.questions : []).filter(
        (q) =>
          q && seen.get(JSON.stringify([q.mode, q.prompt, q.options, q.answer, q.material])) > 1,
      ).length,
    })),
  };
}
