export const PLAY_RULE_VERSION = "local-play-v1";
export const MEMORY_RULE_VERSION = "local-memory-v2";
export function validMemoryConfig(v) {
  return (
    !!v &&
    typeof v === "object" &&
    Object.keys(v).sort().join() === "allowHints,schema,variant" &&
    v.schema === 1 &&
    ["practice", "limit"].includes(v.variant) &&
    typeof v.allowHints === "boolean"
  );
}
export const PLAY_MODES = ["memory", "knowledge", "observation", "puzzle"];
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
export function memoryStart(ids, difficulty = "easy", seed = 1, config = null) {
  if (!PLAY_DIFFICULTIES.includes(difficulty)) throw Error("Unknown difficulty");
  if (config !== null && !validMemoryConfig(config)) throw Error("Invalid memory configuration");
  const needed = { easy: 2, standard: 4, hard: 6 }[difficulty];
  const unique = [...new Set(ids)];
  if (unique.length < needed) throw Error("Insufficient eligible held designs");
  const chosen = shuffle(unique, seed).slice(0, needed);
  return {
    schema: 1,
    ruleVersion: config ? MEMORY_RULE_VERSION : PLAY_RULE_VERSION,
    ...(config
      ? {
          memoryConfig: structuredClone(config),
          hintsUsed: 0,
          hintIndexes: [],
          moveLimit: config.variant === "limit" ? needed * 2 : null,
          failed: false,
        }
      : {}),
    mode: "memory",
    inputIds: unique,
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
  if (!state || state.complete || state.failed) return state;
  const s = structuredClone(state);
  if (event.type === "pause") {
    s.paused = !s.paused;
    s.events.push(event);
    return s;
  }
  if (s.paused) return state;
  if (event.type === "hint") {
    if (!s.memoryConfig?.allowHints || s.hintsUsed >= 3 || s.open.length) return state;
    const first = s.deck.findIndex((_, i) => !s.matched.includes(i));
    s.hintIndexes = s.deck.flatMap((id, i) =>
      id === s.deck[first] && !s.matched.includes(i) ? [i] : [],
    );
    s.hintsUsed++;
  } else if (event.type === "hide-hint") {
    if (!s.hintIndexes?.length) return state;
    s.hintIndexes = [];
  } else if (event.type === "continue") {
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
    if (s.hintIndexes) s.hintIndexes = [];
    if (s.open.length === 2) {
      s.moves++;
      const [a, b] = s.open;
      if (s.deck[a] === s.deck[b]) {
        s.matched.push(a, b);
        s.open = [];
        s.complete = s.matched.length === s.deck.length;
      }
      if (
        s.moveLimit !== null &&
        s.moveLimit !== undefined &&
        s.moves >= s.moveLimit &&
        !s.complete
      )
        s.failed = true;
    }
  } else throw Error("Unknown memory action");
  s.events.push(event);
  if (s.events.length > 500) throw Error("Round event limit");
  return s;
}
export function replayMemory(proof) {
  let s = memoryStart(
    proof.inputIds ?? proof.cardIds,
    proof.difficulty,
    proof.seed,
    proof.memoryConfig ?? null,
  );
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
