export const ARTICLE_CATEGORIES = ["design", "guide", "interview", "behind-scenes"];
const blank = () => ({ "zh-TW": "", en: "" });
export function blankArticle(category, id) {
  return {
    id,
    category: ARTICLE_CATEGORIES.includes(category) ? category : "design",
    title: blank(),
    summary: blank(),
    blocks: Array.from({ length: 4 }, () => [
      { type: "heading", text: blank() },
      { type: "paragraph", text: blank() },
    ]).flat(),
  };
}
export function moveItem(items, index, delta) {
  const target = index + delta;
  if (
    !Number.isInteger(index) ||
    ![-1, 1].includes(delta) ||
    index < 0 ||
    target < 0 ||
    target >= items.length
  )
    return items;
  const next = items.slice();
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
