import { shuffle, PLAY_DIFFICULTIES } from "./collection-play.mjs";
export const PUZZLE_RULE_VERSION = "local-puzzle-v1";
export const SEQUENCE_RULE_VERSION = "local-sequence-v1";
export function sequenceStart(ids, difficulty = "easy", seed = 1) {
  if (!PLAY_DIFFICULTIES.includes(difficulty)) throw Error("Unknown difficulty");
  const length = { easy: 2, standard: 3, hard: 4 }[difficulty],
    unique = [...new Set(ids)];
  if (unique.length < length || unique.some((id) => typeof id !== "string" || !id))
    throw Error("Insufficient eligible sequence");
  return {
    schema: 1,
    mode: "sequence",
    ruleVersion: SEQUENCE_RULE_VERSION,
    difficulty,
    seed,
    sequence: shuffle(unique, seed).slice(0, length),
    stage: 1,
    input: 0,
    moves: 0,
    mistakes: 0,
    hintsUsed: 0,
    showSequence: true,
    paused: false,
    complete: false,
    lastCorrect: null,
    events: [],
  };
}
export function sequenceAction(state, event) {
  if (!state || state.complete) return state;
  const s = structuredClone(state);
  if (event.type === "pause") s.paused = !s.paused;
  else if (s.paused) return state;
  else if (event.type === "replay") {
    if (s.hintsUsed >= 3) return state;
    s.hintsUsed++;
    s.showSequence = true;
    s.input = 0;
    s.lastCorrect = null;
  } else if (event.type === "conceal") {
    if (!s.showSequence) return state;
    s.showSequence = false;
    s.input = 0;
    s.lastCorrect = null;
  } else if (event.type === "answer") {
    if (s.showSequence || !s.sequence.includes(event.id)) return state;
    s.moves++;
    s.lastCorrect = event.id === s.sequence[s.input];
    if (!s.lastCorrect) {
      s.mistakes++;
      s.input = 0;
    } else {
      s.input++;
      if (s.input === s.stage) {
        if (s.stage === s.sequence.length) s.complete = true;
        else {
          s.stage++;
          s.input = 0;
          s.showSequence = true;
        }
      }
    }
  } else throw Error("Unknown sequence action");
  s.events.push(event);
  if (s.events.length > 500) throw Error("Bounded round exceeded");
  return s;
}
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
