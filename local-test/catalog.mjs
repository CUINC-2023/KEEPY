import { createServer } from "vite";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
export async function loadCatalog() {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const server = await createServer({
    configFile: false,
    cacheDir: join(tmpdir(), "keepy-catalog-" + randomUUID()),
    root,
    resolve: { alias: { "@": root + "src" } },
    // This one-shot source reader has no live reload. Never watch SQLite,
    // browser profiles or tool caches while loading the immutable fixture catalogue.
    server: { middlewareMode: true, hmr: false, watch: null },
    logLevel: "error",
  });
  try {
    const { ALBUM } = await server.ssrLoadModule("/src/data/player.ts");
    const { POOLS, GRADES, GODDESSES } = await server.ssrLoadModule("/src/data/mock.ts");
    const { KEEPY_SAMPLE_POOL_ID } = await server.ssrLoadModule("/src/data/keepy-sample.ts");
    const demo = await server.ssrLoadModule("/src/lib/demo-player-model.ts");
    const content = await server.ssrLoadModule("/src/lib/content-store.ts");
    const { buildDrawSettings } = await server.ssrLoadModule("/src/data/admin.ts");
    const m = await server.ssrLoadModule("/src/lib/operations-model.ts");
    let state = m.EMPTY_OPS;
    for (const label of ["a", "b"]) {
      const p = {
        id: "local-partner-" + label,
        name: "Local Test creator " + label.toUpperCase(),
        accountId: "demo-approved-" + label,
        accountActive: true,
        cooperation: "active",
        restrictionReason: "",
      };
      state = m.savePartner(state, p, "seed-partner-" + label, "2026-10-04T00:00:00Z");
      state = m.createContract(
        state,
        p.id,
        {
          ...m.DEFAULT_TERMS,
          payeeId: p.id,
          evidence: "Synthetic Local Test license fixture",
          remuneration: "buyout",
        },
        "Synthetic Local Test contract; not electronic signing",
        "local-contract-" + label,
        "2026-10-04T00:00:00Z",
      );
      state = m.transitionContract(
        state,
        "local-contract-" + label,
        "pending",
        "seed-submit-" + label,
        "2026-10-04T00:00:00Z",
      );
      state = m.transitionContract(
        state,
        "local-contract-" + label,
        "agreed",
        "seed-consent-" + label,
        "2026-10-04T00:00:00Z",
      );
    }
    ALBUM.filter((c) => c.poolId === "p-uniform").forEach((c, i) => {
      state = m.bindCard(
        state,
        c.id,
        "local-contract-" + (i % 2 ? "b" : "a"),
        true,
        "normal",
        "seed-card-" + c.id,
        "2026-10-04T00:00:00Z",
      );
    });
    return {
      discoveryPools: POOLS,
      discoveryCreators: GODDESSES,
      pools: POOLS.map((p) => ({ id: p.id, status: p.status, startAt: p.startAt, endAt: p.endAt })),
      cards: ALBUM.map((c) => ({ id: c.id, poolId: c.poolId, grade: c.grade, name: c.name })),
      operations: state,
      applySynthesis: demo.applyDemoSynthesis,
      emptyDemo: demo.EMPTY_DEMO,
      fullCards: ALBUM,
      grades: GRADES,
      samplePoolId: KEEPY_SAMPLE_POOL_ID,
      emptyContent: content.emptyOverrides(),
      parseContent: content.parseOverrides,
      transitionContract: m.transitionContract,
      requestReview: m.requestReview,
      drawSettings: Object.fromEntries(POOLS.map((p) => [p.id, buildDrawSettings(p)])),
      parseOperations: m.parseOperations,
      listingIssues: m.listingIssues,
    };
  } finally {
    await server.close();
  }
}
