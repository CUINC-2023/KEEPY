import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-query-")), "test.sqlite"),
  await loadCatalog(),
);
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    o = d.session("official-a"),
    cat = d.collectionCatalogue(),
    publicCard = cat.cards[0],
    hidden = cat.cards.find(
      (c) => c.poolId === publicCard.poolId && c.rarity !== publicCard.rarity,
    );
  assert.ok(hidden);
  const rules = d.document("collection-rules"),
    value = structuredClone(rules.data);
  value.visibility.find((v) => v.poolId === hidden.poolId).hiddenGrades = [hidden.rarity];
  d.collectionRules(o, { expectedVersion: rules.version, data: value }, "qa-query-hide");
  for (let i = 0; i < 40; i++)
    d.db
      .prepare("INSERT INTO asset_events VALUES(?,?,?,?,?,?,?,?)")
      .run(
        "qa-query-" + i,
        "member-a",
        "qa-query-source",
        i < 15 ? publicCard.cardId : hidden.cardId,
        1,
        "test-grant",
        new Date(Date.UTC(2026, 9, 12, 0, i)).toISOString(),
        JSON.stringify({ synthetic: true }),
      );
  const me = d.collectionMe(a);
  assert.equal(me.recent.length, 10);
  assert.ok(me.recent.every((r) => r.cardId === publicCard.cardId));
  assert.equal(me.recent[0].at, new Date(Date.UTC(2026, 9, 12, 0, 14)).toISOString());
  assert.equal(d.collectionMe(b).recent.length, 0);
  assert.ok(!me.acquiredCards.some((c) => c.cardId === hidden.cardId));
  let count = 0;
  const prepare = d.db.prepare.bind(d.db);
  d.db.prepare = (sql) => {
    if (sql.includes("SELECT DISTINCT card_id FROM asset_events")) count++;
    return prepare(sql);
  };
  d.collectionMe(a);
  assert.ok(count <= 4, "acquisition sources must not be queried per design");
  console.log(
    "PASS bounded newest public records, hidden-first filtering, owner isolation and no per-design queries",
  );
} finally {
  d.close();
}
