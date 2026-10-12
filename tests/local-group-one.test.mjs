import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { createLocalServer } from "../local-test/server.mjs";
const catalog = await loadCatalog(),
  path = join(mkdtempSync(join(tmpdir(), "keepy-group-one-")), "test.sqlite");
let fault = "";
let d = new LocalDatabase(path, catalog, {
  clock: () => Date.parse("2026-10-04T10:00:00Z"),
  fault: (stage) => {
    if (stage === fault) throw Error(stage);
  },
});
const official = d.session("official-a"),
  a = d.session("creator-a"),
  b = d.session("creator-b"),
  member = d.session("member-a");
const reject = (fn, status) => assert.throws(fn, (e) => e.status === status);
const counts = () =>
  JSON.stringify(
    ["documents", "document_versions", "audit", "mutations", "pool_versions"].map((t) =>
      d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all(),
    ),
  );
function pending(label) {
  let doc = d.document("operations");
  const c = {
    ...doc.data.contracts.find((c) => c.id === "local-contract-" + label),
    id: "pending-" + label,
    version: 2,
    status: "draft",
    confirmedAt: "",
    returnReason: "",
  };
  doc.data.contracts.push(c);
  d.saveCooperation(official, { expectedVersion: doc.version, data: doc.data });
  doc = d.document("operations");
  doc.data.contracts.find((c) => c.id === "pending-" + label).status = "pending";
  d.saveCooperation(official, { expectedVersion: doc.version, data: doc.data });
}
pending("a");
pending("b");
let v = d.document("operations").version;
const command = {
  expectedVersion: v,
  kind: "consent",
  contractId: "pending-a",
  status: "agreed",
  reason: "",
};
reject(() => d.creatorCommand(b, command, "foreign-consent-key"), 404);
reject(() => d.creatorCommand(member, command, "member-command-key"), 403);
for (const stage of ["after-document-snapshot", "before-mutation-receipt"]) {
  const before = counts();
  fault = stage;
  assert.throws(() => d.creatorCommand(a, command, "fault-consent-key"));
  assert.equal(counts(), before);
  fault = "";
}
const consent = d.creatorCommand(a, command, "consent-command-key");
assert.deepEqual(d.creatorCommand(a, command, "consent-command-key"), consent);
reject(
  () =>
    d.creatorCommand(
      a,
      { ...command, status: "returned", reason: "changed" },
      "consent-command-key",
    ),
  409,
);
reject(
  () =>
    d.creatorCommand(
      b,
      {
        expectedVersion: v,
        kind: "consent",
        contractId: "pending-b",
        status: "returned",
        reason: "synthetic revision",
      },
      "stale-consent-key",
    ),
  409,
);
const returned = d.creatorCommand(
  b,
  {
    expectedVersion: consent.version,
    kind: "consent",
    contractId: "pending-b",
    status: "returned",
    reason: "synthetic revision",
  },
  "return-command-key",
);
const review = {
  expectedVersion: returned.version,
  kind: "review",
  partnerId: "local-partner-a",
  note: "Synthetic review only; no withdrawal",
};
const requested = d.creatorCommand(a, review, "review-command-key");
assert.deepEqual(d.creatorCommand(a, review, "review-command-key"), requested);
reject(
  () =>
    d.creatorCommand(b, { ...review, expectedVersion: requested.version }, "foreign-review-key"),
  404,
);
const content = d.document("content");
content.data.faq.physical = {
  title: { en: "Synthetic local FAQ" },
  body: { en: "No real shipping" },
  hint: { en: "TEST only" },
};
const input = { expectedVersion: content.version, data: content.data };
reject(() => d.saveContent(a, input, "creator-content-key"), 403);
for (const stage of ["after-document-snapshot", "before-mutation-receipt"]) {
  const before = counts();
  fault = stage;
  assert.throws(() => d.saveContent(official, input, "fault-content-key"));
  assert.equal(counts(), before);
  fault = "";
}
const saved = d.saveContent(official, input, "content-command-key");
assert.deepEqual(d.saveContent(official, input, "content-command-key"), saved);
reject(() => d.saveContent(official, input, "stale-content-key"), 409);
const bad = structuredClone(content.data);
bad.faq.unknown = { title: { en: "bad" } };
reject(
  () =>
    d.saveContent(official, { expectedVersion: saved.version, data: bad }, "unknown-content-key"),
  422,
);
const pool = d.pools().find((p) => p.id === "p-uniform"),
  snapshot = d.draw(member, { poolId: pool.id, mode: "single" }, "before-publish-draw");
