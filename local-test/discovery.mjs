import { readingShape } from "../src/lib/reading-shape.mjs";
import { publicationPeriod } from "./publication-period.mjs";
import { publicContentSearch } from "../src/lib/public-search.mjs";
import { supplyProjection } from "./supply.mjs";
import { randomUUID } from "node:crypto";

const kinds = ["home", "series", "creator", "article"];
const categories = ["permanent", "seasonal", "upcoming", "historical"];
const articleTypes = ["interview", "behind-scenes", "design", "guide"];
const fields = [
  "title",
  "summary",
  "body",
  "story",
  "period",
  "goal",
  "endPolicy",
  "teaser",
  "social",
];
const invalid = (d, message, status = 422) => {
  throw new d.constructor.DiscoveryError(status, "discovery", message);
};
const bilingual = (zh, en) => ({ "zh-TW": zh, en });
function copy(title, summary) {
  return {
    title,
    summary,
    body: bilingual(
      "此為虛構示意內容，不代表真實合作或訪談。",
      "Fictional sample content, not a real collaboration or interview.",
    ),
    story: bilingual("以創作時刻串連系列作品。", "A series of memorable creative moments."),
    period: bilingual(
      "依卡池原有示意期間；不是正式上架承諾。",
      "Existing sample pool schedule; not a release commitment.",
    ),
    goal: bilingual(
      "收藏不同款式；重複卡不增加款式完成度。",
      "Collect distinct designs; duplicates do not increase completion.",
    ),
    endPolicy: bilingual(
      "保留已取得收藏與歷史；停止抽卡、復刻及限量政策待核定。",
      "Keep acquired cards and history; closure, rerun and edition policies pending approval.",
    ),
    teaser: bilingual(
      "下一季企劃示意，時間與合作對象待確認。",
      "Next-season concept; schedule and partners pending confirmation.",
    ),
    social: bilingual("", ""),
  };
}
export function seedDiscovery(catalog) {
  const entry = (id, kind, referenceId, text, extra = {}) => {
    const value = {
      kind,
      referenceId,
      copy: text,
      category: kind === "series" ? "seasonal" : "guide",
      creatorIds: [],
      poolIds: [],
      order: 0,
      featured: true,
      releaseAt: "",
      withdrawAt: "",
      ...extra,
    };
    return {
      id,
      status: "published",
      draft: value,
      published: { ...value, publishedAt: "2026-10-04T00:00:00Z", revision: 1 },
    };
  };
  return {
    schema: 1,
    items: [
      entry(
        "home",
        "home",
        "",
        copy(
          bilingual("星光收藏季", "Season of Starlight"),
          bilingual(
            "發現創作者，收藏作品，期待下一季。",
            "Discover creators, collect their work, and look forward to next season.",
          ),
        ),
      ),
      ...catalog.discoveryPools.map((p, order) =>
        entry(
          "series-" + p.id,
          "series",
          p.id,
          copy(
            bilingual(p.name, "Sample series · " + p.id),
            bilingual(p.description, "Fictional collection series for local testing."),
          ),
          {
            category:
              p.status === "ended"
                ? "historical"
                : p.status === "upcoming"
                  ? "upcoming"
                  : p.kind === "permanent"
                    ? "permanent"
                    : "seasonal",
            creatorIds: p.goddessIds.filter((id) =>
              catalog.discoveryCreators.some((c) => c.id === id),
            ),
            poolIds: [p.id],
            order,
          },
        ),
      ),
      ...catalog.discoveryCreators.map((c, order) =>
        entry(
          "creator-" + c.id,
          "creator",
          c.id,
          copy(
            bilingual(c.name, "Sample creator · " + c.id),
            bilingual(c.intro, "Fictional creator profile for local testing."),
          ),
          { creatorIds: [c.id], poolIds: c.poolIds, order },
        ),
      ),
      ...articleTypes.map((type, order) =>
        entry(
          "journal-" + type,
          "article",
          "",
          copy(
            bilingual(
              {
                interview: "創作者訪談示意",
                "behind-scenes": "拍攝花絮示意",
                design: "卡面設計故事示意",
                guide: "收藏指南",
              }[type],
              {
                interview: "Sample creator interview",
                "behind-scenes": "Sample behind the scenes",
                design: "Sample card design story",
                guide: "Collection guide",
              }[type],
            ),
            bilingual(
              "閱讀作品故事，再探索相關系列。",
              "Read the story, then explore the related series.",
            ),
          ),
          {
            category: type,
            creatorIds: catalog.discoveryCreators.slice(0, 1).map((c) => c.id),
            poolIds: ["p-uniform"],
            order,
          },
        ),
      ),
    ],
  };
}
export function initDiscovery(d) {
  d.db
    .exec(`CREATE TABLE IF NOT EXISTS creator_follows(user_id TEXT REFERENCES users(id),creator_id TEXT,at TEXT NOT NULL,PRIMARY KEY(user_id,creator_id));
    CREATE TABLE IF NOT EXISTS discovery_events(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),kind TEXT NOT NULL,subject TEXT NOT NULL,at TEXT NOT NULL,synthetic INTEGER NOT NULL CHECK(synthetic=1),UNIQUE(user_id,kind,subject));
    CREATE TRIGGER IF NOT EXISTS discovery_events_immutable BEFORE UPDATE ON discovery_events BEGIN SELECT RAISE(ABORT,'immutable'); END;`);
  d.transaction(() => {
    const payload = JSON.stringify(seedDiscovery(d.catalog));
    d.db.prepare("INSERT OR IGNORE INTO documents VALUES('discovery',1,?)").run(payload);
    d.db.prepare("INSERT OR IGNORE INTO document_versions VALUES('discovery',1,?)").run(payload);
  });
}
function validateValue(d, value) {
  if (
    !value ||
    Object.keys(value).sort().join(",") !==
      "category,copy,creatorIds,featured,kind,order,poolIds,referenceId,releaseAt,withdrawAt" ||
    !kinds.includes(value.kind) ||
    !Number.isSafeInteger(value.order) ||
    Math.abs(value.order) > 10000 ||
    typeof value.featured !== "boolean"
  )
    invalid(d, "Invalid content fields");
  if (typeof value.referenceId !== "string" || value.referenceId.length > 100)
    invalid(d, "Invalid reference");
  if (
    value.kind === "series" &&
    (!categories.includes(value.category) ||
      !d.catalog.pools.some((p) => p.id === value.referenceId))
  )
    invalid(d, "Unknown series/category");
  if (
    value.kind === "creator" &&
    !d.catalog.discoveryCreators.some((c) => c.id === value.referenceId)
  )
    invalid(d, "Unknown creator");
  if (value.kind === "article" && !articleTypes.includes(value.category))
    invalid(d, "Unknown article type");
  if (["home", "article"].includes(value.kind) && value.referenceId !== "")
    invalid(d, "Unexpected reference");
  for (const [key, ids] of [
    ["creatorIds", d.catalog.discoveryCreators.map((c) => c.id)],
    ["poolIds", d.catalog.pools.map((p) => p.id)],
  ]) {
    if (
      !Array.isArray(value[key]) ||
      value[key].length > 30 ||
      new Set(value[key]).size !== value[key].length ||
      value[key].some((id) => !ids.includes(id))
    )
      invalid(d, "Invalid relation IDs");
  }
  for (const key of ["releaseAt", "withdrawAt"]) {
    if (
      typeof value[key] !== "string" ||
      (value[key] &&
        (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?(?:Z|[+-]\d\d:\d\d)$/.test(value[key]) ||
          !Number.isFinite(Date.parse(value[key]))))
    )
      invalid(d, "Explicit timezone ISO date required");
  }
  if (
    value.releaseAt &&
    value.withdrawAt &&
    Date.parse(value.releaseAt) >= Date.parse(value.withdrawAt)
  )
    invalid(d, "Release must precede withdrawal");
  if (!value.copy || Object.keys(value.copy).sort().join(",") !== fields.slice().sort().join(","))
    invalid(d, "Unknown copy fields");
  for (const field of fields) {
    const text = value.copy[field];
    if (!text || Object.keys(text).sort().join(",") !== "en,zh-TW")
      invalid(d, "Both locales required");
    for (const locale of ["zh-TW", "en"]) {
      if (
        typeof text[locale] !== "string" ||
        text[locale].length > (field === "body" ? 12000 : 2000)
      )
        invalid(d, "Text too long or invalid");
      if (field === "title" && !text[locale].trim()) invalid(d, "Title required in both locales");
      if (field === "social" && text[locale]) {
        for (const line of text[locale].split("\n").filter(Boolean)) {
          let url;
          try {
            url = new URL(line);
          } catch {
            invalid(d, "Invalid social URL");
          }
          if (url.protocol !== "https:" || url.username || url.password)
            invalid(d, "Social links must be HTTPS without credentials");
        }
      }
    }
  }
}
export function publicDiscovery(d) {
  return projectDiscoveryRecords(d, d.document("discovery").data.items);
}
export function projectDiscoveryRecords(d, records) {
  const projectionContext = { pools: d.pools(), rules: d.document("collection-rules").data };
  return {
    environment: "Local Test",
    synthetic: true,
    serverTime: d.at(),
    items: records
      .filter(
        (i) =>
          i.status === "published" &&
          i.published &&
          publicationPeriod(i.published, d.clock()) === "current",
      )
      .map((i) => supplyProjection(d, { id: i.id, ...i.published }, projectionContext))
      .filter(Boolean)
      .sort(
        (a, b) =>
          Boolean(b.sourcePackId) - Boolean(a.sourcePackId) ||
          b.publishedAt.localeCompare(a.publishedAt) ||
          a.order - b.order ||
          a.id.localeCompare(b.id),
      )
      .filter(
        (i, index, all) =>
          !["series", "creator"].includes(i.kind) ||
          all.findIndex((x) => x.kind === i.kind && x.referenceId === i.referenceId) === index,
      ),
  };
}
export function discoveryCommand(d, token, input, key) {
  return d.mutation(token, input, key, "discovery-content", (u) => {
    if (
      !input ||
      Object.keys(input).sort().join(",") !== "action,expectedVersion,id,value" ||
      !["save", "publish", "archive"].includes(input.action) ||
      typeof input.id !== "string" ||
      !/^[a-z0-9-]{1,100}$/.test(input.id)
    )
      invalid(d, "Invalid content command");
    const prior = d.document("discovery");
    if (input.expectedVersion !== prior.version)
      invalid(d, "Content changed; reload before editing", 409);
    const data = structuredClone(prior.data);
    let item = data.items.find((i) => i.id === input.id);
    if (item?.supplyPackId)
      invalid(d, "Managed package: use creator supply review/publication", 409);
    if (input.action === "save") {
      validateValue(d, input.value);
      if (
        item &&
        (input.value.kind !== item.draft.kind || input.value.referenceId !== item.draft.referenceId)
      )
        invalid(d, "Existing kind/reference immutable");
      if (!item && input.value.kind !== "article")
        invalid(d, "Only journal articles can be added; use existing catalogue IDs");
      if (!item) {
        if (data.items.length >= 300) invalid(d, "Content limit reached");
        item = { id: input.id, status: "draft", draft: input.value, published: null };
        data.items.push(item);
      } else item.draft = input.value;
    } else {
      if (input.value !== null || !item) invalid(d, "Known content and null value required");
      if (input.action === "publish") {
        validateValue(d, item.draft);
        item.published = {
          ...structuredClone(item.draft),
          revision: prior.version + 1,
          publishedAt: d.at(),
        };
        item.status = "published";
      } else item.status = "archived";
    }
    return d.writeDocument("discovery", prior, data, u.id, "discovery." + input.action);
  });
}
export function recordDiscoveryEvent(d, userId, kind, subject) {
  d.db
    .prepare("INSERT OR IGNORE INTO discovery_events VALUES(?,?,?,?,?,1)")
    .run(randomUUID(), userId, kind, subject, d.at());
}
export function discoveryMe(d, token) {
  const u = d.actor(token),
    visibleCards = new Set(d.collectionCatalogue().cards.map((c) => c.cardId));
  return {
    actorId: u.id,
    synthetic: true,
    follows: d.db
      .prepare("SELECT creator_id FROM creator_follows WHERE user_id=? ORDER BY creator_id")
      .all(u.id)
      .map((r) => r.creator_id),
    progress: publicDiscovery(d)
      .items.filter((i) => i.kind === "series")
      .map((i) => ({
        poolId: i.referenceId,
        distinctOwned: d.catalog.cards.filter(
          (c) =>
            visibleCards.has(c.id) &&
            c.poolId === i.referenceId &&
            (d.db
              .prepare("SELECT count FROM holdings WHERE user_id=? AND card_id=?")
              .get(u.id, c.id)?.count ?? 0) > 0,
        ).length,
      })),
  };
}
export function followCreator(d, token, input, key) {
  return d.mutation(token, input, key, "discovery-follow", (u) => {
    if (
      !input ||
      Object.keys(input).sort().join(",") !== "creatorId,following" ||
      typeof input.following !== "boolean" ||
      !publicDiscovery(d).items.some(
        (i) => i.kind === "creator" && i.referenceId === input.creatorId,
      )
    )
      invalid(d, "Published creator required");
    if (input.following) {
      d.db
        .prepare("INSERT OR IGNORE INTO creator_follows VALUES(?,?,?)")
        .run(u.id, input.creatorId, d.at());
      recordDiscoveryEvent(d, u.id, "follow", input.creatorId);
    } else
      d.db
        .prepare("DELETE FROM creator_follows WHERE user_id=? AND creator_id=?")
        .run(u.id, input.creatorId);
    d.log(u.id, input.following ? "creator.follow" : "creator.unfollow", input.creatorId);
    return { creatorId: input.creatorId, following: input.following };
  });
}
export function discoveryVisit(d, token, input, key) {
  return d.mutation(token, input, key, "discovery-visit", (u) => {
    if (
      !input ||
      Object.keys(input).sort().join(",") !== "kind,subject" ||
      !["content-to-pool", "visit"].includes(input.kind) ||
      typeof input.subject !== "string"
    )
      invalid(d, "Invalid event");
    if (input.kind === "content-to-pool") {
      const [articleId, poolId, ...extra] = input.subject.split(":");
      if (
        extra.length ||
        !publicDiscovery(d).items.some(
          (i) => i.id === articleId && i.kind === "article" && i.poolIds.includes(poolId),
        )
      )
        invalid(d, "Published article/pool relation required");
      recordDiscoveryEvent(d, u.id, input.kind, input.subject + ":" + d.at().slice(0, 10));
    } else {
      if (input.subject !== "discovery") invalid(d, "Unknown visit source");
      const first = d.db
        .prepare(
          "SELECT at FROM discovery_events WHERE user_id=? AND kind='first-collection' ORDER BY at LIMIT 1",
        )
        .get(u.id);
      if (
        first &&
        d.clock() >= Date.parse(first.at) + 7 * 86400000 &&
        d.clock() < Date.parse(first.at) + 8 * 86400000
      )
        recordDiscoveryEvent(d, u.id, "seven-day-return", "first-collection");
    }
    return { recorded: true, synthetic: true };
  });
}

