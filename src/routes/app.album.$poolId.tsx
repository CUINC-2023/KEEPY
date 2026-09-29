import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { poolById } from "@/data/mock";
import { AlbumDetailTemplate } from "@/components/album/AlbumDetailTemplate";
import { EmptyState } from "@/components/ui/empty-state";
import { StatePlaceholder, StateSwitcher, useDemoState } from "@/components/ui/state-demo";
import { useMockLoading } from "@/hooks/use-mock-loading";

export const Route = createFileRoute("/app/album/$poolId")({
  head: () => ({
    meta: [
      { title: "卡冊詳情 — CU 女神卡" },
      { name: "description", content: "單一卡池的蒐集進度、十級完成度、女神完成度與卡牌格狀列表。" },
      { property: "og:title", content: "卡冊詳情 — CU 女神卡" },
      { property: "og:description", content: "卡池蒐集進度、等級與女神完成度、卡牌一覽。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AlbumDetail,
});

function AlbumDetail() {
  const { poolId } = useParams({ from: "/app/album/$poolId" });
  const [state, setState] = useDemoState();
  const loading = useMockLoading(420);
  const pool = poolById(poolId);

  if (!pool) {
    return (
      <EmptyState
        title="找不到這個卡池"
        description="卡池可能已下架，請回到卡冊總覽。"
        action={
          <Link to="/app/album" className="text-xs font-bold text-primary hover:underline">
            回到卡冊總覽 →
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <StateSwitcher state={state} onChange={setState} />
      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="此卡池尚無卡牌資料" />
      ) : (
        <AlbumDetailTemplate pool={pool} loading={loading} />
      )}
    </div>
  );
}
