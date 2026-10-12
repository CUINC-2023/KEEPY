import { randomBytes, randomUUID, createHash } from "node:crypto";
import { validWorkbench } from "../src/lib/collection-workbench.mjs";
import { FIXTURES, ApiError } from "./database.mjs";
import { recordDiscoveryEvent } from "./discovery.mjs";
import { collectionReadContract } from "../src/lib/collection-contract.mjs";
import { previewPlayerLevel } from "../src/lib/player-level-preview.mjs";
import { previewPlatformLevel } from "../src/lib/platform-level-preview.mjs";
import { publicParticipation } from "./participation.mjs";
const fail = (message, status = 422) => {
  throw new ApiError(status, "collection", message);
};
const parse = JSON.parse;
const defaultProfile = () => ({
  isPublic: false,
  displayName: "Local collector",
  bio: "",
  mainCardId: null,
  shelfIds: [],
  showCards: false,
  showProgress: false,
  showBadges: false,
  showRanking: false,
});
export function initCollection(d) {
  d.db
    .exec(`CREATE TABLE IF NOT EXISTS collection_profiles(user_id TEXT PRIMARY KEY REFERENCES users(id),handle TEXT UNIQUE NOT NULL,version INTEGER NOT NULL,payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS collection_definitions(card_id TEXT,version INTEGER,payload TEXT NOT NULL,PRIMARY KEY(card_id,version));
    CREATE TABLE IF NOT EXISTS collection_growth(user_id TEXT REFERENCES users(id),card_id TEXT,growth_level INTEGER,policy_version INTEGER,PRIMARY KEY(user_id,card_id));
    CREATE TABLE IF NOT EXISTS collection_awards(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),rule_id TEXT,subject TEXT,rule_version INTEGER NOT NULL,payload TEXT NOT NULL,UNIQUE(user_id,rule_id,subject));
    CREATE TABLE IF NOT EXISTS collection_participation(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),activity_id TEXT,at TEXT NOT NULL,actor TEXT NOT NULL,UNIQUE(user_id,activity_id));
    CREATE TRIGGER IF NOT EXISTS collection_definitions_immutable BEFORE UPDATE ON collection_definitions BEGIN SELECT RAISE(ABORT,'immutable'); END;
    CREATE TRIGGER IF NOT EXISTS collection_awards_immutable BEFORE UPDATE ON collection_awards BEGIN SELECT RAISE(ABORT,'immutable'); END;
    CREATE TRIGGER IF NOT EXISTS collection_participation_immutable BEFORE UPDATE ON collection_participation BEGIN SELECT RAISE(ABORT,'immutable'); END;`);
  d.transaction(() => {
    for (const f of FIXTURES)
      d.db
        .prepare("INSERT OR IGNORE INTO collection_profiles VALUES(?,?,1,?)")
        .run(f.id, "c-" + randomBytes(10).toString("hex"), JSON.stringify(defaultProfile()));
    for (const c of d.catalog.cards)
      d.db.prepare("INSERT OR IGNORE INTO collection_definitions VALUES(?,1,?)").run(
        c.id,
        JSON.stringify({
          cardId: c.id,
          poolId: c.poolId,
          name: c.name,
          rarity: c.grade,
          cardVersion: 1,
          definitionSource: "synthetic catalogue v1; historical source snapshots unchanged",
        }),
      );
    const rules = {
      schema: 1,
      visibility: d.catalog.pools.map((p) => ({ poolId: p.id, hiddenGrades: [] })),
      achievements: [
        {
          id: "first-collection",
          type: "first",
          enabled: true,
          threshold: 1,
          poolId: "",
          title: { "zh-TW": "首次收藏", en: "First collection" },
        },
        {
          id: "series-complete",
          type: "series",
          enabled: true,
          threshold: 100,
          poolId: "",
          title: { "zh-TW": "完成公開系列", en: "Complete a public series" },
        },
        {
          id: "official-activity",
          type: "activity",
          enabled: true,
          threshold: 1,
          poolId: "",
          title: { "zh-TW": "官方活動參與", en: "Official activity participation" },
        },
      ],
      proposal: {
        status: "pending",
        rarityEffect: "undecided",
        duplicateMode: "undecided",
        sharedMaterials: null,
        recipeCount: null,
        successPct: null,
        pityCount: null,
        minimumKeep: null,
        note: {
          "zh-TW": "正式成長與合成政策尚未核定；預覽不消耗卡或 KP。",
          en: "Growth and synthesis policy is unapproved; previews consume no cards or KP.",
        },
      },
    };
    const payload = JSON.stringify(rules);
    d.db.prepare("INSERT OR IGNORE INTO documents VALUES('collection-rules',1,?)").run(payload);
    d.db
      .prepare("INSERT OR IGNORE INTO document_versions VALUES('collection-rules',1,?)")
      .run(payload);
  });
}
export function collectionCatalogue(d) {
  const rules = d.document("collection-rules"),
    published = d.publicDiscovery().items.filter((i) => i.kind === "series");
  const pools = d.pools();
  const cards = d.db
    .prepare("SELECT payload FROM collection_definitions WHERE version=1")
    .all()
    .map((r) => parse(r.payload))
    .filter(
      (c) =>
        d.catalog.cards.some(
          (actual) =>
            actual.id === c.cardId && actual.poolId === c.poolId && actual.grade === c.rarity,
        ) &&
        published.some((p) => p.referenceId === c.poolId) &&
        pools.some((p) => p.id === c.poolId && p.visibility !== "hidden") &&
        rules.data.visibility.some(
          (v) => v.poolId === c.poolId && !v.hiddenGrades.includes(c.rarity),
        ),
    );
  return {
    synthetic: true,
    readContract: collectionReadContract("catalogue"),
    version: rules.version,
    visibilityKey: createHash("sha256")
      .update(
        JSON.stringify([
          rules.version,
          cards.map((c) => c.cardId),
          published.map((p) => p.referenceId),
        ]),
      )
      .digest("hex"),
    cards,
    pools: published.map((p) => ({
      poolId: p.referenceId,
      title: p.copy.title,
      visibleDesigns: cards.filter((c) => c.poolId === p.referenceId).length,
      releaseAt: p.releaseAt,
      withdrawAt: p.withdrawAt,
    })),
    proposal: rules.data.proposal,
  };
}
function acquired(d, id) {
  return new Set(
    d.db
      .prepare("SELECT DISTINCT card_id FROM asset_events WHERE user_id=? AND delta>0")
      .all(id)
      .map((r) => r.card_id),
  );
}
export function collectionProgress(d, id) {
  const catalog = collectionCatalogue(d),
    got = acquired(d, id);
  return catalog.pools.map((p) => {
    const ids = catalog.cards.filter((c) => c.poolId === p.poolId).map((c) => c.cardId),
      owned = ids.filter((c) => got.has(c)).length;
    return {
      poolId: p.poolId,
      title: p.title,
      owned,
      total: ids.length,
      pct: ids.length ? Math.floor((owned / ids.length) * 100) : 0,
      complete: ids.length > 0 && owned === ids.length,
      ruleVersion: catalog.version,
    };
  });
}
function awardVisible(d, a) {
  if (a.type !== "series") return true;
  const visible = new Set(collectionCatalogue(d).cards.map((c) => c.cardId));
  return a.catalogueIds.every((id) => visible.has(id));
}
function syncAwards(d, u) {
  const rules = d.document("collection-rules"),
    catalog = collectionCatalogue(d),
    got = acquired(d, u.id),
    progress = collectionProgress(d, u.id);
  const activityCount = d.db
    .prepare("SELECT COUNT(*) AS n FROM collection_participation WHERE user_id=?")
    .get(u.id).n;
  for (const rule of rules.data.achievements.filter((r) => r.enabled)) {
    const subjects =
      rule.type === "first" &&
      catalog.cards.filter((c) => got.has(c.cardId)).length >= rule.threshold
        ? ["first"]
        : rule.type === "activity" && activityCount >= rule.threshold
          ? ["activity"]
          : rule.type === "series"
            ? progress
                .filter((p) => p.complete && (!rule.poolId || p.poolId === rule.poolId))
                .map((p) => p.poolId)
            : [];
    for (const subject of subjects) {
      const payload = {
        id: randomUUID(),
        ruleId: rule.id,
        ruleVersion: rules.version,
        type: rule.type,
        subject,
        title: rule.title,
        recordedAt: d.at(),
        synthetic: true,
        catalogueIds:
          rule.type === "series"
            ? catalog.cards.filter((c) => c.poolId === subject).map((c) => c.cardId)
            : [],
        condition: structuredClone(rule),
      };
      const changed = d.db
        .prepare("INSERT OR IGNORE INTO collection_awards VALUES(?,?,?,?,?,?)")
        .run(payload.id, u.id, rule.id, subject, rules.version, JSON.stringify(payload)).changes;
      if (changed) {
        d.log(u.id, "collection.achievement", rule.id + ":" + subject);
        if (rule.type === "series") recordDiscoveryEvent(d, u.id, "series-complete", subject);
        d.fault("after-collection-award");
      }
    }
  }
}
function awards(d, id, publicOnly = false, details = false) {
  return d.db
    .prepare("SELECT payload FROM collection_awards WHERE user_id=? ORDER BY rowid DESC")
    .all(id)
    .map((r) => parse(r.payload))
    .filter((a) => !publicOnly || awardVisible(d, a))
    .map(({ catalogueIds, condition, ...a }) => {
      void catalogueIds;
      return details
        ? { ...a, earnedCondition: { type: condition.type, threshold: condition.threshold } }
        : a;
    });
}
export function readEarnedCollectionRecords(d, token) {
  return awards(d, d.actor(token).id, true);
}
export function collectionMe(d, token) {
  const u = d.actor(token);
  return d.transaction(() => {
    syncAwards(d, u);
    const catalogue = collectionCatalogue(d),
      profile = d.db.prepare("SELECT * FROM collection_profiles WHERE user_id=?").get(u.id);
    const held = d.db
      .prepare("SELECT card_id,count FROM holdings WHERE user_id=? AND count>0")
      .all(u.id);
    const acquiredIds = acquired(d, u.id);
    const heldById = new Map(held.map((h) => [h.card_id, h.count]));
    const profileData = parse(profile.payload);
    if (profileData.collectionSearch && validWorkbench(profileData.collectionSearch)) {
      if (!catalogue.pools.some((p) => p.poolId === profileData.collectionSearch.poolId))
        profileData.collectionSearch.poolId = "";
      if (!catalogue.cards.some((c) => c.rarity === profileData.collectionSearch.rarity))
        profileData.collectionSearch.rarity = "all";
    }
    const displayable = new Set(
      catalogue.cards.filter((c) => heldById.has(c.cardId)).map((c) => c.cardId),
    );
    if (Array.isArray(profileData.curations))
      profileData.curations = profileData.curations.map((group) => ({
        ...group,
        cardIds: Array.isArray(group.cardIds)
          ? group.cardIds.filter((id) => displayable.has(id))
          : [],
      }));
    for (const card of held)
      d.db
        .prepare("INSERT OR IGNORE INTO collection_growth VALUES(?,?,NULL,NULL)")
        .run(u.id, card.card_id);
    return {
      actorId: u.id,
      readContract: collectionReadContract("owner"),
      synthetic: true,
      profile: { handle: profile.handle, version: profile.version, data: profileData },
      progress: collectionProgress(d, u.id),
      cards: catalogue.cards
        .filter((c) => heldById.has(c.cardId))
        .map((c) => ({
          ...c,
          count: heldById.get(c.cardId),
          growthLevel: null,
          growthPolicyVersion: null,
        })),
      awards: awards(d, u.id, true, true),
      rulesVersion: catalogue.version,
      visibilityKey: catalogue.visibilityKey,
      acquiredCards: catalogue.cards
        .filter((c) => acquiredIds.has(c.cardId))
        .map((c) => ({ ...c, count: heldById.get(c.cardId) ?? 0 })),
      recent: d.db
        .prepare(
          "SELECT card_id,source,at FROM asset_events WHERE user_id=? AND delta>0 AND card_id IN (SELECT value FROM json_each(?)) ORDER BY at DESC,id DESC LIMIT 10",
        )
        .all(u.id, JSON.stringify(catalogue.cards.map((c) => c.cardId)))
        .map((e) => ({ cardId: e.card_id, source: e.source, at: e.at })),
    };
  });
}
function validateProfile(d, u, p) {
  if (
    !p ||
    Object.keys(p)
      .filter(
        (k) =>
          ![
            "badgeIds",
            "presentation",
            "goalPoolIds",
            "growthPreview",
            "journeyPaused",
            "curations",
            "readingLayout",
            "collectionSearch",
          ].includes(k),
      )
      .sort()
      .join(",") !== Object.keys(defaultProfile()).sort().join(",")
  )
    fail("Unknown profile fields");
  if (p.collectionSearch !== undefined) {
    const cat = collectionCatalogue(d);
    if (
      !validWorkbench(p.collectionSearch) ||
      (p.collectionSearch.poolId &&
        !cat.pools.some((v) => v.poolId === p.collectionSearch.poolId)) ||
      (p.collectionSearch.rarity !== "all" &&
        !cat.cards.some((v) => v.rarity === p.collectionSearch.rarity))
    )
      fail("Invalid private search preference");
  }
  if (
    p.readingLayout !== undefined &&
    (!p.readingLayout ||
      Object.keys(p.readingLayout).sort().join() !== "first,mode,schema" ||
      p.readingLayout.schema !== 1 ||
      !["full", "compact"].includes(p.readingLayout.mode) ||
      !["timeline", "awards", "growth", "play", "curations"].includes(p.readingLayout.first))
  )
    fail("Invalid private reading layout");
  if (p.journeyPaused !== undefined && typeof p.journeyPaused !== "boolean")
    fail("Invalid private journey preference");
  if (
    p.curations !== undefined &&
    (!Array.isArray(p.curations) ||
      p.curations.length > 6 ||
      new Set(p.curations.map((g) => g?.id)).size !== p.curations.length ||
      p.curations.some(
        (g) =>
          !g ||
          Object.keys(g).sort().join() !== "cardIds,id,note,showPublic,title" ||
          typeof g.id !== "string" ||
          !/^curation-[a-z0-9-]{1,40}$/.test(g.id) ||
          typeof g.title !== "string" ||
          !g.title.trim() ||
          g.title.length > 60 ||
          typeof g.note !== "string" ||
          g.note.length > 240 ||
          typeof g.showPublic !== "boolean" ||
          !Array.isArray(g.cardIds) ||
          g.cardIds.length > 12 ||
          new Set(g.cardIds).size !== g.cardIds.length ||
          g.cardIds.some((id) => typeof id !== "string"),
      ))
  )
    fail("Invalid bounded curation groups");
  if (
    p.growthPreview !== undefined &&
    (!p.growthPreview ||
      Object.keys(p.growthPreview).sort().join(",") !== "platform,player" ||
      typeof p.growthPreview.player !== "boolean" ||
      typeof p.growthPreview.platform !== "boolean")
  )
    fail("Explicit boolean growth preview choices required");
  for (const k of ["isPublic", "showCards", "showProgress", "showBadges", "showRanking"])
    if (typeof p[k] !== "boolean") fail("Invalid public control");
  if (p.goalPoolIds !== undefined) {
    const pools = new Set(collectionCatalogue(d).pools.map((p) => p.poolId));
    if (
      !Array.isArray(p.goalPoolIds) ||
      p.goalPoolIds.length > 12 ||
      new Set(p.goalPoolIds).size !== p.goalPoolIds.length ||
      p.goalPoolIds.some((id) => !pools.has(id))
    )
      fail("Only currently public albums may be selected as goals");
  }
  if (p.badgeIds !== undefined) {
    const earned = new Set(awards(d, u.id, true).map((a) => a.id));
    if (
      !Array.isArray(p.badgeIds) ||
      p.badgeIds.length > 12 ||
      new Set(p.badgeIds).size !== p.badgeIds.length ||
      p.badgeIds.some((id) => !earned.has(id))
    )
      fail("Only your earned, currently visible badges may be selected");
  }
  if (p.presentation !== undefined) {
    const x = p.presentation,
      pools = new Set(collectionCatalogue(d).pools.map((p) => p.poolId));
    if (
      !x ||
      Object.keys(x)
        .filter((k) => !["theme", "shelfLayout", "coverMode", "badgeLayout"].includes(k))
        .sort()
        .join(",") !== "bioEn,layout,poolIds" ||
      (x.theme !== undefined &&
        !["classic", "quiet", "contrast", "linen", "aurora", "ink", "dawn"].includes(x.theme)) ||
      (x.coverMode !== undefined && !["plain", "band"].includes(x.coverMode)) ||
      (x.badgeLayout !== undefined && !["list", "grid"].includes(x.badgeLayout)) ||
      (x.shelfLayout !== undefined && !["grid", "wide"].includes(x.shelfLayout)) ||
      !["collector", "albums", "badges"].includes(x.layout) ||
      typeof x.bioEn !== "string" ||
      x.bioEn.length > 500 ||
      !Array.isArray(x.poolIds) ||
      x.poolIds.length > 12 ||
      new Set(x.poolIds).size !== x.poolIds.length ||
      x.poolIds.some((id) => !pools.has(id))
    )
      fail("Invalid showcase presentation / only currently public albums may be featured");
  }
  if (
    typeof p.displayName !== "string" ||
    !p.displayName.trim() ||
    p.displayName.length > 80 ||
    typeof p.bio !== "string" ||
    p.bio.length > 500
  )
    fail("Invalid display name/bio");
  if (p.mainCardId !== null && typeof p.mainCardId !== "string") fail("Invalid main card");
  if (
    !Array.isArray(p.shelfIds) ||
    p.shelfIds.length > 12 ||
    new Set(p.shelfIds).size !== p.shelfIds.length
  )
    fail("Shelf allows up to 12 distinct cards");
  const visible = new Set(collectionCatalogue(d).cards.map((c) => c.cardId)),
    selected = new Set(
      [p.mainCardId, ...p.shelfIds, ...(p.curations ?? []).flatMap((g) => g.cardIds)].filter(
        Boolean,
      ),
    );
  const held = new Set(
    d.db
      .prepare("SELECT card_id FROM holdings WHERE user_id=? AND count>0")
      .all(u.id)
      .map((h) => h.card_id),
  );
  if ([...selected].some((id) => !visible.has(id) || !held.has(id)))
    fail("Only owned, currently public designs may be displayed");
}
/** Official-only aggregate diagnosis; no owner identifiers or repair writes. */
export function collectionProfileHealth(d, token) {
  d.official(token);
  const catalogue = collectionCatalogue(d),
    publicIds = new Set(catalogue.cards.map((c) => c.cardId)),
    publicPools = new Set(catalogue.pools.map((p) => p.poolId));
  const report = {
    checked: 0,
    incompatible: 0,
    repairable: 0,
    removableSelections: 0,
    readOnly: true,
    applied: false,
  };
  for (const row of d.db
    .prepare(
      "SELECT p.user_id,p.payload FROM collection_profiles p JOIN users u ON u.id=p.user_id WHERE u.active=1",
    )
    .all()) {
    report.checked++;
    let value;
    try {
      value = parse(row.payload);
    } catch {
      report.incompatible++;
      continue;
    }
    const held = new Set(
      d.db
        .prepare("SELECT card_id FROM holdings WHERE user_id=? AND count>0")
        .all(row.user_id)
        .map((h) => h.card_id),
    );
    const earned = new Set(awards(d, row.user_id, true).map((a) => a.id));
    const candidate = structuredClone(value);
    let removed = 0;
    const trim = (ids, allowed) => {
      if (!Array.isArray(ids)) return ids;
      return ids.filter((id) => {
        const keep = allowed.has(id);
        if (!keep) removed++;
        return keep;
      });
    };
    const displayable = new Set([...publicIds].filter((id) => held.has(id)));
    if (candidate && typeof candidate === "object") {
      if (candidate.mainCardId !== null && !displayable.has(candidate.mainCardId)) {
        candidate.mainCardId = null;
        removed++;
      }
      candidate.shelfIds = trim(candidate.shelfIds, displayable);
      if (Array.isArray(candidate.curations))
        candidate.curations = candidate.curations.map((g) =>
          g && typeof g === "object" ? { ...g, cardIds: trim(g.cardIds, displayable) } : g,
        );
      if (candidate.badgeIds !== undefined) candidate.badgeIds = trim(candidate.badgeIds, earned);
      if (candidate.goalPoolIds !== undefined)
        candidate.goalPoolIds = trim(candidate.goalPoolIds, publicPools);
      if (candidate.presentation?.poolIds !== undefined)
        candidate.presentation.poolIds = trim(candidate.presentation.poolIds, publicPools);
    }
    try {
      validateProfile(d, { id: row.user_id }, value);
    } catch {
      report.incompatible++;
      try {
        validateProfile(d, { id: row.user_id }, candidate);
        if (removed) {
          report.repairable++;
          report.removableSelections += removed;
        }
      } catch {
        /* Do not invent repairs for unknown schema. */
      }
    }
  }
  return report;
}
export function previewCollectionProfile(d, token, input) {
  const u = d.actor(token);
  if (!input || Object.keys(input).sort().join(",") !== "data,expectedVersion")
    fail("Expected profile and version");
  const row = d.db.prepare("SELECT * FROM collection_profiles WHERE user_id=?").get(u.id);
  if (row.version !== input.expectedVersion) fail("Profile changed; reload", 409);
  validateProfile(d, u, input.data);
  return {
    version: row.version,
    visibilityKey: collectionCatalogue(d).visibilityKey,
    projection: input.data.isPublic ? projectCollection(d, row, input.data) : null,
  };
}
export function saveCollectionProfile(d, token, input, key) {
  return d.mutation(token, input, key, "collection-profile", (u) => {
    if (!input || Object.keys(input).sort().join(",") !== "data,expectedVersion")
      fail("Expected profile and version");
    const row = d.db.prepare("SELECT * FROM collection_profiles WHERE user_id=?").get(u.id);
    if (row.version !== input.expectedVersion) fail("Profile changed; reload", 409);
    const p = input.data;
    validateProfile(d, u, p);
    const version = row.version + 1;
    d.db
      .prepare("UPDATE collection_profiles SET version=?,payload=? WHERE user_id=?")
      .run(version, JSON.stringify(p), u.id);
    d.log(u.id, "collection.profile", row.handle + ":v" + version);
    d.fault("after-collection-profile");
    return { version };
  });
}
export function publicCollection(d, handle) {
  if (typeof handle !== "string" || !/^c-[a-f0-9]{20}$/.test(handle))
    fail("Collection unavailable", 404);
  const row = d.db
    .prepare(
      "SELECT p.*,u.active FROM collection_profiles p JOIN users u ON u.id=p.user_id WHERE handle=?",
    )
    .get(handle);
  if (!row || !row.active || !parse(row.payload).isPublic) fail("Collection unavailable", 404);
  return projectCollection(d, row, parse(row.payload));
}
function projectCollection(d, row, p) {
  const catalogue = collectionCatalogue(d);
  const growthPreview = {};
  if (p.growthPreview?.player || p.growthPreview?.platform) {
    const ids = acquired(d, row.user_id);
    const owner = {
      actorId: row.user_id,
      visibilityKey: catalogue.visibilityKey,
      acquiredCards: catalogue.cards.filter((c) => ids.has(c.cardId)),
      progress: collectionProgress(d, row.user_id),
      profile: { version: row.version },
    };
    if (p.growthPreview.player) {
      const result = previewPlayerLevel(owner, catalogue);
      if (result)
        growthPreview.player = {
          status: result.status,
          ruleVersion: result.ruleVersion,
          level: result.level,
          xp: result.xp,
        };
    }
    if (p.growthPreview.platform) {
      const participant = {
        actorId: row.user_id,
        tasks: d.db
          .prepare("SELECT payload FROM participation_tasks WHERE user_id=?")
          .all(row.user_id)
          .map((r) => parse(r.payload)),
        votes: d.db
          .prepare("SELECT round_id,option_id FROM participation_votes WHERE user_id=?")
          .all(row.user_id),
      };
      const result = previewPlatformLevel(participant, owner, publicParticipation(d));
      if (result)
        growthPreview.platform = {
          status: result.status,
          ruleVersion: result.ruleVersion,
          stage: result.stage,
        };
    }
  }
  const card = (id) => {
    const c = catalogue.cards.find((c) => c.cardId === id);
    return c &&
      d.db.prepare("SELECT count FROM holdings WHERE user_id=? AND card_id=?").get(row.user_id, id)
        ?.count > 0
      ? c
      : null;
  };
  return {
    handle: row.handle,
    readContract: collectionReadContract("showcase"),
    synthetic: true,
    displayName: p.displayName,
    bio: p.bio,
    bioEn: p.presentation?.bioEn ?? "",
    layout: p.presentation?.layout ?? "collector",
    theme: p.presentation?.theme ?? "classic",
    shelfLayout: p.presentation?.shelfLayout ?? "grid",
    coverMode: p.presentation?.coverMode ?? "plain",
    badgeLayout: p.presentation?.badgeLayout ?? "list",
    growthPreview,
    featured: p.showProgress
      ? (p.presentation?.poolIds ?? []).flatMap((id) =>
          collectionProgress(d, row.user_id).filter((x) => x.poolId === id),
        )
      : [],
    mainCard: p.showCards ? card(p.mainCardId) : null,
    shelf: p.showCards ? p.shelfIds.map(card).filter(Boolean) : [],
    curations: p.showCards
      ? (p.curations ?? [])
          .filter((g) => g.showPublic === true)
          .map((g) => ({
            title: g.title,
            note: g.note,
            cards: g.cardIds.map(card).filter(Boolean),
          }))
          .filter((g) => g.cards.length > 0)
      : [],
    progress: p.showProgress ? collectionProgress(d, row.user_id) : [],
    awards: p.showBadges
      ? p.badgeIds === undefined
        ? awards(d, row.user_id, true)
        : p.badgeIds.flatMap((id) => awards(d, row.user_id, true).filter((a) => a.id === id))
      : [],
  };
}
export function rankCollections(rows, { localPreview = false } = {}) {
  const handles = new Map();
  for (const row of rows) handles.set(row?.handle, (handles.get(row?.handle) ?? 0) + 1);
  const safe = rows
    .filter(
      (r) =>
        r &&
        (r.synthetic === false || (r.synthetic === true && localPreview)) &&
        r.isPublic === true &&
        r.showRanking === true &&
        typeof r.handle === "string" &&
        r.handle.length > 0 &&
        r.handle.length <= 100 &&
        handles.get(r.handle) === 1 &&
        typeof r.displayName === "string" &&
        r.displayName.trim().length > 0 &&
        r.displayName.length <= 80 &&
        Number.isSafeInteger(r.completion) &&
        r.completion >= 0 &&
        r.completion <= 100 &&
        [r.completedSeries, r.achievements].every((n) => Number.isSafeInteger(n) && n >= 0),
    )
    .map(({ handle, displayName, completion, completedSeries, achievements }) => ({
      handle,
      displayName,
      completion,
      completedSeries,
      achievements,
    }));
  safe.sort(
    (a, b) =>
      b.completion - a.completion ||
      b.completedSeries - a.completedSeries ||
      b.achievements - a.achievements ||
      a.handle.localeCompare(b.handle),
  );
  let previous = "",
    rank = 0;
  return safe.map((r, i) => {
    const score = [r.completion, r.completedSeries, r.achievements].join(":");
    if (score !== previous) {
      rank = i + 1;
      previous = score;
    }
    return { ...r, rank };
  });
}
export function rankingPage(rows, query = {}) {
  const q = typeof query.q === "string" && query.q.length <= 200 ? query.q.trim() : "";
  const requested = Number(query.page),
    pageSize = 20;
  const filtered = rows.filter((r) =>
    r.displayName.toLocaleLowerCase().includes(q.toLocaleLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, pages) : 1;
  return {
    rows: filtered.slice((page - 1) * pageSize, page * pageSize),
    q,
    page,
    pages,
    total: filtered.length,
    pageSize,
  };
}
export function collectionRankings(d, query = {}) {
  // All currently authorised accounts are synthetic. Never convert fixtures to real accounts via an admin flag.
  const rows = d.db
    .prepare(
      "SELECT p.payload,p.handle,u.id FROM collection_profiles p JOIN users u ON p.user_id=u.id WHERE u.active=1",
    )
    .all()
    .map((r) => {
      const p = parse(r.payload),
        progress = collectionProgress(d, r.id);
      return {
        handle: r.handle,
        displayName: p.displayName,
        isPublic: p.isPublic,
        showRanking: p.showRanking,
        synthetic: true,
        completion: progress.length
          ? Math.floor(progress.reduce((n, p) => n + p.pct, 0) / progress.length)
          : 0,
        completedSeries: progress.filter((p) => p.complete).length,
        achievements: awards(d, r.id, true).length,
      };
    });
  return {
    ...rankingPage(rankCollections(rows), query),
    readContract: collectionReadContract("ranking"),
    updatedAt: d.at(),
    ruleVersion: d.document("collection-rules").version,
    catalogueVersion: collectionCatalogue(d).version,
    visibilityKey: collectionCatalogue(d).visibilityKey,
    eligibilityVersion: "public-opt-in-nonsynthetic-v1",
    excludedSynthetic: true,
    metrics: ["series-completion", "completed-series", "achievements"],
    moneyMetric: false,
  };
}
export function saveCollectionRules(d, token, input, key) {
  return d.mutation(token, input, key, "collection-rules", (u) => {
    if (!input || Object.keys(input).sort().join(",") !== "data,expectedVersion")
      fail("Expected rules and version");
    const prior = d.document("collection-rules"),
      v = input.data;
    if (input.expectedVersion !== prior.version) fail("Rules changed; reload", 409);
    if (
      !v ||
      Object.keys(v).sort().join(",") !== "achievements,proposal,schema,visibility" ||
      v.schema !== 1
    )
      fail("Invalid rule fields");
    if (
      !Array.isArray(v.visibility) ||
      v.visibility.length !== d.catalog.pools.length ||
      new Set(v.visibility.map((r) => r.poolId)).size !== v.visibility.length
    )
      fail("All pool visibility controls required");
    for (const r of v.visibility)
      if (
        Object.keys(r).sort().join(",") !== "hiddenGrades,poolId" ||
        !d.catalog.pools.some((p) => p.id === r.poolId) ||
        !Array.isArray(r.hiddenGrades) ||
        new Set(r.hiddenGrades).size !== r.hiddenGrades.length ||
        r.hiddenGrades.some((g) => !d.catalog.grades.includes(g))
      )
        fail("Invalid visibility rule");
    if (!Array.isArray(v.achievements) || v.achievements.length !== prior.data.achievements.length)
      fail("Keep stable achievement identities");
    for (let i = 0; i < v.achievements.length; i++) {
      const a = v.achievements[i],
        old = prior.data.achievements[i];
      if (
        !a ||
        Object.keys(a).sort().join(",") !== "enabled,id,poolId,threshold,title,type" ||
        a.id !== old.id ||
        a.type !== old.type ||
        typeof a.enabled !== "boolean" ||
        !Number.isSafeInteger(a.threshold) ||
        a.threshold < 1 ||
        a.threshold > 1000 ||
        (a.type === "series" && a.threshold !== 100) ||
        typeof a.poolId !== "string" ||
        (a.type !== "series" && a.poolId !== "") ||
        (a.poolId && !d.catalog.pools.some((p) => p.id === a.poolId)) ||
        !a.title ||
        Object.keys(a.title).sort().join(",") !== "en,zh-TW" ||
        Object.values(a.title).some((t) => typeof t !== "string" || !t.trim() || t.length > 100)
      )
        fail("Invalid achievement condition");
    }
    const p = v.proposal,
      base = prior.data.proposal;
    if (
      !p ||
      Object.keys(p).sort().join(",") !== Object.keys(base).sort().join(",") ||
      p.status !== "pending" ||
      !["undecided", "cosmetic", "rights", "rarity-change"].includes(p.rarityEffect) ||
      !["undecided", "retain", "convert", "shared"].includes(p.duplicateMode) ||
      (p.sharedMaterials !== null && typeof p.sharedMaterials !== "boolean") ||
      !p.note ||
      Object.keys(p.note).sort().join(",") !== "en,zh-TW" ||
      Object.values(p.note).some((t) => typeof t !== "string" || t.length > 2000)
    )
      fail("Proposal stays unapproved");
    for (const k of ["recipeCount", "successPct", "pityCount", "minimumKeep"])
      if (
        p[k] !== null &&
        (!Number.isSafeInteger(p[k]) || p[k] < 0 || p[k] > (k === "successPct" ? 100 : 1000))
      )
        fail("Invalid proposal value");
    return d.writeDocument("collection-rules", prior, v, u.id, "collection.rules");
  });
}
export function collectionPreview(d, token, input) {
  const u = d.actor(token);
  if (
    !input ||
    Object.keys(input).sort().join(",") !== "cardId,count" ||
    !Number.isSafeInteger(input.count) ||
    input.count < 0 ||
    input.count > 1000
  )
    fail("Invalid preview");
  const visible = collectionCatalogue(d).cards.find((c) => c.cardId === input.cardId),
    held =
      d.db
        .prepare("SELECT count FROM holdings WHERE user_id=? AND card_id=?")
        .get(u.id, input.cardId)?.count ?? 0;
  if (!visible || !held) fail("Owned public card required", 404);
  const p = d.document("collection-rules");
  return {
    approved: false,
    executed: false,
    cardsConsumed: 0,
    kpConsumed: 0,
    owned: held,
    requestedMaterials: input.count,
    hypotheticalRemaining: Math.max(0, held - input.count),
    sufficient: input.count <= held,
    ruleVersion: p.version,
    proposal: p.data.proposal,
    rarity: visible.rarity,
    growthLevel: null,
    cardVersion: visible.cardVersion,
  };
}
export function recordCollectionParticipation(d, token, input, key) {
  return d.mutation(token, input, key, "collection-participation", (u) => {
    if (
      !input ||
      Object.keys(input).sort().join(",") !== "activityId,fixtureId" ||
      !FIXTURES.some((f) => f.id === input.fixtureId) ||
      typeof input.activityId !== "string" ||
      !/^local-activity-[a-z0-9-]{1,50}$/.test(input.activityId)
    )
      fail("Known synthetic account and local activity evidence ID required");
    d.db
      .prepare("INSERT OR IGNORE INTO collection_participation VALUES(?,?,?,?,?)")
      .run(randomUUID(), input.fixtureId, input.activityId, d.at(), u.id);
    d.log(u.id, "collection.activity-evidence", input.activityId);
    return { synthetic: true, assetReward: false };
  });
}
