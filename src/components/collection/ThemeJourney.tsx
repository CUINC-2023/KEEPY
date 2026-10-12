import { Link } from "@tanstack/react-router";
import type { CollectionMe, CollectionCatalogue } from "@/lib/collection-store";
import { previewThemeJourney } from "@/lib/theme-journey.mjs";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
export function ThemeJourney({
  me,
  catalogue,
}: {
  me: CollectionMe;
  catalogue: CollectionCatalogue;
}) {
  const t = useDiscoveryText(),
    { locale } = useLocale(),
    value = previewThemeJourney(me, catalogue);
  if (!value) return null;
  return (
    <section id="collection-theme-journey" data-theme-journey className="panel space-y-4 p-5">
      <h2 className="text-xl font-bold">
        {t(
          "私人主題收藏旅程 · 無獎預覽",
          "Private thematic collection journey · no-reward preview",
        )}
      </h2>
      <p>
        {t(
          "沿你已保存的收藏目標与優先順序，不另建持卡或完成狀態。只納入目前公開、來源與分母一致的卡冊；重複款式不加進度。",
          "Uses your saved collection goals and priority order, without another holding or completion state. Only current public albums with matching sources and denominators qualify; duplicate designs do not add progress.",
        )}
      </p>
      <Link to="/app/collection" hash="collection-goals" className="text-primary underline">
        {t("選擇或調整私人旅程卡冊", "Choose or reorder private journey albums")}
      </Link>
      {!value.chapters.length ? (
        <p>
          {t(
            "目前沒有已選且有效公開的旅程卡冊，請先設定本人目標。",
            "No selected, currently public journey albums yet. Set your own goals first.",
          )}
        </p>
      ) : (
        <>
          <p>
            {t("目前完成章節", "Currently completed chapters")}: {value.completed} /{" "}
            {value.chapters.length}
          </p>
          <ol className="grid gap-4 sm:grid-cols-2">
            {value.chapters.map((p, i) => (
              <li key={p.poolId} className="space-y-3 rounded-xl border p-4">
                <h3 className="font-bold">
                  {i + 1}. {p.title[locale]}
                </h3>
                <p>
                  {p.owned}/{p.total} ·{" "}
                  {p.complete
                    ? t("目前公開款式已完成", "Current public designs complete")
                    : p.owned
                      ? t("收藏進行中", "Collecting")
                      : t("先閱讀系列故事", "Start with the series story")}
                </p>
                <progress
                  className="h-3 w-full"
                  value={p.owned}
                  max={p.total}
                  aria-label={p.title[locale]}
                />
                <Link
                  to="/pools/$poolId"
                  params={{ poolId: p.poolId }}
                  className="text-primary underline"
                >
                  {t("閱讀目前公開系列", "Read the current public series")}
                </Link>
                {value.nextPoolId === p.poolId && (
                  <p className="text-sm">
                    {t(
                      "下一章：依你自選優先順序。",
                      "Next chapter: from your chosen priority order.",
                    )}
                  </p>
                )}
                {p.earnedRecordAt && (
                  <p className="text-sm">
                    {t(
                      "已有系列成就紀錄（不是旅程發獎）",
                      "Existing series achievement record (not a journey reward)",
                    )}
                    :{" "}
                    <time dateTime={p.earnedRecordAt}>
                      {new Date(p.earnedRecordAt).toLocaleString(locale, {
                        timeZone: "Asia/Taipei",
                      })}
                    </time>
                  </p>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
      <p className="text-sm text-muted-foreground">
        {value.ruleVersion} · v{value.catalogueVersion} ·{" "}
        {t(
          "僅本機回顧，不發放KP、卡牌或新成就。",
          "Local recap only; no KP, cards or new achievements are issued.",
        )}
      </p>
    </section>
  );
}
