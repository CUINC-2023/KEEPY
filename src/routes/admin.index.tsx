import { createFileRoute, Link } from "@tanstack/react-router";
import { ADMIN_POOL_ROWS, ADMIN_USER, ALL_POOLS_TBD, DRAW_SCOPES } from "@/data/admin";
import { DataTable } from "@/components/ui/data-table";
import { StatusTag } from "@/components/ui/status-tag";
import { StatCard } from "@/components/ui/stat-card";
import { PoolStatusTag } from "@/components/ui/pool-cover";
import { StateSwitcher, StatePlaceholder, useDemoState } from "@/components/ui/state-demo";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "營運總覽 — CU 女神卡管理後台" },
      { name: "description", content: "卡池草稿與發布狀態、最後修改者與修改時間的營運總覽骨架。（Demo）" },
      { property: "og:title", content: "營運總覽 — CU 女神卡管理後台" },
      { property: "og:description", content: "卡池草稿與發布狀態、最後修改者與修改時間的營運總覽骨架。（Demo）" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminHome,
});

function AdminHome() {
  const [state, setState] = useDemoState();
  const drafts = ADMIN_POOL_ROWS.filter((r) => r.meta.publishState !== "已發布").length;

  return (
    <div className="space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-wide">營運總覽</h1>
          <span className="demo-chip">Demo</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          管理卡池抽卡與合成規則草稿。此原型不會真的發布或改動前台資料。
        </p>
      </header>

      <StateSwitcher state={state} onChange={setState} />
      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="尚無卡池" emptyDescription="建立卡池後即可設定抽卡與合成規則。" />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="卡池數" value={ADMIN_POOL_ROWS.length} sub="Mock 卡池" />
            <StatCard label="待處理草稿" value={drafts} sub="含未發布變更" tone="gold" />
            <StatCard label="抽卡範圍" value="單一卡池" sub="V1 僅啟用 single_pool" tone="violet" />
            <StatCard label="權限" value={<span className="text-base">{ADMIN_USER.permissions.length} 項</span>} sub={ADMIN_USER.permissions.join("、")} />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-black tracking-wide">卡池狀態</h2>
            <DataTable
              columns={[
                { key: "pool", label: "卡池" },
                { key: "status", label: "前台狀態" },
                { key: "publish", label: "發布狀態" },
                { key: "version", label: "設定版本" },
                { key: "edited", label: "最後修改" },
                { key: "go", label: "", className: "text-right" },
              ]}
              rows={ADMIN_POOL_ROWS.map(({ pool, meta }) => ({
                pool: <span className="font-bold">{pool.name}</span>,
                status: <PoolStatusTag status={pool.status} />,
                publish: (
                  <StatusTag
                    tone={meta.publishState === "已發布" ? "live" : meta.publishState === "草稿" ? "pending" : "gold"}
                    label={meta.publishState}
                  />
                ),
                version: (
                  <span className="font-mono text-xs text-muted-foreground">
                    抽卡 {meta.drawSettingsVersion}／合成 {meta.synthesisSettingsVersion}
                  </span>
                ),
                edited: (
                  <span className="text-xs text-muted-foreground">
                    {meta.lastEditedBy}
                    <br />
                    <span className="tabular-nums">{meta.lastEditedAt}</span>
                  </span>
                ),
                go: (
                  <Link
                    to="/admin/pools/$poolId"
                    params={{ poolId: pool.id }}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    管理
                  </Link>
                ),
              }))}
            />
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            {DRAW_SCOPES.map((s) => (
              <div
                key={s.key}
                className={`panel p-5 ${s.enabled ? "hairline-gold" : "opacity-70"}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black">{s.label}</h3>
                  <StatusTag tone={s.enabled ? "live" : "resting"} label={s.enabled ? "已啟用" : "尚未啟用"} />
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                {!s.enabled && (
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground">未來待決策（全部待定）</p>
                    {ALL_POOLS_TBD.map((t) => (
                      <p key={t}>・{t}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
