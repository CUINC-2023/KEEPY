import { randomUUID } from "node:crypto";
import { ApiError } from "./database.mjs";
const fail = (s, status = 422) => {
  throw new ApiError(status, "participation", s);
};
const bi = (zh, en) => ({ "zh-TW": zh, en });
const tasks = [
  { id: "profile", title: bi("設定個人頁", "Set up your profile") },
  { id: "first", title: bi("首次收藏", "First collection") },
  { id: "album", title: bi("查看卡冊", "View your album") },
  { id: "vote", title: bi("參與官方票選", "Join an official theme vote") },
];
const entry = (id, draft) => ({
  id,
  status: "published",
  draft,
  published: { ...draft, ruleVersion: 1 },
});
export function initParticipation(d) {
  d.db
    .exec(`CREATE TABLE IF NOT EXISTS participation_votes(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),round_id TEXT,option_id TEXT,at TEXT,payload TEXT,UNIQUE(user_id,round_id,option_id));
 CREATE TABLE IF NOT EXISTS participation_recommendations(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),round_id TEXT,version INTEGER,payload TEXT,UNIQUE(user_id,round_id));
 CREATE TABLE IF NOT EXISTS participation_view_events(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),kind TEXT,at TEXT);
 CREATE TRIGGER IF NOT EXISTS participation_view_events_immutable BEFORE UPDATE ON participation_view_events BEGIN SELECT RAISE(ABORT,'immutable'); END;
 CREATE TABLE IF NOT EXISTS participation_views(user_id TEXT REFERENCES users(id),kind TEXT,at TEXT,PRIMARY KEY(user_id,kind));
 CREATE TABLE IF NOT EXISTS participation_tasks(user_id TEXT REFERENCES users(id),task_id TEXT,at TEXT,payload TEXT,PRIMARY KEY(user_id,task_id));
 CREATE TABLE IF NOT EXISTS participation_claims(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),activity_id TEXT,at TEXT,payload TEXT,UNIQUE(user_id,activity_id));
 CREATE TRIGGER IF NOT EXISTS participation_votes_immutable BEFORE UPDATE ON participation_votes BEGIN SELECT RAISE(ABORT,'immutable'); END;
 CREATE TRIGGER IF NOT EXISTS participation_tasks_immutable BEFORE UPDATE ON participation_tasks BEGIN SELECT RAISE(ABORT,'immutable'); END;
 CREATE TRIGGER IF NOT EXISTS participation_claims_immutable BEFORE UPDATE ON participation_claims BEGIN SELECT RAISE(ABORT,'immutable'); END;`);
  const period = { startAt: "2026-10-01T00:00:00Z", endAt: "2026-11-01T00:00:00Z" };
  const doc = {
    schema: 1,
    rounds: [
      entry("theme-local-020", {
        kind: "theme",
        title: bi("下一季主題票選示意", "Sample next-season theme vote"),
        summary: bi(
          "每帳號本輪限一票；結果供企劃參考，不承諾合作或上架。",
          "One vote per account this round. Results guide planning, without release or collaboration promises.",
        ),
        ...period,
        limit: 1,
        options: [
          { id: "light", title: bi("光影日記", "Light diary") },
          { id: "city", title: bi("城市片刻", "City moments") },
        ],
        resultsPublished: false,
        result: bi("", ""),
      }),
      entry("creator-local-020", {
        kind: "creator",
        title: bi("推薦下一季創作者（測試）", "Recommend a creator (test)"),
        summary: bi(
          "每帳號每輪一份推薦；官方審核前僅本人可查看。請勿輸入私人聯絡資料。",
          "One recommendation per account per round, private until official review. Do not submit private contact details.",
        ),
        ...period,
        limit: 1,
        options: [],
        resultsPublished: false,
        result: bi("", ""),
      }),
    ],
    activities: [
      entry("activity-local-020", {
        title: bi("首次探索活動示意", "Sample first exploration activity"),
        summary: bi(
          "查看卡冊後記錄參與；未提供 KP 或卡牌獎勵。",
          "View your album and record participation. No KP or card rewards.",
        ),
        ...period,
        claimUntil: "2026-11-08T00:00:00Z",
        eligibility: "account",
        condition: "album",
        instructions: bi(
          "先登入本機測試帳號，查看卡冊，再回此頁記錄參與。",
          "Select a Local Test account, view your album, then return to record participation.",
        ),
        rewardKind: "none",
        result: bi(
          "尚無活動結果；此為流程測試。",
          "No activity result yet; this is a workflow test.",
        ),
      }),
    ],
    tasks: tasks.map((t) => ({ ...t, enabled: true })),
  };
  d.transaction(() => {
    d.db
      .prepare(
        "INSERT OR IGNORE INTO participation_view_events SELECT 'legacy-view:'||user_id||':'||kind,user_id,kind,at FROM participation_views v WHERE NOT EXISTS (SELECT 1 FROM participation_view_events e WHERE e.user_id=v.user_id AND e.kind=v.kind)",
      )
      .run();
    const value = JSON.stringify(doc);
    d.db.prepare("INSERT OR IGNORE INTO documents VALUES('participation',1,?)").run(value);
    d.db.prepare("INSERT OR IGNORE INTO document_versions VALUES('participation',1,?)").run(value);
  });
}
const exact = (v, keys) =>
  v &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  Object.keys(v).sort().join(",") === keys.split(",").sort().join(",");
