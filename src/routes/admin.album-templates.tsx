import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ALBUM_TEMPLATES, ALBUM_TEMPLATE_NOTE, type AlbumTemplate } from "@/data/admin";
import { POOLS } from "@/data/mock";
import { PoolCover } from "@/components/ui/pool-cover";
import { StatusTag } from "@/components/ui/status-tag";
import { Progress } from "@/components/ui/progress";
import { ALL_POOL_PROGRESS } from "@/data/player";
import { StatePlaceholder, StateSwitcher, useDemoState } from "@/components/ui/state-demo";

export const Route = createFileRoute("/admin/album-templates")({
  head: () => ({
    meta: [
      { title: "卡冊 UI 範本 — CU 女神卡管理後台" },
      { name: "description", content: "標準卡冊、限定卡冊與紀念完成卡冊三種 UI 範本預覽。" },
      { property: "og:title", content: "卡冊 UI 範本 — CU 女神卡管理後台" },
      { property: "og:description", content: "三種卡冊 UI 範本的封面、進度欄、卡格狀態與鎖定規則（Demo）。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AlbumTemplatesPage,
});

const SAMPLE: Record<string, string> = {
  "atpl-standard": "p-uniform",
  "atpl-limited": "p-night-cherry",
  "atpl-complete": "p-anniversary",
};

function AlbumTemplatesPage() {
  const [state, setState] = useDemoState();
  const [active, setActive] = useState<AlbumTemplate>(ALBUM_TEMPLATES[0]!);
  const poolId = SAMPLE[active.id] ?? "p-uniform";
  const pool = POOLS.find((p) => p.id === poolId)!;
  const progress = ALL_POOL_PROGRESS.find((p) => p.poolId === poolId)!;

  return (
    <div className="space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-wide">卡冊 UI 範本</h1>
          <span className="demo-chip">Demo</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{ALBUM_TEMPLATE_NOTE}</p>
      </header>

      <StateSwitcher state={state} onChange={setState} />

      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="尚無卡冊範本" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {ALBUM_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t)}
                className={`panel p-4 text-left transition-colors ${
                  active.id === t.id ? "ring-1 ring-primary" : "hover:bg-muted/40"
                }`}
              >
                <p className="text-sm font-black">{t.name}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t.useCase}</p>
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="panel overflow-hidden p-3">
              <PoolCover pool={pool} />
              <div className="p-3">
                <p className="text-sm font-black">{pool.name}（範例預覽）</p>
                <Progress
                  className="mt-2"
                  value={progress.owned}
                  max={Math.max(1, progress.total)}
                  showLabel
                  label={`完成率 ${progress.pct}%`}
                  tone={progress.pct >= 100 ? "gold" : "violet"}
                />
                <p className="mt-2 text-[11px] text-muted-foreground">封面配置：{active.cover}</p>
              </div>
            </section>

            <section className="panel space-y-3 p-4 sm:p-5">
              <div>
                <p className="text-[11px] text-muted-foreground">進度欄</p>
                <p className="mt-0.5 text-sm font-bold">{active.progressBar}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">卡格狀態</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {active.tileStates.map((s) => (
                    <StatusTag key={s} tone="info" label={s} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">鎖定規則</p>
                <p className="mt-0.5 text-sm leading-relaxed">{active.lockRule}</p>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                手機版每列至少 2 張卡牌；未取得卡牌不顯示未公開完整卡面。
              </p>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
