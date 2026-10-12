import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { createLocalServer } from "../local-test/server.mjs";
import {
  isLocalSummary,
  unreadableLocalResponse,
  isDefiniteLocalRejection,
} from "../src/lib/local-summary-contract.mjs";
const d = new LocalDatabase(
    join(mkdtempSync(join(tmpdir(), "keepy-actor-")), "qa.sqlite"),
    await loadCatalog(),
  ),
  server = createLocalServer(d);
await new Promise((r) => server.listen(0, "127.0.0.1", r));
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    o = d.session("official-a"),
    me = d.collectionMe(a);
  const summary = d.summary(a);
  assert.equal(isLocalSummary(summary), true);
  assert.equal(isLocalSummary({ ...summary, tokenHash: "private" }), false);
  assert.equal(isLocalSummary({ ...summary, user: { ...summary.user, role: "superuser" } }), false);
  assert.equal(
    isLocalSummary({ ...summary, holdings: [{ user_id: "member-b", card_id: "known", count: 1 }] }),
    false,
  );
  assert.equal(
    isLocalSummary({
      ...summary,
      holdings: [{ user_id: "member-a", card_id: "known", count: -1 }],
    }),
    false,
  );
  const request = async (path, token, actor, body) => {
    const r = await fetch("http://127.0.0.1:" + server.address().port + "/api/local-test" + path, {
      headers: {
        Origin: "http://127.0.0.1:8787",
        Cookie: "keepy_local_session=" + token,
        "X-KEEPY-Expected-Actor": actor,
        "Content-Type": "application/json",
        "Idempotency-Key": "qa-boundary-" + crypto.randomUUID(),
      },
      ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
    });
    return { status: r.status, value: await r.json() };
  };
  const snapshot = () =>
      JSON.stringify(
        [
          "collection_profiles",
          "play_results",
          "mutations",
          "audit",
          "holdings",
          "ledger",
          "document_versions",
        ].map((t) => d.db.prepare("SELECT * FROM " + t).all()),
      ),
    before = snapshot();
  const input = {
    expectedVersion: me.profile.version,
    data: { ...me.profile.data, bio: "isolated own draft" },
  };
  const stale = await request("/collection/profile", b, "member-a", input);
  assert.equal(stale.status, 409);
  assert.equal(stale.value.code, "actor-changed");
  for (const path of [
    "/collection/me",
    "/play/me",
    "/discovery/reading/me",
    "/participation/me",
    "/supply/me",
    "/admin/supply",
  ])
    assert.equal((await request(path, b, "member-a")).status, 409);
  assert.equal((await request("/collection/profile", a, "member-b", input)).status, 409);
  assert.equal((await request("/collection/profile", "forged", "member-a", input)).status, 401);
  assert.equal((await request("/play/me", o, "official-a")).status, 403);
  assert.equal(snapshot(), before);
  // /me is the authoritative identity read; an assertion can never grant a role.
  assert.equal((await request("/me", b, "member-a")).value.user.id, "member-b");
  assert.equal((await request("/collection/profile", a, "member-a", input)).status, 200);
  assert.equal(d.collectionMe(a).profile.data.bio, "isolated own draft");
  assert.notEqual(d.collectionMe(b).profile.data.bio, "isolated own draft");
} finally {
  await new Promise((r) => server.close(r));
  d.close();
}
console.log(
  "PASS stale expected-actor read/write rejection, authoritative cookie role, unchanged rejected transactions and correct own save",
);
for (const status of [200, 201, 204, 206])
  assert.equal(unreadableLocalResponse(status).status, undefined);
for (const status of [401, 403, 409, 422, 500, 503])
  assert.equal(unreadableLocalResponse(status).status, status);
for (const status of [200, 401, 403, 500, 503])
  assert.equal(isDefiniteLocalRejection({ status }), false);
assert.equal(isDefiniteLocalRejection({ status: 409, code: "actor-changed" }), false);
assert.equal(isDefiniteLocalRejection({ status: 409, code: "version" }), true);
assert.equal(isDefiniteLocalRejection({ status: 422 }), true);
