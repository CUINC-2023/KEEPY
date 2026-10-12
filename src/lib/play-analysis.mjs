import { PLAY_MODES, PLAY_DIFFICULTIES } from "./collection-play.mjs";
export function validPlayAnalysis(v) {
  return (
    v &&
    Object.keys(v).sort().join() === "coverage,groups,schema,truncated" &&
    v.schema === 1 &&
    v.coverage === "current-authorized-local-results" &&
    typeof v.truncated === "boolean" &&
    Array.isArray(v.groups) &&
    v.groups.length <= 100 &&
    v.groups.every(
      (g) =>
        g &&
        Object.keys(g).sort().join() ===
          "bestMoves,configuration,correct,difficulty,hintsUsed,mode,rounds,ruleVersion,total" &&
        PLAY_MODES.includes(g.mode) &&
        PLAY_DIFFICULTIES.includes(g.difficulty) &&
        typeof g.ruleVersion === "string" &&
        g.ruleVersion.length <= 128 &&
        ["original", "practice", "limit"].includes(g.configuration) &&
        (g.hintsUsed === null ||
          (Number.isSafeInteger(g.hintsUsed) && g.hintsUsed >= 0 && g.hintsUsed <= 3)) &&
        Number.isSafeInteger(g.rounds) &&
        g.rounds > 0 &&
        Number.isSafeInteger(g.correct) &&
        g.correct >= 0 &&
        Number.isSafeInteger(g.total) &&
        g.total >= g.correct &&
        (g.bestMoves === null ||
          (Number.isSafeInteger(g.bestMoves) && g.bestMoves > 0 && g.bestMoves <= 500)),
    )
  );
}