const settings = structuredClone(pool.editorSettings);
delete settings.scope;
const chosen = settings.cards.find((c) => c.included);
settings.grades = settings.grades.map((g) => ({
  ...g,
  enabled: g.grade === chosen.grade,
  pct: g.grade === chosen.grade ? 100 : 0,
}));
settings.cards = settings.cards.map((c) => ({ ...c, included: c.id === chosen.id }));
const pub = { expectedVersion: pool.version, settings };
reject(() => d.publishSettings(a, pool.id, pub, "creator-publish-key"), 403);
for (const stage of ["after-pool-snapshot", "before-mutation-receipt"]) {
  const before = counts();
  fault = stage;
  assert.throws(() => d.publishSettings(official, pool.id, pub, "fault-publish-key"));
  assert.equal(counts(), before);
  fault = "";
}
const published = d.publishSettings(official, pool.id, pub, "publish-command-key");
assert.deepEqual(d.publishSettings(official, pool.id, pub, "publish-command-key"), published);
reject(() => d.publishSettings(official, pool.id, pub, "stale-publish-key"), 409);
assert.deepEqual(d.drawById(member, snapshot.id), snapshot);
const draw = d.draw(member, { poolId: pool.id, mode: "10plus1" }, "configured-publish-draw");
assert.equal(draw.poolVersion, published.version);
assert.ok(draw.items.every((c) => c.id === chosen.id));
assert.equal(draw.after - draw.before, 11);
const invalid = structuredClone(settings);
invalid.grades[0].pct = -1;
reject(
  () =>
    d.publishSettings(
      official,
      pool.id,
      { expectedVersion: published.version, settings: invalid },
      "bad-publish-key",
    ),
  422,
);
const beforeRestart = counts();
d.close();
d = new LocalDatabase(path, catalog, { clock: () => Date.parse("2026-10-04T10:00:00Z") });
assert.equal(counts(), beforeRestart);
assert.equal(d.document("content").data.faq.physical.title.en, "Synthetic local FAQ");
assert.equal(d.cooperation(a).data.requests.length, 1);
assert.equal(d.cooperation(b).data.requests.length, 0);
assert.deepEqual(d.creatorCommand(a, command, "consent-command-key"), consent);
const app = createLocalServer(d);
await new Promise((r) => app.listen(0, "127.0.0.1", r));
const url = "http://127.0.0.1:" + app.address().port;
async function api(path, token, body, key, method = "POST") {
  const r = await fetch(url + "/api/local-test" + path, {
    method: body ? method : "GET",
    headers: {
      Cookie: "keepy_local_session=" + token,
      Origin: "http://127.0.0.1:8083",
      ...(body ? { "Content-Type": "application/json", "Idempotency-Key": key } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: r.status, data: await r.json() };
}
try {
  assert.equal((await api("/content", member)).data.version, saved.version);
  assert.equal((await api("/admin/content", member, input, "http-denied-key", "PUT")).status, 403);
  assert.equal((await api("/cooperation/commands", a, command, "consent-command-key")).status, 200);
  d.revoke(official, "creator-a");
  assert.equal((await api("/cooperation/commands", a, command, "consent-command-key")).status, 403);
} finally {
  await new Promise((r) => app.close(r));
  d.close();
}
console.log(
  "PASS creator ownership/current roles/CAS/replay, FAQ stable IDs, configured local draws, six rollback points, restart persistence, HTTP checks",
);
