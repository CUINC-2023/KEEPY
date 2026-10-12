export const RANKING_BOARDS = Object.freeze(["total", "season", "album"]);
export function parseRankingView(raw) {
  try {
    const v = JSON.parse(raw);
    if (
      v?.schema !== 1 ||
      !Array.isArray(v.boards) ||
      v.boards.length > 3 ||
      new Set(v.boards).size !== v.boards.length ||
      v.boards.some((x) => !RANKING_BOARDS.includes(x)) ||
      (v.last !== null && !RANKING_BOARDS.includes(v.last))
    )
      return null;
    return { schema: 1, boards: v.boards, last: v.last };
  } catch {
    return null;
  }
}
