export function articleAnchors<T extends { type: "heading" | "paragraph" | "image" }>(
  id: string,
  blocks?: T[],
): (T & { anchor: string })[];
