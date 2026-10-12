import { useLocalTest } from "@/lib/local-test-client";
import { usePlayerUiText } from "@/lib/player-ui-text";
import { DemoFlowNote } from "@/components/player/DemoFlowNote";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { PLAYER, POINT_DEDUCT_NOTE } from "@/data/player";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "玩家中心 — KEEPY" },
      {
        name: "description",
        content: "KEEPY玩家模式：抽卡、卡冊、成長、合成、錢包與設定（Demo 原型）。",
      },
      { property: "og:title", content: "玩家中心 — KEEPY" },
      { property: "og:description", content: "抽卡、卡冊、卡牌成長與隨機合成的玩家核心流程原型。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlayerLayout,
});

const SUB_NAV = [
  { to: "/app/reading" as const, label: "稍後閱讀", prefix: "/app/reading" },
  { to: "/app/tasks" as const, label: "探索任務", prefix: "/app/tasks" },
  { to: "/app" as const, label: "玩家首頁", exact: true, prefix: "/app" },
  {
    to: "/app/draw/$poolId" as const,
    label: "抽卡",
    params: { poolId: "p-uniform" },
    prefix: "/app/draw",
  },
  { to: "/app/collection" as const, label: "收藏進度與展示", prefix: "/app/collection" },
  { to: "/app/album" as const, label: "我的卡冊", prefix: "/app/album" },
  { to: "/app/growth" as const, label: "指定卡成長", prefix: "/app/growth" },
  { to: "/app/synthesis" as const, label: "隨機合成", prefix: "/app/synthesis" },
  { to: "/app/wallet" as const, label: "錢包", prefix: "/app/wallet" },
  { to: "/app/history" as const, label: "紀錄", prefix: "/app/history" },
  { to: "/app/settings" as const, label: "設定", prefix: "/app/settings" },
];

function PlayerLayout() {
  const local = useLocalTest();
  const tx = usePlayerUiText();
  const pathname = useLocation().pathname;
  return (
    <div className="space-y-5">
      <div className="panel flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/50 text-xs font-black text-primary-foreground">
            {local.enabled ? "TEST" : PLAYER.level}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black">
              {local.enabled ? (local.summary?.user.id ?? "No session") : PLAYER.name}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Lv.{local.enabled ? "TEST" : PLAYER.level}
              {tx("・玩家模式")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span className="rounded-full border border-gold/40 px-2.5 py-1 text-gold">
            {local.enabled ? "TEST KP" : tx("付費點數")}
            {(local.enabled
              ? (local.summary?.user.balance ?? 0)
              : PLAYER.paidPoints
            ).toLocaleString()}
          </span>
          <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
            {local.enabled ? "Bonus fixture KP" : tx("贈送點數")}
            {(local.enabled ? 0 : PLAYER.freePoints).toLocaleString()}
          </span>
          <span className="demo-chip">
            {local.enabled
              ? "TEST KP only · atomic server debit · no real money"
              : tx(POINT_DEDUCT_NOTE)}
          </span>
        </div>
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {SUB_NAV.map((n) => {
          const active = n.exact
            ? pathname === "/app" || pathname === "/app/"
            : pathname.startsWith(n.prefix);
          return (
            <Link
              key={tx(n.label)}
              to={n.to}
              params={n.params as never}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "border-primary/50 bg-primary/15 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tx(n.label)}
            </Link>
          );
        })}
      </div>

      {!local.enabled && <DemoFlowNote />}
      <Outlet />
    </div>
  );
}
