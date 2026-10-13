import assert from "node:assert/strict";
import { PLAY_CONTENT_PACKS, playPackIssues, playPackHealth } from "../src/lib/play-packs.mjs";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { createLocalServer } from "../local-test/server.mjs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
assert.equal(PLAY_CONTENT_PACKS.length, 15);
const corrupt = structuredClone(PLAY_CONTENT_PACKS[0]);
corrupt.questions[0].options = [null, null];
assert.ok(playPackIssues(corrupt).includes("answer-or-options"));
corrupt.questions[0] = null;
assert.ok(playPackIssues(corrupt).includes("question-schema"));
const missing = structuredClone(PLAY_CONTENT_PACKS[0]);
missing.questions[0].answer = "missing";
missing.questions[0].prompt.en = "";
missing.questions[0].sourceRef.templateId = "missing";
missing.questions[1] = structuredClone(missing.questions[0]);
const codes = playPackIssues(missing);
for (const code of [
  "duplicate-question",
  "answer-or-options",
  "question-translation-or-type",
  "source-relation",
])
  assert.ok(codes.includes(code));
const geometric = PLAY_CONTENT_PACKS.filter((p) => p.puzzleMaterials);
assert.equal(geometric.length, 9);
for (const p of geometric) {
  assert.deepEqual(
    p.puzzleMaterials.map((m) => m.size),
    [2, 3, 4],
  );
  const bad = structuredClone(p);
  bad.puzzleMaterials[0].purpose = "formal-print";
  assert.ok(playPackIssues(bad).includes("puzzle-material"));
}
const health = playPackHealth();
assert.equal(health.packs.length, 15);
assert.ok(health.packs.every((p) => p.sharedQuestionLayouts >= 3 && p.sharedQuestionLayouts <= 6));
assert.ok(!JSON.stringify(health).includes(PLAY_CONTENT_PACKS[0].questions[0].prompt.en));
assert.equal(new Set(PLAY_CONTENT_PACKS.map((p) => p.id)).size, 15);
for (const p of PLAY_CONTENT_PACKS) {
  assert.deepEqual(playPackIssues(p), []);
  assert.equal(p.questions.length, p.id.includes("local-demo-246-") ? 8 : 6);
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
  assert.equal(body.packs.length, 15);
  const prefix =
    "http://127.0.0.1:" +
    server.address().port +
    "/api/local-test/admin/play/preview?id=" +
    PLAY_CONTENT_PACKS[0].id;
  const cookie = "keepy_local_session=" + d.session("official-a");
  assert.equal((await fetch(prefix + "&version=0", { headers: { cookie } })).status, 409);
  assert.equal((await fetch(prefix + "&version=1", { headers: { cookie } })).status, 200);
  assert.ok(!d.collectionCatalogue().pools.some((p) => p.poolId.startsWith("local-demo-121-")));
} finally {
  await new Promise((r) => server.close(r));
  d.close();
}
console.log(
  "PASS fifteen bilingual versioned question packs, truthful shared-layout counts, sourced chapter/geometry answers and server official scope; never auto-published",
);

for (const p of PLAY_CONTENT_PACKS.filter((p) => p.id.includes("local-demo-246-"))) {
  assert.equal(p.questions.length, 8);
  assert.ok(
    p.questions.some((q) => q.difficulty === "standard") &&
      p.questions.some((q) => q.difficulty === "hard"),
  );
  for (const q of p.questions.filter((q) => q.id.includes("chapter-comparison")))
    assert.deepEqual(
      q.explanation,
      p.questions.find(
        (v) =>
          v.sourceRef.chapter === q.sourceRef.chapter &&
          v.difficulty === "easy" &&
          v.mode === "knowledge",
      ).explanation,
    );
}
