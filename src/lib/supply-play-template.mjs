import { PLAY_CONTENT_PACKS, playPackIssues } from "./play-packs.mjs";
/** Add a review-bound, bilingual text article. Never activates a player question bank. */
export function reusePlayOutline(value, packId, articleId) {
  const pack = PLAY_CONTENT_PACKS.find((p) => p.id === packId);
  if (
    !pack ||
    playPackIssues(pack).length ||
    !value?.editorial ||
    !/^local-[a-z0-9-]{1,90}$/.test(articleId) ||
    value.articleIds.includes(articleId) ||
    value.editorial.articles.length >= 8
  )
    throw Error("Known sample, independent article ID and available editorial slot required");
  const pair = (zh, en) => ({ "zh-TW": zh, en });
  const article = {
    id: articleId,
    category: "guide",
    title: pair(pack.title["zh-TW"] + " · 示意玩法題綱", pack.title.en + " · Sample play outline"),
    summary: pair(
      "虛構內容的題目、答案與來源；正常保存與指定版審核，不自動啟用玩法題庫。",
      "Questions, answers and sources for fictional content. Normal saving and exact-version review; never auto-activates a question bank.",
    ),
    blocks: [
      {
        type: "paragraph",
        text: pair(
          "僅本機示意用途，未核定社群與印製權；不發獎、不計正式XP。",
          "Local sample use only; social and print rights unconfirmed. No rewards or official XP.",
        ),
      },
      ...pack.questions.flatMap((q, i) => [
        {
          type: "heading",
          text: pair("題目 " + (i + 1) + " · " + q.mode, "Question " + (i + 1) + " · " + q.mode),
        },
        {
          type: "paragraph",
          text: pair(
            q.prompt["zh-TW"] +
              (q.material.ref === "geometry-circles" ? "\n" + "○ ".repeat(q.material.count) : ""),
            q.prompt.en +
              (q.material.ref === "geometry-circles" ? "\n" + "○ ".repeat(q.material.count) : ""),
          ),
        },
        {
          type: "paragraph",
          text: pair(
            q.options.map((o) => o.id + ": " + o.label["zh-TW"]).join("\n"),
            q.options.map((o) => o.id + ": " + o.label.en).join("\n"),
          ),
        },
        {
          type: "paragraph",
          text: pair(
            "答案 " + q.answer + " · " + q.explanation["zh-TW"],
            "Answer " + q.answer + " · " + q.explanation.en,
          ),
        },
        {
          type: "paragraph",
          text: pair(
            "来源 " +
              pack.source["zh-TW"] +
              " · " +
              q.sourceRef.templateId +
              " v" +
              q.sourceRef.version +
              " · 章節 " +
              q.sourceRef.chapter,
            "Source " +
              pack.source.en +
              " · " +
              q.sourceRef.templateId +
              " v" +
              q.sourceRef.version +
              " · chapter " +
              q.sourceRef.chapter,
          ),
        },
      ]),
    ],
  };
  return {
    ...value,
    articleIds: [...value.articleIds, articleId],
    editorial: { ...value.editorial, articles: [...value.editorial.articles, article] },
  };
}
