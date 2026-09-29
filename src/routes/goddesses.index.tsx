import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GODDESSES, SPLIT_POLICY_NOTE } from "@/data/mock";
import { CardFrame } from "@/components/ui/card-frame";
import { FilterBar } from "@/components/ui/filter-bar";
import { StatusTag } from "@/components/ui/status-tag";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCardGrid } from "@/components/ui/skeleton-block";
import { useMockLoading } from "@/hooks/use-mock-loading";

export const Route = createFileRoute("/goddesses/")({
  head: () => ({
    meta: [
      { title: "女神列表 — CU 女神卡" },
      { name: "description", content: "認識所有合作女神創作者，查看代表卡等級與公開檔案。" },
      { property: "og:title", content: "女神列表 — CU 女神卡" },
      { property: "og:description", content: "認識所有合作女神創作者，查看代表卡等級與公開檔案。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GoddessesPage,
});

const FILTERS = [
  { key: "all", label: "全部" },
  { key: "live", label: "營業中" },
  { key: "resting", label: "休息中" },
  { key: "pending", label: "審核中" },
];

function GoddessesPage() {
  const [status, setStatus] = useState("all");
  const loading = useMockLoading();
  const list = status === "all" ? GODDESSES : GODDESSES.filter((g) => g.status === status);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-black tracking-wide">女神列表</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          共 {GODDESSES.length} 位合作女神 · {SPLIT_POLICY_NOTE}
        </p>
      </header>

      <FilterBar filters={FILTERS} active={status} onChange={setStatus} />

      {loading ? (
        <SkeletonCardGrid count={5} />
      ) : list.length === 0 ? (
        <EmptyState title="沒有符合條件的女神" description="換個狀態分類試試。" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {list.map((g) => (
            <Link key={g.id} to="/goddesses/$goddessId" params={{ goddessId: g.id }} className="min-w-0">
              <CardFrame goddess={g} />
              <div className="mt-2 flex items-center justify-between gap-2">
                <StatusTag tone={g.status === "live" ? "live" : g.status === "pending" ? "pending" : "resting"} />
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {g.supporters.toLocaleString()} 支持
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
