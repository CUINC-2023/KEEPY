import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { createLocalServer } from "../local-test/server.mjs";
import { validCollectionNotes } from "../src/lib/collection-notes.mjs";
const path = join(mkdtempSync(join(tmpdir(), "keepy-private-new-")), "qa.sqlite"),
  catalog = await loadCatalog();
let fault = false,
  d = new LocalDatabase(path, catalog, {
    fault: (stage) => {
      if (fault && stage === "after-collection-profile") throw Error("isolated rollback");
    },
  });
const server = createLocalServer(d);
await new Promise((r) => server.listen(0, "127.0.0.1", r));
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    o = d.session("official-a"),
    card = d.collectionCatalogue().cards[0];
  d.db.prepare("INSERT INTO holdings VALUES(?,?,?)").run("member-a", card.cardId, 1);
  d.collectionMe(b);
  const me = d.collectionMe(a),
    note = {
      schema: 1,
      id: "note-owned",
      kind: "card",
      subjectId: card.cardId,
      category: "memory",
      text: "private local text",
    },
    data = {
      ...me.profile.data,
      notes: [note],
      planningOrder: ["practice", "journey", "guide", "goals"],
    },
    input = { expectedVersion: me.profile.version, data };
  const request = async (token, actor, body, key) => {
    const r = await fetch(
      "http://127.0.0.1:" + server.address().port + "/api/local-test/collection/profile",
      {
        method: "POST",
        headers: {
          Origin: "http://127.0.0.1:8787",
          Cookie: "keepy_local_session=" + token,
          "X-KEEPY-Expected-Actor": actor,
          "Content-Type": "application/json",
          "Idempotency-Key": key,
        },
        body: JSON.stringify(body),
      },
    );
    return r.status;
  };
  const snapshot = () =>
    JSON.stringify(
      ["collection_profiles", "mutations", "audit", "holdings", "ledger", "document_versions"].map(
        (t) => d.db.prepare("SELECT * FROM " + t + " ORDER BY rowid").all(),
      ),
    );
  const before = snapshot();
  assert.equal(await request(b, "member-a", input, "qa-stale-notes"), 409);
  assert.equal(await request("invalid", "member-a", input, "qa-anon-notes"), 401);
  assert.equal(
    await request(
      b,
      "member-b",
      {
        expectedVersion: d.collectionMe(b).profile.version,
        data: { ...d.collectionMe(b).profile.data, notes: [note] },
      },
      "qa-foreign-notes",
    ),
    422,
  );
  assert.equal(await request(o, "official-a", input, "qa-role-unheld"), 422);
  assert.equal(snapshot(), before);
  for (const notes of [
    [{ ...note, owner: "member-b" }],
    [{ ...note, text: "x".repeat(1001) }],
    Array.from({ length: 31 }, (_, i) => ({ ...note, id: "note-" + i })),
  ])
    assert.equal(validCollectionNotes(notes), false);
  fault = true;
  assert.equal(await request(a, "member-a", input, "qa-fault-notes"), 500);
  assert.equal(snapshot(), before);
  fault = false;
  assert.equal(await request(a, "member-a", input, "qa-fault-notes"), 200);
  const saved = d.collectionMe(a);
  assert.equal(saved.profile.version, me.profile.version + 1);
  assert.equal(await request(a, "member-a", input, "qa-fault-notes"), 200);
  assert.equal(d.collectionMe(a).profile.version, saved.profile.version);
  assert.equal(await request(a, "member-a", input, "qa-new-key-conflict"), 409);
  assert.equal(d.collectionMe(b).profile.data.notes, undefined);
  await new Promise((r) => server.close(r));
  d.close();
  d = new LocalDatabase(path, catalog);
  assert.deepEqual(d.collectionMe(a).profile.data.notes, [note]);
  assert.equal(d.collectionProfile(a, input, "qa-fault-notes").version, saved.profile.version);
  assert.equal(d.collectionMe(b).profile.data.planningOrder, undefined);
  console.log(
    "New private notes/planning HTTP actor and field gates, mixed-ID rejection, atomic rollback, original-key recovery, conflict and restart persistence PASS",
  );
} finally {
  if (server.listening) await new Promise((r) => server.close(r));
  d.close();
}
