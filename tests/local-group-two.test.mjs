import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { createLocalServer } from "../local-test/server.mjs";
const catalog = await loadCatalog(),
  path = join(mkdtempSync(join(tmpdir(), "keepy-group-two-")), "local.sqlite");
let fault = "";
let d = new LocalDatabase(path, catalog, {
  clock: () => Date.parse("2026-10-04T10:00:00Z"),
  fault: (stage) => {
    if (fault === stage) throw Error(stage);
  },
});
const a = d.session("member-a"),
  b = d.session("member-b"),
  ca = d.session("creator-a"),
  cb = d.session("creator-b"),
  official = d.session("official-a");
const reject = (fn, status) => assert.throws(fn, (e) => e.status === status);
const countState = () =>
  JSON.stringify(
    [
      "holdings",
      "acquisitions",
      "asset_events",
      "syntheses",
      "synthesis_progress",
      "physical_previews",
      "pity",
      "ledger",
      "audit",
      "mutations",
    ].map((t) => d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all()),
  );
function configure(grade) {
  const pool = d.pools().find((p) => p.id === "p-uniform"),
    settings = structuredClone(catalog.drawSettings[pool.id]);
  delete settings.scope;
  const card = settings.cards.find((c) => c.grade === grade);
  settings.grades = settings.grades.map((g) => ({
    ...g,
    enabled: g.grade === grade,
    pct: g.grade === grade ? 100 : 0,
  }));
  settings.cards = settings.cards.map((c) => ({ ...c, included: c.id === card.id }));
  d.publishSettings(
    official,
    pool.id,
    { expectedVersion: pool.version, settings },
    "configure-" + grade,
  );
  return card;
}
function reconcile() {
  for (const u of ["member-a", "member-b", "creator-a", "creator-b", "official-a", "official-b"]) {
    assert.equal(
      d.db.prepare("SELECT balance FROM users WHERE id=?").get(u).balance,
      d.db.prepare("SELECT SUM(amount) n FROM ledger WHERE user_id=?").get(u).n,
    );
    for (const h of d.db.prepare("SELECT * FROM holdings WHERE user_id=?").all(u))
      assert.equal(
        h.count,
        d.db
          .prepare(
            "SELECT COALESCE(SUM(delta),0) n FROM asset_events WHERE user_id=? AND card_id=?",
          )
          .get(u, h.card_id).n,
      );
  }
}
const r = configure("R"),
  draw = d.draw(a, { poolId: "p-uniform", mode: "10plus1" }, "r-source-eleven"),
  before = d.summary(a);
assert.equal(before.holdings.find((h) => h.card_id === r.id).count, 11);
const input = { poolId: "p-uniform", grade: "R", materials: [r.id, r.id, r.id], useItem: false };
reject(() => d.synthesis(b, input, "foreign-synthesis"), 422);
reject(() => d.synthesis(a, { ...input, grade: "O" }, "o-synthesis-reject"), 422);
reject(() => d.synthesis(a, { ...input, materials: [r.id] }, "bad-synthesis-count"), 422);
for (const stage of [
  "after-synthesis-consume",
  "after-synthesis-result",
  "before-mutation-receipt",
]) {
  const old = countState();
  fault = stage;
  assert.throws(() => d.synthesis(a, input, "fault-synthesis-key"));
  assert.equal(countState(), old);
  fault = "";
}
const result = d.synthesis(a, input, "synthesis-fail-key");
assert.equal(result.kind, "fail");
assert.equal(result.afterFailure, 7);
assert.ok(!result.rules.cooperation);
assert.deepEqual(d.synthesis(a, input, "synthesis-fail-key"), result);
reject(() => d.synthesis(a, { ...input, useItem: true }, "synthesis-fail-key"), 409);
reject(() => d.synthesisById(b, result.id), 404);
assert.deepEqual(d.synthesisById(a, result.id), result);
assert.equal(d.summary(a).user.balance, before.user.balance);
assert.deepEqual(d.summary(a).pity, before.pity);
assert.equal(
  d.summary(a).holdings.reduce((n, h) => n + h.count, 0),
  9,
);
const nextDraw = d.draw(a, { poolId: "p-uniform", mode: "single" }, "after-synthesis-draw");
assert.equal(
  nextDraw.items[0].ownedBefore,
  d.summary(a).holdings.find((h) => h.card_id === r.id).count - 1,
);
for (let i = 0; i < 2; i++) d.synthesis(a, input, "fail-streak-" + i);
const pity = d.synthesis(a, input, "synthesis-pity-key");
assert.equal(pity.kind, "pity");
assert.equal(pity.afterFailure, 0);
assert.equal(catalog.fullCards.find((c) => c.id === pity.cardId).grade, "RR");
d.draw(a, { poolId: "p-uniform", mode: "10plus1" }, "extra-materials-key");
const success = d.synthesis(a, { ...input, useItem: true }, "synthesis-success-key");
assert.equal(success.kind, "success");
assert.equal(catalog.fullCards.find((c) => c.id === success.cardId).grade, "RR");
reconcile();
const ssr = configure("SSR");
const ssrDraw = d.draw(a, { poolId: "p-uniform", mode: "10plus1" }, "ssr-source-eleven");
const preview = { cardId: ssr.id, quantity: 2 };
reject(() => d.physicalPreview(b, preview, "foreign-preview-key"), 422);
reject(() => d.physicalPreview(a, { cardId: r.id, quantity: 1 }, "low-grade-preview-key"), 422);
reject(() => d.physicalPreview(a, { cardId: ssr.id, quantity: 12 }, "quantity-preview-key"), 422);
for (const stage of ["after-physical-preview", "before-mutation-receipt"]) {
  const old = countState();
  fault = stage;
  assert.throws(() => d.physicalPreview(a, preview, "fault-preview-key"));
  assert.equal(countState(), old);
  fault = "";
}
const ownBefore = d.summary(a);
const saved = d.physicalPreview(a, preview, "preview-command-key");
assert.deepEqual(d.physicalPreview(a, preview, "preview-command-key"), saved);
assert.deepEqual(d.physicalPreview(a, preview, "another-preview-key"), saved);
reject(() => d.physicalPreview(a, { ...preview, quantity: 1 }, "changed-preview-key"), 409);
assert.deepEqual(d.summary(a).holdings, ownBefore.holdings);
assert.deepEqual(d.summary(a).ledger, ownBefore.ledger);
assert.deepEqual(d.summary(a).pity, ownBefore.pity);
assert.equal(d.summary(a).physical.length, 1);
assert.equal(d.summary(b).physical.length, 0);
assert.equal(d.summary(b).syntheses.length, 0);
const revA = d.revenue(ca),
  revB = d.revenue(cb);
