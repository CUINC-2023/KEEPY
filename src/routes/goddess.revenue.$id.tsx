import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SPLIT_POLICY_NOTE, SPLIT_SOURCE_NOTE } from "@/data/mock";
import {
  NON_ELIGIBLE_ACTIONS,
  REVENUE_CURRENCY_NOTE,
  SETTLE_DEMO_NOTE,
  ordersByPeriod,
  periodById,
} from "@/data/goddess-backstage";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { StatusTag } from "@/components/ui/status-tag";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { StateSwitcher, StatePlaceholder, useDemoState } from "@/components/ui/state-demo";

export const Route = createFileRoute("/goddess/revenue/$id")({
  head: () => ({
    meta: [
      { title: "結算期明細 — KEEPY" },
      { name: "description", content: "單一結算期的付費抽卡訂單、符合分潤消費與新台幣分潤明細。（Demo）" },
      { property: "og:title", content: "結算期明細 — KEEPY" },
      { property: "og:description", content: "單一結算期的付費抽卡訂單、符合分潤消費與新台幣分潤明細。（Demo）" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RevenueDetail,
});

function RevenueDetail() {
  const { id } = Route.useParams();
  const [state, setState] = useDemoState();
  const [confirm, setConfirm] = useState(false);
  const { push } = useToast();
  const period = periodById(id);
  const orders = period ? ordersByPeriod(period.id) : [];

  if (!period) {
    return (
      <EmptyState
        icon="◇"
        title="找不到此結算期"
        description="結算期可能已變更或不存在。"
        action={
          <Link to="/goddess/revenue" className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
            回到收益列表
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <Link to="/goddess/revenue" className="text-xs font-semibold text-primary hover:underline">
          ← 收益與分潤
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-wide">{period.label}</h1>
          <StatusTag tone={period.status === "可結算" ? "gold" : period.status === "待結算" ? "pending" : "live"} label={period.status} />
          <span className="demo-chip">Demo</span>
        </div>
        <p className="text-sm tabular-nums text-muted-foreground">
          {period.periodStart} ～ {period.periodEnd}｜卡池：{period.poolNames.join("、")}
          {period.settledAt ? `｜結算日 ${period.settledAt}` : ""}
        </p>
      </header>

      <StateSwitcher state={state} onChange={setState} />
      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="此結算期沒有訂單" emptyDescription="結算期內沒有符合分潤的付費抽卡。" />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="有效付費抽卡" value={period.paidDrawCount.toLocaleString()} sub="現金／付費點數" />
            <StatCard label="符合分潤消費" value={`NT$ ${period.eligibleSpendTwd.toLocaleString()}`} sub="不含贈送點數與免費抽卡" tone="violet" />
            <StatCard label="女神分潤" value={`NT$ ${period.shareTwd.toLocaleString()}`} sub={SPLIT_POLICY_NOTE} tone="gold" />
            <StatCard label="狀態" value={<span className="text-base">{period.status}</span>} sub="結算流程為 Demo" />
          </section>

          <section className="panel hairline-gold p-5 text-sm leading-relaxed text-muted-foreground">
            <p className="flex gap-2"><span className="text-gold">◆</span>{SPLIT_SOURCE_NOTE}</p>
            <p className="mt-2 flex gap-2"><span className="text-gold">◆</span>{REVENUE_CURRENCY_NOTE}</p>
            <p className="mt-2 flex gap-2"><span className="text-gold">◆</span>不列入：{NON_ELIGIBLE_ACTIONS.join("、")}。</p>
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
            rows={orders.map((o) => ({
              order: <span className="font-mono text-xs">{o.orderNo}</span>,
              at: <span className="tabular-nums text-muted-foreground">{o.drawAt}</span>,
              pool: o.poolName,
              type: <span className="text-muted-foreground">{o.drawType}・{o.payMethod}</span>,
              spend: <span className="tabular-nums text-muted-foreground">{o.eligibleSpendTwd.toLocaleString()}</span>,
              share: <span className="font-black tabular-nums">{o.shareTwd.toLocaleString()}</span>,
              status: <StatusTag tone={o.status === "可結算" ? "gold" : o.status === "待結算" ? "pending" : "live"} label={o.status} />,
            }))}
            empty={<EmptyState title="此結算期沒有訂單" description="結算期內沒有符合分潤的付費抽卡。" />}
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setConfirm(true)}
              disabled={period.status !== "可結算"}
              className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              申請結算（Demo）
            </button>
            <button
              onClick={() => push({ title: "已產生明細檔（Demo）", description: "原型不提供真實下載或帳務文件。" })}
              className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              下載明細（Demo）
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">{SETTLE_DEMO_NOTE}</p>
        </>
      )}

      <ConfirmDialog
        open={confirm}
        title="申請結算（Demo）"
        description={`結算期 ${period.label}，分潤 NT$ ${period.shareTwd.toLocaleString()}。原型不會真的送出結算或付款。`}
        confirmLabel="送出申請（Demo）"
        tone="gold"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          push({ title: "已送出結算申請（Demo）", description: "狀態不會真的改變，僅示範流程。", tone: "gold" });
        }}
      />
    </div>
  );
}
