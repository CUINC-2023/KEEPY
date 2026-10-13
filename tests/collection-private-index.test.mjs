import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import {
  privateCollectionIndex,
  PRIVATE_INDEX_DEFAULT,
  validPrivateIndexPreference,
} from "../src/lib/collection-private-index.mjs";
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-private-index-")), "qa.sqlite"),
  await loadCatalog(),
);
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    cat = d.collectionCatalogue(),
    card = cat.cards[0];
  d.db.prepare("INSERT INTO holdings VALUES(?,?,?)").run("member-a", card.cardId, 1);
  d.collectionMe(b);
  const me = d.collectionMe(a),
    pref = { ...PRIVATE_INDEX_DEFAULT, q: "own-search-secret", kind: "note" },
    input = {
      expectedVersion: me.profile.version,
      data: {
        ...me.profile.data,
        isPublic: true,
        collectionIndex: pref,
        notes: [
          {
            schema: 1,
            id: "note-index",
            kind: "card",
            subjectId: card.cardId,
            category: "story",
            text: "own-search-secret",
          },
        ],
      },
    };
  const saved = d.collectionProfile(a, input, "qa-index-key");
  assert.deepEqual(d.collectionProfile(a, input, "qa-index-key"), saved);
  assert.equal(privateCollectionIndex(d.collectionMe(a), cat, pref).total, 1);
  assert.equal(privateCollectionIndex(d.collectionMe(b), cat, pref).total, 0);
  assert.equal(d.collectionMe(b).profile.data.collectionIndex, undefined);
  assert.ok(!JSON.stringify(d.publicCollection(me.profile.handle)).includes("own-search-secret"));
  for (const bad of [
    { ...pref, q: "a".repeat(101) },
    { ...pref, actorId: "member-b" },
    { ...pref, kind: "session" },
    { ...pref, page: 0 },
  ])
    assert.equal(validPrivateIndexPreference(bad), false);
  assert.throws(() => d.collectionProfile(a, input, "qa-index-new-conflict"));
  const synthetic = {
    ...d.collectionMe(a),
    profile: {
      ...d.collectionMe(a).profile,
      data: {
        ...d.collectionMe(a).profile.data,
        notes: Array.from({ length: 30 }, (_, i) => ({ ...input.data.notes[0], id: "note-" + i })),
      },
    },
  };
  assert.equal(
    privateCollectionIndex(synthetic, cat, { ...PRIVATE_INDEX_DEFAULT, kind: "note" }).rows.length,
    20,
  );
  assert.equal(
    privateCollectionIndex(synthetic, cat, { ...PRIVATE_INDEX_DEFAULT, kind: "note", page: 2 }).rows
      .length,
    10,
  );
  d.db.prepare("DELETE FROM holdings WHERE user_id=?").run("member-a");
  assert.equal(privateCollectionIndex(d.collectionMe(a), cat, pref).total, 0);
  console.log(
    "Unified private same-source index, 20-row bounds, saved CAS/original key, account/public omission, exact preferences and unavailable notes masking PASS",
  );
} finally {
  d.close();
}
