const bi = (zh, en) => ({ "zh-TW": zh, en });
export const READING_GUIDES = [
  {
    id: "starter",
    title: bi("新手收藏閱讀", "First collection reading"),
    steps: [
      bi("先讀系列故事與公開收藏目標。", "Read the series story and public collection goal."),
      bi(
        "查看本人卡冊，區分曾取得與目前持有。",
        "Check your album; separate acquired designs from current holdings.",
      ),
      bi(
        "選擇接續收藏或私人展示，沒有資產獎勵。",
        "Choose continued collecting or a private showcase, with no asset rewards.",
      ),
    ],
  },
  {
    id: "theme",
    title: bi("主題閱讀", "Theme reading"),
    steps: [
      bi("閱讀主題背景與創作者介紹。", "Read the theme background and creator introduction."),
      bi("比較合法公開款式與相關故事。", "Compare eligible public designs and related stories."),
      bi(
        "回顧自己的收藏目標，明確選擇下一步。",
        "Review your collection goal and explicitly choose the next step.",
      ),
    ],
  },
  {
    id: "deep",
    title: bi("深度閱讀", "Close reading"),
    steps: [
      bi("從故事章節與來源開始閱讀。", "Begin with story chapters and their sources."),
      bi(
        "核對卡牌版本、稀有度與取得來源的差異。",
        "Check the differences between card version, rarity and acquisition source.",
      ),
      bi(
        "用私人筆記或策展整理心得，不代表已完成系列。",
        "Organize reflections in private notes or curations; this does not mean series completion.",
      ),
    ],
  },
];
export function validReadingGuide(v) {
  return (
    !!v &&
    typeof v === "object" &&
    Object.keys(v).sort().join() === "poolId,schema,step,template" &&
    v.schema === 1 &&
    READING_GUIDES.some((g) => g.id === v.template) &&
    typeof v.poolId === "string" &&
    v.poolId.length > 0 &&
    v.poolId.length <= 128 &&
    Number.isSafeInteger(v.step) &&
    v.step >= 0 &&
    v.step <= 3
  );
}
