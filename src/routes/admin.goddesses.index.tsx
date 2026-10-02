import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PARTNER_GODDESSES, SUSPEND_DEMO_NOTE } from "@/data/partner";
import { DataTable } from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { StatusTag } from "@/components/ui/status-tag";
import { EmptyState } from "@/components/ui/empty-state";
import { StateSwitcher, StatePlaceholder, useDemoState } from "@/components/ui/state-demo";

export const Route = createFileRoute("/admin/goddesses/")({
  head: () => ({
    meta: [
      { title: "女神名單 — KEEPY管理後台" },
      {
        name: "description",
        content: "合作中、待合約、暫停合作與合作結束的女神名單，含卡池、卡牌數與合約版本。（Demo）",
      },
      { property: "og:title", content: "女神名單 — KEEPY管理後台" },
      { property: "og:description", content: "合作女神狀態、參與卡池與合約版本一覽。（Demo）" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminGoddessList,
});

const tone = (s: string) =>
  s === "合作中" ? "live" : s === "待合約" ? "gold" : s === "暫停合作" ? "pending" : "resting";

function AdminGoddessList() {
  const [state, setState] = useDemoState();
  const [filter, setFilter] = useState("all");
  const rows = PARTNER_GODDESSES.filter((g) => filter === "all" || g.status === filter);

  return (
    <div className="space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-wide">女神名單</h1>
          <span className="demo-chip">Demo</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          合作狀態、女神後台開通情形、參與卡池、卡牌數與合約版本。{SUSPEND_DEMO_NOTE}
        </p>
      </header>

      <StateSwitcher state={state} onChange={setState} />
      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="沒有符合條件的女神" emptyDescription="切換篩選條件再試。" />
      ) : (
        <>
          <FilterBar
            filters={[
              { key: "all", label: "全部" },
              { key: "合作中", label: "合作中" },
              { key: "待合約", label: "待合約" },
              { key: "暫停合作", label: "暫停合作" },
              { key: "合作結束", label: "合作結束" },
            ]}
            active={filter}
            onChange={setFilter}
          />

          <DataTable
            columns={[
              { key: "name", label: "女神" },
              { key: "status", label: "合作狀態" },
              { key: "backstage", label: "女神後台" },
              { key: "pools", label: "參與卡池" },
              { key: "cards", label: "卡牌數", className: "text-right" },
              { key: "contract", label: "合約版本" },
            ]}
            rows={rows.map((g) => ({
              name: (
                <Link
                  to="/admin/goddesses/$id"
                  params={{ id: g.id }}
                  className="font-bold text-primary hover:underline"
                >
                  {g.name}
                </Link>
              ),
              status: <StatusTag tone={tone(g.status)} label={g.status} />,
              backstage: <span className="text-muted-foreground">{g.backstage}</span>,
              pools: (
                <span className="text-muted-foreground">
                  {g.pools.length ? g.pools.join("、") : "尚未指派"}
                </span>
              ),
              cards: <span className="tabular-nums text-muted-foreground">{g.cardCount}</span>,
              contract: <span className="font-mono text-xs text-muted-foreground">{g.contractVersion}</span>,
            }))}
            empty={<EmptyState icon="◇" title="沒有符合條件的女神" description="切換篩選條件再試。" />}
          />
        </>
      )}
    </div>
  );
}
