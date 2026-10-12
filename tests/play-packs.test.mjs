import assert from "node:assert/strict";
import { PLAY_CONTENT_PACKS, playPackIssues } from "../src/lib/play-packs.mjs";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { createLocalServer } from "../local-test/server.mjs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
assert.equal(PLAY_CONTENT_PACKS.length, 3);
assert.equal(new Set(PLAY_CONTENT_PACKS.map((p) => p.id)).size, 3);
for (const p of PLAY_CONTENT_PACKS) {
  assert.deepEqual(playPackIssues(p), []);
  assert.equal(p.questions.length, 6);
  assert.ok(
    p.questions.every(
      (q) => q.prompt.en && q.prompt["zh-TW"] && q.options.some((o) => o.id === q.answer),
    ),
  );
  assert.equal(p.published, false);
}
const d = new LocalDatabase(
    join(mkdtempSync(join(tmpdir(), "keepy-pack-")), "qa.sqlite"),
    await loadCatalog(),
  ),
  server = createLocalServer(d);
await new Promise((r) => server.listen(0, "127.0.0.1", r));
try {
  const url = "http://127.0.0.1:" + server.address().port + "/api/local-test/admin/play/packs";
  assert.equal((await fetch(url)).status, 401);
  assert.equal(
    (await fetch(url, { headers: { cookie: "keepy_local_session=" + d.session("member-a") } }))
      .status,
    403,
  );
  const r = await fetch(url, {
    headers: { cookie: "keepy_local_session=" + d.session("official-a") },
  });
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.equal(body.publicationApproval, false);
  assert.equal(body.packs.length, 3);
  assert.ok(!d.collectionCatalogue().pools.some((p) => p.poolId.startsWith("local-demo-121-")));
} finally {
  await new Promise((r) => server.close(r));
  d.close();
}
console.log(
  "PASS three bilingual versioned question packs, chapter/geometry answers, controlled material references and server official scope; never auto-published",
);
