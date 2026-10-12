import assert from "node:assert/strict";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const server = await createServer({
  configFile: false,
  root,
  resolve: { alias: { "@": root + "src" } },
  server: { middlewareMode: true, watch: null, hmr: false },
  logLevel: "error",
});
try {
  const model = await server.ssrLoadModule("/src/lib/demo-player-model.ts");
  const { ALBUM, DEMO_PITY_COUNT_BEFORE } = await server.ssrLoadModule("/src/data/player.ts");
  const { POOLS, GRADES, nextGrade } = await server.ssrLoadModule("/src/data/mock.ts");
  const { KEEPY_SAMPLE_POOL_ID } = await server.ssrLoadModule("/src/data/keepy-sample.ts");
  const { EMPTY_DEMO, applyDemoDraw, applyDemoSynthesis, demoAlbum, cardCount, parseDemoPlayer } =
    model;
  const total = (s) => demoAlbum(s).reduce((n, c) => n + cardCount(c), 0);
  const date = "2026-10-04";
  let checks = 0;
  for (const pool of POOLS.filter((p) => model.canDemoDraw(p.id))) {
    const ten = applyDemoDraw(EMPTY_DEMO, pool.id, "ten", "ten-" + pool.id, date);
    assert.equal(ten.lastDraw.items.length, 11);
    assert.equal(total(ten) - total(EMPTY_DEMO), 11);
    assert.equal(ten.pity[pool.id], DEMO_PITY_COUNT_BEFORE + 11);
    assert.ok(
      ten.lastDraw.items.every(
        (i) =>
          i.card.poolId === pool.id && i.source.creatorShareBase === 0 && i.source.paidKp === 0,
      ),
    );
    assert.equal(ten.lastDraw.items[10].source.kind, "bonus");
    assert.equal(
      applyDemoDraw(ten, pool.id, "ten", "next", date),
      ten,
      "pending result must block another draw",
    );
    const viewed = { ...ten, lastDraw: { ...ten.lastDraw, viewed: true } };
    assert.equal(
      applyDemoDraw(viewed, pool.id, "ten", ten.lastDraw.id, date),
      viewed,
      "duplicate id must not reapply",
    );
    const next = applyDemoDraw(viewed, pool.id, "ten", "next", date);
    assert.equal(total(next) - total(ten), 11);
    assert.equal(next.pity[pool.id], DEMO_PITY_COUNT_BEFORE + 22);
    assert.ok(next.lastDraw.items.every((i) => !i.isNew));
    const restored = parseDemoPlayer(JSON.stringify(ten));
    assert.equal(total(restored), total(ten));
    assert.equal(restored.lastDraw.after, ten.lastDraw.after);
    assert.deepEqual(
      restored.lastDraw.items.map((i) => i.card.id),
      ten.lastDraw.items.map((i) => i.card.id),
    );
    const unlocked = ten.lastDraw.items.find((i) => i.isNew);
    if (unlocked) assert.ok(demoAlbum(ten).find((c) => c.id === unlocked.card.id).owned);
    checks++;
  }
  for (const id of [
    "unknown",
    KEEPY_SAMPLE_POOL_ID,
    ...POOLS.filter((p) => p.status !== "live").map((p) => p.id),
  ])
    assert.equal(applyDemoDraw(EMPTY_DEMO, id, "ten", "bad", date), EMPTY_DEMO);
  for (const pool of POOLS.filter((p) => p.id !== KEEPY_SAMPLE_POOL_ID))
    for (const grade of GRADES.filter((g) => g !== "O")) {
      const material = ALBUM.find((c) => c.poolId === pool.id && c.grade === grade);
      if (!material) continue;
      const ready = { ...EMPTY_DEMO, counts: { [material.id]: { count: 5, obtainedAt: date } } };
      for (const useItem of [true, false]) {
        const output = applyDemoSynthesis(
          ready,
          pool.id,
          grade,
          Array(3).fill(material.id),
          useItem,
          "syn-" + pool.id + grade + useItem,
          date,
        );
        assert.ok(output !== ready);
        assert.equal(total(output), total(ready) - 2);
        const card = demoAlbum(output).find((c) => c.id === output.lastSynthesis.cardId);
        assert.equal(card.poolId, pool.id);
        assert.equal(card.grade, useItem ? nextGrade(grade) : grade);
        assert.ok(card.owned);
        assert.equal(
          applyDemoSynthesis(
            output,
            pool.id,
            grade,
            Array(3).fill(material.id),
            useItem,
            output.lastSynthesis.id,
            date,
          ),
          output,
        );
      }
      const pityState = { ...ready, failures: { [pool.id + ":" + grade]: 9 } };
      const pity = applyDemoSynthesis(
        pityState,
        pool.id,
        grade,
        Array(3).fill(material.id),
        false,
        "pity",
        date,
      );
      assert.equal(pity.lastSynthesis.kind, "pity");
      assert.equal(pity.failures[pool.id + ":" + grade], 0);
      assert.equal(
        demoAlbum(pity).find((c) => c.id === pity.lastSynthesis.cardId).grade,
        nextGrade(grade),
      );
      const tooFew = { ...EMPTY_DEMO, counts: { [material.id]: { count: 2 } } };
      assert.equal(
        applyDemoSynthesis(tooFew, pool.id, grade, Array(3).fill(material.id), true, "bad", date),
        tooFew,
      );
      assert.equal(
        applyDemoSynthesis(ready, pool.id, "O", Array(3).fill(material.id), true, "bad", date),
        ready,
      );
      assert.equal(
        applyDemoSynthesis(
          ready,
          pool.id,
          grade,
          [material.id, "unknown", material.id],
          true,
          "bad",
          date,
        ),
        ready,
      );
      checks++;
    }
  for (const raw of [
    null,
    "{",
    "null",
    "[]",
    '{"version":0}',
    '{"version":1,"counts":{"unknown":{"count":999}}}',
  ])
    assert.deepEqual(parseDemoPlayer(raw).counts, {});
  const owned = ALBUM.find((c) => c.owned);
  const corrupt = parseDemoPlayer(
    JSON.stringify({
      version: 1,
      counts: { [owned.id]: { count: -1 } },
      lastDraw: { id: "x", poolId: "p-uniform", items: [null], before: 23 },
      physical: ["unknown"],
    }),
  );
  assert.deepEqual(corrupt.counts, {});
  assert.equal(corrupt.lastDraw, null);
  assert.deepEqual(corrupt.physical, []);
  assert.equal(
    demoAlbum(EMPTY_DEMO).find((c) => c.id === owned.id).dupes,
    owned.dupes,
    "baseline must remain unchanged",
  );
  // Additive v1 migration preserves known results and cumulative ownership without replaying grants.
  const first = applyDemoDraw(EMPTY_DEMO, "p-uniform", "ten", "history-first", date);
  const second = applyDemoDraw(
    { ...first, lastDraw: { ...first.lastDraw, viewed: true } },
    "p-uniform",
    "single",
    "history-second",
    date,
  );
  assert.equal(second.drawHistory.length, 2);
  assert.equal(total(second) - total(EMPTY_DEMO), 12);
  const restoredHistory = parseDemoPlayer(JSON.stringify(second));
  assert.equal(restoredHistory.drawHistory.length, 2);
  assert.equal(restoredHistory.drawHistory[0].createdAt, date);
  assert.equal(restoredHistory.lastDraw.viewed, false);
  const viewedHistory = {
    ...restoredHistory,
    lastDraw: { ...restoredHistory.lastDraw, viewed: true },
  };
  assert.equal(
    applyDemoDraw(viewedHistory, "p-uniform", "ten", "history-first", date),
    viewedHistory,
    "old request id must not grant again after reload",
  );
  const legacy = { ...first };
  delete legacy.drawHistory;
  delete legacy.physicalQuantities;
  assert.equal(parseDemoPlayer(JSON.stringify(legacy)).drawHistory.length, 1);
  const mixed = parseDemoPlayer(
    JSON.stringify({
      ...second,
      drawHistory: [
        null,
        first.lastDraw,
        first.lastDraw,
        { ...first.lastDraw, id: "bad", items: [null] },
        second.lastDraw,
      ],
    }),
  );
  assert.deepEqual(
    mixed.drawHistory.map((d) => d.id),
    ["history-first", "history-second"],
  );
  const forged = structuredClone(first);
  forged.drawHistory[0].items[0].card.name = "forged";
  assert.notEqual(
    parseDemoPlayer(JSON.stringify(forged)).drawHistory[0].items[0].card.name,
    "forged",
  );
  const physicalCard = ALBUM.find((c) => c.poolId === "p-uniform" && c.grade === "SSR");
  const physicalReady = { ...EMPTY_DEMO, counts: { [physicalCard.id]: { count: 3 } } };
  const physical = model.applyDemoPhysical(physicalReady, physicalCard.id, 2);
  assert.equal(physical.physicalQuantities[physicalCard.id], 2);
  assert.equal(total(physical), total(physicalReady), "physical preview must never consume copies");
  assert.equal(
    model.applyDemoPhysical(physical, physicalCard.id, 2),
    physical,
    "double completion is idempotent",
  );
  assert.equal(
    model.applyDemoPhysical(physical, physicalCard.id, 1),
    physical,
    "saved quantity cannot be overwritten",
  );
  for (const qty of [0, -1, 1.5, 4, NaN, Infinity])
    assert.equal(model.applyDemoPhysical(physicalReady, physicalCard.id, qty), physicalReady);
  assert.equal(model.applyDemoPhysical(EMPTY_DEMO, "unknown", 1), EMPTY_DEMO);
  assert.equal(parseDemoPlayer(JSON.stringify(physical)).physicalQuantities[physicalCard.id], 2);
  const badQuantity = parseDemoPlayer(
    JSON.stringify({ ...physical, physicalQuantities: { [physicalCard.id]: -1, unknown: 50 } }),
  );
  assert.deepEqual(badQuantity.physicalQuantities, { [physicalCard.id]: 1 });
  assert.deepEqual(
    parseDemoPlayer(JSON.stringify({ ...physical, physicalQuantities: undefined }))
      .physicalQuantities,
    { [physicalCard.id]: 1 },
  );
  assert.deepEqual(parseDemoPlayer(JSON.stringify(EMPTY_DEMO)).drawHistory, []);
  console.log(
    "PASS: history migration, cumulative records, old-id replay, deduplication, malformed/forged records, quantity persistence/bounds/idempotency and no card consumption.",
  );
  console.log(
    "PASS: " +
      checks +
      " pool/grade scenarios; draw restore, idempotency, cumulative pity, synthesis conservation, grade/pool identity and corrupt storage.",
  );
} finally {
  await server.close();
}
