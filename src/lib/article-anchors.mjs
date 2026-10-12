export function articleAnchors(id, blocks = []) {
  const prefix =
      "content-" +
      Array.from(id)
        .map((c) => c.codePointAt(0).toString(16))
        .join("-"),
    counts = { heading: 0, paragraph: 0, image: 0 };
  return blocks.map((block) => ({
    ...block,
    anchor: prefix + "-" + block.type + "-" + ++counts[block.type],
  }));
}
