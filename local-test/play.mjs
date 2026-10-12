import { randomUUID, createHash } from "node:crypto";
import { collectionCatalogue } from "./collection.mjs";
import {
  memoryStart,
  memoryAction,
  PLAY_RULE_VERSION,
  MEMORY_RULE_VERSION,
  validMemoryConfig,
  PLAY_MODES,
  PLAY_DIFFICULTIES,
} from "../src/lib/collection-play.mjs";
import { playQuestions, quizStart, quizAnswer } from "../src/lib/play-questions.mjs";
import { validPracticeItems } from "../src/lib/play-practice.mjs";
import { validStoredPlaySettings } from "../src/lib/play-contract.mjs";
import {
  PUZZLE_RULE_VERSION,
  SEQUENCE_RULE_VERSION,
  sequenceStart,
  sequenceAction,
  puzzleStart,
  puzzleAction,
} from "../src/lib/collection-extra-play.mjs";
const fail = (d, status, message) => {
  throw new d.constructor.DiscoveryError(status, "play", message);
};
export function initPlay(d) {
  d.db
    .exec(`CREATE TABLE IF NOT EXISTS play_private(user_id TEXT PRIMARY KEY REFERENCES users(id),version INTEGER NOT NULL,payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS play_results(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),at TEXT NOT NULL,payload TEXT NOT NULL,proof_hash TEXT NOT NULL,UNIQUE(user_id,proof_hash));
CREATE TRIGGER IF NOT EXISTS play_results_immutable BEFORE UPDATE OF id,user_id,at,payload,proof_hash ON play_results BEGIN SELECT RAISE(ABORT,'immutable'); END;`);
  d.db
    .exec(`CREATE INDEX IF NOT EXISTS play_results_owner_time ON play_results(user_id,at DESC,id DESC);
CREATE INDEX IF NOT EXISTS play_results_owner_score ON play_results(user_id,json_extract(payload,'$.ruleVersion'),json_extract(payload,'$.mode'),json_extract(payload,'$.difficulty'),(CASE WHEN json_extract(payload,'$.mode')='memory' THEN -json_extract(payload,'$.moves') ELSE 1.0*json_extract(payload,'$.correct')/NULLIF(json_extract(payload,'$.total'),0) END) DESC,at DESC,id DESC);`);
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
  if (!row) return { version: 0, data: { schema: 1, lastMode: "memory", difficulty: "easy" } };
  let data;
  try {
    data = JSON.parse(row.payload);
  } catch {
    fail(d, 422, "Stored play settings incompatible; read-only diagnosis required");
  }
  if (!Number.isSafeInteger(row.version) || row.version < 0 || !validStoredPlaySettings(data))
    fail(d, 422, "Stored play settings incompatible; read-only diagnosis required");
  return { version: row.version, data };
}
export function playHealth(d, token) {
  d.official(token);
  const report = {
    checked: 0,
    incompatible: 0,
    missingReferences: 0,
    readOnly: true,
    applied: false,
    autoRepair: false,
  };
  for (const row of d.db.prepare("SELECT user_id FROM play_private ORDER BY user_id").all()) {
    report.checked++;
    try {
      const value = settings(d, row.user_id).data;
      if (!d.db.prepare("SELECT id FROM users WHERE id=?").get(row.user_id)) {
        report.incompatible++;
        continue;
      }
      for (const [index, id] of [
        ...(value.journey?.resultIds ?? []),
        ...(value.practice?.resultIds ?? []),
      ].entries()) {
        const result = d.db
          .prepare("SELECT payload FROM play_results WHERE user_id=? AND id=?")
          .get(row.user_id, id);
        if (
          !result ||
          (index < (value.journey?.resultIds.length ?? 0) &&
            JSON.parse(result.payload).mode !== value.journey.modes[index])
        )
          report.missingReferences++;
      }
    } catch {
      report.incompatible++;
    }
  }
  return report;
}
function journeyProjection(d, id, journey, owner) {
  if (!journey) return null;
  const allowed = new Set(owner.cards.map((c) => c.cardId));
  const valid = journey.resultIds.every((resultId, i) => {
    const row = d.db
      .prepare("SELECT payload FROM play_results WHERE user_id=? AND id=?")
      .get(id, resultId);
    if (!row) return false;
    const value = JSON.parse(row.payload);
    return (
      value.mode === journey.modes[i] &&
      value.sourceIds.length > 0 &&
      value.sourceIds.every((cardId) => allowed.has(cardId))
    );
  });
  return {
    schema: 1,
    ruleVersion: journey.ruleVersion,
    modes: journey.modes,
    startedAt: journey.startedAt,
    paused: journey.paused,
    completed: valid ? journey.resultIds.length : 0,
    invalidated: !valid,
  };
}
function practiceProjection(d, id, p, owner) {
  if (!p) return null;
  const allowed = new Set(owner.cards.map((c) => c.cardId));
  const valid = p.resultIds.every((resultId, i) => {
    const row = d.db
      .prepare("SELECT payload FROM play_results WHERE user_id=? AND id=?")
      .get(id, resultId);
    if (!row) return false;
    const r = JSON.parse(row.payload);
    return (
      r.mode === p.items[i].mode &&
      r.difficulty === p.items[i].difficulty &&
      r.sourceIds.length > 0 &&
      r.sourceIds.every((id) => allowed.has(id))
    );
  });
  return {
    schema: 1,
    ruleVersion: p.ruleVersion,
    items: p.items,
    startedAt: p.startedAt,
    paused: p.paused,
    completed: valid ? p.resultIds.length : 0,
    invalidated: !valid,
  };
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
    allowed = JSON.stringify(owner.cards.map((c) => c.cardId)),
    where =
      "user_id=? AND json_array_length(json_extract(payload,'$.sourceIds'))>0 AND NOT EXISTS(SELECT 1 FROM json_each(play_results.payload,'$.sourceIds') s WHERE s.type!='text' OR s.value NOT IN (SELECT value FROM json_each(?)))",
    selected = where + (mode === "all" ? "" : " AND json_extract(payload,'$.mode')=?"),
    queryArgs = mode === "all" ? [u.id, allowed] : [u.id, allowed, mode],
    total = d.db
      .prepare("SELECT count(*) n FROM play_results WHERE " + selected)
      .get(...queryArgs).n;
  const pages = Math.max(1, Math.ceil(total / 20)),
    p = Math.min(page, pages),
    project = (r) => ({
      id: r.id,
      at: r.at,
      mode: r.mode,
      difficulty: r.difficulty,
      ruleVersion: r.ruleVersion,
      sourceVersion: r.sourceVersion,
      ...(r.ruleVersion === MEMORY_RULE_VERSION
        ? { memoryConfig: r.memoryConfig, hintsUsed: r.hintsUsed }
        : {}),
      ...(r.assistance !== undefined ? { assistance: r.assistance } : {}),
      moves: r.moves,
      correct: r.correct,
      total: r.total,
    });
  const unpack = (r) => ({ ...JSON.parse(r.payload), id: r.id, at: r.at });
  const rows = d.db
    .prepare(
      "SELECT id,at,payload FROM play_results WHERE " +
        selected +
        " ORDER BY at DESC,id DESC LIMIT 20 OFFSET ?",
    )
    .all(...queryArgs, (p - 1) * 20)
    .map(unpack);
  const best = [];
  // Only these original modes ever accepted local-play-v1 result proofs.
  // Puzzle/sequence use their own version groups in analysis, not legacy bests.
  for (const kind of ["memory", "knowledge", "observation"])
    for (const level of PLAY_DIFFICULTIES) {
      if (mode !== "all" && mode !== kind) continue;
      const result = d.db
        .prepare(
          "SELECT id,at,payload FROM play_results WHERE " +
            where +
            " AND json_extract(payload,'$.ruleVersion')=? AND json_extract(payload,'$.mode')=? AND json_extract(payload,'$.difficulty')=? ORDER BY (CASE WHEN json_extract(payload,'$.mode')='memory' THEN -json_extract(payload,'$.moves') ELSE 1.0*json_extract(payload,'$.correct')/NULLIF(json_extract(payload,'$.total'),0) END) DESC,at DESC,id DESC LIMIT 1",
        )
        .get(u.id, allowed, PLAY_RULE_VERSION, kind, level);
      if (result) best.push(project(unpack(result)));
    }
  const statistics = d.db
    .prepare(
      "SELECT json_extract(payload,'$.mode') mode,json_extract(payload,'$.difficulty') difficulty,json_extract(payload,'$.ruleVersion') ruleVersion,COALESCE(json_extract(payload,'$.memoryConfig.variant'),'original') configuration,COALESCE(json_extract(payload,'$.assistance.hintsUsed'),json_extract(payload,'$.hintsUsed'),-1) hints,COUNT(*) rounds,SUM(json_extract(payload,'$.correct')) correct,SUM(json_extract(payload,'$.total')) total,MIN(json_extract(payload,'$.moves')) bestMoves FROM play_results WHERE " +
        selected +
        " GROUP BY mode,difficulty,ruleVersion,configuration,hints ORDER BY mode,difficulty,ruleVersion,configuration,hints LIMIT 101",
    )
    .all(...queryArgs);
  const analysis = {
    schema: 1,
    coverage: "current-authorized-local-results",
    truncated: statistics.length > 100,
    groups: statistics
      .slice(0, 100)
      .map(({ hints, ...group }) => ({ ...group, hintsUsed: hints < 0 ? null : hints })),
  };
  const privateSettings = settings(d, u.id);
  const journey = journeyProjection(d, u.id, privateSettings.data.journey, owner);
  const practice = practiceProjection(d, u.id, privateSettings.data.practice, owner);
  return {
    schema: 1,
    source: "local-SQLite-private-play",
    actorId: u.id,
    visibilityKey: cat.visibilityKey,
    settings: {
      version: privateSettings.version,
      data: {
        schema: 1,
        lastMode: privateSettings.data.lastMode,
        difficulty: privateSettings.data.difficulty,
        ...(journey ? { journey } : {}),
        ...(practice ? { practice } : {}),
      },
    },
    page: p,
    pages,
    total,
    rows: rows.map(project),
    analysis,
    best,
    officialXP: false,
    ranking: false,
    rewards: false,
  };
}
export function privatePlaySummary(d, token, range) {
  const u = d.actor(token);
  if (u.role !== "member") return null;
  const { owner } = eligible(d, u.id),
    ids = JSON.stringify(owner.cards.map((c) => c.cardId));
  const rows = d.db
    .prepare(
      "SELECT payload FROM play_results r WHERE user_id=? AND (?='' OR at>=?) AND (?='' OR at<?) AND json_type(payload,'$.sourceIds')='array' AND json_array_length(payload,'$.sourceIds')>0 AND NOT EXISTS(SELECT 1 FROM json_each(json_extract(r.payload,'$.sourceIds')) s WHERE s.value NOT IN (SELECT value FROM json_each(?)))",
    )
    .all(u.id, range.start, range.start, range.end, range.end, ids)
    .map((r) => JSON.parse(r.payload));
  return {
    source: "local-SQLite-private-play",
    records: rows.length,
    modes: PLAY_MODES.flatMap((mode) => {
      const group = rows.filter((r) => r.mode === mode);
      return group.length
        ? [
            {
              mode,
              rounds: group.length,
              correct: group.reduce((n, r) => n + r.correct, 0),
              total: group.reduce((n, r) => n + r.total, 0),
              ruleVersions: [...new Set(group.map((r) => r.ruleVersion))],
            },
          ]
        : [];
    }),
    recordTimeOnly: true,
    officialXP: false,
    rewards: false,
    ranking: false,
  };
}
export function playCommand(d, token, input, key) {
  const u = actor(d, token);
  if (
    !input ||
    !["result", "settings", "clear", "journey", "practice"].includes(input.action) ||
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
      result = {
        settings: { ...prior.data, ...v },
      };
    } else if (input.action === "practice") {
      const v = input.data;
      if (
        !v ||
        Object.keys(v).sort().join() !== "cancel,items,paused,restart" ||
        typeof v.cancel !== "boolean" ||
        typeof v.paused !== "boolean" ||
        typeof v.restart !== "boolean"
      )
        fail(d, 422, "Invalid practice command");
      if (v.cancel) {
        if (!Array.isArray(v.items) || v.items.length || v.paused || v.restart)
          fail(d, 422, "Explicit plan-only cancellation required");
        const data = { ...prior.data };
        delete data.practice;
        result = { settings: data };
      } else {
        if (!validPracticeItems(v.items)) fail(d, 422, "Invalid bounded practice items");
        if (
          !v.restart &&
          (!prior.data.practice ||
            JSON.stringify(prior.data.practice.items) !== JSON.stringify(v.items))
        )
          fail(d, 409, "Practice changed; reload");
        result = {
          settings: {
            ...prior.data,
            practice: v.restart
              ? {
                  schema: 1,
                  ruleVersion: "local-practice-v1",
                  items: v.items,
                  startedAt: d.at(),
                  paused: v.paused,
                  resultIds: [],
                }
              : { ...prior.data.practice, paused: v.paused },
          },
        };
      }
    } else if (input.action === "journey") {
      const v = input.data;
      if (
        !v ||
        Object.keys(v).sort().join() !== "modes,paused,restart" ||
        !Array.isArray(v.modes) ||
        v.modes.length < 2 ||
        v.modes.length > 3 ||
        new Set(v.modes).size !== v.modes.length ||
        !v.modes.every((mode) => PLAY_MODES.includes(mode)) ||
        typeof v.paused !== "boolean" ||
        typeof v.restart !== "boolean"
      )
        fail(d, 422, "Invalid bounded private journey");
      if (
        !v.restart &&
        (!prior.data.journey ||
          JSON.stringify(prior.data.journey.modes) !== JSON.stringify(v.modes))
      )
        fail(d, 409, "Journey changed; reload");
      const journey = v.restart
        ? {
            schema: 1,
            ruleVersion: v.modes.some((mode) => ["puzzle", "sequence"].includes(mode))
              ? "local-theme-journey-v2"
              : "local-mixed-journey-v1",
            modes: v.modes,
            startedAt: d.at(),
            paused: v.paused,
            resultIds: [],
          }
        : { ...prior.data.journey, paused: v.paused };
      result = { settings: { ...prior.data, journey } };
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
        Object.keys(proof)
          .filter((k) => k !== "memoryConfig")
          .sort()
          .join() !==
          "cardIds,cardVersions,difficulty,events,mode,ruleVersion,seed,visibilityKey" ||
        !(
          (proof.ruleVersion === PLAY_RULE_VERSION &&
            ["memory", "knowledge", "observation"].includes(proof.mode) &&
            proof.memoryConfig === undefined) ||
          (proof.mode === "memory" &&
            proof.ruleVersion === MEMORY_RULE_VERSION &&
            validMemoryConfig(proof.memoryConfig)) ||
          (proof.mode === "puzzle" &&
            proof.ruleVersion === PUZZLE_RULE_VERSION &&
            proof.memoryConfig === undefined) ||
          (proof.mode === "sequence" &&
            proof.ruleVersion === SEQUENCE_RULE_VERSION &&
            proof.memoryConfig === undefined)
        ) ||
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
        if (proof.mode === "sequence") {
          state = sequenceStart(proof.cardIds, proof.difficulty, proof.seed);
          for (const event of proof.events) {
            if (!event || Object.keys(event).some((key) => !["type", "id"].includes(key)))
              throw Error("Invalid sequence event");
            const next = sequenceAction(state, event);
            if (next === state) throw Error("Invalid sequence event");
            state = next;
          }
        } else if (proof.mode === "puzzle") {
          state = puzzleStart(proof.cardIds, proof.difficulty, proof.seed);
          for (const event of proof.events) {
            if (!event || Object.keys(event).some((key) => !["type", "from", "to"].includes(key)))
              throw Error("Invalid puzzle event");
            const next = puzzleAction(state, event);
            if (next === state) throw Error("Invalid puzzle event");
            state = next;
          }
        } else if (proof.mode === "memory") {
          state = memoryStart(
            proof.cardIds,
            proof.difficulty,
            proof.seed,
            proof.memoryConfig ?? null,
          );
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
        ruleVersion: proof.ruleVersion,
        ...(state.memoryConfig
          ? { memoryConfig: state.memoryConfig, hintsUsed: state.hintsUsed }
          : {}),
        assistance: {
          hintsUsed: ["memory", "puzzle", "sequence"].includes(proof.mode)
            ? (state.hintsUsed ?? 0)
            : null,
          mistakes:
            proof.mode === "sequence"
              ? state.mistakes
              : ["knowledge", "observation"].includes(proof.mode)
                ? state.answers.filter((a, i) => a !== state.questions[i].answer).length
                : null,
        },
        sourceVersion: cat.version,
        sourceIds: proof.cardIds,
        moves: ["memory", "puzzle", "sequence"].includes(proof.mode) ? state.moves : null,
        correct:
          proof.mode === "sequence"
            ? state.sequence.length
            : proof.mode === "puzzle"
              ? state.tiles.length
              : proof.mode === "memory"
                ? state.cardIds.length
                : state.answers.filter((a, i) => a === state.questions[i].answer).length,
        total:
          proof.mode === "sequence"
            ? state.sequence.length
            : proof.mode === "puzzle"
              ? state.tiles.length
              : proof.mode === "memory"
                ? state.cardIds.length
                : state.questions.length,
      };
      const id = randomUUID();
      d.db
        .prepare("INSERT INTO play_results(id,user_id,at,payload,proof_hash) VALUES(?,?,?,?,?)")
        .run(id, u.id, d.at(), JSON.stringify(payload), proofHash);
      const journey = prior.data.journey;
      const progress = journeyProjection(d, u.id, journey, owner);
      result = {
        id,
        settings:
          journey &&
          !journey.paused &&
          !progress.invalidated &&
          journey.modes[journey.resultIds.length] === proof.mode
            ? { ...prior.data, journey: { ...journey, resultIds: [...journey.resultIds, id] } }
            : prior.data,
      };
      const p = prior.data.practice,
        practiceProgress = practiceProjection(d, u.id, p, owner),
        item = p?.items[p.resultIds.length];
      if (
        p &&
        !p.paused &&
        !practiceProgress.invalidated &&
        item?.mode === proof.mode &&
        item?.difficulty === proof.difficulty
      )
        result.settings = {
          ...result.settings,
          practice: { ...p, resultIds: [...p.resultIds, id] },
        };
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
