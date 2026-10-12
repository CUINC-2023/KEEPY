export const PLAY_RULE_VERSION = "local-play-v1";
export const PLAY_MODES = ["memory", "knowledge", "observation"];
export const PLAY_DIFFICULTIES = ["easy", "standard", "hard"];
export function shuffle(items, seed) {
  if (!Number.isInteger(seed) || seed < 1 || seed > 0xffffffff)
    throw Error("Valid shuffle seed required");
  const out = [...items];
  let x = seed;
  for (let i = out.length - 1; i > 0; i--) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    const j = (x >>> 0) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
export function memoryStart(ids, difficulty = "easy", seed = 1) {
  if (!PLAY_DIFFICULTIES.includes(difficulty)) throw Error("Unknown difficulty");
  const needed = { easy: 2, standard: 4, hard: 6 }[difficulty];
  const unique = [...new Set(ids)];
  if (unique.length < needed) throw Error("Insufficient eligible held designs");
  const chosen = shuffle(unique, seed).slice(0, needed);
  return {
    schema: 1,
    ruleVersion: PLAY_RULE_VERSION,
    mode: "memory",
    difficulty,
    seed,
    cardIds: chosen,
    deck: shuffle(
      chosen.flatMap((id) => [id, id]),
      seed,
    ),
    open: [],
    matched: [],
    moves: 0,
    paused: false,
    complete: false,
    events: [],
  };
}
export function memoryAction(state, event) {
  if (!state || state.complete) return state;
  const s = structuredClone(state);
  if (event.type === "pause") {
    s.paused = !s.paused;
    s.events.push(event);
    return s;
  }
  if (s.paused) return state;
  if (event.type === "continue") {
    if (s.open.length !== 2) return state;
    s.open = [];
  } else if (event.type === "flip") {
    const i = event.index;
    if (
      !Number.isInteger(i) ||
      i < 0 ||
      i >= s.deck.length ||
      s.matched.includes(i) ||
      s.open.includes(i) ||
      s.open.length === 2
    )
      return state;
    s.open.push(i);
    if (s.open.length === 2) {
      s.moves++;
      const [a, b] = s.open;
      if (s.deck[a] === s.deck[b]) {
        s.matched.push(a, b);
        s.open = [];
        s.complete = s.matched.length === s.deck.length;
      }
    }
  } else throw Error("Unknown memory action");
  s.events.push(event);
  if (s.events.length > 500) throw Error("Round event limit");
  return s;
}
export function replayMemory(proof) {
  let s = memoryStart(proof.cardIds, proof.difficulty, proof.seed);
  for (const event of proof.events) {
    const next = memoryAction(s, event);
    if (next === s) throw Error("Invalid replay action");
    s = next;
  }
  if (!s.complete) throw Error("Incomplete replay");
  return {
    mode: s.mode,
    difficulty: s.difficulty,
    ruleVersion: s.ruleVersion,
    moves: s.moves,
    correct: s.cardIds.length,
    total: s.cardIds.length,
  };
}
