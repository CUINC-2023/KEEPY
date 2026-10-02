import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  CARDS,
  GODDESSES,
  POOLS,
  SPLIT_POLICY_NOTE,
  SPLIT_SOURCE_NOTE,
  goddessById,
} from "@/data/mock";
import { CardFrame } from "@/components/ui/card-frame";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { StatusTag } from "@/components/ui/status-tag";
import { StatCard } from "@/components/ui/stat-card";
import { PoolStatusTag } from "@/components/ui/pool-cover";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/goddesses/$goddessId")({
  loader: ({ params }) => {
    const g = GODDESSES.find((x) => x.id === params.goddessId);
    if (!g) throw notFound();
    return { name: g.name, title: g.title, intro: g.intro };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "找不到女神 — KEEPY" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.name}・${loaderData.title} — KEEPY`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.intro },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.intro },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <EmptyState
      icon="✦"
      title="找不到這位女神"
      description="檔案可能已下架或連結有誤。"
      action={
        <Link to="/goddesses" className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
          回到女神列表
        </Link>
      }
    />
  ),
  component: GoddessPublicPage,
});

function GoddessPublicPage() {
  const { goddessId } = Route.useParams();
  const g = goddessById(goddessId);
  const cards = CARDS.filter((c) => c.goddessId === g.id);
  const pools = POOLS.filter((p) => g.poolIds.includes(p.id));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/goddesses" className="hover:text-foreground">女神列表</Link>
        <span>/</span>
        <span className="text-foreground">{g.name}</span>
      </div>

      <section className="panel panel-glow grid gap-6 p-5 sm:p-8 md:grid-cols-[180px_minmax(0,1fr)]">
        <div className="mx-auto w-40 md:w-full">
          <CardFrame goddess={g} level={g.level} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <RarityBadge rarity={g.grade} />
            <StatusTag tone={g.status === "live" ? "live" : g.status === "pending" ? "pending" : "resting"} />
            <span className="demo-chip">Demo</span>
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-wide sm:text-3xl">{g.name}</h1>
          <p className="mt-1 text-sm text-gold">{g.title}</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{g.intro}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {g.tags.map((t) => (
              <span key={t} className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-semibold">
                #{t}
              </span>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="代表卡等級" value={g.grade} tone="gold" />
            <StatCard label="女神等級" value={`Lv.${g.level}`} tone="violet" />
            <StatCard label="支持人數" value={g.supporters.toLocaleString()} />
            <StatCard label="出道日" value={g.debutAt} />
          </div>
        </div>
      </section>

      <section className="panel hairline-gold p-5">
        <h2 className="font-black">合作與分潤說明</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {SPLIT_POLICY_NOTE}，本頁不顯示任何未核定比例。{SPLIT_SOURCE_NOTE}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="demo-chip mr-1.5">Demo</span>所有資料皆為原型示意。
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-black tracking-widest text-muted-foreground">好感度</h2>
        <div className="panel p-5">
          <Progress value={g.affinity} tone="violet" showLabel label="玩家平均好感度（Mock）" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-black tracking-widest text-muted-foreground">參與卡池</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {pools.map((p) => (
            <Link key={p.id} to="/pools/$poolId" params={{ poolId: p.id }} className="panel hover-lift p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-black">{p.name}</span>
                <PoolStatusTag status={p.status} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                {p.startAt} — {p.endAt}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-black tracking-widest text-muted-foreground">卡牌一覽</h2>
        {cards.length === 0 ? (
          <EmptyState title="尚未發行卡牌" description="此女神的卡牌將於下一波卡池公開。" />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {cards.map((c) => (
              <CardFrame key={c.id} goddess={g} grade={c.grade} cardName={c.name} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
