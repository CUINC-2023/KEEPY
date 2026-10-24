import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { createLocalServer } from "../local-test/server.mjs";
import { creatorProfile, saveCreatorProfile } from "../local-test/creator-profile.mjs";
import {
  emptyCreatorProfile,
  validCreatorProfile,
  isCreatorProfileProjection,
} from "../src/lib/creator-profile.mjs";
const file = join(mkdtempSync(join(tmpdir(), "keepy-creator-profile-")), "qa.sqlite"),
  catalog = await loadCatalog();
let fault = false,
  d = new LocalDatabase(file, catalog, {
    fault: (stage) => {
      if (fault && stage === "after-creator-profile") throw Error("QA rollback");
    },
  });
const server = createLocalServer(d);
await new Promise((r) => server.listen(0, "127.0.0.1", r));
try {
  const a = d.session("creator-a"),
    b = d.session("creator-b"),
    m = d.session("member-a"),
    o = d.session("official-a");
  const preserved = () =>
    JSON.stringify(
      ["holdings", "asset_events", "ledger", "draws", "pool_versions", "document_versions"].map(
        (t) => d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all(),
      ),
    );
  const assets = preserved();
  const initial = creatorProfile(d, a);
  assert.equal(initial.version, 0);
  assert.ok(isCreatorProfileProjection(initial));
  for (const token of [m, o]) {
    assert.throws(
      () => creatorProfile(d, token),
      (e) => e.status === 403,
    );
    assert.throws(
      () =>
        saveCreatorProfile(
          d,
          token,
          { expectedVersion: 0, data: emptyCreatorProfile() },
          "qa-role-save",
        ),
      (e) => e.status === 403,
    );
  }
  assert.throws(
    () => creatorProfile(d, "invalid"),
    (e) => e.status === 401,
  );
  const data = {
      ...emptyCreatorProfile(),
      displayName: { "zh-TW": "QA本人草稿", en: "QA own draft" },
      intro: { "zh-TW": "私人介紹", en: "Private introduction" },
      links: ["https://example.com/creator"],
    },
    body = { expectedVersion: 0, data };
  const before = () =>
    JSON.stringify(
      ["documents", "mutations", "audit"].map((t) =>
        d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all(),
      ),
    );
  const base = before();
  for (const invalid of [
    { ...body, actorId: "creator-b" },
    { ...body, expectedVersion: -1 },
    { ...body, data: { ...data, ownerId: "creator-b" } },
    { ...body, data: { ...data, displayName: { "zh-TW": "x".repeat(81), en: "" } } },
    { ...body, data: { ...data, links: ["javascript:alert(1)"] } },
    { ...body, data: { ...data, links: ["https://user:pass@example.com"] } },
  ])
    assert.throws(
      () => saveCreatorProfile(d, a, invalid, "qa-invalid"),
      (e) => e.status === 422,
    );
  assert.equal(before(), base);
  fault = true;
  assert.throws(() => saveCreatorProfile(d, a, body, "qa-original-key"), /QA rollback/);
  assert.equal(before(), base);
  fault = false;
  assert.equal(saveCreatorProfile(d, a, body, "qa-original-key").version, 1);
  assert.equal(saveCreatorProfile(d, a, body, "qa-original-key").version, 1);
  assert.equal(creatorProfile(d, a).version, 1);
  assert.equal(creatorProfile(d, b).version, 0);
  assert.throws(
    () => saveCreatorProfile(d, a, body, "qa-new-stale-key"),
    (e) => e.status === 409,
  );
  assert.throws(
    () => saveCreatorProfile(d, a, { ...body, expectedVersion: 1 }, "qa-original-key"),
    (e) => e.status === 409,
  );
  assert.equal(JSON.stringify(d.publicDiscovery()).includes("QA own draft"), false);
  assert.equal(JSON.stringify(d.supplyList(b)).includes("QA own draft"), false);
  const req = async (
    token,
    method = "GET",
    input,
    path = "/creator/profile",
    actor = "creator-a",
  ) =>
    fetch("http://127.0.0.1:" + server.address().port + "/api/local-test" + path, {
      method,
      headers: {
        Cookie: "keepy_local_session=" + token,
        Origin: "http://127.0.0.1:8787",
        "Content-Type": "application/json",
        "X-KEEPY-Expected-Actor": actor,
        "Idempotency-Key": "qa-http-key",
      },
      ...(input ? { body: JSON.stringify(input) } : {}),
    });
  assert.equal((await req(b, "GET", undefined, "/creator/profile", "creator-a")).status, 409);
  assert.equal((await req(o, "GET", undefined, "/creator/profile", "official-a")).status, 403);
  assert.equal((await req(a, "GET", undefined, "/creator/profile?actorId=creator-b")).status, 422);
  const read = await req(a);
  assert.equal(read.headers.get("cache-control"), "no-store");
  assert.deepEqual((await read.json()).data, data);
  d.db.prepare("UPDATE users SET role='member' WHERE id='creator-a'").run();
  assert.throws(
    () => saveCreatorProfile(d, a, body, "qa-original-key"),
    (e) => e.status === 403,
  );
  d.db.prepare("UPDATE users SET role='creator' WHERE id='creator-a'").run();
  assert.equal(preserved(), assets);
  d.close();
  d = new LocalDatabase(file, catalog);
  assert.deepEqual(creatorProfile(d, a).data, data);
  assert.equal(saveCreatorProfile(d, a, body, "qa-original-key").version, 1);
  assert.equal(preserved(), assets);
  assert.ok(validCreatorProfile(emptyCreatorProfile()));
  console.log(
    "PASS creator profile: owner/role/anonymous/contract/CAS/original-key/rollback/restart/private projection/history",
  );
} finally {
  await new Promise((r) => server.close(r));
  d.close();
}
