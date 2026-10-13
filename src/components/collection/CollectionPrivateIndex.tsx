import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  useCollection,
  refreshCollectionMe,
  type CollectionMe,
  type CollectionCatalogue,
} from "@/lib/collection-store";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { privateCollectionIndex, PRIVATE_INDEX_DEFAULT } from "@/lib/collection-private-index.mjs";
import {
  discoveryCommand,
  retryDiscoveryCommand,
  hasPendingDiscovery,
} from "@/lib/discovery-store";
export function CollectionPrivateIndex() {
  const d = useCollection(),
    t = useDiscoveryText();
  return (
    <main className="space-y-4 p-4 md:p-8">
      <h1 className="text-2xl font-bold">
        {t("本人私人收藏索引", "Your private collection index")}
      </h1>
      <Link to="/app/collection" className="text-primary underline">
        {t("返回本人收藏", "Back to your collection")}
      </Link>
      {d.error || d.meError ? (
        <div role="alert">
          <p>{t("來源失敗，舊私人索引已清空。", "Sources failed; old private index cleared.")}</p>
          <Button onClick={() => void refreshCollectionMe()}>
            {t("重讀本人索引", "Reload your index")}
          </Button>
        </div>
      ) : d.me && d.catalogue && d.catalogueValid ? (
        <Index
          key={
            d.me.actorId +
            d.me.profile.version +
            d.me.visibilityKey +
            d.me.cards.map((c) => c.cardId).join(",")
          }
          me={d.me}
          catalogue={d.catalogue}
        />
      ) : (
        <p>
          {t(
            "確認本人本機測試身分；Staging只前端，不是雲端搜尋。",
            "Confirm your own local test identity. Staging is a front-end preview, not cloud search.",
          )}
        </p>
      )}
    </main>
  );
}
function Index({ me, catalogue }: { me: CollectionMe; catalogue: CollectionCatalogue }) {
  const t = useDiscoveryText(),
    { locale } = useLocale(),
    saved = me.profile.data.collectionIndex ?? PRIVATE_INDEX_DEFAULT,
    [p, setP] = useState(saved),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    result = privateCollectionIndex(me, catalogue, p, locale),
    dirty = JSON.stringify(p) !== JSON.stringify(saved),
    pending = hasPendingDiscovery("/collection/profile");
  async function save(retry = false) {
    if (busy) return;
    setBusy(true);
    try {
      if (retry) await retryDiscoveryCommand("/collection/profile");
      else
        await discoveryCommand("/collection/profile", {
          expectedVersion: me.profile.version,
          data: { ...me.profile.data, collectionIndex: { ...p, page: result.page } },
        });
      await refreshCollectionMe();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  const kind = (v: string) =>
    ({
      album: t("卡冊", "Album"),
      card: t("卡牌", "Card"),
      note: t("私人筆記", "Private note"),
      curation: t("私人策展", "Private curation"),
    })[v] ?? t("全部", "All");
  return (
    <section data-private-collection-index className="space-y-4">
      <p>
        {t(
          "統合目前合法卡冊、本人持有與曾取得卡牌、本人筆記與策展。每頁20項；查找條件只保存本人本機設定，不寫入公開網址或宣稱跨裝置同步。",
          "Current eligible albums, your held and acquired cards, notes and curations. Twenty items per page; filters save only to your local profile, never a public URL or a cross-device sync claim.",
        )}
      </p>
      <p role="status">
        {dirty
          ? t("未保存查找條件", "Unsaved search conditions")
          : t("已保存本機條件", "Saved local conditions")}{" "}
        · v{me.profile.version}
      </p>
      <label>
        {t("查找本人內容", "Find your content")}
        <input
          aria-label="Private index query"
          maxLength={100}
          className="block w-full rounded border bg-background p-2"
          value={p.q}
          onChange={(e) => setP({ ...p, q: e.target.value, page: 1 })}
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <label>
          {t("類型", "Type")}{" "}
          <select
            aria-label="Private index kind"
            value={p.kind}
            onChange={(e) => setP({ ...p, kind: e.target.value, page: 1 })}
          >
            {["all", "album", "card", "note", "curation"].map((v) => (
              <option key={v} value={v}>
                {kind(v)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("排序", "Sort")}{" "}
          <select
            aria-label="Private index sort"
            value={p.sort}
            onChange={(e) => setP({ ...p, sort: e.target.value, page: 1 })}
          >
            <option value="title">{t("標題", "Title")}</option>
            <option value="kind">{t("類型", "Type")}</option>
          </select>
        </label>
        <Button disabled={busy || pending || !dirty} onClick={() => void save()}>
          {t("保存本人查找條件", "Save my search conditions")}
        </Button>
        <Button
          disabled={busy || !dirty}
          variant="outline"
          onClick={() => {
            setP(saved);
            setError(false);
          }}
        >
          {t("取消查找修改", "Cancel search changes")}
        </Button>
      </div>
      {error && (
        <div role="alert">
          <p>
            {t(
              "版本衝突／保存未確認，重讀或核對原key，不覆寫。",
              "Version conflict / save unconfirmed. Read back or confirm the original key without overwriting.",
            )}
          </p>
          <Button disabled={busy} onClick={() => void save(true)}>
            {t("確認索引原操作", "Confirm original index operation")}
          </Button>
        </div>
      )}
      {result.rows.length ? (
        <ul className="space-y-3">
          {result.rows.map((r) => (
            <li key={r.kind + ":" + r.id} className="panel space-y-2 p-4" data-private-index-row>
              <h2 className="font-bold break-words">
                {kind(r.kind)} · {r.title}
              </h2>
              <p className="whitespace-pre-wrap break-words">{r.summary}</p>
              <p>v{r.sourceVersion}</p>
              {r.kind === "album" ? (
                <Link to="/app/album/$poolId" params={{ poolId: r.id }} className="underline">
                  {t("定位本人卡冊", "Open your album")}
                </Link>
              ) : r.kind === "card" ? (
                <Link to="/app/cards/$cardId" params={{ cardId: r.id }} className="underline">
                  {t("核對本人卡牌來源", "Check your card source")}
                </Link>
              ) : (
                <Link
                  to={r.kind === "note" ? "/app/notes" : "/app/curations"}
                  className="underline"
                >
                  {t("前往原本人編輯器", "Go to your existing editor")}
                </Link>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>
          {t(
            "沒有符合條件的本人有效內容；可清除查找。",
            "No eligible personal content matches; clear search conditions.",
          )}
        </p>
      )}
      <nav className="flex gap-3" aria-label={t("私人索引分頁", "Private index pagination")}>
        <Button disabled={result.page <= 1} onClick={() => setP({ ...p, page: result.page - 1 })}>
          {t("上一頁", "Previous page")}
        </Button>
        <span>
          {result.page}/{result.pages} · {result.total}
        </span>
        <Button
          disabled={result.page >= result.pages}
          onClick={() => setP({ ...p, page: result.page + 1 })}
        >
          {t("下一頁", "Next page")}
        </Button>
      </nav>
    </section>
  );
}
