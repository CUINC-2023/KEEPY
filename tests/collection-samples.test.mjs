import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  COLLECTION_THEMES,
  CREATOR_CONTENT_TEMPLATES,
  collectionSampleCatalog,
} from "../src/lib/collection-samples.mjs";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
const base = await loadCatalog(),
  before = JSON.stringify(base),
  catalog = collectionSampleCatalog(base),
  path = join(mkdtempSync(join(tmpdir(), "keepy-samples-")), "samples.sqlite");
assert.equal(CREATOR_CONTENT_TEMPLATES.length, 3);
for (const t of CREATOR_CONTENT_TEMPLATES) {
  assert.ok(COLLECTION_THEMES.some((s) => s.id === t.seriesId));
  assert.equal(t.questions.length, 4);
  assert.ok([t.workIntro, t.source, ...t.process, ...t.questions].every((v) => v["zh-TW"] && v.en));
  assert.equal(t.confirmedAnswers, null);
  assert.equal(t.collaborator, null);
  assert.equal(t.shootDate, null);
}
assert.equal(JSON.stringify(base), before);
assert.equal(COLLECTION_THEMES.length, 18);
assert.equal(new Set(COLLECTION_THEMES.map((t) => t.id)).size, 18);
assert.ok(
  COLLECTION_THEMES.slice(12, 15).every(
    (t) => t.id.startsWith("local-demo-121-") && t.cardStories.length === 3,
  ),
);
assert.ok(
  COLLECTION_THEMES.slice(15).every(
    (t) => t.id.startsWith("local-demo-156-") && t.cardStories.length === 3,
  ),
);
assert.deepEqual(
  COLLECTION_THEMES.slice(0, 3).map((t) => t.id),
  ["local-demo-034-window", "local-demo-034-city", "local-demo-034-paper"],
);
assert.ok(COLLECTION_THEMES.slice(3, 6).every((t) => t.id.startsWith("local-demo-043-")));
assert.ok(
  COLLECTION_THEMES.slice(6, 9).every(
    (t) =>
      t.id.startsWith("local-demo-067-") &&
      t.cardStories.length === 3 &&
      t.cardStories.every((s) => s["zh-TW"] && s.en),
  ),
);
for (const theme of COLLECTION_THEMES) {
  for (const k of ["title", "story", "guide", "bio", "badge", "source"])
    for (const lang of ["zh-TW", "en"]) assert.ok(theme[k][lang].length > 0);
  assert.deepEqual(theme.materialReferences, []);
  assert.ok(!base.pools.some((p) => p.id === theme.id));
}
assert.ok(
  COLLECTION_THEMES.slice(9, 12).every(
    (t) =>
      t.id.startsWith("local-demo-086-") &&
      t.cardStories.length === 3 &&
      t.cardStories.every((s) => s["zh-TW"] && s.en),
  ),
);
let d = new LocalDatabase(path, catalog);
const ledgerBefore = d.db.prepare("SELECT * FROM ledger ORDER BY id").all();
try {
  const official = d.session("official-a");
  for (const theme of COLLECTION_THEMES) {
    const record = d.document("discovery").data.items.find((i) => i.draft.referenceId === theme.id),
      value = structuredClone(record.draft);
    value.copy.title = theme.title;
    value.copy.summary = theme.guide;
    value.copy.story = theme.story;
    value.copy.goal = theme.guide;
    d.discoveryCommand(
      official,
      { action: "save", id: record.id, value, expectedVersion: d.document("discovery").version },
      "qa-theme-save-" + theme.id,
    );
    d.discoveryCommand(
      official,
      {
        action: "publish",
        id: record.id,
        value: null,
        expectedVersion: d.document("discovery").version,
      },
      "qa-theme-publish-" + theme.id,
    );
    const cards = catalog.cards.filter((c) => c.poolId === theme.id);
    for (const [actor, n] of [
      ["member-a", 3],
      ["member-b", 1],
    ])
      for (const card of cards.slice(0, n)) {
        d.db.prepare("INSERT INTO holdings VALUES(?,?,?)").run(actor, card.id, 1);
        d.assetEvent(
          "qa-" + actor + "-" + card.id,
          actor,
          "isolated-theme-fixture",
          card.id,
          1,
          "synthetic-template-fixture",
          { synthetic: true, templateId: theme.id },
        );
      }
  }
  const sessions = ["member-a", "member-b", "creator-a"].map((id) => d.session(id));
  for (let i = 0; i < sessions.length; i++) {
    const me = d.collectionMe(sessions[i]);
    for (const theme of COLLECTION_THEMES) {
      const p = me.progress.find((p) => p.poolId === theme.id);
      assert.equal(p.total, 3);
      assert.equal(p.owned, [3, 1, 0][i]);
      assert.equal(p.complete, i === 0);
    }
  }
  const rows = d.db.prepare("SELECT * FROM document_versions ORDER BY id,version").all();
  d.close();
  d = new LocalDatabase(path, catalog);
  assert.deepEqual(d.db.prepare("SELECT * FROM document_versions ORDER BY id,version").all(), rows);
  assert.deepEqual(d.db.prepare("SELECT * FROM ledger ORDER BY id").all(), ledgerBefore);
  assert.equal(d.db.prepare("SELECT COUNT(*) n FROM draws").get().n, 0);
  console.log(
    "PASS three independent bilingual templates and isolated full/partial/empty scenarios; base catalogue and snapshots preserved",
  );
} finally {
  d.close();
}
