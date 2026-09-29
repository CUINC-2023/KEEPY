import art1 from "@/assets/keepy-sample-1.png";
import art2 from "@/assets/keepy-sample-2.png";
import art3 from "@/assets/keepy-sample-3.png";

/** Fictional visual specimens only. Never eligible for draws, revenue or fulfillment. */
export const KEEPY_SAMPLE_POOL_ID = "p-keepy-sample";
export const KEEPY_SAMPLE_NOTE = "範例／非正式上架・虛構人物卡面。不可抽卡、付款、簽約或兌換。";
export const KEEPY_SAMPLE_CARDS = [
  { id: "c-keepy-01", name: "星光收藏・夜色光環", art: art1, mode: "官方買斷示例" },
  { id: "c-keepy-02", name: "星光收藏・觀星之間", art: art2, mode: "分潤示例" },
  { id: "c-keepy-03", name: "星光收藏・緋色星願", art: art3, mode: "實體卡示例" },
] as const;

export const sampleCardById = (id: string) => KEEPY_SAMPLE_CARDS.find((card) => card.id === id);
