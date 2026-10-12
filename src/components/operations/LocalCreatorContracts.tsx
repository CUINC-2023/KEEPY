import { Link } from "@tanstack/react-router";
import { useLocalTest } from "@/lib/local-test-client";
export function LocalCreatorContracts({ id }: { id?: string }) {
  const local = useLocalTest();
  if (!["creator", "official"].includes(local.summary?.user.role ?? ""))
    return <p role="alert">Current creator/official role required.</p>;
  const rows = local.operations.contracts.filter((c) => !id || c.id === id);
  return (
    <section className="panel space-y-3 break-all p-4" data-testid="local-contracts">
      <h1>syntheticLocalTest · Own contract snapshots</h1>
      <p>
        Workflow testing only; no valid legal signing. Versioned SQLite records, not Mock contract
        fixtures.
      </p>
      {id && !rows.length && <p role="alert">Own contract not found</p>}
      {rows.map((c) => (
        <article key={c.id}>
          <Link to="/goddess/contracts/$id" params={{ id: c.id }}>
            {c.id} v{c.version} · {c.status}
          </Link>
          <p>{c.text}</p>
          <p>{c.confirmedAt}</p>
          <p>
            {c.terms.remuneration} · {c.terms.payeeId}
          </p>
        </article>
      ))}
      <Link to="/goddess/cooperation">Consent / review requests</Link>
    </section>
  );
}
