import { Link } from "@tanstack/react-router";
import type { DiscoveryItem } from "@/lib/content-store";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { useDiscoveryText } from "@/lib/discovery-copy";

/** Only the current published projection supplied by content-store is accepted. */
export function DiscoveryPathways({ items }: { items: DiscoveryItem[] }) {
  const { locale } = useLocale(),
    t = useDiscoveryText();
  const series = items.filter((i) => i.kind === "series").slice(0, 3);
  const guides = items.filter((i) => i.kind === "article" && i.category === "guide").slice(0, 3);
  return (
    <section data-discovery-pathways className="panel space-y-4 p-5">
      <h2 className="text-xl font-bold">
        {t("從故事開始收藏", "Start collecting through stories")}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t(
          "沿目前官方公開順序，先讀系列故事或收藏指南；不是人氣評分，也不授予資產。",
          "Follow the current official publication order: read series stories or collection guides first. These are not popularity scores and grant no assets.",
        )}
      </p>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="font-bold">
            {t("公開主題與卡冊故事", "Public themes and album stories")}
          </h3>
          {series.length ? (
            series.map((i) => (
              <article key={i.id} className="space-y-1 break-words">
                <Link
                  className="text-primary underline"
                  to="/pools/$poolId"
                  params={{ poolId: i.referenceId }}
                >
                  {i.copy.title[locale]}
                </Link>
                <p className="text-sm">{i.copy.summary[locale]}</p>
              </article>
            ))
          ) : (
            <p>{t("目前沒有公開系列故事。", "No public series stories at present.")}</p>
          )}
        </div>
        <div className="space-y-3">
          <h3 className="font-bold">{t("收藏指南", "Collection guides")}</h3>
          {guides.length ? (
            guides.map((i) => (
              <article key={i.id} className="space-y-1 break-words">
                <Link
                  className="text-primary underline"
                  to="/journal/$articleId"
                  params={{ articleId: i.id }}
                >
                  {i.copy.title[locale]}
                </Link>
                <p className="text-sm">{i.copy.summary[locale]}</p>
              </article>
            ))
          ) : (
            <p>{t("目前沒有公開收藏指南。", "No public collection guides at present.")}</p>
          )}
        </div>
      </div>
      <Link className="inline-block text-primary underline" to="/journal">
        {t("閱讀收藏誌", "Read the collection journal")}
      </Link>
    </section>
  );
}
