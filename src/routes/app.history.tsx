import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DRAW_HISTORY, ORDERS, POINT_LEDGER, POINT_DEDUCT_NOTE } from "@/data/player";
import { DataTable } from "@/components/ui/data-table";
import { StatusTag } from "@/components/ui/status-tag";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { FilterBar } from "@/components/ui/filter-bar";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
import { StatePlaceholder, StateSwitcher, useDemoState } from "@/components/ui/state-demo";
import { useMockLoading } from "@/hooks/use-mock-loading";

export const Route = createFileRoute("/app/history")({
  head: () => ({
    meta: [
      { title: "紀錄 — CU 女神卡" },
      { name: "description", content: "抽卡紀錄、點數異動與訂單紀錄（Demo 資料）。" },
      { property: "og:title", content: "紀錄 — CU 女神卡" },
      { property: "og:description", content: "玩家抽卡與點數異動紀錄原型。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [state, setState] = useDemoState();
  const loading = useMockLoading(420);
  const [tab, setTab] = useState("draw");

  return (
    <div className="space-y-5">
      <StateSwitcher state={state} onChange={setState} />

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-black sm:text-2xl">紀錄</h1>
        <span className="demo-chip">Mock 資料</span>
      </div>

      <FilterBar
        filters={[
          { key: "draw", label: "抽卡紀錄" },
          { key: "points", label: "點數異動" },
          { key: "orders", label: "訂單" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="目前沒有紀錄" />
      ) : loading ? (
        <SkeletonBlock className="h-56" />
      ) : tab === "draw" ? (
        <DataTable
          columns={[
            { key: "t", label: "時間" },
            { key: "pool", label: "卡池" },
            { key: "mode", label: "方式" },
            { key: "cost", label: "消耗點數" },
            { key: "grade", label: "最高等級" },
            { key: "new", label: "新卡" },
          ]}
          rows={DRAW_HISTORY.map((h) => ({
            t: h.createdAt,
            pool: h.poolName,
            mode: h.mode,
            cost: `${h.costPoints} 點`,
            grade: <RarityBadge rarity={h.topGrade} />,
            new: `${h.newCards} 張`,
          }))}
        />
      ) : tab === "points" ? (
        <>
          <DataTable
            columns={[
              { key: "t", label: "時間" },
              { key: "type", label: "類型" },
              { key: "detail", label: "說明" },
              { key: "paid", label: "付費點數" },
              { key: "free", label: "贈送點數" },
            ]}
            rows={POINT_LEDGER.map((l) => ({
              t: l.createdAt,
              type: l.type,
              detail: l.detail,
              paid: l.paidDelta === 0 ? "—" : `${l.paidDelta > 0 ? "+" : ""}${l.paidDelta}`,
              free: l.freeDelta === 0 ? "—" : `${l.freeDelta > 0 ? "+" : ""}${l.freeDelta}`,
            }))}
          />
          <p className="text-[11px] text-muted-foreground">{POINT_DEDUCT_NOTE}</p>
        </>
      ) : (
        <DataTable
          columns={[
            { key: "id", label: "訂單編號" },
            { key: "t", label: "時間" },
            { key: "plan", label: "方案" },
            { key: "amount", label: "金額" },
            { key: "status", label: "狀態" },
          ]}
          rows={ORDERS.map((o) => ({
            id: o.id,
            t: o.createdAt,
            plan: o.plan,
            amount: `NT$${o.amountTwd.toLocaleString()}`,
            status: (
              <StatusTag
                label={o.status}
                tone={o.status === "已完成" ? "live" : o.status === "處理中" ? "pending" : "danger"}
              />
            ),
          }))}
        />
      )}
    </div>
  );
}