function text(v, max = 2000) {
  if (
    !exact(v, "zh-TW,en") ||
    Object.values(v).some((s) => typeof s !== "string" || s.length > max)
  )
    fail("Bounded bilingual text required");
}
function date(v) {
  if (
    typeof v !== "string" ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d(\.\d+)?)?(Z|[+-]\d\d:\d\d)$/.test(v) ||
    !Number.isFinite(Date.parse(v))
  )
    fail("Timezone ISO date required");
}
function validate(kind, v) {
  const keys =
    kind === "round"
      ? "kind,title,summary,startAt,endAt,limit,options,resultsPublished,result"
      : "title,summary,startAt,endAt,claimUntil,eligibility,condition,instructions,rewardKind,result";
  if (!exact(v, keys)) fail("Known content fields required");
  text(v.title, 150);
  text(v.summary);
  text(v.result);
  if (Object.values(v.title).some((s) => !s.trim())) fail("Bilingual title required");
  date(v.startAt);
  date(v.endAt);
  if (Date.parse(v.startAt) >= Date.parse(v.endAt)) fail("End must follow start");
  if (kind === "round") {
    if (
      !["theme", "creator"].includes(v.kind) ||
      !Number.isSafeInteger(v.limit) ||
      v.limit < 1 ||
      v.limit > 5 ||
      typeof v.resultsPublished !== "boolean" ||
      !Array.isArray(v.options)
    )
      fail("Invalid round settings");
    if (v.kind === "creator" && (v.limit !== 1 || v.options.length))
      fail("Creator rounds accept one moderated recommendation, not ballots");
    if (
      v.kind === "theme" &&
      (v.options.length < 2 ||
        v.options.length > 12 ||
        new Set(v.options.map((o) => o?.id)).size !== v.options.length)
    )
      fail("Two to twelve distinct options required");
    for (const o of v.options) {
      if (
        !exact(o, "id,title") ||
        typeof o.id !== "string" ||
        !/^opt-[a-z0-9-]+$|^[a-z][a-z0-9-]{0,49}$/.test(o.id)
      )
        fail("Invalid option");
      text(o.title, 100);
      if (Object.values(o.title).some((s) => !s.trim())) fail("Option titles required");
    }
  } else {
    date(v.claimUntil);
    text(v.instructions);
    if (
      Date.parse(v.claimUntil) < Date.parse(v.endAt) ||
      !["account", "member"].includes(v.eligibility) ||
      !tasks.some((t) => t.id === v.condition) ||
      !["none", "pending"].includes(v.rewardKind)
    )
      fail("Unsupported eligibility/reward or claim time");
  }
}
const current = (d, kind, id) =>
  d
    .document("participation")
    .data[kind === "round" ? "rounds" : "activities"].find((r) => r.id === id);
