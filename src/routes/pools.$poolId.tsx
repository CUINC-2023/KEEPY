import { PoolDescription } from "@/components/public/EditableText";
import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import {
  GRADES,
  SPLIT_SOURCE_NOTE,
  cardsByPool,
  goddessById,
  poolById,
  poolCollectProgress,
} from "@/data/mock";
import { CardFrame } from "@/components/ui/card-frame";
import { CardDetailLink } from "@/components/card/CardDetailLink";
import { PoolCover, POOL_STATUS_LABEL } from "@/components/ui/pool-cover";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCardGrid } from "@/components/ui/skeleton-block";
import { useMockLoading } from "@/hooks/use-mock-loading";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/layout/AppShell";
import { KEEPY_SAMPLE_NOTE, KEEPY_SAMPLE_POOL_ID } from "@/data/keepy-sample";
import { missingCardDisplay, useAlbumVisibility } from "@/lib/album-visibility";
import { resolveCardDetail } from "@/data/card-detail";

export const Route = createFileRoute("/pools/$poolId")({
  loader: ({ params }) => {
    const pool = poolById(params.poolId);
    if (!pool) throw notFound();
    return { poolName: pool.name, poolDesc: pool.description };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "找不到卡池 — CU 女神卡" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.poolName} 卡池 — KEEPY`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.poolDesc },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.poolDesc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: PoolNotFound,
  component: PoolDetailPage,
});

function PoolNotFound() {
  return (
    <EmptyState
      icon="✦"
      title="找不到這個卡池"
      description="卡池可能已下架或連結有誤。"
      action={
        <Link to="/pools" className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
          回到卡池一覽
        </Link>
      }
    />
  );
}

function PoolDetailPage() {
  const { poolId } = Route.useParams();
  const pool = poolById(poolId)!;
  const cards = cardsByPool(poolId);
  const progress = poolCollectProgress(poolId);
  const loading = useMockLoading();
  const { requireLogin } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const visibility = useAlbumVisibility();

  const [reminded, setReminded] = useState(false);
  const drawable = pool.status === "live";
  const specimen = pool.id === KEEPY_SAMPLE_POOL_ID;
  const onDraw = () =>
    requireLogin(() => navigate({ to: "/app/draw/$poolId", params: { poolId: pool.id } }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/pools" className="hover:text-foreground">卡池</Link>
        <span>/</span>
        <span className="text-foreground">{pool.name}</span>
      </div>

      <PoolCover pool={pool} tall />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <section className="panel p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black">{pool.name}</h1>
              <span className="demo-chip">Demo</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <PoolDescription poolId={pool.id} />
            </p>
            {specimen && <p className="mt-3 rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm font-bold text-gold">{KEEPY_SAMPLE_NOTE} <Link to="/faq" className="underline">查看 FAQ</Link></p>}
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Meta label="狀態" value={specimen ? "範例／非正式上架" : POOL_STATUS_LABEL[pool.status]} />
              <Meta label="期間" value={`${pool.startAt} — ${pool.endAt}`} />
              <Meta label="卡牌數" value={`${pool.cardCount} 張`} />

              <Meta label={specimen ? "卡面人物" : "參與女神"} value={specimen ? "虛構示意，非合作創作者" : `${pool.goddessIds.length} 位`} />
            </div>
          </section>

          {/* 參與女神 */}
          {!specimen && <section className="panel p-5">
            <h2 className="text-sm font-black tracking-widest text-muted-foreground">參與女神</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {pool.goddessIds.map((id) => {
                const g = goddessById(id);
                 return (
                  <Link
                    key={id}
                    to="/goddesses/$goddessId"
                    params={{ goddessId: id }}
                    className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted"
                  >
                    <RarityBadge rarity={g.grade} />
                    {g.name}
                  </Link>
                );
              })}
            </div>
          </section>}

          {/* 卡牌一覽 */}
          <section>
            <div className="mb-3">
              <h2 className="text-sm font-black tracking-widest text-muted-foreground">卡牌一覽</h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                 {specimen ? `以下 ${cards.length} 張皆為虛構卡面示例，並非已上架商品。` : `以下為 ${cards.length} 張範例卡面，其餘為卡位範本；此區不計入卡冊完成率分母。`}
              </p>
            </div>
            {loading ? (
              <SkeletonCardGrid count={5} />
            ) : cards.length === 0 ? (
              <EmptyState title="此卡池尚未公開卡牌" description="卡牌將於開池前公布。" />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {cards.map((c) => {
                  const owned = resolveCardDetail(c.id)?.owned ?? false;
                  const display = missingCardDisplay(visibility, c.poolId, c.grade);
                  const hidden = !owned && display === "silhouette";
                  return <div key={c.id} className="min-w-0">
                    <CardFrame
                      goddess={goddessById(c.goddessId)}
                      grade={c.grade}
                      cardName={hidden ? "未公開卡面" : c.name}
                      art={hidden ? undefined : c.art}
                      locked={!owned}
                      missingDisplay={display}
                    />
                    {hidden ? <p className="mt-2 text-xs text-muted-foreground">卡面已隱藏 · Local Mock</p> : <CardDetailLink name={c.name} grade={c.grade} />}
                  </div>;
                })}
              </div>
            )}
          </section>
        </div>

        {/* 側欄：價格、機率、保底、進度、CTA */}
        <div className="space-y-4">
          {!specimen && <section className="panel hairline-gold p-5">
            <h2 className="text-sm font-black tracking-widest text-gold">抽卡價格</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
                <span className="font-semibold">單抽</span>
                <span className="font-black tabular-nums">
                  {pool.singlePricePoints.toLocaleString()} 點
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
                <span className="font-semibold">十抽送一抽（Demo）</span>
                <span className="font-black tabular-nums">
                  {pool.tenPricePoints.toLocaleString()} 點
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {pool.pointsPriceNote}。原型不進行真實付款。
            </p>

            <div className="my-4 shimmer-line" />

            <h2 className="text-sm font-black tracking-widest text-gold">等級機率</h2>
            <div className="mt-3 space-y-1.5">
              {[...pool.rates]
                .sort((a, b) => GRADES.indexOf(b.grade) - GRADES.indexOf(a.grade))
                .map((r) => (
                  <div key={r.grade} className="flex items-center gap-2 text-xs">
                    <RarityBadge rarity={r.grade} className="w-12 justify-center" />
                    <Progress
                      className="min-w-0 flex-1"
                      value={r.pct}
                      max={25}
                      tone="gold"
                    />
                    <span className="w-14 text-right font-bold tabular-nums">{r.pct}%</span>
                  </div>
                ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              機率總和 100%，數值為 Mock 示意。
            </p>
          </section>}

          {!specimen && <section className="panel p-5">
            <h2 className="text-sm font-black tracking-widest text-muted-foreground">保底說明</h2>
            <p className="mt-2 text-xs font-bold text-gold">正式規則待核定</p>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              {pool.pityNote.map((n, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-gold">◆</span>
                  {n}
                </li>
              ))}
            </ul>
            <Link
              to="/rules"
              className="mt-3 inline-block text-xs font-semibold text-primary hover:underline"
            >
              查看完整規則 →
            </Link>
            <Link
              to="/leaderboards"
              search={{ view: "pool", pool: pool.id }}
              className="mt-3 ml-4 inline-block text-xs font-semibold text-primary hover:underline"
            >
              查看此卡池排行榜 →
            </Link>
          </section>}

          {!specimen && <section className="panel p-5">
            <h2 className="text-sm font-black tracking-widest text-muted-foreground">
              我的蒐集進度
            </h2>
            <Progress
              className="mt-3"
              value={progress.owned}
              max={Math.max(1, progress.total)}
              tone="gold"
              showLabel
              label={`${progress.owned} / ${progress.total} 張（卡冊完整總數，完成率 ${progress.pct}%）`}
            />
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              完成率以卡冊完整總數 {pool.cardCount} 張計算，與上方範例卡面數量無關。
            </p>
          </section>}

          <div className="space-y-2">
            {specimen ? <p className="rounded-xl border border-gold/40 p-4 text-sm font-bold text-gold">{KEEPY_SAMPLE_NOTE}</p> : <button
              onClick={onDraw}
              disabled={!drawable}
              className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/70 py-3.5 text-sm font-black text-primary-foreground shadow-[0_10px_30px_-10px_var(--primary)] transition-transform hover:scale-[1.01] disabled:opacity-40 disabled:hover:scale-100"
            >
              {pool.status === "live"
                ? "前往抽卡（Demo）"
                : pool.status === "upcoming"
                  ? `${pool.startAt} 開池（尚不可抽卡）`
                  : "卡池已結束（不可抽卡）"}
            </button>}
            {!specimen && pool.status === "upcoming" && (
              <>
                <p className="text-center text-xs font-bold text-gold tabular-nums">
                  距開池約 {daysUntil(pool.startAt)} 天
                </p>
                <button
                  onClick={() => {
                    setReminded(true);
                    push({
                      title: "已加入開池提醒（Demo）",
                      description: "原型不會真的訂閱，也不會寄送任何通知或推播。",
                      tone: "gold",
                    });
                  }}
                  className="w-full rounded-xl border border-gold/40 py-2.5 text-xs font-bold text-gold hover:bg-gold/10"
                >
                  {reminded ? "已加入提醒（Demo，不寄送通知）" : "提醒我（Demo）"}
                </button>
              </>
            )}
            {pool.status === "ended" && (
              <>
                <p className="text-center text-xs text-muted-foreground">
                  此卡池已結束，卡牌不再發行，僅保留於玩家收藏。
                </p>
                <Link
                  to="/app/album/$poolId"
                  params={{ poolId: pool.id }}
                  className="block rounded-xl border border-border py-2.5 text-center text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  查看此卡池卡冊 →
                </Link>
              </>
            )}
            <p className="text-[11px] leading-relaxed text-muted-foreground">{specimen ? KEEPY_SAMPLE_NOTE : SPLIT_SOURCE_NOTE}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}

/** Demo 倒數：以固定基準日計算，不使用真實時間 */
function daysUntil(dateStr: string) {
  const base = new Date("2026-09-20T00:00:00Z").getTime();
  const target = new Date(`${dateStr.replaceAll("/", "-")}T00:00:00Z`).getTime();
  if (Number.isNaN(target)) return 0;
  return Math.max(0, Math.round((target - base) / 86400000));
}
