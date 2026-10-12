import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { backup } from "node:sqlite";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { createLocalServer } from "../local-test/server.mjs";
const catalog = await loadCatalog(),
  dir = mkdtempSync(join(tmpdir(), "keepy-participation-")),
  path = join(dir, "test.sqlite");
let now = Date.parse("2026-10-04T10:00:00Z"),
  fault = "",
  d = new LocalDatabase(path, catalog, {
    clock: () => now,
    fault: (stage) => {
      if (stage === fault) throw Error(stage);
    },
  });
let a = d.session("member-a"),
  b = d.session("member-b"),
  o = d.session("official-a"),
  c = d.session("creator-a");
const reject = (fn, status) => assert.throws(fn, (e) => e.status === status),
  tables = [
    "participation_votes",
    "participation_recommendations",
    "participation_views",
    "participation_view_events",
    "participation_tasks",
    "participation_claims",
    "collection_participation",
    "documents",
    "document_versions",
    "audit",
    "mutations",
  ];
const snapshot = () =>
  JSON.stringify(tables.map((t) => d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all()));
const assets = () =>
  JSON.stringify(
    ["holdings", "asset_events", "ledger", "pity", "draws", "syntheses"].map((t) =>
      d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all(),
    ),
  );
const startAssets = assets(),
  command = (action, kind, id, value = null) => ({
    action,
    kind,
    id,
    value,
    expectedVersion: d.document("participation").version,
  });
const round = "theme-local-020",
  activity = "activity-local-020",
  recommend = {
    action: "recommend",
    roundId: "creator-local-020",
    name: "Fictional creator",
    url: "https://example.com/creator",
    reason: "Synthetic concept only",
  };
