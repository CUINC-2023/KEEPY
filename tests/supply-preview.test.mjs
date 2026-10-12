import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { supplyPreview, supplyProjection } from "../local-test/supply.mjs";
import { sampleUniformPackage, SAMPLE_PACKAGE_ID as id } from "../src/lib/sample-022.mjs";
import { createLocalServer } from "../local-test/server.mjs";
const path = join(mkdtempSync(join(tmpdir(), "keepy-private-preview-")), "test.sqlite");
let now = Date.parse("2026-10-09T08:00:00Z");
const d = new LocalDatabase(path, await loadCatalog(), { clock: () => now });
const a = d.session("creator-a"),
  b = d.session("creator-b"),
  o = d.session("official-a"),
  m = d.session("member-a");
let seq = 0;
const value = sampleUniformPackage("local-partner-a", now),
  pack = () => d.db.prepare("SELECT version,payload FROM documents WHERE id=?").get("supply:" + id),
  snapshot = () =>
    JSON.stringify(
      [
        "documents",
        "document_versions",
        "audit",
        "mutations",
        "holdings",
        "ledger",
        "asset_events",
      ].map((t) => d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all()),
    );
const preview = (token, revision = null, v = value, official = false) =>
  supplyPreview(
    d,
    token,
    { id, expectedVersion: pack()?.version ?? 0, revision, value: v },
    official,
  );
const reject = (fn, status) => assert.throws(fn, (e) => e.status === status);
const cmd = (action, v = null, reason = "") => {
  const r = pack(),
    p = r && JSON.parse(r.payload);
  return {
    action,
    id,
    expectedVersion: r?.version ?? 0,
    revision:
      action === "save" ? null : action === "withdraw" ? p?.publishedRevision : p?.draftRevision,
    expectedDiscoveryVersion: ["publish", "withdraw"].includes(action)
      ? d.document("discovery").version
      : null,
    value: v,
    reason,
  };
};
const send = (token, action, v = null, reason = "", official = false) =>
  d.supplyCommand(token, cmd(action, v, reason), "preview-command-" + ++seq, official);
