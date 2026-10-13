import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { validCollectionNotes } from "../src/lib/collection-notes.mjs";
let fault = false;
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-note-tags-")), "qa.sqlite"),
  await loadCatalog(),
  {
    fault: (s) => {
      if (fault && s === "after-collection-profile") throw Error("isolated note rollback");
    },
  },
);
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    cat = d.collectionCatalogue(),
    card = cat.cards[0];
  d.db.prepare("INSERT INTO holdings VALUES(?,?,?)").run("member-a", card.cardId, 1);
  d.collectionMe(b);
  const me = d.collectionMe(a),
    note = {
      schema: 1,
      id: "note-tag-first",
      kind: "card",
      subjectId: card.cardId,
      category: "story",
      text: "own note",
      tags: ["favorite", "review"],
    },
    notes = [note, { ...note, id: "note-tag-second", tags: ["research"] }];
  assert.equal(validCollectionNotes(notes), true);
  for (const tags of [
    ["review", "review"],
    ["unknown"],
    ["favorite", "research", "next", "review"],
  ])
    assert.equal(validCollectionNotes([{ ...note, tags }]), false);
  const data = { ...me.profile.data, isPublic: true, notes },
    input = { expectedVersion: me.profile.version, data };
  const snapshot = () =>
    JSON.stringify(
      ["collection_profiles", "audit", "mutations", "holdings", "ledger", "document_versions"].map(
        (t) => d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all(),
      ),
    );
  const before = snapshot();
  fault = true;
  assert.throws(() => d.collectionProfile(a, input, "qa-tags-atomic"));
  assert.equal(snapshot(), before);
  fault = false;
  const result = d.collectionProfile(a, input, "qa-tags-atomic");
  assert.deepEqual(d.collectionProfile(a, input, "qa-tags-atomic"), result);
  assert.deepEqual(d.collectionMe(a).profile.data.notes, notes);
  assert.equal(d.collectionMe(b).profile.data.notes, undefined);
  assert.ok(!JSON.stringify(d.publicCollection(me.profile.handle)).includes("tags"));
  assert.throws(() =>
    d.collectionProfile(
      b,
      {
        expectedVersion: d.collectionMe(b).profile.version,
        data: { ...d.collectionMe(b).profile.data, notes },
      },
      "qa-cross-tags",
    ),
  );
  d.db.prepare("DELETE FROM holdings WHERE user_id=?").run("member-a");
  assert.deepEqual(d.collectionMe(a).profile.data.notes, []);
  console.log(
    "Optional legacy-compatible controlled tags, limits, atomic batch rollback/key, actor/source gate and public omission PASS",
  );
} finally {
  d.close();
}
