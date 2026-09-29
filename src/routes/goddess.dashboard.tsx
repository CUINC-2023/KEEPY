import { createFileRoute, Link } from "@tanstack/react-router";
import { poolById, SPLIT_POLICY_NOTE, SPLIT_SOURCE_NOTE } from "@/data/mock";
import {
  COOP,
  NON_ELIGIBLE_ACTIONS,
  REVENUE_CALC_NOTE,
  REVENUE_CURRENCY_NOTE,
  REVENUE_ORDERS,
  REVENUE_PERIODS,
  goddessSelf,
  sumShare,
} from "@/data/goddess-backstage";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { StatusTag } from "@/components/ui/status-tag";
import { EmptyState } from "@/components/ui/empty-state";
import { PoolStatusTag } from "@/components/ui/pool-cover";
import { StateSwitcher, StatePlaceholder, useDemoState } from "@/components/ui/state-demo";

export const Route = createFileRoute("/goddess/dashboard")({
  head: () => ({
    meta: [
      { title: "女神儀表板 — CU 女神卡" },
      { name: "description", content: "合作狀態、上架卡池、有效付費抽卡與新台幣分潤摘要。（Demo）" },
      { property: "og:title", content: "女神儀表板 — CU 女神卡" },
      { property: "og:description", content: "合作狀態、上架卡池、有效付費抽卡與新台幣分潤摘要。（Demo）" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GoddessDashboard,
});

function GoddessDashboard() {
  const [state, setState] = useDemoState();
  const self = goddessSelf();
  const recent = REVENUE_ORDERS.slice(0, 6);

  return (
    <div className="space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-wide">女神儀表板</h1>
          <span className="demo-chip">Demo</span>
          <StatusTag tone="live" label={COOP.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {self.name}・{self.title}｜{REVENUE_CURRENCY_NOTE}
        </p>
      </header>

      <StateSwitcher state={state} onChange={setState} />
      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="尚無合作資料" emptyDescription="通過合作審核並上架卡池後，這裡會顯示收益摘要。" />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="上架卡池" value={COOP.poolIds.length} sub={COOP.poolNames.join("、")} />
            <StatCard label="卡牌數" value={COOP.cardCount} sub="已上架卡面（Mock）" />
            <StatCard label="有效付費抽卡" value={COOP.paidDrawCount.toLocaleString()} sub="現金／付費點數完成者" tone="violet" />
            <StatCard label="可結算分潤" value={`NT$ ${sumShare("可結算").toLocaleString()}`} sub="Demo，不可提領" tone="gold" />
          </section>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard label="待結算分潤" value={`NT$ ${sumShare("待結算").toLocaleString()}`} sub="結算期尚未截止" />
            <StatCard label="累積已結算" value={`NT$ ${sumShare("已結算").toLocaleString()}`} sub="歷史合計" />
            <StatCard label="分潤計算方式" value={<span className="text-base">{SPLIT_POLICY_NOTE}</span>} sub="介面不顯示未核定比例" />
          </section>

          <section className="panel hairline-gold p-5 text-sm leading-relaxed text-muted-foreground">
            <p className="flex gap-2"><span className="text-gold">◆</span>{SPLIT_SOURCE_NOTE}</p>
            <p className="mt-2 flex gap-2"><span className="text-gold">◆</span>{REVENUE_CALC_NOTE}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {NON_ELIGIBLE_ACTIONS.map((a) => (
                <span key={a} className="rounded-full border border-border px-2.5 py-1 text-[11px]">
                  {a}：不列入
                </span>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-black tracking-wide">上架卡池</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {COOP.poolIds.map((pid) => {
                const pool = poolById(pid);
                if (!pool) return null;
                return (
                  <div key={pid} className="panel flex items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-black">{pool.name}</p>
                        <PoolStatusTag status={pool.status} />
                      </div>
                      <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                        {pool.startAt} ～ {pool.endAt}｜卡牌 {pool.cardCount} 張
                      </p>
                    </div>
                    <Link to="/pools/$poolId" params={{ poolId: pool.id }} className="shrink-0 text-xs font-semibold text-primary hover:underline">
                      前台頁面 →
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-black tracking-wide">近期分潤明細</h2>
              <Link to="/goddess/revenue" className="text-xs font-semibold text-primary hover:underline">
                查看全部與篩選 →
              </Link>
            </div>
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
              rows={recent.map((o) => ({
                order: <span className="font-mono text-xs">{o.orderNo}</span>,
                at: <span className="tabular-nums text-muted-foreground">{o.drawAt}</span>,
                pool: o.poolName,
                type: <span className="text-muted-foreground">{o.drawType}・{o.payMethod}</span>,
                spend: <span className="tabular-nums text-muted-foreground">{o.eligibleSpendTwd.toLocaleString()}</span>,
                share: <span className="font-black tabular-nums">{o.shareTwd.toLocaleString()}</span>,
                status: <StatusTag tone={o.status === "可結算" ? "gold" : o.status === "待結算" ? "pending" : "live"} label={o.status} />,
              }))}
              empty={<EmptyState title="尚無分潤紀錄" description="玩家完成付費抽卡後才會產生分潤。" />}
            />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-black tracking-wide">結算期</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {REVENUE_PERIODS.map((p) => (
                <Link key={p.id} to="/goddess/revenue/$id" params={{ id: p.id }} className="panel p-4 transition-colors hover:bg-muted/40">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-black">{p.label}</p>
                    <StatusTag tone={p.status === "可結算" ? "gold" : p.status === "待結算" ? "pending" : "live"} label={p.status} />
                  </div>
                  <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                    {p.periodStart} ～ {p.periodEnd}｜有效付費抽卡 {p.paidDrawCount.toLocaleString()} 次
                  </p>
                  <p className="mt-2 text-lg font-black tabular-nums text-gold-gradient">
                    NT$ {p.shareTwd.toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
