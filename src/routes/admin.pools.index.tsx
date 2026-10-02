import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ADMIN_POOL_ROWS } from "@/data/admin";
import { POOL_KIND_LABEL, poolPermanence } from "@/data/mock";
import { DataTable } from "@/components/ui/data-table";
import { StatusTag } from "@/components/ui/status-tag";
import { FilterBar } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { PoolStatusTag } from "@/components/ui/pool-cover";
import { StateSwitcher, StatePlaceholder, useDemoState } from "@/components/ui/state-demo";

export const Route = createFileRoute("/admin/pools/")({
  head: () => ({
    meta: [
      { title: "卡池管理 — KEEPY管理後台" },
      { name: "description", content: "卡池列表與抽卡、合成設定入口，草稿與發布狀態一覽。（Demo）" },
      { property: "og:title", content: "卡池管理 — KEEPY管理後台" },
      { property: "og:description", content: "卡池列表與抽卡、合成設定入口，草稿與發布狀態一覽。（Demo）" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPools,
});

function AdminPools() {
  const [state, setState] = useDemoState();
  const [filter, setFilter] = useState("all");
  const rows = ADMIN_POOL_ROWS.filter((r) =>
    filter === "all"
      ? true
      : filter === "permanent" || filter === "limited"
        ? poolPermanence(r.pool.kind) === filter
        : r.pool.status === filter
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black tracking-wide">卡池管理</h1>
            <span className="demo-chip">Demo</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            抽卡範圍與機率皆以單一卡池為單位（V1）。全卡池抽卡尚未啟用。
          </p>
        </div>
        <Link
          to="/admin/pools/new"
          search={{ template: undefined, copy: undefined }}
          className="rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground"
        >
          建立新卡池（Demo 草稿）
        </Link>
      </header>

      <StateSwitcher state={state} onChange={setState} />
      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="沒有符合條件的卡池" emptyDescription="切換篩選條件再試。" />
      ) : (
        <>
          <FilterBar
            filters={[
              { key: "all", label: "全部" },
              { key: "live", label: "進行中" },
              { key: "upcoming", label: "即將開始" },
              { key: "ended", label: "已結束" },
              { key: "permanent", label: "常駐" },
              { key: "limited", label: "限定" },
            ]}
            active={filter}
            onChange={setFilter}
          />

          <DataTable
            columns={[
              { key: "pool", label: "卡池" },
              { key: "kind", label: "類型" },
              { key: "status", label: "前台狀態" },
              { key: "publish", label: "發布狀態" },
              { key: "cards", label: "卡牌數", className: "text-right" },
              { key: "goddesses", label: "參與女神", className: "text-right" },
              { key: "drawSettings", label: "抽卡設定版本／狀態" },
              { key: "synthesisSettings", label: "合成設定版本／狀態" },
              { key: "links", label: "", className: "text-right" },
            ]}
            rows={rows.map(({ pool, meta }) => ({
              pool: (
                <Link to="/admin/pools/$poolId" params={{ poolId: pool.id }} className="font-bold text-primary hover:underline">
                  {pool.name}
                </Link>
              ),
              kind: <StatusTag tone="info" label={POOL_KIND_LABEL[pool.kind]} />,
              status: <PoolStatusTag status={pool.status} />,
              goddesses: (
                <span className="tabular-nums text-muted-foreground">{pool.goddessIds.length} 位</span>
              ),
              drawSettings: (
                <span className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="font-bold tabular-nums text-foreground">{meta.drawSettingsVersion}</span>
                  <StatusTag
                    tone={meta.drawSettingsState === "已發布" ? "live" : "pending"}
                    label={meta.drawSettingsState}
                  />
                </span>
              ),
              synthesisSettings: (
                <span className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="font-bold tabular-nums text-foreground">{meta.synthesisSettingsVersion}</span>
                  <StatusTag
                    tone={meta.synthesisSettingsState === "已發布" ? "live" : "pending"}
                    label={meta.synthesisSettingsState}
                  />
                </span>
              ),
              publish: (
                <StatusTag
                  tone={meta.publishState === "已發布" ? "live" : meta.publishState === "草稿" ? "pending" : "gold"}
                  label={meta.publishState}
                />
              ),
              cards: <span className="tabular-nums text-muted-foreground">{pool.cardCount}</span>,
              links: (
                <span className="flex flex-wrap justify-end gap-1.5">
                  <Link
                    to="/admin/pools/$poolId/draw-settings"
                    params={{ poolId: pool.id }}
                    className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    抽卡設定
                  </Link>
                  <Link
                    to="/admin/pools/$poolId/synthesis-settings"
                    params={{ poolId: pool.id }}
                    className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    合成設定
                  </Link>
                </span>
              ),
            }))}
            empty={<EmptyState icon="◇" title="沒有符合條件的卡池" description="切換篩選條件再試。" />}
          />
        </>
      )}
    </div>
  );
}
