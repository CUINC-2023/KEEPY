import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ORDERS, PLAYER, POINT_DEDUCT_NOTE, TOPUP_PLANS } from "@/data/player";
import { SPLIT_SOURCE_NOTE } from "@/data/mock";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { StatusTag } from "@/components/ui/status-tag";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatePlaceholder, StateSwitcher, useDemoState } from "@/components/ui/state-demo";
import { useToast } from "@/components/ui/toast";

export const Route = createFileRoute("/app/wallet")({
  head: () => ({
    meta: [
      { title: "錢包 — CU 女神卡" },
      { name: "description", content: "付費點數、贈送點數、Demo 儲值方案與訂單紀錄。" },
      { property: "og:title", content: "錢包 — CU 女神卡" },
      { property: "og:description", content: "點數與儲值方案原型，付款與退款全部為 Demo。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  const [state, setState] = useDemoState();
  const { push } = useToast();
  const [planId, setPlanId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const plan = TOPUP_PLANS.find((p) => p.id === planId);

  return (
    <div className="space-y-5">
      <StateSwitcher state={state} onChange={setState} />

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-black sm:text-2xl">錢包</h1>
        <span className="demo-chip">付款與退款皆為 Demo</span>
      </div>

      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="尚無點數紀錄" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="付費點數" value={PLAYER.paidPoints.toLocaleString()} tone="gold" sub="現金購買" />
            <StatCard label="贈送點數" value={PLAYER.freePoints.toLocaleString()} sub="活動贈送（Demo）" />
            <StatCard label="點數合計" value={(PLAYER.paidPoints + PLAYER.freePoints).toLocaleString()} sub={POINT_DEDUCT_NOTE} />
            <StatCard label="本月 Demo 消費" value="NT$1,400" sub="僅為示意資料" tone="violet" />
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-black">Demo 儲值方案</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {TOPUP_PLANS.map((p) => (
                <div key={p.id} className="panel flex flex-col p-4">
                  <div className="flex items-center gap-2">
                    <p className="font-black">{p.name}</p>
                    {p.tag && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">{p.tag}</span>}
                  </div>
                  <p className="mt-2 text-2xl font-black text-gold-gradient">{p.paidPoints.toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground">
                    付費點數{p.bonusPoints ? ` + 贈送 ${p.bonusPoints}` : ""}
                  </p>
                  <p className="mt-2 text-sm font-bold">NT${p.priceTwd.toLocaleString()}</p>
                  <button
                    onClick={() => setPlanId(p.id)}
                    className="mt-3 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                  >
                    購買（Demo）
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              原型不連接任何金流服務，不會產生真實付款、發票或退款。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black">訂單紀錄</h2>
            <DataTable
              columns={[
                { key: "id", label: "訂單編號" },
                { key: "t", label: "時間" },
                { key: "plan", label: "方案" },
                { key: "amount", label: "金額" },
                { key: "method", label: "付款方式" },
                { key: "status", label: "狀態" },
              ]}
              rows={ORDERS.map((o) => ({
                id: o.id,
                t: o.createdAt,
                plan: o.plan,
                amount: `NT$${o.amountTwd.toLocaleString()}`,
                method: o.method,
                status: (
                  <StatusTag
                    label={o.status}
                    tone={o.status === "已完成" ? "live" : o.status === "處理中" ? "pending" : "danger"}
                  />
                ),
              }))}
            />
            <Link to="/app/history" className="inline-block text-xs font-bold text-primary hover:underline">
              查看點數異動與抽卡紀錄 →
            </Link>
          </section>

          <p className="panel p-4 text-[11px] leading-relaxed text-muted-foreground">{SPLIT_SOURCE_NOTE}</p>
        </>
      )}

      <ConfirmDialog
        open={plan !== undefined}
        title={`確認購買「${plan?.name ?? ""}」`}
        description={`Demo 付款 NT$${plan?.priceTwd.toLocaleString() ?? 0}，不會真的扣款或加值。${POINT_DEDUCT_NOTE}`}
        confirmLabel={submitting ? "處理中…" : "確認付款（Demo）"}
        tone="gold"
        onCancel={() => setPlanId(null)}
        onConfirm={() => {
          setSubmitting(true);
          setTimeout(() => {
            setSubmitting(false);
            setPlanId(null);
            push({ title: "Demo 付款完成", description: "此為介面示意，點數與訂單不會變更。", tone: "gold" });
          }, 800);
        }}
      />
    </div>
  );
}
