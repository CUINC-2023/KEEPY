import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { poolById } from "@/data/mock";
import { poolMeta } from "@/data/admin";
import { SubNav } from "@/components/layout/SubNav";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusTag } from "@/components/ui/status-tag";
import { PoolStatusTag } from "@/components/ui/pool-cover";
import { KEEPY_SAMPLE_POOL_ID, KEEPY_SAMPLE_CARDS, KEEPY_SAMPLE_NOTE } from "@/data/keepy-sample";
import { AlbumVisibilityEditor } from "@/components/album/AlbumVisibilityEditor";

export const Route = createFileRoute("/admin/pools/$poolId")({
  component: AdminPoolLayout,
});

function AdminPoolLayout() {
  const { poolId } = Route.useParams();
  const pool = poolById(poolId);

  if (!pool) {
    return (
      <EmptyState
        icon="◇"
        title="找不到此卡池"
        description="卡池可能已下架或不存在。"
        action={
          <Link to="/admin/pools" className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
            回到卡池管理
          </Link>
        }
      />
    );
  }

  const meta = poolMeta(pool.id);

  return (
    <div className="space-y-5">
      <header className="space-y-1.5">
        <Link to="/admin/pools" className="text-xs font-semibold text-primary hover:underline">
          ← 卡池管理
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-wide">{pool.name}</h1>
          {pool.id === KEEPY_SAMPLE_POOL_ID ? <span className="demo-chip">範例／非正式上架</span> : <PoolStatusTag status={pool.status} />}
          {pool.id !== KEEPY_SAMPLE_POOL_ID && <StatusTag
            tone={meta.publishState === "已發布" ? "live" : meta.publishState === "草稿" ? "pending" : "gold"}
            label={meta.publishState}
          />}
          <span className="demo-chip">Demo</span>
        </div>
        {pool.id !== KEEPY_SAMPLE_POOL_ID && <p className="text-xs text-muted-foreground">
          最後修改：{meta.lastEditedBy}・<span className="tabular-nums">{meta.lastEditedAt}</span>
          ｜抽卡設定 {meta.drawSettingsVersion}／合成設定 {meta.synthesisSettingsVersion}
        </p>}
      </header>

      {pool.id === KEEPY_SAMPLE_POOL_ID ? <section className="panel space-y-4 p-5"><p className="font-bold text-gold">後台示範／非真實權限 · {KEEPY_SAMPLE_NOTE}</p><h2 className="font-bold">合作模式（只讀示例，無真實合約）</h2><ul className="space-y-2 text-sm">{KEEPY_SAMPLE_CARDS.map(c => <li key={c.id} className="flex flex-wrap justify-between gap-2 border-b border-border pb-2"><span>{c.name}</span><span>{c.mode} · Demo</span></li>)}</ul><Link to="/pools/$poolId" params={{ poolId: pool.id }} className="text-sm font-bold text-primary underline">預覽前台卡池</Link></section> : <SubNav
        items={[
          { to: `/admin/pools/${pool.id}`, label: "卡池營運", exact: true },
          { to: `/admin/pools/${pool.id}/draw-settings`, label: "抽卡設定" },
          { to: `/admin/pools/${pool.id}/synthesis-settings`, label: "合成設定" },
        ]}
      />}

      {pool.id !== KEEPY_SAMPLE_POOL_ID && <Outlet />}
      <section className="panel p-4 sm:p-5"><AlbumVisibilityEditor key={pool.id} poolId={pool.id} /></section>
    </div>
  );
}
