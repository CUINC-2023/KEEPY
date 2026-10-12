export const RANKING_BOARDS: readonly ["total", "season", "album"];
export interface RankingView {
  schema: 1;
  boards: string[];
  last: string | null;
}
export function parseRankingView(raw: string): RankingView | null;
