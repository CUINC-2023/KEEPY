import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { validCollectionNotes } from "../src/lib/collection-notes.mjs";
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-notes-")), "qa.sqlite"),
  await loadCatalog(),
);
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    o = d.session("official-a"),
    cat = d.collectionCatalogue(),
    first = cat.cards[0],
    foreign = cat.cards.find((c) => c.cardId !== first.cardId);
  d.db.prepare("INSERT INTO holdings VALUES(?,?,?)").run("member-a", first.cardId, 1);
  d.db.prepare("INSERT INTO holdings VALUES(?,?,?)").run("member-b", foreign.cardId, 1);
  d.collectionMe(b);
  const me = d.collectionMe(a),
    note = {
      schema: 1,
      id: "note-qa",
      kind: "card",
      subjectId: first.cardId,
      category: "story",
      text: "<script>private-text-only</script>",
    },
    input = {
      expectedVersion: me.profile.version,
      data: { ...me.profile.data, isPublic: true, notes: [note] },
    },
    assets = () =>
      JSON.stringify(
        ["holdings", "ledger", "asset_events", "document_versions", "collection_awards"].map((t) =>
          d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all(),
        ),
      ),
    before = assets();
  d.collectionProfile(a, input, "qa-notes-original");
  d.collectionProfile(a, input, "qa-notes-original");
  assert.deepEqual(d.collectionMe(a).profile.data.notes, [note]);
  assert.equal(d.collectionMe(a).profile.version, me.profile.version + 1);
  assert.equal(d.collectionMe(b).profile.data.notes, undefined);
  assert.throws(() =>
    d.collectionProfile(
      b,
      {
        expectedVersion: d.collectionMe(b).profile.version,
        data: { ...d.collectionMe(b).profile.data, notes: [note] },
      },
      "qa-notes-foreign",
    ),
  );
  assert.throws(() =>
    d.collectionProfile(
      o,
      {
        expectedVersion: d.collectionMe(o).profile.version,
        data: { ...d.collectionMe(o).profile.data, notes: [note] },
      },
      "qa-notes-unheld-official",
    ),
  );
  assert.throws(() =>
    d.collectionProfile(
      a,
      {
        expectedVersion: me.profile.version + 1,
        data: {
          ...input.data,
          notes: [note, { ...note, id: "note-other", subjectId: foreign.cardId }],
        },
      },
      "qa-notes-mixed",
    ),
  );
  assert.equal(d.collectionMe(a).profile.version, me.profile.version + 1);
  for (const bad of [
    [{ ...note, actorId: "member-b" }],
    [{ ...note, text: "a".repeat(1001) }],
    [{ ...note, kind: "unknown" }],
    [note, note],
  ])
    assert.equal(validCollectionNotes(bad), false);
  assert.throws(() =>
    d.collectionProfile(
      a,
      {
        expectedVersion: me.profile.version + 1,
        data: { ...input.data, notes: [{ ...note, kind: "award", subjectId: "unearned-guess" }] },
      },
      "qa-notes-unearned",
    ),
  );
  const pub = JSON.stringify(d.publicCollection(me.profile.handle));
  assert.ok(!pub.includes("notes") && !pub.includes("private-text-only"));
  assert.equal(assets(), before);
  d.db.prepare("DELETE FROM holdings WHERE user_id=? AND card_id=?").run("member-a", first.cardId);
  assert.deepEqual(d.collectionMe(a).profile.data.notes, []);
  assert.ok(
    d.db
      .prepare("SELECT payload FROM collection_profiles WHERE user_id=?")
      .get("member-a")
      .payload.includes("private-text-only"),
  );
  console.log(
    "Notes exact bounded contract, owner/current-holding gate, mixed-ID atomic rejection, unearned hide, anonymous whitelist and preserved raw history PASS",
  );
} finally {
  d.close();
}
