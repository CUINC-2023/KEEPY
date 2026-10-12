import { useState } from "react";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import type { CollectionCard, CollectionProgress } from "@/lib/collection-store";
import type { ReactNode } from "react";
export function CollectionFilters({
  cards,
  pools,
  render,
}: {
  cards: CollectionCard[];
  pools: CollectionProgress[];
  render: (rows: CollectionCard[]) => ReactNode;
}) {
  const t = useDiscoveryText(),
    { locale } = useLocale(),
    [pool, setPool] = useState("all"),
    [rarity, setRarity] = useState("all"),
    [sort, setSort] = useState("name");
  const rows = cards
    .filter(
      (c) => (pool === "all" || c.poolId === pool) && (rarity === "all" || c.rarity === rarity),
    )
    .sort((a, b) =>
      sort === "count"
        ? (b.count ?? 0) - (a.count ?? 0) || a.cardId.localeCompare(b.cardId)
        : sort === "rarity"
          ? a.rarity.localeCompare(b.rarity) || a.cardId.localeCompare(b.cardId)
          : a.name.localeCompare(b.name, locale) || a.cardId.localeCompare(b.cardId),
    );
  return (
    <section className="space-y-4" data-collection-filters>
      <p>
        {t(
          "曾取得的不同款式：同款只計一次，即使後來不再持有。現在持有：目前數量。重複卡：同款目前數量超過一張的部分，不增加完成度。",
          "Acquired distinct designs count once, even if no longer held. Current holdings are quantities held now. Duplicates are copies beyond the first currently held and do not increase completion.",
        )}
      </p>
      <p className="text-sm text-muted-foreground">
        {t(
          "篩選僅供此頁操作，離頁或換帳號即重設；未保存偏好、未跨裝置同步。",
          "Filters apply to this page only and reset on leaving or switching accounts. Preferences are not saved or synced across devices.",
        )}
      </p>
      <div className="flex flex-wrap gap-3">
        <label>
          {t("系列", "Series")}{" "}
          <select
            aria-label="Collection series filter"
            className="max-w-full border bg-background p-2"
            value={pool}
            onChange={(e) => setPool(e.target.value)}
          >
            <option value="all">{t("全部", "All")}</option>
            {pools.map((p) => (
              <option key={p.poolId} value={p.poolId}>
                {p.title[locale]}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("稀有度", "Rarity")}{" "}
          <select
            aria-label="Collection rarity filter"
            className="border bg-background p-2"
            value={rarity}
            onChange={(e) => setRarity(e.target.value)}
          >
            <option value="all">{t("全部", "All")}</option>
            {[...new Set(cards.map((c) => c.rarity))].sort().map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label>
          {t("排序", "Sort")}{" "}
          <select
            aria-label="Collection sort"
            className="border bg-background p-2"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="name">{t("名稱 A–Z", "Name A–Z")}</option>
            <option value="rarity">{t("稀有度代碼 A–Z", "Rarity code A–Z")}</option>
            <option value="count">{t("目前數量：多到少", "Current quantity: high to low")}</option>
          </select>
        </label>
      </div>
      {rows.length ? (
        render(rows)
      ) : (
        <p role="status">
          {t(
            "此篩選沒有目前可展示的持卡。可調整篩選或探索公開系列。",
            "No currently displayable holdings match. Adjust filters or explore public series.",
          )}
        </p>
      )}
    </section>
  );
}
