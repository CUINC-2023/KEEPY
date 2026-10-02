import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CARDS,
  GRADES,
  OWNED_CARDS,
  goddessById,
  type Rarity,
} from "@/data/mock";
import { CardFrame } from "@/components/ui/card-frame";
import { FilterBar } from "@/components/ui/filter-bar";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCardGrid } from "@/components/ui/skeleton-block";
import { useMockLoading } from "@/hooks/use-mock-loading";
import { useToast } from "@/components/ui/toast";

export const Route = createFileRoute("/collection")({
  head: () => ({
    meta: [
      { title: "收藏圖鑑 — KEEPY" },
      { name: "description", content: "瀏覽你持有的女神卡、卡牌等級與成長進度。" },
      { property: "og:title", content: "收藏圖鑑 — KEEPY" },
      { property: "og:description", content: "瀏覽你持有的女神卡、卡牌等級與成長進度。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CollectionPage,
});

const OWN_FILTERS = [
  { key: "all", label: "全部" },
  { key: "owned", label: "已持有" },
  { key: "locked", label: "未持有" },
];

const GRADE_FILTERS: { key: Rarity | "all"; label: string }[] = [
  { key: "all", label: "全部等級" },
  ...[...GRADES].reverse().map((g) => ({ key: g, label: g })),
];

function CollectionPage() {
  const [own, setOwn] = useState("all");
  const [grade, setGrade] = useState<string>("all");
  const loading = useMockLoading();
  const { push } = useToast();

  const items = useMemo(() => {
    return CARDS.filter((c) => {
      const owned = OWNED_CARDS.some((o) => o.cardId === c.id);
      if (own === "owned" && !owned) return false;
      if (own === "locked" && owned) return false;
      if (grade !== "all" && c.grade !== grade) return false;
      return true;
    }).map((c) => ({ card: c, owned: OWNED_CARDS.find((o) => o.cardId === c.id) }));
  }, [own, grade]);

  const pct = Math.round((OWNED_CARDS.length / CARDS.length) * 100);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-wide">收藏圖鑑</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            已收集 {OWNED_CARDS.length} / {CARDS.length} 張卡牌
          </p>
        </div>
        <Progress value={pct} tone="gold" className="w-36 sm:w-48" showLabel label="完成度" />
      </header>

      <div className="space-y-2">
        <FilterBar filters={OWN_FILTERS} active={own} onChange={setOwn} />
        <FilterBar filters={GRADE_FILTERS} active={grade} onChange={setGrade} />
      </div>

      {loading ? (
        <SkeletonCardGrid count={6} />
      ) : items.length === 0 ? (
        <EmptyState
          title="沒有符合條件的卡牌"
          description="換個篩選條件試試，或前往卡池補齊圖鑑。"
          action={
            <Link to="/pools" className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
              查看卡池
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {items.map(({ card, owned }) => (
            <div key={card.id} className="min-w-0">
              <CardFrame
                goddess={goddessById(card.goddessId)}
                grade={card.grade}
                cardName={card.name}
                level={owned?.level}
                locked={!owned}
                onClick={
                  owned
                    ? () =>
                        push({
                          title: `${card.name} · Lv.${owned.level}`,
                          description: `重複卡 ${owned.dupes} 張 · 成長值 ${owned.growthPct}%（Demo）`,
                          tone: "gold",
                        })
                    : undefined
                }
              />
              {owned && (
                <Progress
                  className="mt-1.5"
                  value={owned.growthPct}
                  tone="gold"
                  label={`成長 ${owned.growthPct}%`}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
