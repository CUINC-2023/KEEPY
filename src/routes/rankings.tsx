import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LEVEL_RANKING, POOL_RANKING, poolById } from "@/data/mock";
import { DataTable } from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
import { useMockLoading } from "@/hooks/use-mock-loading";

export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [
      { title: "排行榜 — CU 女神卡" },
      { name: "description", content: "公開排行榜：卡池蒐集排行與玩家等級排行。" },
      { property: "og:title", content: "排行榜 — CU 女神卡" },
      { property: "og:description", content: "公開排行榜：卡池蒐集排行與玩家等級排行。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RankingsPage,
});

const TABS = [
  { key: "pool", label: "卡池蒐集排行" },
  { key: "level", label: "玩家等級排行" },
];

function RankBadge({ rank }: { rank: number }) {
  const cls =
    rank === 1
      ? "bg-gold text-ink"
      : rank <= 3
        ? "border border-gold/50 text-gold"
        : "border border-border text-muted-foreground";
  return (
    <span className={`inline-grid h-7 w-7 place-items-center rounded-lg text-xs font-black ${cls}`}>
      {rank}
    </span>
  );
}

function RankingsPage() {
  const [tab, setTab] = useState("pool");
  const loading = useMockLoading();
  const poolName = poolById("p-uniform")?.name ?? "";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-wide">公開排行榜</h1>
          <span className="demo-chip">Demo</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          每日 00:00 更新，名次與數據皆為 Mock 示意。
        </p>
      </header>

      <FilterBar filters={TABS} active={tab} onChange={setTab} />

      {loading ? (
        <SkeletonBlock className="h-80 w-full" />
      ) : tab === "pool" ? (
        <>
          <p className="text-xs font-semibold tracking-widest text-gold">
            目前統計卡池：{poolName}
          </p>
          <DataTable
            columns={[
              { key: "rank", label: "名次" },
              { key: "player", label: "玩家" },
              { key: "progress", label: "蒐集進度" },
              { key: "count", label: "張數", className: "text-right" },
            ]}
            rows={POOL_RANKING.map((r) => ({
              rank: <RankBadge rank={r.rank} />,
              player: <span className="font-bold">{r.player}</span>,
              progress: (
                <Progress
                  className="w-32 sm:w-48"
                  value={r.ownedCards}
                  max={r.totalCards}
                  tone="gold"
                />
              ),
              count: (
                <span className="font-black tabular-nums">
                  {r.ownedCards} / {r.totalCards}
                </span>
              ),
            }))}
            empty={<EmptyState title="尚無排行資料" description="卡池開始後才會產生名次。" />}
          />
        </>
      ) : (
        <DataTable
          columns={[
            { key: "rank", label: "名次" },
            { key: "player", label: "玩家" },
            { key: "grade", label: "最高卡等級" },
            { key: "level", label: "等級", className: "text-right" },
          ]}
          rows={LEVEL_RANKING.map((r) => ({
            rank: <RankBadge rank={r.rank} />,
            player: <span className="font-bold">{r.player}</span>,
            grade: <RarityBadge rarity={r.topGrade} />,
            level: <span className="font-black tabular-nums">Lv.{r.level}</span>,
          }))}
          empty={<EmptyState title="尚無排行資料" />}
        />
      )}
    </div>
  );
}
