import * as supply from "./supply.mjs";
import { initPlay } from "./play.mjs";
import {
  initDiscovery,
  publicDiscovery,
  discoveryCommand,
  discoveryMe,
  followCreator,
  discoveryVisit,
  recordDiscoveryEvent,
} from "./discovery.mjs";
import * as participation from "./participation.mjs";
import * as collection from "./collection.mjs";
import { DatabaseSync, backup } from "node:sqlite";
import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export const FIXTURES = [
  { id: "member-a", role: "member" },
  { id: "member-b", role: "member" },
  { id: "creator-a", role: "creator", accountId: "demo-approved-a" },
  { id: "creator-b", role: "creator", accountId: "demo-approved-b" },
  { id: "official-a", role: "official" },
  { id: "official-b", role: "official" },
];
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
const fail = (status, code, message) => {
  throw new ApiError(status, code, message);
};
const hash = (s) => createHash("sha256").update(s).digest("hex");
const json = (s) => JSON.parse(s);
const publicDraw = (draw) => {
  const { cooperation, ...rules } = draw.rules;
  void cooperation;
  return { ...draw, rules };
};
export class LocalDatabase {
  static DiscoveryError = ApiError;
  constructor(path, catalog, { fault = () => {}, clock = () => Date.now() } = {}) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.catalog = catalog;
    this.fault = fault;
    this.clock = clock;
    this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, role TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, balance INTEGER NOT NULL CHECK(balance>=0));
      CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL, revoked INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS pools(id TEXT PRIMARY KEY, current_version INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS pool_versions(pool_id TEXT REFERENCES pools(id), version INTEGER, payload TEXT NOT NULL, PRIMARY KEY(pool_id,version));
      CREATE TABLE IF NOT EXISTS draws(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), request_key TEXT NOT NULL, input_hash TEXT NOT NULL, result TEXT NOT NULL, UNIQUE(user_id,request_key));
      CREATE TABLE IF NOT EXISTS holdings(user_id TEXT REFERENCES users(id),card_id TEXT,count INTEGER NOT NULL CHECK(count>=0),PRIMARY KEY(user_id,card_id));
      CREATE TABLE IF NOT EXISTS pity(user_id TEXT REFERENCES users(id),pool_id TEXT REFERENCES pools(id),count INTEGER NOT NULL CHECK(count>=0),PRIMARY KEY(user_id,pool_id));
      CREATE TABLE IF NOT EXISTS ledger(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),amount INTEGER NOT NULL,source TEXT NOT NULL,draw_id TEXT REFERENCES draws(id),at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS acquisitions(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),draw_id TEXT REFERENCES draws(id),card_id TEXT,source TEXT NOT NULL,ordinal INTEGER NOT NULL,UNIQUE(draw_id,ordinal));
      CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,actor TEXT NOT NULL,action TEXT NOT NULL,subject TEXT NOT NULL,at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS asset_events(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),operation_id TEXT,card_id TEXT,delta INTEGER NOT NULL CHECK(delta!=0),source TEXT NOT NULL,at TEXT NOT NULL,snapshot TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS syntheses(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),result TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS synthesis_progress(user_id TEXT REFERENCES users(id),pool_id TEXT,grade TEXT,count INTEGER NOT NULL,PRIMARY KEY(user_id,pool_id,grade));
      CREATE TABLE IF NOT EXISTS physical_previews(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),card_id TEXT,result TEXT NOT NULL,UNIQUE(user_id,card_id));
      CREATE TRIGGER IF NOT EXISTS asset_events_immutable BEFORE UPDATE ON asset_events BEGIN SELECT RAISE(ABORT,'immutable'); END;
      CREATE TRIGGER IF NOT EXISTS syntheses_immutable BEFORE UPDATE ON syntheses BEGIN SELECT RAISE(ABORT,'immutable'); END;
      CREATE TRIGGER IF NOT EXISTS physical_previews_immutable BEFORE UPDATE ON physical_previews BEGIN SELECT RAISE(ABORT,'immutable'); END;
      CREATE TABLE IF NOT EXISTS mutations(actor TEXT,key TEXT,digest TEXT,result TEXT,PRIMARY KEY(actor,key));
      CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY,version INTEGER NOT NULL,payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS document_versions(id TEXT,version INTEGER,payload TEXT NOT NULL,PRIMARY KEY(id,version));
      CREATE TRIGGER IF NOT EXISTS pool_versions_immutable BEFORE UPDATE ON pool_versions BEGIN SELECT RAISE(ABORT,'immutable'); END;
      CREATE TRIGGER IF NOT EXISTS draws_immutable BEFORE UPDATE ON draws BEGIN SELECT RAISE(ABORT,'immutable'); END;
      CREATE TRIGGER IF NOT EXISTS document_versions_immutable BEFORE UPDATE ON document_versions BEGIN SELECT RAISE(ABORT,'immutable'); END;
      CREATE TRIGGER IF NOT EXISTS audit_immutable BEFORE UPDATE ON audit BEGIN SELECT RAISE(ABORT,'immutable'); END;
      CREATE TRIGGER IF NOT EXISTS ledger_immutable BEFORE UPDATE ON ledger BEGIN SELECT RAISE(ABORT,'immutable'); END;`);
    this.transaction(() => {
      this.db
        .prepare(
          "INSERT OR IGNORE INTO asset_events SELECT 'acq:'||a.id,a.user_id,a.draw_id,a.card_id,1,a.source,COALESCE(json_extract(d.result,'$.createdAt'),?),COALESCE(d.result,'{}') FROM acquisitions a LEFT JOIN draws d ON d.id=a.draw_id",
        )
        .run(this.at());
      for (const u of FIXTURES) {
        const changed = this.db
          .prepare("INSERT OR IGNORE INTO users(id,role,balance) VALUES(?,?,10000)")
          .run(u.id, u.role).changes;
        if (changed)
          this.db
            .prepare("INSERT INTO ledger VALUES(?,?,?,?,?,?)")
            .run(randomUUID(), u.id, 10000, "test-grant", null, this.at());
      }
      for (const p of catalog.pools) {
        const changed = this.db
          .prepare("INSERT OR IGNORE INTO pools VALUES(?,1)")
          .run(p.id).changes;
        if (changed)
          this.db.prepare("INSERT INTO pool_versions VALUES(?,1,?)").run(
            p.id,
            JSON.stringify({
              poolId: p.id,
              status: p.status,
              startAt: p.startAt,
              endAt: p.endAt,
              singleCost: 100,
              tenCost: 900,
              fixture: true,
              selection: "uniform catalog card selection; no production odds or guaranteed grade",
              cards: catalog.cards.filter((c) => c.poolId === p.id),
              cooperation: catalog.operations,
              editorSettings: catalog.drawSettings?.[p.id],
            }),
          );
      }
      this.db
        .prepare("INSERT OR IGNORE INTO documents VALUES(?,1,?)")
        .run("operations", JSON.stringify(catalog.operations));
      this.db
        .prepare("INSERT OR IGNORE INTO document_versions VALUES(?,1,?)")
        .run("operations", JSON.stringify(catalog.operations));
      this.db
        .prepare("INSERT OR IGNORE INTO documents VALUES(?,1,?)")
        .run("content", JSON.stringify(catalog.emptyContent));
      this.db
        .prepare("INSERT OR IGNORE INTO document_versions VALUES(?,1,?)")
        .run("content", JSON.stringify(catalog.emptyContent));
    });
    initDiscovery(this);
    collection.initCollection(this);
    participation.initParticipation(this);
    initPlay(this);
  }
  publicParticipation() {
    return participation.publicParticipation(this);
  }
  supplyIdentity(id) {
    const f = FIXTURES.find((f) => f.id === id);
    return f?.accountId
      ? { accountId: f.accountId, creatorId: id === "creator-a" ? "g-yoru" : "g-akane" }
      : null;
  }
  supplyList(token, official = false) {
    return supply.supplyList(this, token, official);
  }
  supplyCommand(token, input, key, official = false) {
    return supply.supplyCommand(this, token, input, key, official);
  }
  participationMe(token) {
    return participation.participationMe(this, token);
  }
  participationCommand(token, input, key) {
    return participation.participationCommand(this, token, input, key);
  }
  participationAdmin(token) {
    return participation.participationAdmin(this, token);
  }
  participationAdminCommand(token, input, key) {
    return participation.participationAdminCommand(this, token, input, key);
  }
  collectionCatalogue() {
    return collection.collectionCatalogue(this);
  }
  collectionMe(token) {
    return collection.collectionMe(this, token);
  }
  collectionProfile(token, input, key) {
    return collection.saveCollectionProfile(this, token, input, key);
  }
  publicCollection(handle) {
    return collection.publicCollection(this, handle);
  }
  collectionRankings() {
    return collection.collectionRankings(this);
  }
  collectionRules(token, input, key) {
    return collection.saveCollectionRules(this, token, input, key);
  }
  collectionPreview(token, input) {
    return collection.collectionPreview(this, token, input);
  }
  collectionParticipation(token, input, key) {
    return collection.recordCollectionParticipation(this, token, input, key);
  }
  publicDiscovery() {
    return publicDiscovery(this);
  }
  discoveryCommand(token, input, key) {
    return discoveryCommand(this, token, input, key);
  }
  discoveryMe(token) {
    return discoveryMe(this, token);
  }
  followCreator(token, input, key) {
    return followCreator(this, token, input, key);
  }
  discoveryVisit(token, input, key) {
    return discoveryVisit(this, token, input, key);
  }
  at() {
    return new Date(this.clock()).toISOString();
  }
  transaction(fn) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      this.db.exec("COMMIT");
      return result;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  log(actor, action, subject) {
    this.db
      .prepare("INSERT INTO audit VALUES(?,?,?,?,?)")
      .run(randomUUID(), actor, action, subject, this.at());
  }
  session(fixtureId) {
    if (!FIXTURES.some((u) => u.id === fixtureId))
      fail(422, "fixture", "Unknown synthetic fixture");
    const token = randomBytes(32).toString("hex");
    this.db
      .prepare("INSERT INTO sessions VALUES(?,?,?,0)")
      .run(hash(token), fixtureId, this.clock() + 2 * 60 * 60 * 1000);
    return token;
  }
  actor(token) {
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token))
      fail(401, "session", "Local Test session required");
    const u = this.db
      .prepare(
        "SELECT u.id,u.role,u.active,u.balance FROM sessions s JOIN users u ON u.id=s.user_id WHERE token_hash=? AND s.expires>? AND s.revoked=0",
      )
      .get(hash(token), this.clock());
    if (!u || !u.active) fail(401, "session", "Session expired, revoked or disabled");
    return u;
  }
  official(token) {
    const u = this.actor(token);
    if (u.role !== "official") fail(403, "role", "Current official grant required");
    return u;
  }
  logout(token) {
    this.actor(token);
    this.db.prepare("UPDATE sessions SET revoked=1 WHERE token_hash=?").run(hash(token));
  }
  summary(token) {
    const u = this.actor(token);
    return {
      environment: "Local Test",
      user: u,
      holdings: this.db
        .prepare("SELECT * FROM holdings WHERE user_id=? ORDER BY card_id")
        .all(u.id),
      pity: this.db.prepare("SELECT * FROM pity WHERE user_id=?").all(u.id),
      draws: this.db
        .prepare("SELECT result FROM draws WHERE user_id=? ORDER BY rowid DESC")
        .all(u.id)
        .map((r) => publicDraw(json(r.result))),
      syntheses: this.db
        .prepare("SELECT result FROM syntheses WHERE user_id=? ORDER BY rowid DESC")
        .all(u.id)
        .map((r) => publicDraw(json(r.result))),
      failures: this.db.prepare("SELECT * FROM synthesis_progress WHERE user_id=?").all(u.id),
      physical: this.db
        .prepare("SELECT result FROM physical_previews WHERE user_id=? ORDER BY rowid DESC")
        .all(u.id)
        .map((r) => json(r.result)),
      assetEvents: this.db
        .prepare(
          "SELECT id,operation_id,card_id,delta,source,at FROM asset_events WHERE user_id=? ORDER BY rowid DESC",
        )
        .all(u.id),
      ledger: this.db.prepare("SELECT * FROM ledger WHERE user_id=? ORDER BY rowid DESC").all(u.id),
    };
  }
  drawById(token, id) {
    const u = this.actor(token);
    const row = this.db.prepare("SELECT result FROM draws WHERE id=? AND user_id=?").get(id, u.id);
    if (!row) fail(404, "draw", "Draw not found");
    return publicDraw(json(row.result));
  }
  pools() {
    return this.db
      .prepare(
        "SELECT p.id,p.current_version,v.payload FROM pools p JOIN pool_versions v ON v.pool_id=p.id AND v.version=p.current_version",
      )
      .all()
      .map((r) => ({ id: r.id, version: r.current_version, ...json(r.payload) }));
  }
  draw(token, input, key) {
    if (
      !input ||
      Object.keys(input).sort().join(",") !== "mode,poolId" ||
      typeof input.poolId !== "string" ||
      !["single", "10plus1"].includes(input.mode)
    )
      fail(
        422,
        "input",
        "Only poolId and single/10plus1 mode are accepted; result and price are server controlled",
      );
    if (typeof key !== "string" || !/^[A-Za-z0-9_-]{8,100}$/.test(key))
      fail(422, "key", "Stable request key required");
    const digest = hash(JSON.stringify({ poolId: input.poolId, mode: input.mode }));
    return this.transaction(() => {
      const u = this.actor(token); // Re-read live role/session inside the transaction.
      const old = this.db
        .prepare("SELECT input_hash,result FROM draws WHERE user_id=? AND request_key=?")
        .get(u.id, key);
      if (old) {
        if (old.input_hash !== digest)
          fail(409, "key-conflict", "Key already used for different input");
        return publicDraw(json(old.result));
      }
      const pool = this.pools().find((p) => p.id === input.poolId);
      const date = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Taipei" }).format(
        new Date(this.clock()),
      );
      if (
        !pool ||
        pool.status !== "live" ||
        !pool.cards.length ||
        date < pool.startAt ||
        date > pool.endAt
      )
        fail(422, "pool", "Pool is unavailable for local testing");
      if (
        this.catalog.listingIssues(pool.cooperation, pool.id, this.at()).length ||
        this.catalog.listingIssues(this.document("operations").data, pool.id, this.at()).length
      )
        fail(422, "listing", "Local Test snapshot lacks complete rights/contract relations");
      const n = input.mode === "single" ? 1 : 11,
        cost = input.mode === "single" ? pool.singleCost : pool.tenCost;
      if (
        !this.db
          .prepare("UPDATE users SET balance=balance-? WHERE id=? AND balance>=?")
          .run(cost, u.id, cost).changes
      )
        fail(409, "balance", "Insufficient TEST KP");
      this.fault("after-debit");
      const before =
        this.db.prepare("SELECT count FROM pity WHERE user_id=? AND pool_id=?").get(u.id, pool.id)
          ?.count ?? 0;
      const drawId = randomUUID();
      const ownedBefore = new Map();
      const items = Array.from({ length: n }, (_, i) => ({
        ...(() => {
          const card = this.selectCard(pool),
            n =
              ownedBefore.get(card.id) ??
              this.db
                .prepare("SELECT count FROM holdings WHERE user_id=? AND card_id=?")
                .get(u.id, card.id)?.count ??
              0;
          ownedBefore.set(card.id, n + 1);
          return { ...card, ownedBefore: n };
        })(),
        source: "test-paid-draw",
        ordinal: i + 1,
      }));
      const result = {
        id: drawId,
        requestKey: key,
        poolId: pool.id,
        poolVersion: pool.version,
        mode: input.mode,
        cost,
        items,
        before,
        after: before + n,
        createdAt: this.at(),
        environment: "Local Test",
        rules: pool,
      };
      this.db
        .prepare("INSERT INTO draws VALUES(?,?,?,?,?)")
        .run(drawId, u.id, key, digest, JSON.stringify(result));
      this.fault("after-result");
      for (const item of items) {
        const acquisitionId = randomUUID();
        this.db
          .prepare(
            "INSERT INTO holdings VALUES(?,?,1) ON CONFLICT(user_id,card_id) DO UPDATE SET count=count+1",
          )
          .run(u.id, item.id);
        this.db
          .prepare("INSERT INTO acquisitions VALUES(?,?,?,?,?,?)")
          .run(acquisitionId, u.id, drawId, item.id, item.source, item.ordinal);
        this.assetEvent("acq:" + acquisitionId, u.id, drawId, item.id, 1, item.source, result);
      }
      this.db
        .prepare(
          "INSERT INTO pity VALUES(?,?,?) ON CONFLICT(user_id,pool_id) DO UPDATE SET count=excluded.count",
        )
        .run(u.id, pool.id, before + n);
      this.fault("after-holdings");
      this.db
        .prepare("INSERT INTO ledger VALUES(?,?,?,?,?,?)")
        .run(randomUUID(), u.id, -cost, "test-paid-draw", drawId, this.at());
      if (this.db.prepare("SELECT COUNT(*) AS n FROM draws WHERE user_id=?").get(u.id).n === 1)
        recordDiscoveryEvent(this, u.id, "first-collection", "first");
      this.log(u.id, "draw.test", drawId);
      this.fault("after-ledger");
      return publicDraw(result);
    });
  }
  revoke(token, id) {
    return this.transaction(() => {
      const u = this.official(token);
      if (!FIXTURES.some((f) => f.id === id)) fail(404, "user", "Fixture not found");
      this.db.prepare("UPDATE users SET role='member' WHERE id=?").run(id);
      this.log(u.id, "role.revoke", id);
      return { revoked: id };
    });
  }
  audit(token) {
    this.official(token);
    return this.db.prepare("SELECT * FROM audit ORDER BY rowid DESC LIMIT 200").all();
  }
  cooperation(token) {
    const u = this.actor(token);
    if (!["creator", "official"].includes(u.role))
      fail(403, "role", "Creator or official required");
    const doc = this.db
      .prepare("SELECT version,payload FROM documents WHERE id='operations'")
      .get();
    const data = json(doc.payload);
    if (u.role === "official") return { version: doc.version, data };
    const accountId = FIXTURES.find((f) => f.id === u.id)?.accountId;
    const ids = new Set(data.partners.filter((p) => p.accountId === accountId).map((p) => p.id));
    return {
      version: doc.version,
      data: {
        ...data,
        partners: data.partners.filter((p) => ids.has(p.id)),
        contracts: data.contracts.filter((c) => ids.has(c.partnerId)),
        bindings: data.bindings.filter((b) => ids.has(b.partnerId)),
        revenue: data.revenue.filter((r) => ids.has(r.partnerId)),
        requests: data.requests.filter((r) => ids.has(r.partnerId)),
        audit: [],
        poolVersions: [],
      },
    };
  }
  appendPoolVersion(token, poolId, input) {
    if (
      !input ||
      Object.keys(input).sort().join(",") !== "expectedVersion,visibility" ||
      !Number.isSafeInteger(input.expectedVersion) ||
      !["normal", "grayscale", "hidden"].includes(input.visibility)
    )
      fail(422, "input", "Expected version and known visibility required");
    return this.transaction(() => {
      const u = this.official(token),
        old = this.pools().find((p) => p.id === poolId);
      if (!old) fail(404, "pool", "Pool not found");
      if (old.version !== input.expectedVersion) fail(409, "version", "Pool version changed");
      const v = old.version + 1;
      const { id, version, ...payload } = old;
      void id;
      void version;
      payload.visibility = input.visibility;
      this.db
        .prepare("INSERT INTO pool_versions VALUES(?,?,?)")
        .run(poolId, v, JSON.stringify(payload));
      this.db.prepare("UPDATE pools SET current_version=? WHERE id=?").run(v, poolId);
      this.log(u.id, "pool.version", poolId + ":v" + v);
      return { version: v };
    });
  }
  saveCooperation(token, input) {
    return this.transaction(() => {
      const u = this.official(token);
      if (!input || Object.keys(input).sort().join(",") !== "data,expectedVersion")
        fail(422, "input", "Expected version and operations data required");
      const old = this.cooperation(token);
      if (input.expectedVersion !== old.version) fail(409, "version", "Operations version changed");
      const parsed = this.catalog.parseOperations(JSON.stringify(input.data));
      if (JSON.stringify(parsed) !== JSON.stringify(input.data))
        fail(422, "operations", "Invalid operations structure");
      for (const c of old.data.contracts) {
        const n = parsed.contracts.find((n) => n.id === c.id);
        if (
          !n ||
          JSON.stringify({ ...c, status: "", confirmedAt: "", returnReason: "" }) !==
            JSON.stringify({ ...n, status: "", confirmedAt: "", returnReason: "" })
        )
          fail(422, "immutable", "Existing contract contents are immutable");
        if (c.status === "agreed" && JSON.stringify(c) !== JSON.stringify(n))
          fail(422, "immutable", "Agreed version cannot change");
        if (
          c.status !== n.status &&
          !(
            (c.status === "draft" && n.status === "pending") ||
            (c.status === "pending" && ["agreed", "returned"].includes(n.status))
          )
        )
          fail(422, "workflow", "Invalid consent transition");
      }
      for (const n of parsed.contracts)
        if (!old.data.contracts.some((c) => c.id === n.id) && n.status !== "draft")
          fail(422, "workflow", "New versions must start as drafts");
      if (
        parsed.contracts.some(
          (c) => c.status === "agreed" && !Number.isFinite(Date.parse(c.confirmedAt)),
        )
      )
        fail(422, "consent", "Demo agreement requires a valid confirmation time");
      const v = old.version + 1;
      this.db
        .prepare("INSERT INTO document_versions VALUES(?,?,?)")
        .run("operations", v, JSON.stringify(parsed));
      this.db
        .prepare("UPDATE documents SET version=?,payload=? WHERE id=?")
        .run(v, JSON.stringify(parsed), "operations");
      this.log(u.id, "operations.version", "v" + v);
      return { version: v };
    });
  }

  document(id) {
    const row = this.db.prepare("SELECT * FROM documents WHERE id=?").get(id);
    return { version: row.version, data: json(row.payload) };
  }
  mutation(token, body, key, kind, fn) {
    if (typeof key !== "string" || !/^[A-Za-z0-9_-]{8,100}$/.test(key))
      fail(422, "key", "Stable mutation key required");
    return this.transaction(() => {
      const u = this.actor(token),
        digest = hash(JSON.stringify({ kind, body }));
      if (
        ![
          "synthesis",
          "physical",
          "discovery-follow",
          "discovery-visit",
          "collection-profile",
          "participation-member",
          "reading-member",
          "play-member",
        ].includes(kind) &&
        u.role !== (kind === "creator" ? "creator" : "official")
      )
        fail(403, "role", "Current role required even for replay");
      const old = this.db.prepare("SELECT * FROM mutations WHERE actor=? AND key=?").get(u.id, key);
      if (old) {
        if (old.digest !== digest) fail(409, "key", "Different command already used this key");
        return json(old.result);
      }
      const result = fn(u);
      this.fault("before-mutation-receipt");
      this.db
        .prepare("INSERT INTO mutations VALUES(?,?,?,?)")
        .run(u.id, key, digest, JSON.stringify(result));
      return result;
    });
  }
  writeDocument(id, prior, data, actor, action) {
    const version = prior.version + 1;
    this.db
      .prepare("INSERT INTO document_versions VALUES(?,?,?)")
      .run(id, version, JSON.stringify(data));
    this.fault("after-document-snapshot");
    this.db
      .prepare("UPDATE documents SET version=?,payload=? WHERE id=?")
      .run(version, JSON.stringify(data), id);
    this.log(actor, action, id + ":v" + version);
    return { version };
  }
  creatorCommand(token, input, key) {
    return this.mutation(token, input, key, "creator", (u) => {
      if (u.role !== "creator") fail(403, "role", "Current creator role required");
      const prior = this.document("operations");
      if (input.expectedVersion !== prior.version)
        fail(409, "version", "Cooperation changed; reload before editing");
      if (!input || typeof input !== "object") fail(422, "input", "Command required");
      const accountId = FIXTURES.find((f) => f.id === u.id)?.accountId;
      const owner = (p) => p && p.accountActive && p.accountId === accountId;
      let next;
      if (input.kind === "consent") {
        if (
          Object.keys(input).sort().join(",") !== "contractId,expectedVersion,kind,reason,status" ||
          !["agreed", "returned"].includes(input.status) ||
          typeof input.reason !== "string" ||
          input.reason.length > 2000
        )
          fail(422, "input", "Invalid synthetic consent");
        const c = prior.data.contracts.find((c) => c.id === input.contractId);
        if (!c || !owner(prior.data.partners.find((p) => p.id === c.partnerId)))
          fail(404, "owner", "Own contract not found");
        next = this.catalog.transitionContract(
          prior.data,
          c.id,
          input.status,
          key,
          this.at(),
          input.reason,
        );
      } else if (input.kind === "review") {
        if (
          Object.keys(input).sort().join(",") !== "expectedVersion,kind,note,partnerId" ||
          typeof input.note !== "string" ||
          input.note.length > 2000
        )
          fail(422, "input", "Invalid synthetic review request");
        if (!owner(prior.data.partners.find((p) => p.id === input.partnerId)))
          fail(404, "owner", "Own partner not found");
        next = this.catalog.requestReview(prior.data, input.partnerId, input.note, key, this.at());
      } else fail(422, "input", "Known command required");
      if (next === prior.data) fail(422, "workflow", "Command is not applicable");
      return this.writeDocument("operations", prior, next, u.id, "creator." + input.kind);
    });
  }
  saveContent(token, input, key) {
    return this.mutation(token, input, key, "content", (u) => {
      this.official(token);
      if (Object.keys(input).sort().join(",") !== "data,expectedVersion")
        fail(422, "input", "Content CAS required");
      const prior = this.document("content");
      if (input.expectedVersion !== prior.version) fail(409, "version", "Content changed; reload");
      const parsed = this.catalog.parseContent(JSON.stringify(input.data));
      if (JSON.stringify(parsed) !== JSON.stringify(input.data))
        fail(422, "content", "Known FAQ IDs and bounded bilingual strings required");
      for (const name of Object.keys(parsed).filter((k) => k !== "faq"))
        if (JSON.stringify(parsed[name]) !== JSON.stringify(prior.data[name]))
          fail(422, "content", "This local stage accepts FAQ edits only");
      return this.writeDocument("content", prior, parsed, u.id, "faq.version");
    });
  }
  publishSettings(token, poolId, input, key) {
    return this.mutation(token, input, key, "pool-settings:" + poolId, (u) => {
      this.official(token);
      if (Object.keys(input).sort().join(",") !== "expectedVersion,settings")
        fail(422, "input", "Settings CAS required");
      const old = this.pools().find((p) => p.id === poolId);
      if (!old) fail(404, "pool", "Pool not found");
      if (input.expectedVersion !== old.version)
        fail(409, "version", "Pool settings changed; reload");
      const x = input.settings,
        base = this.catalog.drawSettings[poolId];
      if (
        !x ||
        Object.keys(x).sort().join(",") !== "cards,evenWeight,grades" ||
        typeof x.evenWeight !== "boolean" ||
        !Array.isArray(x.grades) ||
        !Array.isArray(x.cards) ||
        x.grades.length !== base.grades.length ||
        x.cards.length !== base.cards.length
      )
        fail(422, "settings", "Invalid setting shape");
      for (let i = 0; i < x.grades.length; i++) {
        const g = x.grades[i];
        if (
          Object.keys(g).sort().join(",") !== "enabled,grade,pct" ||
          g.grade !== base.grades[i].grade ||
          typeof g.enabled !== "boolean" ||
          !Number.isFinite(g.pct) ||
          g.pct < 0 ||
          g.pct > 100
        )
          fail(422, "settings", "Invalid grade");
      }
      for (let i = 0; i < x.cards.length; i++) {
        const c = x.cards[i],
          b = base.cards[i];
        if (
          JSON.stringify({ ...c, included: false, weight: 1 }) !==
            JSON.stringify({ ...b, included: false, weight: 1 }) ||
          typeof c.included !== "boolean" ||
          !Number.isFinite(c.weight) ||
          c.weight <= 0 ||
          c.weight > 10000
        )
          fail(422, "settings", "Invalid catalog card/weight");
      }
      const active = x.grades.filter((g) => g.enabled && g.pct > 0);
      if (
        Math.abs(active.reduce((n, g) => n + g.pct, 0) - 100) > 0.001 ||
        active.some((g) => !x.cards.some((c) => c.grade === g.grade && c.included))
      )
        fail(422, "settings", "Grade total100 and included cards required");
      const cooperation = this.document("operations").data;
      if (this.catalog.listingIssues(cooperation, poolId, this.at()).length)
        fail(422, "listing", "Synthetic licensing checks failed");
      const { id, version, ...payload } = old;
      void id;
      void version;
      payload.publishedAt = this.at();
      payload.editorSettings = x;
      payload.cooperation = cooperation;
      payload.selection =
        "syntheticLocalTest weighted configured grades/cards; no production pity guarantees";
      const v = old.version + 1;
      this.db
        .prepare("INSERT INTO pool_versions VALUES(?,?,?)")
        .run(poolId, v, JSON.stringify(payload));
      this.fault("after-pool-snapshot");
      this.db.prepare("UPDATE pools SET current_version=? WHERE id=?").run(v, poolId);
      this.log(u.id, "pool.settings-version", poolId + ":v" + v);
      return { version: v };
    });
  }
  selectCard(pool) {
    if (!pool.editorSettings || !pool.selection.startsWith("syntheticLocalTest weighted"))
      return pool.cards[randomInt(pool.cards.length)];
    const x = pool.editorSettings;
    const pick = (rows) => {
      const total = rows.reduce((n, r) => n + r.weight, 0);
      let sample = (randomInt(1000000000) / 1000000000) * total;
      for (const r of rows) {
        sample -= r.weight;
        if (sample < 0) return r.value;
      }
      return rows.at(-1).value;
    };
    const grade = pick(
      x.grades
        .filter((g) => g.enabled && g.pct > 0)
        .map((g) => ({ weight: g.pct, value: g.grade })),
    );
    const id = pick(
      x.cards
        .filter((c) => c.included && c.grade === grade)
        .map((c) => ({ weight: x.evenWeight ? 1 : c.weight, value: c.id })),
    );
    return pool.cards.find((c) => c.id === id);
  }

  assetEvent(id, actor, operation, card, delta, source, snapshot) {
    this.db
      .prepare("INSERT INTO asset_events VALUES(?,?,?,?,?,?,?,?)")
      .run(id, actor, operation, card, delta, source, this.at(), JSON.stringify(snapshot));
  }
  synthesis(token, input, key) {
    return this.mutation(token, input, key, "synthesis", (u) => {
      if (
        !input ||
        Object.keys(input).sort().join(",") !== "grade,materials,poolId,useItem" ||
        typeof input.poolId !== "string" ||
        typeof input.grade !== "string" ||
        typeof input.useItem !== "boolean" ||
        !Array.isArray(input.materials) ||
        input.materials.length !== 3 ||
        input.materials.some((id) => typeof id !== "string")
      )
        fail(422, "input", "Same-pool/grade three-card synthetic fixture required");
      const pool = this.pools().find((p) => p.id === input.poolId);
      if (!pool) fail(422, "pool", "Known pool required");
      const counts = Object.fromEntries(this.catalog.fullCards.map((c) => [c.id, { count: 0 }]));
      for (const h of this.db
        .prepare("SELECT card_id,count FROM holdings WHERE user_id=?")
        .all(u.id))
        counts[h.card_id] = { count: h.count };
      const failures = Object.fromEntries(
        this.db
          .prepare("SELECT * FROM synthesis_progress WHERE user_id=?")
          .all(u.id)
          .map((p) => [p.pool_id + ":" + p.grade, p.count]),
      );
      const prior = { ...this.catalog.emptyDemo, counts, failures };
      const id = randomUUID(),
        next = this.catalog.applySynthesis(
          prior,
          input.poolId,
          input.grade,
          input.materials,
          input.useItem,
          id,
          this.at().slice(0, 10),
        );
      if (next === prior)
        fail(422, "materials", "Unavailable, wrong-pool/grade, O or unreleased sample materials");
      const needed = new Map();
      for (const card of input.materials) needed.set(card, (needed.get(card) ?? 0) + 1);
      const result = {
        ...next.lastSynthesis,
        createdAt: this.at(),
        poolVersion: pool.version,
        beforeFailure: failures[input.poolId + ":" + input.grade] ?? 6,
        afterFailure: next.failures[input.poolId + ":" + input.grade],
        source: "test-synthesis",
        policy:
          "0.15 scripted three-card fixture; checkbox success, no item failure,10 failure pity;0 TEST KP;not production rules",
        rules: pool,
      };
      for (const [card, n] of needed) {
        if (
          !this.db
            .prepare("UPDATE holdings SET count=count-? WHERE user_id=? AND card_id=? AND count>=?")
            .run(n, u.id, card, n).changes
        )
          fail(409, "materials", "Materials changed");
        this.assetEvent(
          "consume:" + id + ":" + card,
          u.id,
          id,
          card,
          -n,
          "test-synthesis-material",
          result,
        );
      }
      this.fault("after-synthesis-consume");
      const output = result.cardId;
      this.db
        .prepare(
          "INSERT INTO holdings VALUES(?,?,1) ON CONFLICT(user_id,card_id) DO UPDATE SET count=count+1",
        )
        .run(u.id, output);
      const acquisition = randomUUID();
      this.db
        .prepare("INSERT INTO acquisitions VALUES(?,?,?,?,?,?)")
        .run(acquisition, u.id, null, output, "test-synthesis", 1);
      this.assetEvent("acq:" + acquisition, u.id, id, output, 1, "test-synthesis", result);
      this.db
        .prepare(
          "INSERT INTO synthesis_progress VALUES(?,?,?,?) ON CONFLICT(user_id,pool_id,grade) DO UPDATE SET count=excluded.count",
        )
        .run(u.id, input.poolId, input.grade, result.afterFailure);
      this.db.prepare("INSERT INTO syntheses VALUES(?,?,?)").run(id, u.id, JSON.stringify(result));
      this.db
        .prepare("INSERT INTO ledger VALUES(?,?,?,?,?,?)")
        .run(randomUUID(), u.id, 0, "test-synthesis", null, this.at());
      this.log(u.id, "synthesis.test", id);
      this.fault("after-synthesis-result");
      return publicDraw(result);
    });
  }
  synthesisById(token, id) {
    const u = this.actor(token),
      row = this.db.prepare("SELECT result FROM syntheses WHERE id=? AND user_id=?").get(id, u.id);
    if (!row) fail(404, "synthesis", "Own synthesis not found");
    return publicDraw(json(row.result));
  }
  physicalPreview(token, input, key) {
    return this.mutation(token, input, key, "physical", (u) => {
      if (
        !input ||
        Object.keys(input).sort().join(",") !== "cardId,quantity" ||
        typeof input.cardId !== "string" ||
        !Number.isSafeInteger(input.quantity) ||
        input.quantity < 1
      )
        fail(422, "input", "Known card and positive integer preview quantity required");
      const old = this.db
        .prepare("SELECT result FROM physical_previews WHERE user_id=? AND card_id=?")
        .get(u.id, input.cardId);
      if (old) {
        const r = json(old.result);
        if (r.quantity !== input.quantity)
          fail(409, "preview", "Saved preview quantity is immutable");
        return r;
      }
      const card = this.catalog.fullCards.find((c) => c.id === input.cardId),
        count =
          this.db
            .prepare("SELECT count FROM holdings WHERE user_id=? AND card_id=?")
            .get(u.id, input.cardId)?.count ?? 0;
      if (
        !card ||
        card.poolId === this.catalog.samplePoolId ||
        this.catalog.grades.indexOf(card.grade) < this.catalog.grades.indexOf("SSR") ||
        count < input.quantity
      )
        fail(422, "eligibility", "Own SSR+ test card/copies required;not production eligibility");
      const pool = this.pools().find((p) => p.id === card.poolId);
      const result = {
        id: randomUUID(),
        cardId: card.id,
        quantity: input.quantity,
        ownedAtPreview: count,
        poolVersion: pool?.version ?? null,
        at: this.at(),
        environment: "syntheticLocalTest",
        policy:
          "0.15 own SSR+ and quantity1..owned fixture;no order/payment/address/consumption/stock/edition/serial/shipping",
      };
      this.db
        .prepare("INSERT INTO physical_previews VALUES(?,?,?,?)")
        .run(result.id, u.id, card.id, JSON.stringify(result));
      this.log(u.id, "physical.preview", result.id);
      this.fault("after-physical-preview");
      return result;
    });
  }
  revenue(token) {
    const u = this.actor(token);
    if (!["creator", "official"].includes(u.role))
      fail(403, "role", "Creator or official role required");
    const account = FIXTURES.find((f) => f.id === u.id)?.accountId;
    const partners = this.document("operations").data.partners.filter(
      (p) => u.role === "official" || p.accountId === account,
    );
    const rows = new Map();
    let excludedSynthesis = 0;
    for (const row of this.db.prepare("SELECT result FROM draws").all()) {
      const draw = json(row.result),
        ops = draw.rules.cooperation;
      for (const item of draw.items) {
        const b = ops.bindings.find((b) => b.cardId === item.id);
        if (!b || !partners.some((p) => p.id === b.partnerId)) continue;
        const c = ops.contracts.find((c) => c.id === b.contractId);
        if (!c) continue;
        const key = c.id + ":" + c.version;
        const entry = rows.get(key) ?? {
          id: key,
          partnerId: c.partnerId,
          contractId: c.id,
          contractVersion: c.version,
          remuneration: c.terms.remuneration,
          testSourceCards: 0,
          paidConceptCards: 0,
          excludedEleventh: 0,
          eligibleConceptCards: 0,
          actualWithdrawable: 0,
        };
        entry.testSourceCards++;
        if (draw.mode === "10plus1" && item.ordinal === 11) entry.excludedEleventh++;
        else {
          entry.paidConceptCards++;
          if (c.terms.remuneration !== "buyout" && c.status === "agreed")
            entry.eligibleConceptCards++;
        }
        rows.set(key, entry);
      }
    }
    for (const row of this.db.prepare("SELECT result FROM syntheses").all()) {
      const r = json(row.result),
        b = r.rules.cooperation.bindings.find((b) => b.cardId === r.cardId);
      if (b && partners.some((p) => p.id === b.partnerId)) excludedSynthesis++;
    }
    return {
      environment: "syntheticLocalTest",
      basis:
        "Source-event counts from immutable snapshots; TEST KP is not paid money;11th/synthesis excluded from paid-concept eligibility;no real revenue",
      rows: [...rows.values()],
      excludedSynthesis,
      actualWithdrawable: 0,
    };
  }
  adminSummary(token) {
    this.official(token);
    const scalar = (sql) => this.db.prepare(sql).get().n;
    return {
      environment: "syntheticLocalTest",
      accounts: scalar("SELECT COUNT(*) n FROM users"),
      testBalance: scalar("SELECT SUM(balance) n FROM users"),
      ledgerTotal: scalar("SELECT SUM(amount) n FROM ledger"),
      cards: scalar("SELECT COALESCE(SUM(count),0) n FROM holdings"),
      assetTotal: scalar("SELECT COALESCE(SUM(delta),0) n FROM asset_events"),
      draws: scalar("SELECT COUNT(*) n FROM draws"),
      syntheses: scalar("SELECT COUNT(*) n FROM syntheses"),
      previews: scalar("SELECT COUNT(*) n FROM physical_previews"),
      audit: scalar("SELECT COUNT(*) n FROM audit"),
    };
  }

  async backupTo(path) {
    await backup(this.db, path);
  }
  close() {
    this.db.close();
  }
}