const state = (d, row) =>
  row.status !== "published" || !row.published
    ? "unavailable"
    : d.clock() < Date.parse(row.published.startAt)
      ? "upcoming"
      : d.clock() >= Date.parse(row.published.endAt)
        ? "ended"
        : "open";
const open = (d, row) => {
  if (state(d, row) !== "open") fail("Not open for participation", 409);
};
function condition(d, u, kind) {
  if (kind === "profile")
    return (
      (d.db.prepare("SELECT version FROM collection_profiles WHERE user_id=?").get(u.id)?.version ??
        0) > 1
    );
  if (kind === "first")
    return !!d.db
      .prepare("SELECT 1 FROM asset_events WHERE user_id=? AND delta>0 LIMIT 1")
      .get(u.id);
  if (kind === "album")
    return !!d.db
      .prepare("SELECT 1 FROM participation_views WHERE user_id=? AND kind='album'")
      .get(u.id);
  return !!d.db.prepare("SELECT 1 FROM participation_votes WHERE user_id=? LIMIT 1").get(u.id);
}
function activityEvidence(d, u, p) {
  let at = null;
  if (p.condition === "album")
    at = d.db
      .prepare(
        "SELECT at FROM participation_view_events WHERE user_id=? AND kind='album' AND at>=? AND at<? ORDER BY at LIMIT 1",
      )
      .get(u.id, p.startAt, p.endAt)?.at;
  else if (p.condition === "profile")
    at = d.db
      .prepare(
        "SELECT at FROM audit WHERE actor=? AND action='collection.profile' AND at>=? AND at<? ORDER BY at LIMIT 1",
      )
      .get(u.id, p.startAt, p.endAt)?.at;
  else if (p.condition === "first")
    at = d.db
      .prepare("SELECT MIN(at) at FROM asset_events WHERE user_id=? AND delta>0")
      .get(u.id)?.at;
  else
    at = d.db
      .prepare(
        "SELECT at FROM participation_votes WHERE user_id=? AND at>=? AND at<? ORDER BY at LIMIT 1",
      )
      .get(u.id, p.startAt, p.endAt)?.at;
  return at && Date.parse(at) >= Date.parse(p.startAt) && Date.parse(at) < Date.parse(p.endAt)
    ? { type: p.condition, at }
    : null;
}
function syncTasks(d, u) {
  const doc = d.document("participation");
  for (const t of doc.data.tasks.filter((t) => t.enabled && condition(d, u, t.id))) {
    const value = {
      ...t,
      ruleVersion: doc.version,
      completedAt: d.at(),
      rewardGranted: false,
      synthetic: true,
    };
    const changed = d.db
      .prepare("INSERT OR IGNORE INTO participation_tasks VALUES(?,?,?,?)")
      .run(u.id, t.id, d.at(), JSON.stringify(value)).changes;
    if (changed) {
      d.log(u.id, "participation.task", t.id);
      d.fault("after-participation-task");
    }
  }
}
export function publicParticipation(d) {
  const doc = d.document("participation");
  return {
    synthetic: true,
    version: doc.version,
    rounds: doc.data.rounds
      .filter((r) => r.status === "published" && r.published)
      .map((r) => {
        const p = r.published,
          ended = state(d, r) === "ended",
          show = ended && p.resultsPublished;
        return {
          id: r.id,
          ...p,
          result: show ? p.result : bi("", ""),
          state: state(d, r),
          resultsPublished: show,
          counts:
            show && p.kind === "theme"
              ? p.options.map((o) => ({
                  optionId: o.id,
                  count: d.db
                    .prepare(
                      "SELECT COUNT(*) n FROM participation_votes WHERE round_id=? AND option_id=?",
                    )
                    .get(r.id, o.id).n,
                }))
              : [],
          recommendations:
            show && p.kind === "creator"
              ? d.db
                  .prepare("SELECT payload FROM participation_recommendations WHERE round_id=?")
                  .all(r.id)
                  .map((r) => JSON.parse(r.payload))
                  .filter((r) => r.status === "approved")
                  .map(({ name, url }) => ({ name, url }))
              : [],
        };
      }),
    activities: doc.data.activities
      .filter((r) => r.status === "published" && r.published)
      .map((r) => ({ id: r.id, ...r.published, state: state(d, r) })),
    tasks: doc.data.tasks.map(({ id, title, enabled }) => ({ id, title, enabled })),
  };
}
export function participationMe(d, token) {
  const u = d.actor(token);
  return d.transaction(() => {
    syncTasks(d, u);
    return {
      actorId: u.id,
      activityEligibility: d
        .document("participation")
        .data.activities.filter((r) => r.status === "published" && r.published)
        .map((r) => ({
          activityId: r.id,
          eligible: r.published.eligibility === "account" || u.role === "member",
          conditionMet: !!activityEvidence(d, u, r.published),
          claimOpen:
            d.clock() >= Date.parse(r.published.startAt) &&
            d.clock() < Date.parse(r.published.claimUntil),
        })),
      votes: d.db
        .prepare("SELECT round_id,option_id FROM participation_votes WHERE user_id=?")
        .all(u.id),
      recommendations: d.db
        .prepare(
          "SELECT id,round_id,version,payload FROM participation_recommendations WHERE user_id=?",
        )
        .all(u.id)
        .map(({ payload, ...r }) => ({ ...r, ...JSON.parse(payload) })),
      tasks: d.db
        .prepare("SELECT payload FROM participation_tasks WHERE user_id=?")
        .all(u.id)
        .map((r) => JSON.parse(r.payload)),
      claims: d.db
        .prepare("SELECT payload FROM participation_claims WHERE user_id=?")
        .all(u.id)
        .map((r) => JSON.parse(r.payload)),
    };
  });
}
export function participationCommand(d, token, input, key) {
  return d.mutation(token, input, key, "participation-member", (u) => {
    if (!input || typeof input.action !== "string") fail("Known command required");
    if (input.action === "album-view") {
      if (!exact(input, "action")) fail("Unknown view fields");
      d.db
        .prepare(
          "INSERT INTO participation_views VALUES(?,'album',?) ON CONFLICT(user_id,kind) DO UPDATE SET at=excluded.at",
        )
        .run(u.id, d.at());
      d.db
        .prepare("INSERT INTO participation_view_events VALUES(?,?,'album',?)")
        .run(randomUUID(), u.id, d.at());
      d.log(u.id, "participation.album-view", "album");
    } else if (input.action === "vote") {
      if (!exact(input, "action,roundId,optionId")) fail("Known vote fields required");
      const row = current(d, "round", input.roundId);
      open(d, row ?? {});
      const p = row.published;
      if (p.kind !== "theme" || !p.options.some((o) => o.id === input.optionId))
        fail("Known theme option required");
      const existing = d.db
        .prepare("SELECT option_id FROM participation_votes WHERE user_id=? AND round_id=?")
        .all(u.id, input.roundId);
      if (existing.some((v) => v.option_id === input.optionId))
        fail("Already voted for this option", 409);
      if (existing.length >= p.limit) fail("Round vote limit reached", 409);
      d.db
        .prepare("INSERT INTO participation_votes VALUES(?,?,?,?,?,?)")
        .run(
          randomUUID(),
          u.id,
          row.id,
          input.optionId,
          d.at(),
          JSON.stringify({ rule: structuredClone(p), synthetic: true }),
        );
      d.log(u.id, "participation.vote", row.id);
      d.fault("after-participation-vote");
    } else if (input.action === "recommend") {
      if (
        !exact(input, "action,roundId,name,url,reason") ||
        typeof input.name !== "string" ||
        !input.name.trim() ||
        input.name.length > 100 ||
        typeof input.reason !== "string" ||
        input.reason.length > 1500 ||
        typeof input.url !== "string" ||
        input.url.length > 500
      )
        fail("Bounded public creator recommendation required");
      const row = current(d, "round", input.roundId);
      open(d, row ?? {});
      if (row.published.kind !== "creator") fail("Creator recommendation round required");
      if (input.url) {
        try {
          const url = new URL(input.url);
          if (url.protocol !== "https:" || url.username || url.password) throw Error();
        } catch {
          fail("HTTPS public source URL required");
        }
      }
      if (
        d.db
          .prepare("SELECT 1 FROM participation_recommendations WHERE user_id=? AND round_id=?")
          .get(u.id, row.id)
      )
        fail("One recommendation per account/round", 409);
      const payload = {
        name: input.name,
        url: input.url,
        reason: input.reason,
        status: "pending",
        reviewNote: "",
        rule: structuredClone(row.published),
        synthetic: true,
      };
      d.db
        .prepare("INSERT INTO participation_recommendations VALUES(?,?,?,1,?)")
        .run(randomUUID(), u.id, row.id, JSON.stringify(payload));
      d.log(u.id, "participation.recommend", row.id);
      d.fault("after-participation-recommend");
    } else if (input.action === "claim") {
      if (!exact(input, "action,activityId")) fail("Known activity fields required");
      const row = current(d, "activity", input.activityId);
      if (!row || row.status !== "published" || !row.published) fail("Activity unavailable", 404);
      const p = row.published;
      if (d.clock() < Date.parse(p.startAt) || d.clock() >= Date.parse(p.claimUntil))
        fail("Claim window closed", 409);
      if (p.eligibility === "member" && u.role !== "member") fail("Member-only activity", 403);
      const evidence = activityEvidence(d, u, p);
      if (!evidence) fail("Condition must be completed during the activity period", 409);
      const prior = d.db
        .prepare("SELECT payload FROM participation_claims WHERE user_id=? AND activity_id=?")
        .get(u.id, row.id);
      if (prior) return JSON.parse(prior.payload);
      const value = {
        activityId: row.id,
        recordedAt: d.at(),
        ruleVersion: p.ruleVersion,
        rule: structuredClone(p),
        rewardGranted: false,
        assetReward: false,
        status: "participation-recorded",
        conditionEvidence: evidence,
        synthetic: true,
      };
      d.db
        .prepare("INSERT INTO participation_claims VALUES(?,?,?,?,?)")
        .run(randomUUID(), u.id, row.id, d.at(), JSON.stringify(value));
      d.db
        .prepare("INSERT OR IGNORE INTO collection_participation VALUES(?,?,?,?,?)")
        .run(randomUUID(), u.id, row.id, d.at(), u.id);
      d.log(u.id, "participation.claim", row.id);
      d.fault("after-participation-claim");
      syncTasks(d, u);
      return value;
    } else fail("Unsupported command");
    syncTasks(d, u);
    return { recorded: true, synthetic: true, rewardGranted: false };
  });
}
export function participationAdmin(d, token) {
  d.official(token);
  return {
    ...d.document("participation"),
    recommendations: d.db
      .prepare("SELECT id,round_id,version,payload FROM participation_recommendations")
      .all()
      .map(({ payload, ...r }) => ({ ...r, ...JSON.parse(payload) })),
  };
}
export function participationAdminCommand(d, token, input, key) {
  return d.mutation(token, input, key, "participation-admin", (u) => {
    if (input?.action === "review") {
      if (
        !exact(input, "action,id,expectedVersion,status,note") ||
        !["approved", "rejected"].includes(input.status) ||
        typeof input.note !== "string" ||
        input.note.length > 1000 ||
        !input.note.trim()
      )
        fail("Review status and explanation required");
      const r = d.db
        .prepare("SELECT * FROM participation_recommendations WHERE id=?")
        .get(input.id);
      if (!r) fail("Recommendation unavailable", 404);
      if (r.version !== input.expectedVersion) fail("Review changed; reload", 409);
      const p = JSON.parse(r.payload);
      if (p.status !== "pending") fail("Already reviewed", 409);
      p.status = input.status;
      p.reviewNote = input.note;
      d.db
        .prepare("UPDATE participation_recommendations SET version=version+1,payload=? WHERE id=?")
        .run(JSON.stringify(p), r.id);
      d.log(u.id, "participation.review", r.id + ":" + input.status);
      d.fault("after-participation-review");
      return { version: r.version + 1 };
    }
    if (input?.action === "tasks") {
      if (
        !exact(input, "action,expectedVersion,tasks") ||
        !Array.isArray(input.tasks) ||
        input.tasks.length !== tasks.length
      )
        fail("Stable task rules required");
      const doc = d.document("participation");
      if (doc.version !== input.expectedVersion) fail("Rules changed", 409);
      input.tasks.forEach((t, i) => {
        if (!exact(t, "id,title,enabled") || t.id !== tasks[i].id || typeof t.enabled !== "boolean")
          fail("Stable task identity required");
        text(t.title, 150);
      });
      return d.writeDocument(
        "participation",
        doc,
        { ...doc.data, tasks: input.tasks },
        u.id,
        "participation.task-rules",
      );
    }
    if (
      !exact(input, "action,expectedVersion,kind,id,value") ||
      !["save", "publish", "withdraw"].includes(input.action) ||
      !["round", "activity"].includes(input.kind) ||
      typeof input.id !== "string" ||
      !/^local-[a-z0-9-]{1,60}$|^(theme|creator|activity)-local-020$/.test(input.id)
    )
      fail("Known content command required");
    const doc = d.document("participation");
    if (doc.version !== input.expectedVersion) fail("Content changed; reload", 409);
    const next = structuredClone(doc.data),
      list = next[input.kind === "round" ? "rounds" : "activities"];
    let row = list.find((r) => r.id === input.id);
    if (input.action === "save") {
      validate(input.kind, input.value);
      if (!row) {
        row = { id: input.id, status: "draft", draft: input.value, published: null };
        list.push(row);
      } else row.draft = input.value;
    } else {
      if (input.value !== null || !row) fail("Saved content required");
      if (input.action === "withdraw") row.status = "withdrawn";
      else {
        validate(input.kind, row.draft);
        const hasParticipation =
          input.kind === "round"
            ? d.db
                .prepare(
                  "SELECT 1 FROM participation_votes WHERE round_id=? UNION SELECT 1 FROM participation_recommendations WHERE round_id=? LIMIT 1",
                )
                .get(row.id, row.id)
            : d.db
                .prepare("SELECT 1 FROM participation_claims WHERE activity_id=? LIMIT 1")
                .get(row.id);
        if (hasParticipation && row.published) {
          const structural =
            input.kind === "round"
              ? ["kind", "startAt", "endAt", "limit", "options"]
              : ["startAt", "endAt", "claimUntil", "eligibility", "condition", "rewardKind"];
          for (const field of structural)
            if (JSON.stringify(row.draft[field]) !== JSON.stringify(row.published[field]))
              fail("Participation exists; create a new round/activity for condition changes", 409);
        }
        row.status = "published";
        row.published = { ...row.draft, ruleVersion: doc.version + 1 };
      }
    }
    return d.writeDocument("participation", doc, next, u.id, "participation." + input.action);
  });
}
