import { PoolDescription } from "@/components/public/EditableText";
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { POOLS, POOL_KIND_LABEL, poolCollectProgress, poolPermanence, type Pool } from "@/data/mock";
import { PoolCover } from "@/components/ui/pool-cover";
import { FilterBar } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
import { useMockLoading } from "@/hooks/use-mock-loading";
import { KEEPY_SAMPLE_POOL_ID, KEEPY_SAMPLE_NOTE } from "@/data/keepy-sample";

export const Route = createFileRoute("/pools/")({
  head: () => ({
    meta: [
      { title: "卡池一覽 — KEEPY" },
      {
        name: "description",
        content: "查看 Demo 卡池和星光收藏虛構卡面示例；後者未正式上架，沒有定價或抽卡機率。",
      },
      { property: "og:title", content: "卡池一覽 — KEEPY" },
      {
        property: "og:description",
        content: "Demo 卡池一覽與虛構卡面示例；未對星光收藏設定正式機率或交易。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PoolsPage,
});

const FILTERS = [
  { key: "all", label: "全部" },
  { key: "live", label: "進行中" },
  { key: "upcoming", label: "即將開始" },
  { key: "ended", label: "已結束" },
  { key: "permanent", label: "常駐" },
  { key: "limited", label: "限定" },
];

function PoolsPage() {
  const [tab, setTab] = useState("all");
  const loading = useMockLoading();
  const pools =
    tab === "all"
      ? POOLS
      : tab === "permanent" || tab === "limited"
        ? POOLS.filter((p) => poolPermanence(p.kind) === tab)
        : POOLS.filter((p) => p.status === tab);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-wide">卡池一覽</h1>
          <span className="demo-chip">Demo</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          既有 Demo 卡池展示期間與 Mock 規則；星光收藏僅為虛構卡面範例，無定價與機率。
        </p>
      </header>

      <FilterBar filters={FILTERS} active={tab} onChange={setTab} />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <SkeletonBlock key={i} className="aspect-[16/11] w-full" />
          ))}
        </div>
      ) : pools.length === 0 ? (
        <EmptyState
          icon="✦"
          title="目前沒有這個狀態的卡池"
          description="換個分類看看，或先閱讀遊戲規則了解抽卡與合成機制。"
          action={
            <Link
              to="/rules"
              className="rounded-xl border border-gold/40 px-4 py-2 text-xs font-bold text-gold hover:bg-gold/10"
            >
              查看完整規則
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pools.map((p) => (
            <PoolListCard key={p.id} pool={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PoolListCard({ pool }: { pool: Pool }) {
  const progress = poolCollectProgress(pool.id);
  const top = pool.rates.filter((r) => ["O", "UR", "SSR"].includes(r.grade));
  return (
    <Link
      to="/pools/$poolId"
      params={{ poolId: pool.id }}
      className="panel hover-lift block overflow-hidden p-3"
    >
      <PoolCover pool={pool} />
      <div className="p-3">
        <p className="text-sm leading-relaxed text-muted-foreground"><PoolDescription poolId={pool.id} /></p>
        {pool.id === KEEPY_SAMPLE_POOL_ID && <p className="mt-2 text-xs font-bold text-gold">{KEEPY_SAMPLE_NOTE}</p>}
        <p className="mt-2 text-[11px] font-bold text-gold">{POOL_KIND_LABEL[pool.kind]}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          <span className="font-semibold">卡牌 {pool.cardCount} 張</span>
          <span className="text-muted-foreground">{pool.id === KEEPY_SAMPLE_POOL_ID ? "虛構示意人物" : `參與女神 ${pool.goddessIds.length} 位`}</span>
          {pool.id !== KEEPY_SAMPLE_POOL_ID && <span className="text-muted-foreground">蒐集 {progress.owned}/{progress.total}（{progress.pct}%）</span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          {top.map((r) => (
            <span
              key={r.grade}
              className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 font-bold text-gold tabular-nums"
            >
              {r.grade} {r.pct}%
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