reject(() => d.participationMe("bad"), 401);
reject(() => d.participationAdmin(a), 403);
reject(() => d.participationAdmin(c), 403);
assert.equal(d.publicParticipation().rounds[0].counts.length, 0);
const vote = { action: "vote", roundId: round, optionId: "light" };
reject(() => d.participationCommand(a, { ...vote, optionId: "missing" }, "invalid-020"), 422);
for (const stage of [
  "after-participation-vote",
  "after-participation-task",
  "before-mutation-receipt",
]) {
  fault = stage;
  const before = snapshot();
  assert.throws(() => d.participationCommand(a, vote, "rollback-vote-020"));
  assert.equal(snapshot(), before);
  fault = "";
}
d.participationCommand(a, vote, "vote-020");
let stable = snapshot();
d.participationCommand(a, vote, "vote-020");
assert.equal(snapshot(), stable);
reject(() => d.participationCommand(a, { ...vote, optionId: "city" }, "vote-020"), 409);
reject(() => d.participationCommand(a, { ...vote, optionId: "city" }, "extra-vote-020"), 409);
reject(() => d.participationCommand(a, vote, "dupe-option-020"), 409);
assert.equal(d.participationMe(b).votes.length, 0);
assert.equal(d.participationMe(a).tasks.filter((t) => t.id === "vote").length, 1);
let value = structuredClone(d.document("participation").data.rounds[0].draft);
value.limit = 2;
d.participationAdminCommand(o, command("save", "round", round, value), "changed-draft-020");
assert.equal(d.publicParticipation().rounds[0].limit, 1);
reject(
  () => d.participationAdminCommand(o, command("publish", "round", round), "locked-publish-020"),
  409,
);
value.limit = 1;
value.title.en = "Updated title, same conditions";
d.participationAdminCommand(o, command("save", "round", round, value), "restore-draft-020");
d.participationAdminCommand(o, command("publish", "round", round), "publish-title-020");
assert.equal(d.publicParticipation().rounds[0].title.en, value.title.en);
assert.equal(
  JSON.parse(d.db.prepare("SELECT payload FROM participation_votes").get().payload).rule.title.en,
  "Sample next-season theme vote",
);
const freshId = "local-new-round";
value = structuredClone(value);
value.resultsPublished = true;
value.limit = 2;
value.startAt = "2026-10-05T00:00:00Z";
value.endAt = "2026-10-06T00:00:00Z";
reject(
  () => d.participationAdminCommand(a, command("save", "round", freshId, value), "member-save-020"),
  403,
);
for (const stage of ["after-document-snapshot", "before-mutation-receipt"]) {
  fault = stage;
  const before = snapshot();
  assert.throws(() =>
    d.participationAdminCommand(
      o,
      command("save", "round", freshId, value),
      "rollback-content-020",
    ),
  );
  assert.equal(snapshot(), before);
  fault = "";
}
d.participationAdminCommand(o, command("save", "round", freshId, value), "save-new-020");
assert.ok(!d.publicParticipation().rounds.some((r) => r.id === freshId));
const savedCommand = command("publish", "round", freshId);
d.participationAdminCommand(o, savedCommand, "publish-new-020");
stable = snapshot();
d.participationAdminCommand(o, savedCommand, "publish-new-020");
assert.equal(snapshot(), stable);
reject(() => d.participationAdminCommand(o, savedCommand, "stale-content-020"), 409);
reject(() => d.participationCommand(a, { ...vote, roundId: freshId }, "before-start-020"), 409);
now = Date.parse(value.startAt);
a = d.session("member-a");
b = d.session("member-b");
o = d.session("official-a");
d.participationCommand(a, { ...vote, roundId: freshId }, "start-boundary-020");
d.participationCommand(a, { ...vote, roundId: freshId, optionId: "city" }, "second-vote-020");
assert.equal(d.publicParticipation().rounds.find((r) => r.id === freshId).counts.length, 0);
now = Date.parse(value.endAt);
a = d.session("member-a");
o = d.session("official-a");
reject(() => d.participationCommand(a, { ...vote, roundId: freshId }, "end-boundary-020"), 409);
assert.deepEqual(
  d
    .publicParticipation()
    .rounds.find((r) => r.id === freshId)
    .counts.map((c) => c.count),
  [1, 1],
);
reject(
  () => d.participationCommand(a, { ...recommend, url: "javascript:alert(1)" }, "bad-url-020"),
  422,
);
for (const stage of ["after-participation-recommend", "before-mutation-receipt"]) {
  fault = stage;
  const before = snapshot();
  assert.throws(() => d.participationCommand(a, recommend, "rollback-rec-020"));
  assert.equal(snapshot(), before);
  fault = "";
}
d.participationCommand(a, recommend, "recommend-020");
reject(() => d.participationCommand(a, recommend, "dupe-rec-020"), 409);
b = d.session("member-b");
assert.equal(d.participationMe(b).recommendations.length, 0);
assert.ok(!JSON.stringify(d.publicParticipation()).includes("Fictional creator"));
const rec = d.participationMe(a).recommendations[0];
const review = {
  action: "review",
  id: rec.id,
  expectedVersion: rec.version,
  status: "approved",
  note: "Sample planning suggestion; no collaboration claim",
};
reject(() => d.participationAdminCommand(a, review, "member-review-020"), 403);
fault = "after-participation-review";
stable = snapshot();
assert.throws(() => d.participationAdminCommand(o, review, "rollback-review-020"));
assert.equal(snapshot(), stable);
fault = "";
d.participationAdminCommand(o, review, "review-020");
reject(() => d.participationAdminCommand(o, review, "stale-review-020"), 409);
assert.equal(d.participationMe(a).recommendations[0].status, "approved");
assert.ok(!JSON.stringify(d.publicParticipation()).includes("Fictional creator"));
const claim = { action: "claim", activityId: activity };
reject(() => d.participationCommand(a, claim, "no-condition-020"), 409);
d.participationCommand(a, { action: "album-view" }, "view-album-020");
assert.ok(d.participationMe(a).tasks.some((t) => t.id === "album"));
for (const stage of ["after-participation-claim", "before-mutation-receipt"]) {
  fault = stage;
  const before = snapshot();
  assert.throws(() => d.participationCommand(a, claim, "rollback-claim-020"));
  assert.equal(snapshot(), before);
  fault = "";
}
const claimed = d.participationCommand(a, claim, "claim-020");
assert.equal(claimed.rewardGranted, false);
assert.equal(claimed.assetReward, false);
stable = snapshot();
d.participationCommand(a, claim, "claim-020");
assert.equal(snapshot(), stable);
d.participationCommand(a, claim, "claim-again-020");
assert.equal(d.db.prepare("SELECT COUNT(*) n FROM participation_claims").get().n, 1);
assert.equal(d.db.prepare("SELECT COUNT(*) n FROM collection_participation").get().n, 1);
assert.ok(d.collectionMe(a).awards.some((a) => a.type === "activity"));
let act = structuredClone(d.document("participation").data.activities[0].draft);
act.condition = "vote";
d.participationAdminCommand(
  o,
  command("save", "activity", activity, act),
  "activity-condition-draft-020",
);
reject(
  () =>
    d.participationAdminCommand(o, command("publish", "activity", activity), "activity-locked-020"),
  409,
);
act.condition = "album";
act.rewardKind = "kp";
reject(
  () =>
    d.participationAdminCommand(
      o,
      command("save", "activity", "local-asset", act),
      "no-asset-policy-020",
    ),
  422,
);
act.rewardKind = "pending";
act.startAt = "2026-10-06T00:00:00Z";
act.endAt = "2026-10-07T00:00:00Z";
act.claimUntil = "2026-10-08T00:00:00Z";
d.participationAdminCommand(
  o,
  command("save", "activity", "local-expiring", act),
  "save-expire-020",
);
d.participationAdminCommand(
  o,
  command("publish", "activity", "local-expiring"),
  "publish-expire-020",
);
// Qualify during the activity, then revisit after it ends: the earlier evidence remains valid.
now = Date.parse(act.startAt) + 1000;
a = d.session("member-a");
d.participationCommand(a, { action: "album-view" }, "qualifying-view-020");
now = Date.parse(act.endAt);
a = d.session("member-a");
b = d.session("member-b");
o = d.session("official-a");
d.participationCommand(b, { action: "album-view" }, "late-view-020");
reject(
  () =>
    d.participationCommand(
      b,
      { action: "claim", activityId: "local-expiring" },
      "late-condition-020",
    ),
  409,
);
assert.equal(
  d.participationMe(b).activityEligibility.find((a) => a.activityId === "local-expiring")
    .conditionMet,
  false,
);
a = d.session("member-a");
d.participationCommand(a, { action: "album-view" }, "post-period-view-020");
assert.equal(
  d.participationMe(a).activityEligibility.find((x) => x.activityId === "local-expiring")
    .conditionMet,
  true,
);
d.participationCommand(a, { action: "claim", activityId: "local-expiring" }, "grace-claim-020");
now = Date.parse(act.claimUntil);
b = d.session("member-b");
reject(
  () =>
    d.participationCommand(b, { action: "claim", activityId: "local-expiring" }, "deadline-020"),
  409,
);
now = Date.parse("2026-11-01T00:00:00Z");
o = d.session("official-a");
a = d.session("member-a");
let creator = structuredClone(d.document("participation").data.rounds[1].draft);
creator.resultsPublished = true;
d.participationAdminCommand(
  o,
  command("save", "round", "creator-local-020", creator),
  "publish-rec-draft-020",
);
d.participationAdminCommand(
  o,
  command("publish", "round", "creator-local-020"),
  "publish-rec-result-020",
);
const publicResults = d.publicParticipation();
assert.deepEqual(publicResults.rounds.find((r) => r.kind === "creator").recommendations, [
  { name: recommend.name, url: recommend.url },
]);
assert.ok(!JSON.stringify(publicResults).includes("reviewNote"));
assert.ok(!JSON.stringify(publicResults).includes('"user_id"'));
d.participationAdminCommand(o, command("withdraw", "activity", activity), "withdraw-activity-020");
assert.ok(!d.publicParticipation().activities.some((a) => a.id === activity));
assert.equal(d.participationMe(a).claims.length, 2);
reject(() => d.participationCommand(a, claim, "withdrawn-claim-020"), 404);
let doc = d.document("participation"),
  taskRules = structuredClone(doc.data.tasks);
