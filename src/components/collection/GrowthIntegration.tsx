import { Link } from "@tanstack/react-router";
import type { CollectionMe, CollectionCatalogue } from "@/lib/collection-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { PlayerLevelPreview } from "./PlayerLevelPreview";
import { PlatformLevelPreview } from "./PlatformLevelPreview";
export function GrowthIntegration({
  me,
  catalogue,
}: {
  me: CollectionMe;
  catalogue: CollectionCatalogue;
}) {
  const t = useDiscoveryText();
  const choices = me.profile.data.growthPreview;
  return (
    <section data-growth-integration className="space-y-4">
      <h2 className="text-xl font-bold">
        {t(
          "成長與展示：來源分開，公開由你選擇",
          "Growth and showcase: separate sources, your sharing choices",
        )}
      </h2>
      <div className="grid gap-4 xl:grid-cols-2">
        <PlayerLevelPreview key={"player-" + me.actorId} me={me} catalogue={catalogue} />
        <PlatformLevelPreview key={"platform-" + me.actorId} me={me} />
      </div>
      <p className="text-sm" data-growth-sharing-state>
        {t("已保存公開選擇", "Saved sharing choices")}: {t("玩家", "Player")}{" "}
        {choices?.player ? t("勾選", "selected") : t("私人", "private")} · {t("平台", "Platform")}{" "}
        {choices?.platform ? t("勾選", "selected") : t("私人", "private")} ·{" "}
        {me.profile.data.isPublic
          ? t("公開頁已啟用", "Public page enabled")
          : t("公開頁未啟用，摘要仍私人", "Public page disabled; summaries remain private")}
      </p>
      <nav className="flex flex-wrap gap-4">
        <Link to="/app/levels" className="text-primary underline">
          {t("玩家來源與階段", "Player sources and stages")}
        </Link>
        <Link to="/app/participation-level" className="text-primary underline">
          {t("平台來源與階段", "Platform sources and stages")}
        </Link>
        {me.awards.length > 0 && (
          <Link to="/app/achievements" className="text-primary underline">
            {t("回顧已取得成就", "Revisit earned achievements")}
          </Link>
        )}
        <Link to="/app/settings/privacy" className="text-primary underline">
          {t("編輯展示並預覽公开範圍", "Edit showcase and preview public scope")}
        </Link>
      </nav>
      <p className="text-sm text-muted-foreground">
        {t(
          "等級候選、已取得成就、卡牌成長與稀有度分別記錄。修改或停用公開選擇後，由相同服務端投影重新讀取，沒有跨裝置真人等級。",
          "Candidate levels, earned achievements, card growth and rarity stay separate. Updated or disabled sharing is read from the same server projection. No real cross-device levels are enabled.",
        )}
      </p>
    </section>
  );
}
