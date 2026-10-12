import { Link, useLocation } from "@tanstack/react-router";
import { relatedArticles, normalizeExploreSearch } from "@/lib/explore-search.mjs";
import { useDiscovery, type DiscoveryItem } from "@/lib/content-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
export function RelatedReading({ item }: { item: DiscoveryItem }) {
  const d = useDiscovery(),
    t = useDiscoveryText(),
    { locale } = useLocale(),
    location = useLocation();
  if (!d.loaded || d.error || !d.items.some((i) => i.id === item.id)) return null;
  const rows = relatedArticles(d.items, item),
    search = normalizeExploreSearch(location.search, d.items);
  const series = d.items
    .filter(
      (i) =>
        i.kind === "series" &&
        (i.poolIds.some((id) => item.poolIds.includes(id)) || item.poolIds.includes(i.referenceId)),
    )
    .slice(0, 6);
  return (
    <section data-related-reading className="space-y-3 border-t pt-4">
      <h2 className="font-bold">{t("繼續閱讀公開文章", "Continue reading public articles")}</h2>
      {series.length > 0 && (
        <nav data-related-series aria-label={t("故事與系列章節", "Story and series chapters")}>
          <ol className="space-y-2">
            {series.map((s, n) => (
              <li key={s.id}>
                {n + 1}.{" "}
                <Link
                  className="text-primary underline"
                  to="/pools/$poolId"
                  params={{ poolId: s.referenceId }}
                  search={search}
                >
                  {s.copy.title[locale]}
                </Link>
              </li>
            ))}
          </ol>
          <p className="text-sm text-muted-foreground">
            {t(
              "依目前公開順序閱讀，撤下或到期章節不保留。",
              "Read in current publication order; withdrawn or expired chapters are removed.",
            )}
          </p>
        </nav>
      )}
      <p className="text-sm">
        {t(
          "依同創作者、同系列或同分類關聯；固定順序，非人氣或演算法評分。",
          "Related by creator, series or category; fixed order, without popularity or algorithm scores.",
        )}
      </p>
      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((a) => (
            <li key={a.id} data-related-id={a.id}>
              <Link
                className="text-primary underline"
                to="/journal/$articleId"
                params={{ articleId: a.id }}
                search={search}
              >
                {a.copy.title[locale]}
              </Link>
              <p>{a.copy.summary[locale]}</p>
              <small>
                {t("關聯原因：", "Related because: ")}
                {[
                  a.creatorIds.some((id) => item.creatorIds.includes(id))
                    ? t("同創作者", "same creator")
                    : "",
                  a.poolIds.some((id) => item.poolIds.includes(id))
                    ? t("同系列", "same series")
                    : "",
                  a.category === item.category ? t("同分類", "same category") : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p>{t("目前沒有其他公開關聯文章。", "No other public related articles at present.")}</p>
      )}
    </section>
  );
}
