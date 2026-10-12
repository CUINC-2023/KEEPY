import { useLocalTest } from "@/lib/local-test-client";
import { CollectionPage } from "@/components/collection/CollectionViews";
import { usePlayerUiText } from "@/lib/player-ui-text";
import { useDemoPlayer, demoPhysicalEligible } from "@/lib/demo-player-store";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PLAYER, goddessOf } from "@/data/player";
import { POOLS } from "@/data/mock";
import { ACTIVITIES } from "@/data/public-hub";
import {
  COMPLETED_ACHIEVEMENTS,
  PLAYER_NOTIFICATIONS,
  achievementProgress,
} from "@/data/player-profile";
import { selfRanks } from "@/data/leaderboard";
import { DEFAULT_PUBLIC_PROFILE, readPublicProfile } from "@/data/public-profile-settings";
import { useEffect, useState } from "react";
import { CardFrame } from "@/components/ui/card-frame";
import { CardDetailLink } from "@/components/card/CardDetailLink";
import { Progress } from "@/components/ui/progress";
import { PoolCover, PoolStatusTag } from "@/components/ui/pool-cover";
import { TextStatus } from "@/components/public/PublicPage";
import { Button } from "@/components/ui/button";
import { useDemoState } from "@/components/ui/state-demo-shared";
import { StatePlaceholder, StateSwitcher } from "@/components/ui/state-demo";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "玩家私人儀表板 — KEEPY 創作者收藏卡平台" },
      {
        name: "description",
        content: "查看點數、當季卡冊、收藏任務、實體典藏資格與近期通知的 Local Mock。",
      },
      { property: "og:title", content: "玩家私人儀表板 — KEEPY 創作者收藏卡平台" },
      { property: "og:description", content: "玩家專屬收藏進度、卡牌成長與近期提醒。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlayerHome,
});

const ACTIONS = [
  { label: "我的卡冊", to: "/app/album" as const, note: "6 本卡冊" },
  { label: "成就與徽章", to: "/app/achievements" as const, note: "已取得徽章 · Local Mock" },
  { label: "卡牌成長", to: "/app/growth" as const, note: "Local Mock" },
  { label: "合成工坊", to: "/app/synthesis" as const, note: "Demo／待定" },
  { label: "實體典藏", to: "/physical-collection" as const, note: "資格／進度 Mock" },
  { label: "抽卡／消費紀錄", to: "/app/history" as const, note: "Demo 紀錄" },
  { label: "公開頁設定", to: "/app/settings/privacy" as const, note: "Local Mock" },
  { label: "玩家設定", to: "/app/settings" as const, note: "本機設定" },
];

