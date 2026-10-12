import test from "node:test";
import assert from "node:assert/strict";
import { taskRows } from "../src/lib/supply-tasks.mjs";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { acceptanceFlow } from "../local-test/acceptance-flow.mjs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrationInventory } from "../local-test/migration-inventory.mjs";
const row = (id, at = null, boundary = null, status = "submitted") => ({
  data: {
    id,
    creatorId: "g-yoru",
    draftRevision: 1,
    status,
    published: false,
    revisions: [
      { revision: 1, value: { copy: { title: { "zh-TW": "制服" + id, en: "Uniform" + id } } } },
    ],
    schedule: {
      submittedAt: at,
      nextBoundary: boundary,
      draftPeriod: "current",
      publicPeriod: null,
    },
  },
});
test("private combined filters, same-date ID tie, absent dates last and input remains immutable", () => {
  const rows = [row("c"), row("b", "2026-10-09T00:00:00Z"), row("a", "2026-10-09T00:00:00Z")];
  assert.deepEqual(
    taskRows(rows).map((r) => r.data.id),
    ["a", "b", "c"],
  );
  assert.deepEqual(
    rows.map((r) => r.data.id),
    ["c", "b", "a"],
  );
  assert.equal(taskRows(rows, { q: "制服a", creator: "g-yoru", status: "submitted" }).length, 1);
  assert.equal(taskRows(rows, { q: "Uniforma" }, "en").length, 1);
  assert.equal(taskRows(rows, { creator: "g-other" }).length, 0);
  assert.deepEqual(
    taskRows(
      [row("b", null, "2026-10-10T00:00:00Z"), row("a", null, "2026-10-10T00:00:00Z"), row("c")],
      { sort: "deadline" },
    ).map((r) => r.data.id),
    ["a", "b", "c"],
  );
});
test("service derives dates and visibility from existing audit and publication: GET is read only, boundary and role", async () => {
  const path = join(mkdtempSync(join(tmpdir(), "keepy-tasks-")), "qa.sqlite");
  await acceptanceFlow(path);
  let now = Date.now();
  const d = new LocalDatabase(path, await loadCatalog(), { clock: () => now });
  try {
    const official = d.session("official-a"),
      creator = d.session("creator-a"),
      before = migrationInventory(path);
    const p = d
      .supplyList(official, true)
      .packages.find((p) => p.data.id === "local-demo-022-uniform");
    assert.ok(p.data.schedule.submittedAt);
    assert.ok(Date.parse(p.data.schedule.nextBoundary) > now);
    assert.equal(p.data.schedule.visible, true);
    assert.deepEqual(migrationInventory(path), before);
    assert.throws(
      () => d.supplyList(creator, true),
      (e) => e.status === 403,
    );
    now = Date.parse(
      p.data.revisions.find((r) => r.revision === p.data.publishedRevision).value.withdrawAt,
    );
    const future = d.session("official-a");
    const ended = d.supplyList(future, true).packages.find((x) => x.data.id === p.data.id);
    assert.equal(ended.data.schedule.publicPeriod, "expired");
    assert.equal(ended.data.schedule.visible, false);
    assert.ok(!d.publicDiscovery().items.some((i) => i.sourcePackId === p.data.id));
  } finally {
    d.close();
  }
});
