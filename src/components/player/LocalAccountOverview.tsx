import { Link } from "@tanstack/react-router";
import { useLocalTest } from "@/lib/local-test-client";
export function LocalAccountOverview({
  kind = "player",
  id,
}: {
  kind?: "player" | "wallet" | "creator" | "revenue" | "admin";
  id?: string;
}) {
  const local = useLocalTest(),
    s = local.summary;
  if (!s) return <p role="alert">syntheticLocalTest · select a fixture and load saved data.</p>;
  if (kind === "admin") {
    const a = local.adminSummary;
    if (!a) return <p role="alert">Current official role required.</p>;
    return (
      <section className="panel space-y-3 break-all p-4" data-testid="local-admin-summary">
        <h1>syntheticLocalTest · Official overview</h1>
        <p>
          {a.accounts} synthetic accounts · {a.testBalance} TEST KP · ledger total {a.ledgerTotal}
        </p>
        <p>
          {a.cards} held cards · source-event net {a.assetTotal} · {a.draws} draws · {a.syntheses}{" "}
          syntheses · {a.previews} previews · {a.audit} audit records
        </p>
        <Link to="/admin/operations">Cooperation</Link>
      </section>
    );
  }
  if (kind === "creator" || kind === "revenue") {
    const revenue = local.revenue;
    if (!revenue) return <p role="alert">Current creator/official role required.</p>;
    const rows = revenue.rows.filter((r) => !id || r.id === id);
    return (
      <section className="panel space-y-3 break-all p-4" data-testid="local-revenue">
        <h1>syntheticLocalTest · Source-derived creator overview</h1>
        <p>{revenue.basis}</p>
        <p>
          Actual withdrawable: {revenue.actualWithdrawable} · Excluded synthesis events:{" "}
          {revenue.excludedSynthesis}
        </p>
        {id && !rows.length && <p role="alert">Own snapshot not found</p>}
        {rows.map((r) => (
          <div key={r.id} data-testid="local-revenue-row">
            {r.partnerId} · {r.contractId} v{r.contractVersion} · {r.remuneration} · TEST source
            cards {r.testSourceCards} · paid-concept cards {r.paidConceptCards} · excluded eleventh{" "}
            {r.excludedEleventh} · eligible-concept {r.eligibleConceptCards} · real revenue{" "}
            {r.actualWithdrawable}
          </div>
        ))}
        <p>No conversion from TEST KP into money, no payment or withdrawal.</p>
        <Link to="/goddess/cooperation">Own cooperation / consent / review</Link>
      </section>
    );
  }
  const ledger = s.ledger.reduce((n, row) => n + row.amount, 0),
    events = s.assetEvents ?? [],
    total = s.holdings.reduce((n, h) => n + h.count, 0);
  return (
    <section
      className="panel space-y-3 break-all p-4"
      data-testid={kind === "wallet" ? "local-wallet" : "local-home"}
    >
      <h1>syntheticLocalTest · {kind === "wallet" ? "Wallet / ledger" : "Player overview"}</h1>
      <p>
        {s.user.id} · balance {s.user.balance} TEST KP · ledger sum {ledger}
      </p>
      <p>
        Held cards: {total} · source-event net: {events.reduce((n, e) => n + e.delta, 0)} · draws:{" "}
        {s.draws.length} · syntheses: {s.syntheses.length} · previews: {s.physical.length}
      </p>
      <p>
        No real paid KP, revenue, top-up, refund or orders. KP grants and costs are test fixtures.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link to="/app/draw/$poolId" params={{ poolId: "p-uniform" }}>
          Draw
        </Link>
        <Link to="/app/album">Collection</Link>
        <Link to="/app/synthesis">Synthesis</Link>
        <Link to="/physical-collection">Physical preview</Link>
        <Link to="/app/history">History</Link>
      </div>
      {kind === "wallet" &&
        s.ledger.map((row) => (
          <div key={row.id}>
            {row.at} · {row.source} · {row.amount} TEST KP
          </div>
        ))}
    </section>
  );
}