function PlayerHome() {
  const local = useLocalTest();
  const tx = usePlayerUiText();
  const { album, progress: ALL_POOL_PROGRESS } = useDemoPlayer();
  const RECENT_CARDS = album
    .filter((c) => c.owned)
    .sort((a, b) => (b.obtainedAt ?? "").localeCompare(a.obtainedAt ?? ""))
    .slice(0, 6);
  const [state, setState] = useDemoState();
  const [profile, setProfile] = useState(DEFAULT_PUBLIC_PROFILE);
  useEffect(() => setProfile(readPublicProfile()), []);
  const ranks = selfRanks(
    profile.displayName || DEFAULT_PUBLIC_PROFILE.displayName,
    profile.isPublic,
    profile.showRanking,
  );
  const upgradable = album.filter((c) => c.owned && c.growthPct >= 100);
  const season =
    ALL_POOL_PROGRESS.find((item) => item.poolId === "p-summer") ?? ALL_POOL_PROGRESS[0];
  const nearAchievements = COMPLETED_ACHIEVEMENTS.slice(0, 3);
  const physical = album.filter(demoPhysicalEligible).slice(0, 4);
  const endingPools = POOLS.filter((item) => item.status === "live" && item.id !== "p-uniform");
  const endingActivities = ACTIVITIES.filter((item) => item.status === "進行中");
  const totalPoints = PLAYER.paidPoints + PLAYER.freePoints;

  if (local.enabled) return <CollectionPage />;
  return (
    <div className="space-y-6 overflow-x-clip">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-black text-gold">PLAYER PRIVATE DASHBOARD</p>
          <h1 className="mt-1 text-2xl font-black">
            {tx("晚上好，")}
            {PLAYER.name}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {tx("私人儀表板 · 全部資料為 Local Mock")}
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/app/preview/collector">{tx("本人預覽公開頁")}</Link>
        </Button>
      </div>
      <StateSwitcher state={state} onChange={setState} />
      {state !== "ok" ? (
        <StatePlaceholder
          state={state}
          emptyTitle={tx("目前沒有玩家摘要")}
          emptyDescription={tx("這是私人儀表板的 Demo 狀態畫面。")}
        />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="panel p-4">
              <p className="text-[11px] text-muted-foreground">{tx("剩餘點數（Demo）")}</p>
              <p className="mt-1 text-2xl font-black text-gold">{totalPoints.toLocaleString()}</p>
              <p className="mt-2 text-[10px] text-muted-foreground">
                {tx("付費")}
                {PLAYER.paidPoints.toLocaleString()}
                {tx("· 贈送")} {PLAYER.freePoints.toLocaleString()}
                <br />
                {tx("扣抵順序 Demo／待定")}
              </p>
            </div>
            <div className="panel p-4">
              <p className="text-[11px] text-muted-foreground">{tx("收藏等級")}</p>
              <p className="mt-1 text-2xl font-black">Lv.{PLAYER.level}</p>
              <p className="mt-2 text-[10px] text-muted-foreground">{tx("經驗公式 Demo／待定")}</p>
            </div>
            <div className="panel p-4">
              <p className="text-[11px] text-muted-foreground">{tx("總榜名次")}</p>
              <p className="mt-1 text-2xl font-black">
                {ranks.total ? tx(`第 ${ranks.total} 名`) : tx("未列入")}
              </p>
              <p className="mt-2 text-[10px] text-muted-foreground">{tx("排行公式 Demo／待定")}</p>
            </div>
            <div className="panel p-4">
              <p className="text-[11px] text-muted-foreground">{tx("未讀通知")}</p>
              <p className="mt-1 text-2xl font-black text-gold">{PLAYER_NOTIFICATIONS.length}</p>
              <p className="mt-2 text-[10px] text-muted-foreground">
                {tx("僅本機示意，不會真的通知")}
              </p>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
            <div className="panel p-5">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-[11px] font-black text-gold">SEASON ALBUM</p>
                  <h2 className="text-lg font-black">{tx("當季卡冊完成度")}</h2>
                </div>
                {season ? (
                  <span className="text-2xl font-black text-gold">{season.pct}%</span>
                ) : null}
              </div>
              {season ? (
                <>
                  <Progress
                    className="mt-5"
                    value={season.owned}
                    max={season.total}
                    showLabel
                    label={`${season.poolName} ${season.owned}/${season.total}`}
                    tone="gold"
                  />
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-muted/60 p-3">
                      <p className="text-lg font-black">{season.owned}</p>
                      <p className="text-[10px] text-muted-foreground">{tx("已取得")}</p>
                    </div>
                    <div className="rounded-md bg-muted/60 p-3">
                      <p className="text-lg font-black">{season.total - season.owned}</p>
                      <p className="text-[10px] text-muted-foreground">{tx("待蒐集")}</p>
                    </div>
                    <div className="rounded-md bg-muted/60 p-3">
                      <p className="text-lg font-black">{season.newCount}</p>
                      <p className="text-[10px] text-muted-foreground">{tx("近期新卡")}</p>
                    </div>
                  </div>
                </>
              ) : null}
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/app/album">{tx("前往我的卡冊")}</Link>
              </Button>
            </div>
            <div className="panel p-5">
              <p className="text-[11px] font-black text-gold">RANKING</p>
              <h2 className="text-lg font-black">{tx("代表性卡池榜")}</h2>
              <p className="mt-5 text-xs text-muted-foreground">
                {ranks.poolName}
                {tx("收藏榜")}
              </p>
              <p className="mt-1 text-3xl font-black text-gold">
                {ranks.pool ? tx(`第 ${ranks.pool} 名`) : tx("未列入")}
              </p>
              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                {tx("不顯示消費金額；同分與計分規則 Demo／待定。")}
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/leaderboards">{tx("查看排行榜")}</Link>
              </Button>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-lg font-black">{tx("快速入口")}</h2>
              <span className="text-[11px] text-muted-foreground">
                {tx("未完成項目均標示 Demo／待定")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {ACTIONS.map((item) => (
                <Link
                  key={tx(item.label)}
                  to={item.to}
                  className="panel min-w-0 p-4 transition-colors hover:border-primary/40"
                >
                  <p className="text-sm font-black">{item.label}</p>
                  <p className="mt-2 text-[10px] text-muted-foreground">{tx(item.note)}</p>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-black">{tx("最近取得卡牌")}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {RECENT_CARDS.map((card) => (
                <div key={card.id} className="min-w-0">
                  <Link
                    to="/app/cards/$cardId"
                    params={{ cardId: card.id }}
                    className="block min-w-0"
                  >
                    <CardFrame goddess={goddessOf(card)} grade={card.grade} cardName={card.name} />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="truncate text-[11px] font-bold">{card.name}</p>
                      <TextStatus tone="live">{tx("新卡")}</TextStatus>
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {tx("取得")}
                      {card.obtainedAt}
                    </p>
                  </Link>
                  <CardDetailLink name={card.name} grade={card.grade} />
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="panel p-5">
              <div className="flex items-end justify-between">
                <h2 className="text-lg font-black">{tx("已取得成就")}</h2>
                <span className="demo-chip">Local Mock</span>
              </div>
              <div className="mt-4 space-y-4">
                {nearAchievements.map((item) => (
                  <div key={item.id}>
                    <div className="flex justify-between gap-3">
                      <p className="text-sm font-bold">{item.title}</p>
                      <span className="text-xs tabular-nums text-gold">
                        {item.id === "a-pool-top100"
                          ? tx(`最佳卡池第 ${item.current} 名`)
                          : `${item.current}/${item.target}`}
                      </span>
                    </div>
                    <Progress className="mt-2" value={achievementProgress(item)} tone="gold" />
                    <p className="mt-1 text-[10px] text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] text-muted-foreground">
                {tx("本機示意已取得項目；Local Test 成就以本人服務端保存資料為準。")}
              </p>
            </div>
            <div className="panel p-5">
              <div className="flex items-end justify-between">
                <h2 className="text-lg font-black">{tx("可升級卡牌")}</h2>
                <TextStatus tone="live">
                  {upgradable.length}
                  {tx("張可升級")}
                </TextStatus>
              </div>
              <div className="mt-4 space-y-3">
                {upgradable.slice(0, 3).map((card) => (
                  <div
                    key={card.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border pb-3 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{card.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {card.grade}
                        {tx("· 重複卡")}
                        {card.dupes}
                        {tx("張 · 成長值")}
                        {card.growthPct}%
                      </p>
                    </div>
                    <TextStatus tone="gold">{tx("可升級")}</TextStatus>
                  </div>
                ))}
              </div>
              <Button asChild size="sm" className="mt-4">
                <Link to="/app/growth">{tx("前往升級（Demo）")}</Link>
              </Button>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-lg font-black">{tx("實體典藏資格")}</h2>
              <Button asChild size="sm" variant="outline">
                <Link to="/physical-collection">{tx("查看實體典藏")}</Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {physical.map((item) => (
                <article key={item.id} className="panel p-5">
                  <div className="flex flex-wrap justify-between gap-2">
                    <TextStatus tone="gold">{tx("資格／進度 Mock")}</TextStatus>
                    <span className="text-xs font-bold text-gold">{item.grade}</span>
                  </div>
                  <h3 className="mt-3 font-black">{item.name}</h3>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.poolName} · {tx("持有")} {item.dupes + 1}
                  </p>
                  <p className="mt-3 text-[10px] text-muted-foreground">
                    {tx("V1 僅為資格／進度 Mock，不執行真實兌換或履約。")}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div>
              <h2 className="mb-3 text-lg font-black">{tx("即將結束")}</h2>
              <div className="space-y-3">
                {endingPools.map((pool) => (
                  <article
                    key={pool.id}
                    className="panel grid grid-cols-[92px_minmax(0,1fr)] overflow-hidden"
                  >
                    <PoolCover pool={pool} className="h-full min-h-28" />
                    <div className="min-w-0 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black">{pool.name}</p>
                        <PoolStatusTag status={pool.status} />
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {tx("期間至")}
                        {pool.endAt}
                        {tx("· 狀態以卡池頁為準")}
                      </p>
                      <Button asChild size="sm" variant="outline" className="mt-3">
                        <Link to="/pools/$poolId" params={{ poolId: pool.id }}>
                          {tx("查看卡池")}
                        </Link>
                      </Button>
                    </div>
                  </article>
                ))}
                {endingActivities.map((item) => (
                  <article key={item.id} className="panel p-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="font-black">{item.title}</p>
                      <TextStatus tone="live">{item.status}</TextStatus>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {item.period} · {item.subtitle}
                    </p>
                  </article>
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-3 text-lg font-black">{tx("未讀通知")}</h2>
              <div className="panel divide-y divide-border">
                {PLAYER_NOTIFICATIONS.map((item) => (
                  <div key={item.id} className="p-4">
                    <div className="flex items-center gap-2">
                      <TextStatus>{item.type}</TextStatus>
                      <p className="text-sm font-bold">{item.title}</p>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                {tx("Local Mock · 不會真的發送或標記已讀。")}
              </p>
            </div>
          </section>

          <p className="border-t border-border pt-5 text-[11px] leading-relaxed text-muted-foreground">
            {tx(
              "私人儀表板不顯示消費金額、完整抽卡紀錄、收件資料或地址；所有操作皆為 Local Mock。",
            )}
          </p>
        </>
      )}
    </div>
  );
}
