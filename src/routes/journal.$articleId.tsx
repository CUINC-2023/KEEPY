import { ExploreBackLink } from "@/components/content/ExploreBackLink";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useDiscovery, useLocalHead } from "@/lib/content-store";
import { DiscoveryEntry, DiscoveryStatus } from "@/components/content/DiscoveryContent";
import { normalizeExploreSearch } from "@/lib/explore-search.mjs";
export const Route = createFileRoute("/journal/$articleId")({
  validateSearch: normalizeExploreSearch,
  head: () => ({
    meta: [{ title: "KEEPY · Journal · Local Test" }, { name: "robots", content: "noindex" }],
  }),
  component: Article,
});
function Article() {
  const { articleId } = Route.useParams(),
    data = useDiscovery(),
    t = useDiscoveryText();
  const publicSearch = Route.useSearch();
  const item = data.items.find((i) => i.kind === "article" && i.id === articleId);
  const { locale } = useLocale();
  useLocalHead(
    (item?.copy.title[locale] ?? t("文章尚未發布", "Article unavailable")) +
      " — KEEPY · Local Test",
    item?.copy.summary[locale] ?? "Local Test sample content",
  );
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {publicSearch.returnTo !== "journal" && (
        <Link to="/journal" search={publicSearch} className="text-primary underline">
          {t("返回收藏誌", "Back to journal")}
        </Link>
      )}
      <ExploreBackLink />
      <DiscoveryStatus />
      {item ? (
        <DiscoveryEntry item={item} detail />
      ) : data.loaded && !data.error ? (
        <p>
          {t(
            "找不到文章，可能尚未發布或已下架。",
            "Article unavailable, unpublished or withdrawn.",
          )}
        </p>
      ) : null}
    </div>
  );
}
