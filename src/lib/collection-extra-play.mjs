import { shuffle, PLAY_DIFFICULTIES } from "./collection-play.mjs";
export const PUZZLE_RULE_VERSION = "local-puzzle-v1";
export function puzzleStart(ids, difficulty = "easy", seed = 1) {
  if (
    !PLAY_DIFFICULTIES.includes(difficulty) ||
    !Array.isArray(ids) ||
    !ids.length ||
    ids.some((id) => typeof id !== "string" || !id)
  )
    throw Error("Eligible puzzle material required");
  const size = { easy: 2, standard: 3, hard: 4 }[difficulty],
    target = Array.from({ length: size * size }, (_, i) => i);
  let tiles = shuffle(target, seed);
  if (tiles.every((v, i) => v === i)) tiles = [...tiles.slice(1), tiles[0]];
  return {
    schema: 1,
    mode: "puzzle",
    ruleVersion: PUZZLE_RULE_VERSION,
    difficulty,
    seed,
    cardId: shuffle([...new Set(ids)], seed)[0],
    size,
    tiles,
    moves: 0,
    hintsUsed: 0,
    showHint: false,
    paused: false,
    complete: false,
    events: [],
  };
}
export function puzzleAction(state, event) {
  if (!state || state.complete) return state;
  const s = structuredClone(state);
  if (event.type === "pause") s.paused = !s.paused;
  else if (s.paused) return state;
  else if (event.type === "hint") {
    if (s.hintsUsed >= 3) return state;
    s.hintsUsed++;
    s.showHint = true;
  } else if (event.type === "hide-hint") {
    if (!s.showHint) return state;
    s.showHint = false;
  } else if (event.type === "swap") {
    const { from, to } = event;
    if (
      !Number.isInteger(from) ||
      !Number.isInteger(to) ||
      from === to ||
      from < 0 ||
      to < 0 ||
      from >= s.tiles.length ||
      to >= s.tiles.length
    )
      return state;
    [s.tiles[from], s.tiles[to]] = [s.tiles[to], s.tiles[from]];
    s.moves++;
    s.complete = s.tiles.every((v, i) => v === i);
    s.showHint = false;
  } else throw Error("Unknown puzzle action");
  s.events.push(event);
  if (s.events.length > 500) throw Error("Bounded round exceeded");
  return s;
}
