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
  const m = await server.ssrLoadModule("/src/lib/operations-model.ts");
  const { ALBUM } = await server.ssrLoadModule("/src/data/player.ts");
  const content = await server.ssrLoadModule("/src/lib/content-store.ts");
  const { FAQ } = await server.ssrLoadModule("/src/data/faq.ts");
  const at = "2026-10-04T08:00:00Z";
  let seq = 0;
  const op = () => `op-${++seq}`;
  const partner = (id, accountId = "") => ({
    id,
    name: "Same demo name",
    accountId,
    accountActive: true,
    cooperation: "active",
    restrictionReason: "",
  });
  let s = m.savePartner(m.EMPTY_OPS, partner("partner-a"), op(), at);
  assert.equal(s.partners[0].accountId, "", "buyout does not require account");
  const terms = (payeeId, remuneration = "buyout", rate = 20) => ({
    ...m.DEFAULT_TERMS,
    payeeId,
    remuneration,
    rate,
    evidence: "Fixture license evidence",
  });
  let operationId = op();
  s = m.createContract(s, "partner-a", terms("partner-a"), "Version 1 snapshot", operationId, at);
  const a = operationId;
  assert.equal(
    m.createContract(s, "partner-a", terms("partner-a"), "Version 1 snapshot", operationId, at),
    s,
    "same create request is idempotent",
  );
  assert.equal(
    m.transitionContract(s, a, "agreed", op(), at),
    s,
    "draft cannot skip consent workflow",
  );
  s = m.transitionContract(s, a, "pending", op(), at);
  for (const card of ALBUM.filter((c) => c.poolId === "p-uniform"))
    s = m.bindCard(s, card.id, a, true, "normal", op(), at);
  assert.ok(m.listingIssues(s, "p-uniform", at).some((x) => x.endsWith(":consent")));
  s = m.transitionContract(s, a, "agreed", op(), at);
  assert.deepEqual(
    m.listingIssues(s, "p-uniform", at),
    [],
    "buyout without account can pass demo checks",
  );
  const badVisibility = structuredClone(s);
  badVisibility.bindings[0].visibility = "";
  assert.ok(m.listingIssues(badVisibility, "p-uniform", at).some((x) => x.endsWith(":visibility")));
  const fixtureCard = ALBUM.find((c) => c.id === s.bindings[0].cardId);
  const originalGrade = fixtureCard.grade;
  fixtureCard.grade = "";
  assert.ok(m.listingIssues(s, "p-uniform", at).some((x) => x.endsWith(":rarity")));
  fixtureCard.grade = originalGrade;
  s = m.snapshotPool(s, "p-uniform", "rules-v1", op(), at);
  const savedVersion = structuredClone(s.poolVersions[0]);
  s = m.savePartner(s, partner("partner-b", "demo-approved-b"), op(), at);
  operationId = op();
  s = m.createContract(
    s,
    "partner-b",
    terms("partner-b", "share"),
    "Partner B v1",
    operationId,
    at,
  );
  const b = operationId;
  s = m.transitionContract(s, b, "pending", op(), at);
  s = m.transitionContract(s, b, "agreed", op(), at);
  const secondCard = ALBUM.filter((c) => c.poolId === "p-uniform")[1];
  s = m.bindCard(s, secondCard.id, b, true, "hidden", op(), at);
  assert.equal(
    s.bindings.find((row) => row.cardId === secondCard.id).partnerId,
    "partner-b",
    "IDs distinguish same display name",
  );
  assert.deepEqual(m.listingIssues(s, "p-uniform", at), []);
  assert.equal(
    s.contracts.find((c) => c.id === b).terms.payeeId,
    "partner-b",
    "one payee per contract",
  );
  assert.equal(
    m.createContract(s, "partner-b", terms("partner-a"), "Invalid extra payee", op(), at),
    s,
  );
  s = m.revenueExample(s, b, op(), at);
  assert.equal(s.revenue[0].amount, 200);
  const oldRevenue = structuredClone(s.revenue[0]);
  operationId = op();
  s = m.createContract(
    s,
    "partner-b",
    terms("partner-b", "mixed", 40),
    "Partner B v2",
    operationId,
    at,
  );
  const b2 = operationId;
  assert.equal(s.contracts.find((c) => c.id === b2).version, 2);
  assert.equal(s.contracts.find((c) => c.id === b).text, "Partner B v1");
  s = m.bindCard(s, secondCard.id, b2, true, "normal", op(), at);
  assert.ok(m.listingIssues(s, "p-uniform", at).some((x) => x.endsWith(":consent")));
  s = m.transitionContract(s, b2, "pending", op(), at);
  s = m.transitionContract(s, b2, "returned", op(), at, "Revise scope");
  assert.equal(m.transitionContract(s, b2, "agreed", op(), at), s);
  s = m.bindCard(s, secondCard.id, b, true, "normal", op(), at);
  const p = s.partners.find((p) => p.id === "partner-b");
  s = m.savePartner(s, { ...p, accountId: "" }, op(), at);
  assert.ok(m.listingIssues(s, "p-uniform", at).some((x) => x.endsWith(":share-account-or-basis")));
  s = m.savePartner(s, { ...p, accountId: "demo-pending" }, op(), at);
  assert.ok(m.listingIssues(s, "p-uniform", at).some((x) => x.endsWith(":share-account-or-basis")));
  s = m.savePartner(
    s,
    { ...p, accountActive: false, restrictionReason: "Demo account review" },
    op(),
    at,
  );
  assert.ok(m.withdrawalBlocked(s.partners.find((p) => p.id === "partner-b")));
  assert.equal(s.revenue.length, 1);
  assert.deepEqual(s.revenue[0], oldRevenue);
  assert.deepEqual(s.poolVersions[0], savedVersion);
  s = m.requestReview(s, "partner-b", "Please review restriction", op(), at);
  assert.equal(s.requests.length, 1);
  assert.equal(s.requests[0].status, "pending");
  s = m.savePartner(s, { ...p }, op(), at);
  assert.deepEqual(m.listingIssues(s, "p-uniform", at), []);
  const stopped = m.savePartner(
    s,
    { ...p, cooperation: "stopped", restrictionReason: "Authorization review" },
    op(),
    at,
  );
  assert.ok(
    m.listingIssues(stopped, "p-uniform", at).some((x) => x.endsWith(":cooperation-review")),
  );
  const buyoutPartner = s.partners.find((p) => p.id === "partner-a");
  const disabledBuyout = m.savePartner(
    s,
    { ...buyoutPartner, accountActive: false, restrictionReason: "Account review" },
    op(),
    at,
  );
  assert.deepEqual(
    m.listingIssues(disabledBuyout, "p-uniform", at),
    [],
    "account status alone must not extend/revoke valid buyout license",
  );
  assert.equal(
    m.printingAllowed(
      s.contracts.find((c) => c.id === a),
      at,
    ),
    false,
    "public display does not grant physical printing",
  );
  const expired = {
    ...s,
    contracts: s.contracts.map((c) =>
      c.id === a ? { ...c, terms: { ...c.terms, end: "2026-09-01" } } : c,
    ),
  };
  assert.ok(m.listingIssues(expired, "p-uniform", at).some((x) => x.endsWith(":license")));
  const missingArtwork = m.bindCard(s, secondCard.id, b, false, "normal", op(), at);
  assert.ok(m.listingIssues(missingArtwork, "p-uniform", at).some((x) => x.endsWith(":artwork")));
  const partial = { ...s, bindings: s.bindings.slice(0, 1) };
  assert.ok(
    m.listingIssues(partial, "p-uniform", at).some((x) => x.endsWith(":relations")),
    "all pool cards need checks",
  );
  s = m.snapshotPool(s, "p-uniform", "changed-rule-snapshot", op(), at, false);
  assert.equal(s.poolVersions.length, 2);
  assert.deepEqual(s.poolVersions[0], savedVersion);
  assert.deepEqual(m.parseOperations(JSON.stringify(s)), s);
  for (const raw of [
    "{",
    "null",
    "[]",
    '{"version":0}',
    JSON.stringify({ ...s, partners: [...s.partners, s.partners[0]] }),
    JSON.stringify({
      ...s,
      bindings: [...s.bindings, { ...s.bindings[0], contractId: "unknown" }],
    }),
  ])
    assert.deepEqual(m.parseOperations(raw), m.EMPTY_OPS);
  const overrides = content.parseOverrides(
    JSON.stringify({
      version: 1,
      home: { heroDescription: "Existing hero" },
      faq: {
        physical: { title: { en: "Renamed stable question" }, hint: { en: "New stable hint" } },
        unknown: { title: { en: "Do not add" } },
      },
    }),
  );
  assert.equal(overrides.home.heroDescription, "Existing hero");
  assert.equal(overrides.faq.unknown, undefined);
  const merged = content.mergeContent(overrides);
  assert.equal(merged.faq.find((f) => f.id === "physical").title.en, "Renamed stable question");
  assert.deepEqual(
    merged.faq.map((f) => f.id),
    FAQ.map((f) => f.id),
  );
  assert.equal(
    merged.faq.find((f) => f.id === "physical").body.en,
    FAQ.find((f) => f.id === "physical").body.en,
  );
  assert.deepEqual(content.parseOverrides("{").faq, {});
  console.log(
    "PASS: buyout without account, share approval gates, complete-pool/multi-creator ID relations, immutable contracts and rule/revenue snapshots, workflow transitions, rights expiry/printing separation, restriction reasons/requests, corrupt storage and stable FAQ IDs.",
  );
} finally {
  await server.close();
}