try {
  const before = snapshot(),
    unsaved = preview(a);
  assert.equal(unsaved.source.kind, "local-unsaved");
  assert.equal(unsaved.source.revision, null);
  assert.equal(unsaved.items.length, 4);
  assert.equal(unsaved.impact.entries.filter((i) => i.change === "added").length, 4);
  assert.ok(unsaved.impact.reasons.includes("approval"));
  assert.equal(snapshot(), before);
  reject(() => preview(m), 403);
  reject(() => preview(o, null, value, true), 403);
  send(a, "save", value);
  reject(() => preview(b, 1, null), 403);
  reject(() => preview(a, 1, null, true), 403);
  const saved = preview(o, 1, null, true),
    state = snapshot();
  preview(a, 1, null);
  preview(o, 1, null, true);
  assert.equal(snapshot(), state);
  assert.equal(
    d.publicDiscovery().items.some((i) => i.sourcePackId === id),
    false,
  );
  send(a, "submit");
  send(o, "approve", null, "Specified synthetic preview revision", true);
  send(o, "publish", null, "", true);
  const strip = (i) => {
    const { revision, publishedAt, ...rest } = i;
    return rest;
  };
  assert.deepEqual(
    saved.items.map(strip),
    d
      .publicDiscovery()
      .items.filter((i) => i.sourcePackId === id)
      .map(strip),
  );
  assert.equal(JSON.stringify(saved).includes(value.materials[0].evidence), false);
  const publication = structuredClone(d.publicDiscovery().items);
  assert.equal(
    preview(o, 1, null, true).impact.entries.every((i) => i.change === "unchanged"),
    true,
  );
  assert.equal(preview(o, 1, null, true).impact.publishedRevision, 1);
  const changed = structuredClone(value);
  changed.copy.story.en += " Unsaved private edit.";
  const impact = preview(a, null, changed).impact;
  assert.ok(impact.entries.some((i) => i.change === "changed" && i.fields.includes("copy")));
  assert.equal(JSON.stringify(impact).includes("Unsaved private edit"), false);
  assert.equal(JSON.stringify(impact).includes(value.materials[0].evidence), false);
  assert.ok(
    preview(a, null, changed).items.some((i) => i.copy.story.en.includes("Unsaved private edit.")),
  );
  assert.deepEqual(d.publicDiscovery().items, publication);
  const invalid = structuredClone(value);
  invalid.copy.story.en = "";
  assert.equal(preview(a, null, invalid).items.length, 0);
  invalid.copy.story.en = value.copy.story.en;
  invalid.materials[0].version++;
  invalid.materials[0].uses.website = "pending";
  assert.equal(preview(a, null, invalid).items.length, 0);
  invalid.materials[0].uses.website = "sample-confirmed";
  invalid.materials[0].alt.en = "";
  assert.equal(preview(a, null, invalid).items.length, 0);
  invalid.materials[0].alt.en = value.materials[0].alt.en;
  invalid.materials[0].cardId = "missing";
  reject(() => preview(a, null, invalid), 422);
  const hidden = supplyProjection(
    d,
    { ...saved.items[0], materials: value.materials },
    {
      pools: d.pools().map((p) => ({ ...p, visibility: "hidden" })),
      rules: d.document("collection-rules").data,
    },
  );
  assert.equal(hidden, null);
  const unknown = structuredClone(value.materials[0]);
  unknown.cardId = "missing";
  const projected = supplyProjection(d, {
    ...saved.items[0],
    materials: [unknown],
    blocks: [
      { type: "image", caption: { en: "must disappear", "zh-TW": "遮蔽" }, material: unknown },
    ],
  });
  assert.equal(projected.materials.length, 0);
  assert.equal(projected.blocks.length, 0);
  assert.equal(JSON.stringify(projected).includes("must disappear"), false);
  const stale = { id, expectedVersion: pack().version, revision: 1, value: null };
  send(a, "save", changed);
  reject(() => supplyPreview(d, o, stale, true), 409);
  assert.deepEqual(d.publicDiscovery().items, publication);
  assert.equal(preview(o, 1, null, true).source.revision, 1);
  assert.equal(preview(o, 2, null, true).publicationEligible, false);
  now = Date.parse(value.withdrawAt);
  assert.equal(preview(d.session("official-a"), 1, null, true).period, "expired");
  assert.equal(preview(d.session("official-a"), 1, null, true).items.length, 0);
  now = Date.parse(value.releaseAt) - 1;
  assert.equal(preview(d.session("official-a"), 1, null, true).period, "upcoming");
  assert.equal(preview(d.session("official-a"), 1, null, true).items.length, 0);
  now = Date.parse("2026-10-09T08:00:00Z");
  const server = createLocalServer(d);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  try {
    const base = "http://127.0.0.1:" + server.address().port + "/api/local-test";
    const headers = {
      Origin: "http://127.0.0.1:8083",
      "Content-Type": "application/json",
      Cookie: "keepy_local_session=" + o,
    };
    const current = { id, expectedVersion: pack().version, revision: 1, value: null };
    let r = await fetch(base + "/admin/supply/preview", {
      method: "POST",
      headers,
      body: JSON.stringify(current),
    });
    assert.equal(r.status, 200);
    assert.equal(r.headers.get("cache-control"), "no-store");
    r = await fetch(base + "/admin/supply/preview", {
      method: "POST",
      headers: { ...headers, Cookie: "keepy_local_session=" + b },
      body: JSON.stringify(current),
    });
    assert.equal(r.status, 403);
    r = await fetch(base + "/supply/preview", {
      method: "POST",
      headers: { ...headers, Cookie: "" },
      body: JSON.stringify(current),
    });
    assert.equal(r.status, 401);
  } finally {
    await new Promise((r) => server.close(r));
  }
  console.log(
    "PASS private preview: immutable/read-only; own/official roles; exact version; publication equality; missing/hidden/expiry; no-store API",
  );
} finally {
  d.close();
}
