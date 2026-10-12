import assert from "node:assert/strict";
import {
  WORKBENCH_DEFAULT,
  collectionWorkbench,
  validWorkbench,
} from "../src/lib/collection-workbench.mjs";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const cards = Array.from({ length: 45 }, (_, i) => ({
  cardId: "c" + i,
  poolId: "p",
  name: "Design " + i,
  rarity: i % 2 ? "R" : "C",
  count: i % 3,
}));
const me = { cards: cards.filter((c) => c.count > 0), acquiredCards: cards };
assert.equal(collectionWorkbench(me).rows.length, 20);
assert.equal(collectionWorkbench(me, { ...WORKBENCH_DEFAULT, page: 3 }).rows.length, 5);
assert.equal(collectionWorkbench(me, { ...WORKBENCH_DEFAULT, mode: "acquired" }).total, 45);
assert.equal(collectionWorkbench(me, { ...WORKBENCH_DEFAULT, mode: "duplicates" }).total, 15);
assert.equal(validWorkbench({ ...WORKBENCH_DEFAULT, actorId: "foreign" }), false);
assert.equal(validWorkbench({ ...WORKBENCH_DEFAULT, q: "x".repeat(101) }), false);
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-workbench-")), "qa.sqlite"),
  await loadCatalog(),
);
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    owner = d.collectionMe(a),
    data = {
      ...owner.profile.data,
      isPublic: true,
      collectionSearch: { ...WORKBENCH_DEFAULT, q: "private-keyword" },
    };
  const input = { expectedVersion: owner.profile.version, data };
  d.collectionProfile(a, input, "qa-workbench-save");
  d.collectionProfile(a, input, "qa-workbench-save");
  assert.equal(d.collectionMe(a).profile.version, owner.profile.version + 1);
  assert.equal(d.collectionMe(a).profile.data.collectionSearch.q, "private-keyword");
  assert.equal(d.collectionMe(b).profile.data.collectionSearch, undefined);
  assert.ok(!JSON.stringify(d.publicCollection(owner.profile.handle)).includes("private-keyword"));
  assert.throws(() => d.collectionProfile(a, input, "qa-workbench-conflict"));
  assert.throws(() =>
    d.collectionProfile(
      a,
      {
        expectedVersion: owner.profile.version + 1,
        data: { ...data, collectionSearch: { ...WORKBENCH_DEFAULT, poolId: "hidden-or-missing" } },
      },
      "qa-workbench-hidden",
    ),
  );
} finally {
  d.close();
}
console.log(
  "PASS bounded private filters, held/acquired/duplicates distinction, strict inputs, SQLite CAS/replay, account isolation and public exclusion",
);
