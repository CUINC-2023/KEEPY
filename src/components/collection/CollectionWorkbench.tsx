import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import {
  collectionWorkbench,
  WORKBENCH_DEFAULT,
  type WorkbenchPreference,
} from "@/lib/collection-workbench.mjs";
import type { CollectionMe, CollectionCatalogue } from "@/lib/collection-store";
import { refreshCollectionMe } from "@/lib/collection-store";
import {
  discoveryCommand,
  retryDiscoveryCommand,
  hasPendingDiscovery,
} from "@/lib/discovery-store";
import { localSessionGeneration } from "@/lib/local-test-client";
export function CollectionWorkbench({
  me,
  catalogue,
}: {
  me: CollectionMe;
  catalogue: CollectionCatalogue;
}) {
  const t = useDiscoveryText(),
    { locale } = useLocale(),
    saved = me.profile.data.collectionSearch ?? WORKBENCH_DEFAULT,
    [draft, setDraft] = useState<WorkbenchPreference>(saved),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  const result = collectionWorkbench(me, draft),
    pending = hasPendingDiscovery("/collection/profile");
  const save = async (retry = false) => {
    if (busy) return;
    const epoch = localSessionGeneration();
    setBusy(true);
    try {
      if (retry) await retryDiscoveryCommand("/collection/profile");
      else
        await discoveryCommand("/collection/profile", {
          expectedVersion: me.profile.version,
          data: { ...me.profile.data, collectionSearch: { ...draft, page: result.page } },
        });
      if (epoch === localSessionGeneration()) await refreshCollectionMe();
    } catch {
      if (epoch === localSessionGeneration()) setError(true);
    } finally {
      if (epoch === localSessionGeneration()) setBusy(false);
    }
  };
  const change = (patch: Partial<WorkbenchPreference>) => setDraft({ ...draft, ...patch, page: 1 });
  return (
    <section id="collection-workbench" data-collection-workbench className="panel space-y-4 p-4">
      <h2 className="text-xl font-bold">
        {t("本人收藏搜尋工作台", "Your collection search workbench")}
      </h2>
      <p>
        {t(
          "只搜尋本人目前合法投影，曾取得與持有分欄；不同款式只一列，重複卡不增加完成度。私人條件保存在本機SQLite，不放公開URL，不是跨裝置同步。",
          "Searches your current eligible projection, separating ever acquired and current holdings. One row per design; duplicates do not increase completion. Private filters save in local SQLite, never public URLs or cross-device sync.",
        )}
      </p>
      <fieldset disabled={busy || pending} className="collection-filter-grid">
        <label>
          {t("關鍵字", "Keyword")}{" "}
          <input
            aria-label="Private collection query"
            maxLength={100}
            value={draft.q}
            onChange={(e) => change({ q: e.target.value })}
          />
        </label>
        <label>
          {t("卡冊", "Album")}{" "}
          <select
            aria-label="Private collection pool"
            value={draft.poolId}
            onChange={(e) => change({ poolId: e.target.value })}
          >
            <option value="">{t("全部", "All")}</option>
            {catalogue.pools.map((p) => (
              <option key={p.poolId} value={p.poolId}>
                {p.title[locale]}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("稀有度", "Rarity")}{" "}
          <select
            aria-label="Private collection rarity"
            value={draft.rarity}
            onChange={(e) => change({ rarity: e.target.value })}
          >
            <option value="all">{t("全部", "All")}</option>
            {[...new Set(catalogue.cards.map((c) => c.rarity))].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label>
          {t("來源範圍", "Source scope")}{" "}
          <select
            aria-label="Private collection mode"
            value={draft.mode}
            onChange={(e) => change({ mode: e.target.value })}
          >
            {[
              ["all", "全部合法款式", "All eligible designs"],
              ["held", "目前持有", "Currently held"],
              ["acquired", "曾取得", "Ever acquired"],
              ["duplicates", "目前重複卡", "Current duplicates"],
            ].map(([id, zh, en]) => (
              <option key={id} value={id}>
                {t(zh!, en!)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("排序", "Order")}{" "}
          <select
            aria-label="Private collection sort"
            value={draft.sort}
            onChange={(e) => change({ sort: e.target.value })}
          >
            {[
              ["name", "名稱", "Name"],
              ["rarity", "稀有度", "Rarity"],
              ["count", "目前持有數", "Current holding count"],
            ].map(([id, zh, en]) => (
              <option key={id} value={id}>
                {t(zh!, en!)}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      <p role="status">
        {JSON.stringify(draft) === JSON.stringify(saved)
          ? t("已保存／預設私人條件", "Saved / default private filters")
          : t("未保存私人條件", "Unsaved private filters")}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button disabled={busy || pending} onClick={() => void save()}>
          {t("保存私人搜尋條件", "Save private search filters")}
        </Button>
        <Button
          disabled={busy || pending}
          variant="outline"
          onClick={() => {
            setDraft(saved);
            setError(false);
          }}
        >
          {t("取消私人搜尋修改", "Cancel private search changes")}
        </Button>
        <Button
          disabled={busy || pending}
          variant="outline"
          onClick={() => setDraft(WORKBENCH_DEFAULT)}
        >
          {t("清除搜尋條件", "Clear search filters")}
        </Button>
      </div>
      {error && (
        <div role="alert">
          <p>
            {t(
              "版本或回應未確認，請重讀／以原key確認，不覆蓋他人資料。",
              "Version or response unconfirmed. Read back / confirm the original key without overwriting other data.",
            )}
          </p>
          <Button onClick={() => void refreshCollectionMe()}>
            {t("重讀本人設定", "Reload my settings")}
          </Button>
          {pending && (
            <Button onClick={() => void save(true)}>
              {t("確認原搜尋操作", "Confirm original filter operation")}
            </Button>
          )}
        </div>
      )}
      {result.rows.length ? (
        <ul className="space-y-3">
          {result.rows.map((c) => (
            <li key={c.cardId}>
              <Link className="underline" to="/app/cards/$cardId" params={{ cardId: c.cardId }}>
                {c.name}
              </Link>{" "}
              · {c.rarity} · {t("曾取得", "Ever acquired")}:{" "}
              {c.everAcquired ? t("是", "Yes") : t("尚無取得來源", "No acquisition source")} ·{" "}
              {t("目前持有", "Held now")}: {c.count} · {t("重複", "Duplicates")}:{" "}
              {Math.max(0, c.count - 1)}
            </li>
          ))}
        </ul>
      ) : (
        <p>
          {t(
            "目前條件沒有合法本人款式；可清除條件或閱讀公開系列。",
            "No eligible personal designs match. Clear filters or read public series.",
          )}
        </p>
      )}
      <nav className="flex gap-3">
        <Button
          disabled={busy || pending || result.page <= 1}
          onClick={() => setDraft({ ...draft, page: result.page - 1 })}
        >
          {t("上一頁", "Previous")}
        </Button>
        <span>
          {result.page}/{result.pages} · {result.total}
        </span>
        <Button
          disabled={busy || pending || result.page >= result.pages}
          onClick={() => setDraft({ ...draft, page: result.page + 1 })}
        >
          {t("下一頁", "Next")}
        </Button>
      </nav>
      <Link className="underline" to="/app/collection" hash="collection-history">
        {t("查看完整合法取得紀錄", "View full eligible acquisition history")}
      </Link>
    </section>
  );
}
