import { randomUUID, createHash } from "node:crypto";
import { collectionCatalogue } from "./collection.mjs";
import {
  memoryStart,
  memoryAction,
  PLAY_RULE_VERSION,
  PLAY_MODES,
  PLAY_DIFFICULTIES,
} from "../src/lib/collection-play.mjs";
import { playQuestions, quizStart, quizAnswer } from "../src/lib/play-questions.mjs";
const fail = (d, status, message) => {
  throw new d.constructor.DiscoveryError(status, "play", message);
};
export function initPlay(d) {
  d.db
    .exec(`CREATE TABLE IF NOT EXISTS play_private(user_id TEXT PRIMARY KEY REFERENCES users(id),version INTEGER NOT NULL,payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS play_results(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),at TEXT NOT NULL,payload TEXT NOT NULL,proof_hash TEXT NOT NULL,UNIQUE(user_id,proof_hash));
CREATE TRIGGER IF NOT EXISTS play_results_immutable BEFORE UPDATE OF id,user_id,at,payload,proof_hash ON play_results BEGIN SELECT RAISE(ABORT,'immutable'); END;`);
}
function actor(d, token) {
  const u = d.actor(token);
  if (u.role !== "member") fail(d, 403, "Current member role required");
  return u;
}
function eligible(d, id) {
  const cat = collectionCatalogue(d),
    held = new Set(
      d.db
        .prepare("SELECT card_id FROM holdings WHERE user_id=? AND count>0")
        .all(id)
        .map((r) => r.card_id),
    );
  return {
    cat,
    owner: {
      actorId: id,
      visibilityKey: cat.visibilityKey,
      cards: cat.cards.filter((c) => held.has(c.cardId)).map((c) => ({ ...c, count: 1 })),
    },
  };
}
function settings(d, id) {
  const row = d.db.prepare("SELECT * FROM play_private WHERE user_id=?").get(id);
  return row
    ? { version: row.version, data: JSON.parse(row.payload) }
    : { version: 0, data: { schema: 1, lastMode: "memory", difficulty: "easy" } };
}
export function playMe(d, token, params = {}) {
  const u = actor(d, token);
  if (Object.keys(params).some((k) => !["page", "mode"].includes(k)))
    fail(d, 422, "Unknown private query");
  const page = Number(params.page ?? 1),
    mode = params.mode ?? "all";
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 10000 ||
    !["all", ...PLAY_MODES].includes(mode)
  )
    fail(d, 422, "Invalid private query");
  const { cat, owner } = eligible(d, u.id),
    allowed = new Set(owner.cards.map((c) => c.cardId));
  const rows = d.db
    .prepare("SELECT id,at,payload FROM play_results WHERE user_id=? ORDER BY at DESC,id DESC")
    .all(u.id)
    .map((row) => ({ ...JSON.parse(row.payload), id: row.id, at: row.at }))
    .filter(
      (r) => r.sourceIds.every((id) => allowed.has(id)) && (mode === "all" || r.mode === mode),
    );
  const pages = Math.max(1, Math.ceil(rows.length / 20)),
    p = Math.min(page, pages),
    project = (r) => ({
      id: r.id,
      at: r.at,
      mode: r.mode,
      difficulty: r.difficulty,
      ruleVersion: r.ruleVersion,
      sourceVersion: r.sourceVersion,
      moves: r.moves,
      correct: r.correct,
      total: r.total,
    });
  const best = [];
  for (const kind of PLAY_MODES)
    for (const level of PLAY_DIFFICULTIES) {
      const group = rows.filter(
        (r) => r.mode === kind && r.difficulty === level && r.ruleVersion === PLAY_RULE_VERSION,
      );
      group.sort((a, b) =>
        kind === "memory" ? a.moves - b.moves : b.correct / b.total - a.correct / a.total,
      );
      if (group[0]) best.push(project(group[0]));
    }
  return {
    schema: 1,
    source: "local-SQLite-private-play",
    actorId: u.id,
    visibilityKey: cat.visibilityKey,
    settings: settings(d, u.id),
    page: p,
    pages,
    total: rows.length,
    rows: rows.slice((p - 1) * 20, p * 20).map(project),
    best,
    officialXP: false,
    ranking: false,
    rewards: false,
  };
}
export function playCommand(d, token, input, key) {
  const u = actor(d, token);
  if (
    !input ||
    !["result", "settings", "clear"].includes(input.action) ||
    Object.keys(input).some((k) => !["action", "expectedVersion", "data"].includes(k))
  )
    fail(d, 422, "Invalid play command");
  return d.mutation(token, input, key, "play-member", () => {
    const prior = settings(d, u.id);
    if (!Number.isSafeInteger(input.expectedVersion) || prior.version !== input.expectedVersion)
      fail(d, 409, "Play settings changed; reload");
    let result;
    if (input.action === "settings") {
      const v = input.data;
      if (
        !v ||
        Object.keys(v).sort().join() !== "difficulty,lastMode,schema" ||
        v.schema !== 1 ||
        !PLAY_MODES.includes(v.lastMode) ||
        !PLAY_DIFFICULTIES.includes(v.difficulty)
      )
        fail(d, 422, "Invalid play settings");
      result = { settings: v };
    } else if (input.action === "clear") {
      if (input.data !== null) fail(d, 422, "Confirm record-only deletion");
      d.db.prepare("DELETE FROM play_results WHERE user_id=?").run(u.id);
      result = {
        cleared: "private-play-records-only",
        settings: { schema: 1, lastMode: "memory", difficulty: "easy" },
      };
    } else {
      const proof = input.data;
      if (
        !proof ||
        Object.keys(proof).sort().join() !==
          "cardIds,cardVersions,difficulty,events,mode,ruleVersion,seed,visibilityKey" ||
        proof.ruleVersion !== PLAY_RULE_VERSION ||
        !PLAY_MODES.includes(proof.mode) ||
        !PLAY_DIFFICULTIES.includes(proof.difficulty) ||
        !Array.isArray(proof.cardIds) ||
        proof.cardIds.length < 1 ||
        proof.cardIds.length > 120 ||
        new Set(proof.cardIds).size !== proof.cardIds.length ||
        !Array.isArray(proof.events) ||
        proof.events.length > 500 ||
        !Number.isInteger(proof.seed) ||
        proof.seed < 1 ||
        proof.seed > 0xffffffff
      )
        fail(d, 422, "Invalid bounded play proof");
      const { cat, owner } = eligible(d, u.id);
      if (proof.visibilityKey !== cat.visibilityKey)
        fail(d, 409, "Current material changed; stop and reload");
      const allowed = new Map(owner.cards.map((c) => [c.cardId, c]));
      if (
        !Array.isArray(proof.cardVersions) ||
        proof.cardVersions.length !== proof.cardIds.length ||
        proof.cardIds.some(
          (id, i) => !allowed.has(id) || allowed.get(id).cardVersion !== proof.cardVersions[i],
        )
      )
        fail(d, 422, "Only current eligible held designs");
      let state;
      try {
        if (proof.mode === "memory") {
          state = memoryStart(proof.cardIds, proof.difficulty, proof.seed);
          for (const e of proof.events) {
            if (!e || Object.keys(e).some((k) => !["type", "index"].includes(k)))
              throw Error("Invalid event");
            const next = memoryAction(state, e);
            if (next === state) throw Error("Invalid event");
            state = next;
          }
        } else {
          const narrowed = { ...owner, cards: proof.cardIds.map((id) => allowed.get(id)) };
          state = quizStart(playQuestions(narrowed, cat, proof.mode), proof.difficulty, proof.seed);
          for (const e of proof.events) {
            if (typeof e !== "string") throw Error("Invalid answer");
            const next = quizAnswer(state, e);
            if (next === state) throw Error("Invalid answer");
            state = next;
          }
        }
        if (!state.complete) throw Error("Incomplete");
      } catch {
        fail(d, 422, "Invalid or incomplete result replay");
      }
      const proofHash = createHash("sha256").update(JSON.stringify(proof)).digest("hex"),
        existing = d.db
          .prepare("SELECT id FROM play_results WHERE user_id=? AND proof_hash=?")
          .get(u.id, proofHash);
      if (existing) return { id: existing.id, version: prior.version, duplicate: true };
      const payload = {
        schema: 1,
        mode: proof.mode,
        difficulty: proof.difficulty,
        ruleVersion: PLAY_RULE_VERSION,
        sourceVersion: cat.version,
        sourceIds: proof.cardIds,
        moves: proof.mode === "memory" ? state.moves : null,
        correct:
          proof.mode === "memory"
            ? state.cardIds.length
            : state.answers.filter((a, i) => a === state.questions[i].answer).length,
        total: proof.mode === "memory" ? state.cardIds.length : state.questions.length,
      };
      const id = randomUUID();
      d.db
        .prepare("INSERT INTO play_results(id,user_id,at,payload,proof_hash) VALUES(?,?,?,?,?)")
        .run(id, u.id, d.at(), JSON.stringify(payload), proofHash);
      result = { id, settings: prior.data };
    }
    const version = prior.version + 1;
    d.db
      .prepare(
        "INSERT INTO play_private VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET version=excluded.version,payload=excluded.payload",
      )
      .run(u.id, version, JSON.stringify(result.settings));
    d.log(u.id, "play." + input.action, "v" + version);
    d.fault("after-play-write");
    return { ...result, version };
  });
}
