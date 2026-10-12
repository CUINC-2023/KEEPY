import { Link, useLocation } from "@tanstack/react-router";
import { normalizeExploreSearch } from "@/lib/explore-search.mjs";
import { useDiscoveryText } from "@/lib/discovery-copy";
export function ExploreBackLink() {
  const location = useLocation(),
    t = useDiscoveryText();
  const search = normalizeExploreSearch(location.search);
  return (
    <div className="flex flex-wrap gap-3">
      {search.returnTo === "journal" && (
        <Link data-back-journal to="/journal" search={search} className="text-primary underline">
          {t("返回收藏誌（保留條件）", "Back to journal (keep filters)")}
        </Link>
      )}
      {search.returnTo === "reading" && (
        <Link
          data-back-reading
          to="/app/reading"
          search={search}
          className="text-primary underline"
        >
          {t("返回本人閱讀清單（保留條件）", "Back to your reading list (keep filters)")}
        </Link>
      )}
      <Link
        to="/explore"
        search={normalizeExploreSearch(location.search)}
        className="inline-block text-primary underline"
        data-back-explore
      >
        {t("返回公開探索（保留搜尋條件）", "Back to exploration (keep search filters)")}
      </Link>
    </div>
  );
}