assert.ok(revA.rows.every((r) => r.partnerId === "local-partner-a"));
assert.ok(revB.rows.every((r) => r.partnerId === "local-partner-b"));
const all = d.revenue(official);
assert.equal(
  all.rows.reduce((n, r) => n + r.testSourceCards, 0),
  d.db.prepare("SELECT COUNT(*) n FROM acquisitions WHERE source='test-paid-draw'").get().n,
);
assert.equal(
  all.rows.reduce((n, r) => n + r.excludedEleventh, 0),
  3,
);
assert.equal(all.actualWithdrawable, 0);
assert.equal(all.excludedSynthesis, 5);
reject(() => d.revenue(a), 403);
assert.deepEqual(d.drawById(a, draw.id), draw);
assert.equal(d.drawById(a, ssrDraw.id).poolVersion, ssrDraw.poolVersion);
reconcile();
const overview = d.adminSummary(official);
assert.equal(overview.testBalance, overview.ledgerTotal);
assert.equal(overview.cards, overview.assetTotal);
let cooperation = d.document("operations");
cooperation.data.partners[0].cooperation = "stopped";
cooperation.data.partners[0].restrictionReason = "synthetic review";
d.saveCooperation(official, { expectedVersion: cooperation.version, data: cooperation.data });
const stopped = countState();
reject(() => d.draw(a, { poolId: "p-uniform", mode: "single" }, "stopped-cooperation-draw"), 422);
assert.equal(countState(), stopped);
assert.deepEqual(d.drawById(a, draw.id), draw);
cooperation = d.document("operations");
cooperation.data.partners[0].cooperation = "active";
cooperation.data.partners[0].restrictionReason = "";
d.saveCooperation(official, { expectedVersion: cooperation.version, data: cooperation.data });
const backupPath = join(mkdtempSync(join(tmpdir(), "keepy-two-restore-")), "backup.sqlite");
await d.backupTo(backupPath);
const restored = new LocalDatabase(backupPath, catalog, {
  clock: () => Date.parse("2026-10-04T10:00:00Z"),
});
assert.deepEqual(
  JSON.parse(JSON.stringify(restored.summary(a))),
  JSON.parse(JSON.stringify(d.summary(a))),
);
assert.deepEqual(restored.revenue(ca), d.revenue(ca));
restored.close();
const snapshot = countState();
d.close();
d = new LocalDatabase(path, catalog, { clock: () => Date.parse("2026-10-04T10:00:00Z") });
assert.equal(countState(), snapshot);
assert.deepEqual(d.synthesis(a, input, "synthesis-fail-key"), result);
assert.deepEqual(d.physicalPreview(a, preview, "preview-command-key"), saved);
reconcile();
const app = createLocalServer(d);
await new Promise((r) => app.listen(0, "127.0.0.1", r));
const url = "http://127.0.0.1:" + app.address().port;
async function api(path, token, body, key) {
  const response = await fetch(url + "/api/local-test" + path, {
    method: body ? "POST" : "GET",
    headers: {
      Cookie: "keepy_local_session=" + token,
      Origin: "http://127.0.0.1:8083",
      ...(body ? { "Content-Type": "application/json", "Idempotency-Key": key } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, data: await response.json() };
}
try {
  assert.equal((await api("/syntheses/" + result.id, b)).status, 404);
  assert.equal((await api("/syntheses", a, input, "synthesis-fail-key")).data.id, result.id);
  assert.equal((await api("/revenue", a)).status, 403);
  assert.equal((await api("/admin/summary", ca)).status, 403);
  assert.equal(
    (await api("/physical-previews", a, preview, "preview-command-key")).data.id,
    saved.id,
  );
  assert.ok(!(await api("/me", b)).data.assetEvents.some((e) => e.operation_id === result.id));
} finally {
  await new Promise((r) => app.close(r));
  d.close();
}
console.log(
  "PASS source-ledger reconciliation; synthesis fail/success/pity/idempotency/snapshots/ownership; physical preview no-consumption; TEST revenue exclusions; five rollback points; restart; HTTP isolation",
);
