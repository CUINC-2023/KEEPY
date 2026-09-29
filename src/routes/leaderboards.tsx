import { LeaderboardNote } from "@/components/public/EditableText";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { poolById } from "@/data/mock";
import {
  DEMO_COLLECTORS,
  LEADERBOARD_POOLS,
  LEADERBOARD_UPDATED_AT,
  SELF_COLLECTOR_ID,
  rankPool,
  rankTotal,
  selfCollector,
  type DemoCollector,
} from "@/data/leaderboard";
import { DEFAULT_PUBLIC_PROFILE, readPublicProfile } from "@/data/public-profile-settings";
import { APP_VERSION } from "@/data/public-hub";
import { PublicPage, TextStatus } from "@/components/public/PublicPage";
import { EmptyState } from "@/components/ui/empty-state";

type Search = { view?: "total" | "pool"; pool?: string };

export const Route = createFileRoute("/leaderboards")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const out: Search = {};
    const v = s["view"];
    const p = s["pool"];
    if (v === "pool" || v === "total") out.view = v;
    if (typeof p === "string") out.pool = p.slice(0, 64);
    return out;
  },
  head: () => ({
    meta: [
      { title: "排行榜 — PEEKFUTURE 創作者收藏卡平台" },
      { name: "description", content: "收藏總榜與單一卡池排行榜（Demo 示範排名），只顯示公開收藏家資料，不顯示消費金額。" },
      { property: "og:title", content: "排行榜 — PEEKFUTURE 創作者收藏卡平台" },
      { property: "og:description", content: "收藏總榜與單一卡池排行榜，Demo 示範排名。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaderboardsPage,
});

function NameCell({ c }: { c: DemoCollector }) {
  if (c.id === SELF_COLLECTOR_ID) {
    return (
      <span className="flex min-w-0 items-center gap-2">
        <Link to="/collectors/demo-player" className="truncate font-bold text-primary underline-offset-2 hover:underline" aria-label={`查看 ${c.displayName} 的公開收藏頁`}>
          {c.displayName}
        </Link>
        <TextStatus tone="gold">本人</TextStatus>
      </span>
    );
  }
  return <span className="truncate font-bold">{c.displayName}</span>;
}

function LeaderboardsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/leaderboards" });
  const view = search.view ?? (search.pool ? "pool" : "total");
  const poolId = search.pool ?? "p-uniform";

  const [self, setSelf] = useState<DemoCollector | null>(null);
  const [selfHiddenReason, setSelfHiddenReason] = useState<string | null>(null);
  useEffect(() => {
    const s = readPublicProfile();
    if (!s.isPublic) setSelfHiddenReason("你的公開收藏頁目前未公開，因此不列入榜單。");
    else if (!s.showRanking) setSelfHiddenReason("你已關閉「顯示排名」，因此不列入榜單。");
    setSelf(selfCollector(s.displayName || DEFAULT_PUBLIC_PROFILE.displayName, s.isPublic, s.showRanking));
  }, []);

  const list = useMemo(() => (self ? [...DEMO_COLLECTORS, self] : DEMO_COLLECTORS), [self]);
  const totalRows = useMemo(() => rankTotal(list), [list]);
  const poolRows = useMemo(() => rankPool(list, poolId), [list, poolId]);
  const pool = poolById(poolId);
  const hiddenCount = DEMO_COLLECTORS.filter((c) => !(c.isPublic && c.showRanking)).length;
  const selfTotal = totalRows.find((r) => r.collector.id === SELF_COLLECTOR_ID);
  const selfPool = poolRows?.find((r) => r.collector.id === SELF_COLLECTOR_ID);

  const tabCls = (on: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-bold transition-colors ${on ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"}`;

  return (
    <PublicPage title="排行榜" description={`${APP_VERSION} · 排行榜說明請見下方。`}>
      <p className="panel p-4 text-sm leading-relaxed"><LeaderboardNote /></p>
      <div role="group" aria-label="榜別" className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={view === "total"} className={tabCls(view === "total")} onClick={() => navigate({ search: { view: "total" } })}>
          {view === "total" ? "✓ " : ""}收藏總榜
        </button>
        <button type="button" aria-pressed={view === "pool"} className={tabCls(view === "pool")} onClick={() => navigate({ search: { view: "pool", pool: poolId } })}>
          {view === "pool" ? "✓ " : ""}單一卡池排行榜
        </button>
      </div>

      {view === "pool" ? (
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-bold">選擇卡池</span>
          <select
            value={pool ? poolId : ""}
            onChange={(e) => navigate({ search: { view: "pool", pool: e.target.value } })}
            className="min-w-0 max-w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {!pool ? <option value="">（找不到此卡池）</option> : null}
            {LEADERBOARD_POOLS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
      ) : null}

      <section className="panel flex flex-wrap items-center justify-between gap-4 p-5" aria-label="我的名次摘要">
        <div>
          <p className="text-xs text-muted-foreground">我的名次（此瀏覽器 Local Mock）</p>
          {selfHiddenReason ? (
            <p className="mt-1 text-sm font-bold">{selfHiddenReason}</p>
          ) : (
            <p className="mt-1 text-2xl font-black text-gold">
              {view === "total"
                ? selfTotal ? `第 ${selfTotal.rank} 名` : "—"
                : selfPool ? `第 ${selfPool.rank} 名` : "此卡池尚未上榜"}
            </p>
          )}
        </div>
        <Link to="/app/settings/privacy" className="text-xs font-semibold text-primary hover:underline">調整公開與排名設定 →</Link>
      </section>

      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="text-sm font-black">
            {view === "total" ? "收藏總榜" : `單一卡池排行榜：${pool?.name ?? "未知卡池"}`}
          </h2>
          <TextStatus>Demo 示範排名</TextStatus>
        </div>
        {view === "pool" && !pool ? (
          <EmptyState title="找不到這個卡池" description={`卡池「${poolId}」不存在，請從上方選擇既有卡池。`} />
        ) : view === "pool" && poolRows && poolRows.length === 0 ? (
          <EmptyState title="此卡池尚無排行資料" description={`${pool?.name} 尚未開池或尚無公開收藏家蒐集紀錄。`} />
        ) : (
          <ol aria-label={view === "total" ? "收藏總榜名次" : "卡池榜名次"}>
            <li aria-hidden className="grid grid-cols-[48px_minmax(0,1fr)_auto] gap-2 border-b border-border px-4 py-2 text-xs font-bold text-muted-foreground">
              <span>名次</span><span>公開顯示名稱</span><span className="text-right">{view === "total" ? "收藏積分／不重複" : "不重複卡數／蒐集率"}</span>
            </li>
            {view === "total"
              ? totalRows.map((r) => (
                  <li key={r.collector.id} className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-2 border-b border-border/60 px-4 py-3 last:border-0">
                    <span className="font-black text-gold">第 {r.rank}</span>
                    <NameCell c={r.collector} />
                    <span className="text-right text-sm tabular-nums"><b>{r.collector.totalScore.toLocaleString()}</b> 分<span className="block text-[11px] text-muted-foreground">{r.collector.uniqueCards} 張</span></span>
                  </li>
                ))
              : (poolRows ?? []).map((r) => (
                  <li key={r.collector.id} className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-2 border-b border-border/60 px-4 py-3 last:border-0">
                    <span className="font-black text-gold">第 {r.rank}</span>
                    <NameCell c={r.collector} />
                    <span className="text-right text-sm tabular-nums"><b>{r.owned}/{r.total}</b><span className="block text-[11px] text-muted-foreground">{r.pct}%</span></span>
                  </li>
                ))}
          </ol>
        )}
      </div>

      <section className="panel space-y-2 p-5 text-xs leading-relaxed text-muted-foreground">
        <h2 className="text-sm font-black text-foreground">Demo 規則說明（尚未正式核定）</h2>
        <p>・收藏總榜：依總收藏積分由高至低；同分依不重複卡數，再依固定示範 id 排序。</p>
        <p>・單一卡池排行榜：依該卡池已收集不重複卡數（分母為卡冊完整總數）；同分依總不重複卡數，再依固定示範 id。</p>
        <p>・不使用消費金額；不含獎項或賽季結算。正式計分規則待定。</p>
        <p>・隱私：未公開或關閉排名的收藏家不顯示名稱與數據（本次示範有 {hiddenCount} 位未列入）。</p>
        <p>・資料來源：Local Mock 示範資料，固定更新時間 {LEADERBOARD_UPDATED_AT}；你本人的名稱與是否上榜只依此瀏覽器設定，不會跨使用者同步。</p>
      </section>
    </PublicPage>
  );
}
