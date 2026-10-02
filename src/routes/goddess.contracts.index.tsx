import { QaHint } from "@/components/content/QaHint";
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CONTRACTS, SETTLE_DEMO_NOTE, GODDESS_TBD } from "@/data/goddess-backstage";
import { DataTable } from "@/components/ui/data-table";
import { StatusTag } from "@/components/ui/status-tag";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { StateSwitcher, StatePlaceholder, useDemoState } from "@/components/ui/state-demo";

export const Route = createFileRoute("/goddess/contracts/")({
  head: () => ({
    meta: [
      { title: "數位合約 — KEEPY" },
      { name: "description", content: "合作合約列表、版本、有效期間與簽署狀態。簽署與下載皆為 Demo。" },
      { property: "og:title", content: "數位合約 — KEEPY" },
      { property: "og:description", content: "合作合約列表、版本、有效期間與簽署狀態。簽署與下載皆為 Demo。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContractList,
});


function ContractList() {
  const [state, setState] = useDemoState();
  const [filter, setFilter] = useState("all");
  const rows = CONTRACTS.filter((c) => filter === "all" || c.status === filter);

  return (
    <div className="space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-wide">數位合約</h1>
          <span className="demo-chip">Demo</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          原型不提供真實電子簽署與真實提領；簽署、下載與結算皆為介面示意。
        </p>
      </header>

      <QaHint id="agreement" />
      <StateSwitcher state={state} onChange={setState} />
      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="尚無合約" emptyDescription="通過合作審核後，這裡會顯示合約版本與簽署狀態。" />
      ) : (
        <>
          <FilterBar
            filters={[
              { key: "all", label: "全部" },
              { key: "待簽署", label: "待簽署" },
              { key: "已簽署", label: "已簽署" },
              { key: "已到期", label: "已到期" },
            ]}
            active={filter}
            onChange={setFilter}
          />

          <DataTable
            columns={[
              { key: "title", label: "合約" },
              { key: "version", label: "版本" },
              { key: "period", label: "有效期間" },
              { key: "scope", label: "適用卡池" },
              { key: "status", label: "簽署狀態", className: "text-right" },
            ]}
            rows={rows.map((c) => ({
              title: (
                <Link to="/goddess/contracts/$id" params={{ id: c.id }} className="font-bold text-primary hover:underline">
                  {c.title}
                </Link>
              ),
              version: <span className="font-mono text-xs">{c.version}</span>,
              period: <span className="tabular-nums text-muted-foreground">{c.effectiveFrom} ～ {c.effectiveTo}</span>,
              scope: <span className="text-muted-foreground">{c.scope.join("、")}</span>,
              status: (
                <StatusTag
                  tone={c.status === "已簽署" ? "live" : c.status === "待簽署" ? "pending" : "resting"}
                  label={c.status}
                />
              ),
            }))}
            empty={<EmptyState icon="◇" title="此條件下沒有合約" description="切換篩選條件再試。" />}
          />

          <section className="panel p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">待決策項目</p>
            <ul className="mt-1 space-y-1">
              {GODDESS_TBD.map((t) => (
                <li key={t}>・{t}</li>
              ))}
            </ul>
            <p className="mt-2">{SETTLE_DEMO_NOTE}</p>
          </section>
        </>
      )}
    </div>
  );
}