export function discoverySearch(d, q = "", type = "all", locale = "zh-TW", filters = {}) {
  if (
    q.length > 200 ||
    !["all", "series", "creator", "article"].includes(type) ||
    !["zh-TW", "en"].includes(locale)
  )
    invalid(d, "Invalid search parameters");
  const items = publicContentSearch(publicDiscovery(d).items, q, type, locale, filters);
  return { synthetic: true, items, count: items.length };
}

// Private Local Test preference: current documents row only; no content snapshot or migration.
function readingOwner(d, token) {
  const actor = d.actor(token);
  if (actor.role !== "member") invalid(d, "Current local player session required", 403);
  return actor;
}
function readingDocument(d, actor) {
  const row = d.db
    .prepare("SELECT version,payload FROM documents WHERE id=?")
    .get("reading:" + actor.id);
  return row
    ? { version: row.version, ...readingShape(JSON.parse(row.payload)) }
    : { version: 0, items: [], groups: [] };
}
export function readingMe(d, token) {
  const actor = readingOwner(d, token),
    prior = readingDocument(d, actor);
  const visible = new Set(
    publicDiscovery(d)
      .items.filter((i) => i.kind === "article")
      .map((i) => i.id),
  );
  return {
    actorId: actor.id,
    synthetic: true,
    version: prior.version,
    groups: prior.groups,
    items: prior.items.map((i) => ({ ...i, available: visible.has(i.articleId) })),
  };
}
export function readingCommand(d, token, input, key) {
  readingOwner(d, token); // A receipt never grants a role or accepts a caller-provided owner.
  return d.mutation(token, input, key, "reading-member", (actor) => {
    if (input?.action) {
      const keys =
        input.action === "group-create"
          ? ["action", "expectedVersion", "name"]
          : input.action === "group-rename"
            ? ["action", "expectedVersion", "groupId", "name"]
            : input.action === "group-delete"
              ? ["action", "expectedVersion", "groupId"]
              : input.action === "bulk-state"
                ? ["action", "articleIds", "expectedVersion", "state"]
                : input.action === "bulk-group"
                  ? ["action", "articleIds", "expectedVersion", "groupId"]
                  : input.action === "item-update"
                    ? ["action", "articleId", "expectedVersion", "groupId", "state"]
                    : [];
      if (
        !keys.length ||
        Object.keys(input).sort().join() !== keys.sort().join() ||
        !Number.isSafeInteger(input.expectedVersion) ||
        input.expectedVersion < 0
      )
        invalid(d, "Invalid reading organization command");
      const prior = readingDocument(d, actor);
      if (prior.version !== input.expectedVersion)
        invalid(d, "Reading list changed; reload before editing", 409);
      let groups = structuredClone(prior.groups),
        items = structuredClone(prior.items),
        groupId = input.groupId ?? "";
      if (input.action === "bulk-state" || input.action === "bulk-group") {
        if (
          !Array.isArray(input.articleIds) ||
          input.articleIds.length < 1 ||
          input.articleIds.length > 20 ||
          new Set(input.articleIds).size !== input.articleIds.length ||
          input.articleIds.some((id) => typeof id !== "string" || !/^[-a-z0-9]{1,100}$/.test(id))
        )
          invalid(d, "Select 1–20 distinct saved entries");
        if (input.articleIds.some((id) => !items.some((item) => item.articleId === id)))
          invalid(d, "Own saved selection changed; reload", 409);
        if (input.action === "bulk-state" && !["read", "unread"].includes(input.state))
          invalid(d, "Invalid reading state");
        if (
          input.action === "bulk-group" &&
          (typeof input.groupId !== "string" ||
            (input.groupId && !groups.some((g) => g.id === input.groupId)))
        )
          invalid(d, "Own group unavailable", 404);
        const selected = new Set(input.articleIds);
        items = items.map((item) =>
          selected.has(item.articleId)
            ? {
                ...item,
                ...(input.action === "bulk-state"
                  ? { state: input.state }
                  : { groupId: input.groupId }),
              }
            : item,
        );
      } else if (input.action === "group-create" || input.action === "group-rename") {
        if (
          typeof input.name !== "string" ||
          !input.name.trim() ||
          input.name.length > 40 ||
          [...input.name].some((c) => c.charCodeAt(0) < 32)
        )
          invalid(d, "Group name requires 1–40 characters");
        const name = input.name.trim();
        if (
          groups.some(
            (g) =>
              g.id !== input.groupId &&
              g.name.normalize("NFKC").toLocaleLowerCase() ===
                name.normalize("NFKC").toLocaleLowerCase(),
          )
        )
          invalid(d, "Group name already exists", 409);
        if (input.action === "group-create") {
          if (groups.length >= 20) invalid(d, "Local group limit is 20");
          groupId = "reading-group-" + randomUUID();
          groups.push({ id: groupId, name });
        } else {
          const group = groups.find((g) => g.id === input.groupId);
          if (!group) invalid(d, "Own group unavailable", 404);
          group.name = name;
        }
      } else if (input.action === "group-delete") {
        if (!groups.some((g) => g.id === input.groupId)) invalid(d, "Own group unavailable", 404);
        groups = groups.filter((g) => g.id !== input.groupId);
        items = items.map((i) => (i.groupId === input.groupId ? { ...i, groupId: "" } : i));
      } else {
        if (
          !["read", "unread"].includes(input.state) ||
          typeof input.groupId !== "string" ||
          (input.groupId && !groups.some((g) => g.id === input.groupId))
        )
          invalid(d, "Invalid own reading state or group");
        const item = items.find((i) => i.articleId === input.articleId);
        if (!item) invalid(d, "Own saved article unavailable", 404);
        item.state = input.state;
        item.groupId = input.groupId;
      }
      const version = prior.version + 1;
      d.db
        .prepare(
          "INSERT INTO documents(id,version,payload) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET version=excluded.version,payload=excluded.payload",
        )
        .run("reading:" + actor.id, version, JSON.stringify({ items, groups }));
      d.log(actor.id, "reading.organize", "v" + version);
      return { version, groupId };
    }

    if (
      !input ||
      Object.keys(input).sort().join(",") !== "articleId,expectedVersion,saved" ||
      typeof input.articleId !== "string" ||
      !/^[-a-z0-9]{1,100}$/.test(input.articleId) ||
      typeof input.saved !== "boolean" ||
      !Number.isSafeInteger(input.expectedVersion) ||
      input.expectedVersion < 0
    )
      invalid(d, "Invalid reading command");
    const prior = readingDocument(d, actor);
    if (prior.version !== input.expectedVersion)
      invalid(d, "Reading list changed; reload before editing", 409);
    if (
      input.saved &&
      !publicDiscovery(d).items.some((i) => i.id === input.articleId && i.kind === "article")
    )
      invalid(d, "Current public article unavailable", 404);
    const exists = prior.items.some((i) => i.articleId === input.articleId);
    if (exists === input.saved) return { version: prior.version };
    if (input.saved && prior.items.length >= 200)
      invalid(d, "Local reading list size limit reached");
    const items = input.saved
      ? [
          ...prior.items,
          { articleId: input.articleId, savedAt: d.at(), state: "unread", groupId: "" },
        ]
      : prior.items.filter((i) => i.articleId !== input.articleId);
    const version = prior.version + 1;
    d.db
      .prepare(
        "INSERT INTO documents(id,version,payload) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET version=excluded.version,payload=excluded.payload",
      )
      .run("reading:" + actor.id, version, JSON.stringify({ items, groups: prior.groups }));
    d.log(actor.id, "reading.change", "v" + version);
    return { version };
  });
}
