import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BadgeMark } from "@/components/player/BadgeMark";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { discoveryCommand, retryDiscoveryCommand } from "@/lib/discovery-store";
import { refreshCollectionMe, useCollection, type CollectionMe } from "@/lib/collection-store";

export function EarnedAchievements() {
  const d = useCollection(),
    t = useDiscoveryText();
  return (
    <main className="space-y-5 p-4 md:p-8" data-earned-achievements>
      <h1 className="text-2xl font-bold">{t("已取得成就", "Earned achievements")}</h1>
      <p>
        {t(
          "本機測試：只列本人已取得且目前可顯示的成就。徽章展示仍受公開設定限制。",
          "Local Test: only your earned, currently visible achievements are listed. Badge display respects your public settings.",
        )}
      </p>
      <Button onClick={() => void refreshCollectionMe()}>{t("重新讀取", "Reload")}</Button>
      {d.error || d.meError ? (
        <p role="alert">
          {t(
            "資料無法讀取，請確認本機服務後重試。",
            "Data unavailable. Check the local service and retry.",
          )}
        </p>
      ) : !d.me ? (
        <p role="status">
          {t(
            "請啟用本人 Local Test 身分，或等待資料載入。",
            "Enable your Local Test identity, or wait for data to load.",
          )}{" "}
          <Link to="/local-test">Local Test</Link>
        </p>
      ) : (
        <EarnedList key={d.me.actorId + ":" + d.me.profile.version} me={d.me} />
      )}
    </main>
  );
}
function EarnedList({ me }: { me: CollectionMe }) {
  const t = useDiscoveryText(),
    { locale } = useLocale();
  const [category, setCategory] = useState("all"),
    [query, setQuery] = useState(""),
    [group, setGroup] = useState("all"),
    [view, setView] = useState<"cards" | "timeline">("cards"),
    [sort, setSort] = useState("newest"),
    [ids, setIds] = useState(me.profile.data.badgeIds ?? me.awards.map((a) => a.id)),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const saved = me.profile.data.badgeIds ?? me.awards.map((a) => a.id),
    dirty = JSON.stringify(ids) !== JSON.stringify(saved);
  const rows = me.awards
    .filter(
      (a) =>
        (category === "all" || a.type === category) &&
        (group !== "selected" || ids.includes(a.id)) &&
        [a.title[locale], a.ruleId, a.recordedAt].some((v) =>
          v.toLowerCase().includes(query.trim().toLowerCase()),
        ),
    )
    .sort((a, b) =>
      sort === "title"
        ? a.title[locale].localeCompare(b.title[locale])
        : sort === "oldest"
          ? a.recordedAt.localeCompare(b.recordedAt)
          : b.recordedAt.localeCompare(a.recordedAt),
    );
  const commit = async (retry = false) => {
    setBusy(true);
    setError("");
    try {
      if (retry) await retryDiscoveryCommand("/collection/profile");
      else
        await discoveryCommand("/collection/profile", {
          expectedVersion: me.profile.version,
          data: { ...me.profile.data, badgeIds: ids },
        });
      await refreshCollectionMe();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="space-y-4">
      <p role="status">
        {dirty
          ? t("未保存的徽章選擇", "Unsaved badge selection")
          : t("已保存的展示設定", "Saved display settings")}
      </p>
      <p>
        {t(
          "公開徽章需在公開設定開啟；未開啟時選擇仍保持私人。",
          "Enable badges in public settings to display them; selection otherwise stays private.",
        )}{" "}
        <Link to="/app/settings/privacy">{t("公開設定", "Public settings")}</Link>
      </p>
      <div className="flex flex-wrap gap-3">
        <label>
          {t("搜尋本人已取得典藏", "Search your earned archive")}
          <input
            aria-label="Search earned archive"
            className="block rounded border bg-background p-2"
            type="search"
            maxLength={200}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <Button
          variant="outline"
          onClick={() => {
            setQuery("");
            setCategory("all");
            setGroup("all");
          }}
        >
          {t("清除典藏篩選", "Clear archive filters")}
        </Button>
        <label>
          {t("典藏分組", "Archive group")}{" "}
          <select
            aria-label="Earned archive group"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            <option value="all">{t("全部已取得", "All earned")}</option>
            <option value="selected">
              {t("本人精選（沿用徽章選擇）", "My selection (uses badge choices)")}
            </option>
          </select>
        </label>
        <Button variant="outline" aria-pressed={view === "cards"} onClick={() => setView("cards")}>
          {t("卡片檢視", "Card view")}
        </Button>
        <Button
          variant="outline"
          aria-pressed={view === "timeline"}
          onClick={() => {
            setView("timeline");
            if (sort === "title") setSort("newest");
          }}
        >
          {t("取得時間軸", "Earned timeline")}
        </Button>
        <label>
          {t("分類", "Category")}{" "}
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">{t("全部已取得", "All earned")}</option>
            {[...new Set(me.awards.map((a) => a.type))].map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label>
          {t("排序", "Sort")}{" "}
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">{t("最新取得", "Newest")}</option>
            <option value="oldest">{t("最早取得", "Oldest")}</option>
            <option value="title" disabled={view === "timeline"}>
              {t("名稱", "Title")}
            </option>
          </select>
        </label>
      </div>
      {!rows.length ? (
        <p>
          {me.awards.length
            ? t(
                "目前私人條件沒有符合的已取得成就，請清除篩選。",
                "No earned achievements match these private filters; clear them to view your archive.",
              )
            : t("目前沒有已取得成就。", "No earned achievements yet.")}
        </p>
      ) : (
        <div
          className={
            view === "timeline"
              ? "space-y-4 border-l-2 border-primary/30 pl-4"
              : "grid gap-4 sm:grid-cols-2"
          }
          data-earned-view={view}
        >
          {rows.map((a) => (
            <article key={a.id} className="panel space-y-2 p-4">
              <div aria-hidden="true" className="w-20" data-earned-badge>
                <BadgeMark
                  label={a.title[locale]}
                  variant={
                    a.type === "series" ? "series" : a.type === "activity" ? "activity" : "first"
                  }
                />
              </div>
              <h2 className="font-bold">{a.title[locale]}</h2>
              <p>
                <time dateTime={a.recordedAt}>
                  {new Date(a.recordedAt).toLocaleString(locale, { timeZone: "Asia/Taipei" })}
                </time>{" "}
                · {t("台北時間", "Taipei time")}
              </p>
              <p>
                {t("規則版本", "Rule version")} {a.ruleVersion}
              </p>
              {a.earnedCondition && (
                <p>
                  {t("取得時條件", "Condition when earned")}: {a.earnedCondition.type} ·{" "}
                  {a.earnedCondition.threshold}
                </p>
              )}
              <p className="break-words text-xs text-muted-foreground">
                {t("取得紀錄來源", "Earned record source")}: {a.ruleId} · v{a.ruleVersion}
              </p>
              <details data-earned-rule-story>
                <summary>{t("取得故事與歷史規則", "Earned story and historical rule")}</summary>
                <p>
                  {t(
                    "這是本人已取得紀錄，不推測未取得成就；依取得時保留的條件與規則版本解讀，目前收藏狀態不回寫舊紀錄。",
                    "This is your earned record, without hints about unearned achievements. Read the preserved condition and rule version; current collection state does not rewrite the old record.",
                  )}
                </p>
                <p>
                  {a.ruleId} · v{a.ruleVersion} ·{" "}
                  {a.earnedCondition
                    ? `${a.earnedCondition.type}: ${a.earnedCondition.threshold}`
                    : t(
                        "舊紀錄未附條件快照，不補造。",
                        "Legacy record has no condition snapshot; none is invented.",
                      )}
                </p>
              </details>
              <div className="flex flex-wrap gap-3 text-sm">
                {a.type === "series" && me.progress.some((p) => p.poolId === a.subject) && (
                  <Link
                    className="text-primary underline"
                    to="/app/album/$poolId"
                    params={{ poolId: a.subject }}
                  >
                    {t("閱讀目前公開系列", "Read the current public series")}
                  </Link>
                )}
                <Link className="text-primary underline" to="/app/settings/privacy">
                  {t("選擇公開展示", "Choose public display")}
                </Link>
                <Link
                  className="text-primary underline"
                  to="/app/collection"
                  hash="collection-recap"
                >
                  {t("核對私人收藏回顧", "Check your private collection recap")}
                </Link>
              </div>
              <label>
                <input
                  type="checkbox"
                  checked={ids.includes(a.id)}
                  disabled={busy || (!ids.includes(a.id) && ids.length >= 12)}
                  onChange={(e) =>
                    setIds(e.target.checked ? [...ids, a.id] : ids.filter((id) => id !== a.id))
                  }
                />{" "}
                {t("展示此徽章", "Display this badge")}
              </label>
            </article>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <Button disabled={busy || !dirty} onClick={() => void commit()}>
          {t("保存選擇", "Save selection")}
        </Button>
        <Button disabled={busy || !dirty} onClick={() => setIds(saved)}>
          {t("取消修改", "Cancel changes")}
        </Button>
      </div>
      {error && (
        <div role="alert">
          <p>{error}</p>
          <p>
            {t(
              "衝突請重新讀取確認；回應丟失請確認原操作，不新增請求。",
              "Reload to resolve a conflict; if the response was lost, confirm the original operation without creating a new request.",
            )}
          </p>
          <Button disabled={busy} onClick={() => void commit(true)}>
            {t("確認原操作", "Confirm original operation")}
          </Button>
        </div>
      )}
    </section>
  );
}
