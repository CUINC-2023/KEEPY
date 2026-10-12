import { useLocalTest } from "@/lib/local-test-client";
import { useDemoPlayer } from "@/lib/demo-player-store";
import { usePlayerCopy } from "@/lib/player-copy";
import { poolById, gradeIndex } from "@/data/mock";
import { Link } from "@tanstack/react-router";
import { usePlayerUiText } from "@/lib/player-ui-text";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ORDERS, POINT_LEDGER, POINT_DEDUCT_NOTE } from "@/data/player";
import { DataTable } from "@/components/ui/data-table";
import { StatusTag } from "@/components/ui/status-tag";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { FilterBar } from "@/components/ui/filter-bar";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
import { useDemoState } from "@/components/ui/state-demo-shared";
import { StatePlaceholder, StateSwitcher } from "@/components/ui/state-demo";
import { useMockLoading } from "@/hooks/use-mock-loading";

export const Route = createFileRoute("/app/history")({
  head: () => ({
    meta: [
      { title: "紀錄 — KEEPY" },
      { name: "description", content: "抽卡紀錄、點數異動與訂單紀錄（Demo 資料）。" },
      { property: "og:title", content: "紀錄 — KEEPY" },
      { property: "og:description", content: "玩家抽卡與點數異動紀錄原型。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { state: demo } = useDemoPlayer();
  const local = useLocalTest();
  const tx = usePlayerUiText();
  const t = usePlayerCopy();
  const [state, setState] = useDemoState();
  const loading = useMockLoading(420);
  const [tab, setTab] = useState("draw");

  if (local.enabled)
    return (
      <div className="panel space-y-3 break-all p-4" data-testid="local-normal-history">
        <h1>syntheticLocalTest · Draw history / TEST KP ledger</h1>
        <p>
          {local.summary?.user.id} · {local.summary?.user.balance ?? 0} TEST KP
        </p>
        {demo.drawHistory.map((draw) => (
          <div key={draw.id}>
            {draw.id} · {draw.poolId} · {draw.items.length} cards · {draw.before} → {draw.after}
          </div>
        ))}
        {local.summary?.ledger.map((row) => (
          <div key={row.id}>
            {row.at} · {row.source} · {row.amount} TEST KP
          </div>
        ))}
        {local.summary?.syntheses.map((row) => (
          <div key={row.id}>
            {row.createdAt} · synthesis {row.kind} · {row.materials.join(", ")} → {row.cardId}
          </div>
        ))}
        {local.summary?.physical.map((row) => (
          <div key={row.id}>
            Physical preview · {row.cardId} · quantity {row.quantity} · no order
          </div>
        ))}
        {local.summary?.assetEvents.map((row) => (
          <div key={row.id}>
            {row.at} · {row.source} · {row.card_id} · delta {row.delta}
          </div>
        ))}
        <p>No real orders or payments.</p>
      </div>
    );
  return (
    <div className="space-y-5">
      <StateSwitcher state={state} onChange={setState} />

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-black sm:text-2xl">{tx("紀錄")}</h1>
        <span className="demo-chip">{tx("Mock 資料")}</span>
      </div>

      <aside className="panel space-y-2 p-4 text-xs" data-testid="demo-history-summary">
        <p className="font-bold">
          {t("本機示意抽卡紀錄", "Local demo draw history")} · {demo.drawHistory.length}
        </p>
        <p className="text-muted-foreground">
          {t(
            "紀錄與本機收藏同源；示意抽卡不扣 KP。點數與訂單分頁仍為獨立範例，並非本次操作的帳本。",
            "History shares the local collection state; demo draws charge no KP. Points and orders remain separate examples, not a ledger of these operations.",
          )}
        </p>
        {demo.lastDraw && (
          <Link
            to="/app/album/$poolId"
            params={{ poolId: demo.lastDraw.poolId }}
            className="font-bold text-primary underline"
          >
            {tx("前往卡冊")}
          </Link>
        )}
      </aside>
      <FilterBar
        filters={[
          { key: "draw", label: tx("抽卡紀錄") },
          { key: "points", label: tx("點數異動") },
          { key: "orders", label: tx("訂單") },
        ]}
        active={tab}
        onChange={setTab}
      />

      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle={tx("目前沒有紀錄")} />
      ) : loading ? (
        <SkeletonBlock className="h-56" />
      ) : tab === "draw" ? (
        <DataTable
          columns={[
            { key: "t", label: tx("時間") },
            { key: "pool", label: tx("卡池") },
            { key: "mode", label: tx("方式") },
            { key: "cost", label: tx("消耗點數") },
            { key: "grade", label: tx("最高等級") },
            { key: "new", label: tx("新卡") },
          ]}
          rows={[...demo.drawHistory].reverse().map((h) => ({
            t: h.createdAt || t("舊版紀錄・日期不明", "Legacy record · date unknown"),
            pool: poolById(h.poolId)?.name ?? h.poolId,
            mode: h.items.length === 11 ? "10+1" : t("單抽", "Single draw"),
            cost: t("0 KP・示意", "0 KP · demo"),
            grade: (
              <RarityBadge
                rarity={h.items.reduce(
                  (top, item) =>
                    gradeIndex(item.card.grade) > gradeIndex(top) ? item.card.grade : top,
                  h.items[0]!.card.grade,
                )}
              />
            ),
            new: String(h.items.filter((item) => item.isNew).length),
          }))}
        />
      ) : tab === "points" ? (
        <>
          <DataTable
            columns={[
              { key: "t", label: tx("時間") },
              { key: "type", label: tx("類型") },
              { key: "detail", label: tx("說明") },
              { key: "paid", label: tx("付費點數") },
              { key: "free", label: tx("贈送點數") },
            ]}
            rows={POINT_LEDGER.map((l) => ({
              t: l.createdAt,
              type: l.type,
              detail: l.detail,
              paid: l.paidDelta === 0 ? "—" : `${l.paidDelta > 0 ? "+" : ""}${l.paidDelta}`,
              free: l.freeDelta === 0 ? "—" : `${l.freeDelta > 0 ? "+" : ""}${l.freeDelta}`,
            }))}
          />
          <p className="text-[11px] text-muted-foreground">{tx(POINT_DEDUCT_NOTE)}</p>
        </>
      ) : (
        <DataTable
          columns={[
            { key: "id", label: tx("訂單編號") },
            { key: "t", label: tx("時間") },
            { key: "plan", label: tx("方案") },
            { key: "amount", label: tx("金額") },
            { key: "status", label: tx("狀態") },
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
