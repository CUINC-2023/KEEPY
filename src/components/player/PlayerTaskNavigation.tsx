import { Link, useLocation } from "@tanstack/react-router";
import { useDiscoveryText } from "@/lib/discovery-copy";
const groups = [
  {
    id: "discover",
    zh: "探索",
    en: "Discover",
    items: [
      { to: "/app/reading", zh: "稍後閱讀", en: "Read later" },
      { to: "/app/tasks", zh: "探索任務", en: "Discovery tasks" },
    ],
  },
  {
    id: "collect",
    zh: "收藏",
    en: "Collect",
    items: [
      { to: "/app/collection", zh: "收藏總覽", en: "Collection overview" },
      { to: "/app/album", zh: "卡冊", en: "Albums" },
      { to: "/app/achievements", zh: "已取得成就", en: "Earned achievements" },
    ],
  },
  {
    id: "play",
    zh: "遊玩",
    en: "Play",
    items: [
      { to: "/app/play", zh: "五玩法與練習", en: "Five games & practice" },
      { to: "/app/mistakes", zh: "本人錯題", en: "My mistakes" },
      { to: "/app/progress-compare", zh: "練習比較", en: "Practice comparison" },
    ],
  },
  {
    id: "organize",
    zh: "整理",
    en: "Organize",
    items: [
      { to: "/app/collection-index", zh: "私人索引", en: "Private index" },
      { to: "/app/notes", zh: "私人筆記", en: "Private notes" },
      { to: "/app/planning", zh: "私人規劃", en: "Private planning" },
      { to: "/app/recap", zh: "期間回顧", en: "Period recap" },
    ],
  },
  {
    id: "showcase",
    zh: "展示",
    en: "Showcase",
    items: [
      { to: "/app/curations", zh: "私人策展", en: "Private curations" },
      {
        to: "/app/settings/privacy",
        zh: "公開設定與匿名預覽",
        en: "Public settings & anonymous preview",
      },
      { to: "/app/rankings", zh: "本人排行資格", en: "My ranking eligibility" },
    ],
  },
  {
    id: "account",
    zh: "帳號與預覽",
    en: "Account & previews",
    items: [
      { to: "/app", zh: "本人首頁", en: "My home" },
      { to: "/app/settings", zh: "本人設定", en: "My settings" },
      { to: "/app/wallet", zh: "TEST KP", en: "TEST KP" },
      { to: "/app/history", zh: "取得與帳務紀錄", en: "Acquisition & ledger history" },
      { to: "/app/levels", zh: "玩家候選等級", en: "Player level candidates" },
      { to: "/app/participation-level", zh: "平台候選階段", en: "Participation candidates" },
      { to: "/app/growth", zh: "卡牌成長預覽", en: "Card growth preview" },
      { to: "/app/synthesis", zh: "合成預覽", en: "Synthesis preview" },
    ],
  },
] as const;
export function PlayerTaskNavigation() {
  const t = useDiscoveryText(),
    path = useLocation().pathname.replace(/\/$/, "");
  const current = groups
    .map((g) =>
      g.items.find((i) => path === i.to || (i.to !== "/app" && path.startsWith(i.to + "/"))),
    )
    .filter((i) => i !== undefined)
    .sort((a, b) => b.to.length - a.to.length)[0];
  return (
    <nav
      aria-label={t("玩家功能分組", "Player task groups")}
      className="space-y-2"
      data-player-task-navigation
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {t("目前位置：", "Current location: ")}
        {current ? t(current.zh, current.en) : t("玩家工作區", "Player workspace")}
      </p>
      <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {groups.map((g) => (
          <details
            key={g.id + path}
            open={g.items.some((i) => i.to === current?.to)}
            className="min-w-0 rounded-xl border border-border"
          >
            <summary className="min-h-11 cursor-pointer p-3 text-sm font-semibold">
              {t(g.zh, g.en)}
            </summary>
            <ul className="space-y-1 px-2 pb-2">
              {g.items.map((i) => (
                <li key={i.to}>
                  <Link
                    to={i.to}
                    activeOptions={{ exact: true }}
                    aria-current={current?.to === i.to ? "page" : undefined}
                    className={
                      "flex min-h-11 items-center rounded-lg px-2 py-2 text-sm " +
                      (current?.to === i.to
                        ? "bg-primary/15 font-bold text-foreground"
                        : "text-muted-foreground hover:bg-muted")
                    }
                  >
                    {t(i.zh, i.en)}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </nav>
  );
}
