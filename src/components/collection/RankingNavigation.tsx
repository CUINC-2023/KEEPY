import { Link } from "@tanstack/react-router";
import { useDiscoveryText } from "@/lib/discovery-copy";
export function RankingNavigation() {
  const t = useDiscoveryText();
  return (
    <nav
      data-ranking-navigation
      aria-label={t("三榜共同導覽", "Navigation across three rankings")}
      className="flex flex-wrap gap-3 rounded-xl border p-3"
    >
      {(
        [
          ["total", t("總榜", "Total")],
          ["season", t("賽季榜", "Season")],
          ["album", t("卡冊榜", "Album")],
        ] as const
      ).map(([id, label]) => (
        <Link key={id} className="text-primary underline" to="/leaderboards" hash={"ranking-" + id}>
          {label}
        </Link>
      ))}
      <Link className="text-primary underline" to="/app/rankings">
        {t("本人資格與定位", "Your eligibility and location")}
      </Link>
      <p className="basis-full text-xs text-muted-foreground">
        {t(
          "三榜各保留自己的期間／分母與規則版本；正式榜排除synthetic，不以候選XP、儲值或私人偏好計分。",
          "Each board retains its own period, denominator and rule version. Formal boards exclude synthetic data and never score candidate XP, spending or private preferences.",
        )}
      </p>
    </nav>
  );
}