taskRules[2].title.en = "Changed task title";
d.participationAdminCommand(
  o,
  { action: "tasks", expectedVersion: doc.version, tasks: taskRules },
  "tasks-edit-020",
);
assert.equal(d.participationMe(a).tasks.find((t) => t.id === "album").title.en, "View your album");
assert.equal(d.participationMe(a).tasks.filter((t) => t.id === "album").length, 1);
assert.throws(() => d.db.prepare("UPDATE participation_votes SET option_id='changed'").run());
assert.throws(() => d.db.prepare("UPDATE participation_claims SET at='changed'").run());
assert.equal(assets(), startAssets);
const persisted = d.participationMe(a),
  copy = join(dir, "backup.sqlite");
await backup(d.db, copy);
d.close();
d = new LocalDatabase(path, catalog, { clock: () => now });
assert.deepEqual(d.participationMe(a), persisted);
const restored = new LocalDatabase(copy, catalog, { clock: () => now });
assert.deepEqual(restored.participationMe(a), persisted);
restored.close();
const server = createLocalServer(d);
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = "http://127.0.0.1:" + server.address().port + "/api/local-test";
try {
  assert.equal((await fetch(base + "/participation")).status, 200);
  assert.equal((await fetch(base + "/participation/me")).status, 401);
  assert.equal((await fetch(base + "/admin/participation")).status, 401);
  assert.equal(
    (
      await fetch(base + "/participation/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
    ).status,
    403,
  );
} finally {
  await new Promise((resolve) => server.close(resolve));
  d.close();
}
console.log(
  "Participation 0.20 passed: quota/boundaries, drafts/locks, moderation/private data, tasks/evidence, no rewards, dedupe/rollback, immutable snapshots, restart/restore, HTTP.",
);
