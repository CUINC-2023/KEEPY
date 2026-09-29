import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SPLIT_POLICY_NOTE } from "@/data/mock";
import {
  NON_ELIGIBLE_ACTIONS,
  REVENUE_CALC_NOTE,
  REVENUE_CURRENCY_NOTE,
  REVENUE_ORDERS,
  REVENUE_PERIODS,
  SETTLE_DEMO_NOTE,
  type RevenueStatus,
} from "@/data/goddess-backstage";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { StatusTag } from "@/components/ui/status-tag";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { StateSwitcher, StatePlaceholder, useDemoState } from "@/components/ui/state-demo";

export const Route = createFileRoute("/goddess/revenue/")({
  head: () => ({
    meta: [
      { title: "收益與分潤 — CU 女神卡" },
      { name: "description", content: "依日期、卡池、訂單與結算狀態篩選分潤明細，全部以新台幣顯示。（Demo）" },
      { property: "og:title", content: "收益與分潤 — CU 女神卡" },
      { property: "og:description", content: "依日期、卡池、訂單與結算狀態篩選分潤明細，全部以新台幣顯示。（Demo）" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GoddessRevenue,
});

const STATUS_FILTERS = [
  { key: "all", label: "全部狀態" },
  { key: "待結算", label: "待結算" },
  { key: "可結算", label: "可結算" },
  { key: "已結算", label: "已結算" },
];

const POOL_FILTERS = [
  { key: "all", label: "全部卡池" },
  { key: "p-uniform", label: "制服序章" },
  { key: "p-starlight", label: "星光舞台" },
];

function GoddessRevenue() {
  const [state, setState] = useDemoState();
  const [status, setStatus] = useState("all");
  const [pool, setPool] = useState("all");
  const [periodId, setPeriodId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [orderQuery, setOrderQuery] = useState("");

  const rows = useMemo(
    () =>
      REVENUE_ORDERS.filter((o) => {
        if (status !== "all" && o.status !== (status as RevenueStatus)) return false;
        if (pool !== "all" && o.poolId !== pool) return false;
        if (periodId !== "all" && o.periodId !== periodId) return false;
        const day = o.drawAt.slice(0, 10);
        if (from && day < from) return false;
        if (to && day > to) return false;
        if (orderQuery && !o.orderNo.toLowerCase().includes(orderQuery.toLowerCase())) return false;
        return true;
      }),
    [status, pool, periodId, from, to, orderQuery]
  );

  const spend = rows.reduce((s, o) => s + o.eligibleSpendTwd, 0);
  const share = rows.reduce((s, o) => s + o.shareTwd, 0);

  return (
    <div className="space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-wide">收益與分潤</h1>
          <span className="demo-chip">Demo</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {REVENUE_CURRENCY_NOTE}
          {REVENUE_CALC_NOTE}
        </p>
      </header>

      <StateSwitcher state={state} onChange={setState} />
      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="此條件下沒有分潤紀錄" emptyDescription="調整日期、卡池或結算狀態再試。" />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="筆數" value={rows.length} sub="符合篩選的付費抽卡訂單" />
            <StatCard label="符合分潤消費" value={`NT$ ${spend.toLocaleString()}`} sub="僅現金／付費點數抽卡" tone="violet" />
            <StatCard label="女神分潤" value={`NT$ ${share.toLocaleString()}`} sub={SPLIT_POLICY_NOTE} tone="gold" />
            <StatCard label="結算期" value={REVENUE_PERIODS.length} sub="可點擊查看結算期明細" />
          </section>

          {/* ── 篩選 ── */}
          <section className="panel space-y-3 p-4">
            <FilterBar filters={STATUS_FILTERS} active={status} onChange={setStatus} />
            <FilterBar filters={POOL_FILTERS} active={pool} onChange={setPool} />
            <FilterBar
              filters={[{ key: "all", label: "全部結算期" }, ...REVENUE_PERIODS.map((p) => ({ key: p.id, label: p.label }))]}
              active={periodId}
              onChange={setPeriodId}
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="text-xs text-muted-foreground">
                起始日
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                結束日
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                訂單編號
                <input
                  value={orderQuery}
                  onChange={(e) => setOrderQuery(e.target.value)}
                  placeholder="ORD-2609..."
                  className="mt-1 w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60"
                />
              </label>
            </div>
          </section>

          <DataTable
            columns={[
              { key: "order", label: "訂單編號" },
              { key: "at", label: "付費抽卡時間" },
              { key: "pool", label: "卡池" },
              { key: "type", label: "抽卡類型" },
              { key: "spend", label: "符合分潤消費（NT$）", className: "text-right" },
              { key: "share", label: "女神分潤（NT$）", className: "text-right" },
              { key: "status", label: "狀態", className: "text-right" },
            ]}
            rows={rows.map((o) => ({
              order: (
                <Link to="/goddess/revenue/$id" params={{ id: o.periodId }} className="font-mono text-xs text-primary hover:underline">
                  {o.orderNo}
                </Link>
              ),
              at: <span className="tabular-nums text-muted-foreground">{o.drawAt}</span>,
              pool: o.poolName,
              type: <span className="text-muted-foreground">{o.drawType}・{o.payMethod}</span>,
              spend: <span className="tabular-nums text-muted-foreground">{o.eligibleSpendTwd.toLocaleString()}</span>,
              share: <span className="font-black tabular-nums">{o.shareTwd.toLocaleString()}</span>,
              status: <StatusTag tone={o.status === "可結算" ? "gold" : o.status === "待結算" ? "pending" : "live"} label={o.status} />,
            }))}
            empty={<EmptyState icon="◇" title="此條件下沒有分潤紀錄" description="調整日期、卡池、訂單編號或結算狀態再試。" />}
          />

          <section className="panel p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">不列入分潤的行為</p>
            <p className="mt-1">{NON_ELIGIBLE_ACTIONS.join("、")}。</p>
            <p className="mt-2">{SETTLE_DEMO_NOTE}</p>
          </section>
        </>
      )}
    </div>
  );
}
