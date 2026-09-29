import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ALL_POOL_PROGRESS, albumCompletionState } from "@/data/player";
import { POOLS, POOL_KIND_LABEL, poolById, poolPermanence } from "@/data/mock";
import { PoolCover, PoolStatusTag } from "@/components/ui/pool-cover";
import { Progress } from "@/components/ui/progress";
import { StatusTag } from "@/components/ui/status-tag";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
import { StatePlaceholder, StateSwitcher, useDemoState } from "@/components/ui/state-demo";
import { useMockLoading } from "@/hooks/use-mock-loading";
import { KEEPY_SAMPLE_POOL_ID } from "@/data/keepy-sample";

export const Route = createFileRoute("/app/album/")({
  head: () => ({
    meta: [
      { title: "卡冊總覽 — KEEPY" },
      { name: "description", content: "檢視既有六本 Demo 卡冊及星光收藏虛構卡面示例。" },
      { property: "og:title", content: "卡冊總覽 — KEEPY" },
      { property: "og:description", content: "六本 Demo 卡冊與一組非正式上架示意卡面。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AlbumOverview,
});

type StatusFilter = "all" | "live" | "upcoming" | "ended";
type DoneFilter = "all" | "none" | "collecting" | "done";
type KindFilter = "all" | "permanent" | "limited";
type SortKey = "pct-desc" | "pct-asc" | "name";

const DONE_LABEL: Record<string, string> = {
  none: "未開始",
  collecting: "蒐集中",
  done: "已完成",
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function AlbumOverview() {
  const [state, setState] = useDemoState();
  const loading = useMockLoading(420);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [done, setDone] = useState<DoneFilter>("all");
  const [kind, setKind] = useState<KindFilter>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("pct-desc");

  const rows = ALL_POOL_PROGRESS.map((p) => ({ progress: p, pool: poolById(p.poolId)! }))
    .filter(({ pool, progress }) => {
      if (status !== "all" && pool.status !== status) return false;
      if (kind !== "all" && poolPermanence(pool.kind) !== kind) return false;
      if (done !== "all" && albumCompletionState(progress) !== done) return false;
      if (q.trim() && !`${pool.name}${pool.subtitle}`.toLowerCase().includes(q.trim().toLowerCase()))
        return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "name") return a.pool.name.localeCompare(b.pool.name, "zh-Hant");
      if (sort === "pct-asc") return a.progress.pct - b.progress.pct;
      return b.progress.pct - a.progress.pct;
    });

  const officialProgress = ALL_POOL_PROGRESS.filter((p) => p.poolId !== KEEPY_SAMPLE_POOL_ID);
  const totalOwned = officialProgress.reduce((s, p) => s + p.owned, 0);
  const totalCards = officialProgress.reduce((s, p) => s + p.total, 0);

  return (
    <div className="space-y-5">
      <StateSwitcher state={state} onChange={setState} />

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-black sm:text-2xl">卡冊總覽</h1>
        <span className="demo-chip">Mock 資料</span>
        <span className="ml-auto text-xs font-bold tabular-nums text-muted-foreground">
          Demo 蒐集 {totalOwned} / {totalCards} 張（六本卡冊＋一組示意卡）
        </span>
      </div>

      <div className="panel space-y-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          {(["all", "live", "upcoming", "ended"] as StatusFilter[]).map((k) => (
            <Chip key={k} active={status === k} onClick={() => setStatus(k)}>
              {k === "all" ? "全部狀態" : k === "live" ? "進行中" : k === "upcoming" ? "即將開始" : "已結束"}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", "none", "collecting", "done"] as DoneFilter[]).map((k) => (
            <Chip key={k} active={done === k} onClick={() => setDone(k)}>
              {k === "all" ? "全部完成度" : DONE_LABEL[k]}
            </Chip>
          ))}
          {(["all", "permanent", "limited"] as KindFilter[]).map((k) => (
            <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
              {k === "all" ? "常駐＋限定" : k === "permanent" ? "常駐" : "限定"}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜尋卡池名稱"
            className="min-w-0 flex-1 rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground placeholder:text-muted-foreground"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground"
          >
            <option value="pct-desc">完成率：高 → 低</option>
            <option value="pct-asc">完成率：低 → 高</option>
            <option value="name">名稱排序</option>
          </select>
        </div>
      </div>

      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="沒有符合條件的卡冊" />
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBlock key={i} className="aspect-[16/10] w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="沒有符合條件的卡冊"
          description="試著放寬篩選條件或清除關鍵字。"
          action={
            <button onClick={() => { setStatus("all"); setDone("all"); setKind("all"); setQ(""); }} className="text-xs font-bold text-primary hover:underline">
              清除篩選
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map(({ pool, progress }) => (
            <Link
              key={pool.id}
              to="/app/album/$poolId"
              params={{ poolId: pool.id }}
              className="panel hover-lift block overflow-hidden p-3"
            >
              <PoolCover pool={pool} />
              <div className="p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-black">{pool.name}</p>
                  <PoolStatusTag status={pool.status} />
                  <StatusTag tone="info" label={POOL_KIND_LABEL[pool.kind]} />
                  <StatusTag
                    tone={progress.owned >= progress.total ? "gold" : progress.owned === 0 ? "resting" : "live"}
                    label={DONE_LABEL[albumCompletionState(progress)]!}
                  />
                </div>
                <p className="mt-2 text-xl font-black text-violet-gradient tabular-nums">
                  {progress.owned} / {progress.total}
                </p>
                <Progress
                  value={progress.owned}
                  max={Math.max(1, progress.total)}
                  className="mt-2"
                  showLabel
                  label={`完成率 ${progress.pct}%`}
                  tone={progress.owned >= progress.total ? "gold" : "violet"}
                />
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    最高等級
                    {progress.topGrade ? <RarityBadge rarity={progress.topGrade} /> : <span>—</span>}
                  </span>
                  <span>新卡 {progress.newCount}</span>
                  <span>可升級 {progress.upgradableCount}</span>
                  <span>重複卡 {progress.dupeCount}</span>
                  <span>最後取得 {progress.lastObtainedAt ?? "—"}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
