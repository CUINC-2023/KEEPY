import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { localApi, useLocalTest, localSessionGeneration } from "@/lib/local-test-client";
import { useCollection } from "@/lib/collection-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import type { CatalogueHealth } from "@/lib/catalogue-health.mjs";
import { Button } from "@/components/ui/button";
export function CatalogueIntegrity() {
  const local = useLocalTest(),
    collection = useCollection(),
    t = useDiscoveryText(),
    { locale } = useLocale();
  const [snapshot, setSnapshot] = useState<{ scope: string; value: CatalogueHealth } | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const official = local.enabled && local.summary?.user.role === "official";
  const scope = JSON.stringify([
    official,
    local.summary?.user.id,
    localSessionGeneration(),
    collection.catalogue?.visibilityKey,
  ]);
  useEffect(() => {
    const c = new AbortController();
    setSnapshot(null);
    setError("");
    if (official)
      void localApi<CatalogueHealth>(
        "/admin/collection/health",
        undefined,
        "GET",
        undefined,
        c.signal,
      )
        .then((value) => {
          if (!c.signal.aborted) setSnapshot({ scope, value });
        })
        .catch((e) => {
          if (!c.signal.aborted) setError(String(e));
        });
    return () => c.abort();
  }, [scope, official, retry]);
  if (!official) return null;
  const data =
    collection.catalogueValid &&
    !collection.error &&
    snapshot?.scope === scope &&
    snapshot.value.visibilityKey === collection.catalogue?.visibilityKey
      ? snapshot.value
      : null;
  return (
    <section className="panel space-y-4 p-5" data-catalogue-integrity>
      <h2 className="text-xl font-bold">
        {t(
          "目前公開卡冊與虛構範本完整性",
          "Current public albums and fictional template integrity",
        )}
      </h2>
      <p>
        {t(
          "唯讀檢查不是上架核准；來源、用途、指定版審核與發布影響沿原供給頁，不修改範本或撤下內容。",
          "Read-only checks do not approve publication. Sources, uses, exact-version review and publication impact stay in the existing supply page; templates and withdrawn content are not changed.",
        )}
      </p>
      <nav className="flex flex-wrap gap-4">
        <Link to="/admin/supply" className="text-primary underline">
          {t("開啟原審核與發布影響", "Open existing review and publication impact")}
        </Link>
        <Link to="/admin/album-templates" className="text-primary underline">
          {t("查看獨立虛構範本", "View independent fictional templates")}
        </Link>
      </nav>
      {error || collection.error ? (
        <div role="alert">
          <p>
            {t(
              "檢查來源無法讀取，舊結果已清空。",
              "Check sources could not load; old results are cleared.",
            )}
          </p>
          <Button onClick={() => setRetry((n) => n + 1)}>
            {t("重新讀取檢查", "Reload checks")}
          </Button>
        </div>
      ) : !data ? (
        <p role="status">{t("核對目前來源中…", "Checking current sources…")}</p>
      ) : (
        <>
          <p>
            v{data.ruleVersion} · {t("待處理檢查", "Checks requiring attention")}:{" "}
            {data.issues.length}
          </p>
          {data.issues.length > 0 && (
            <ul>
              {data.issues.map((code) => (
                <li key={code}>{code}</li>
              ))}
            </ul>
          )}
          {!data.pools.length ? (
            <p>
              {t(
                "目前沒有公開卡冊，不以範本補造公開目錄。",
                "No public albums currently; templates do not populate the public catalogue.",
              )}
            </p>
          ) : (
            <ul className="space-y-2">
              {data.pools.map((p, i) => (
                <li key={p.poolId + i}>
                  <Link
                    to="/pools/$poolId"
                    params={{ poolId: p.poolId }}
                    className="text-primary underline"
                  >
                    {p.title[locale]}
                  </Link>{" "}
                  · {p.definitions}/{p.declared} ·{" "}
                  {p.complete
                    ? t("本次檢查一致", "Checks consistent")
                    : t("需要核對缺項", "Missing items require review")}
                </li>
              ))}
            </ul>
          )}
          <ul className="space-y-2">
            {data.templates.map((v, i) => (
              <li key={v.id + i}>
                {v.id} · v{v.version} ·{" "}
                {v.complete
                  ? t("双語範本完整（未上架）", "Bilingual template complete (unpublished)")
                  : t("範本缺項（未上架）", "Template missing items (unpublished)")}
                {v.missingTranslations.length > 0 && (
                  <p>
                    {t("缺少雙語欄位", "Missing bilingual fields")}:{" "}
                    {v.missingTranslations.join(" · ")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {v.materialReviewRequired
                    ? t(
                        "素材參照需回原供給頁核對來源／用途／期限，本檢查不核准。",
                        "Material references require source/use/period checks in supply; this diagnostic grants no approval.",
                      )
                    : t(
                        "純文字／幾何示意，沒有外部素材授權聲明。",
                        "Text/geometric sample only; no claim of external material rights.",
                      )}
                </p>
              </li>
            ))}
          </ul>
          <section data-creator-template-health className="space-y-3 rounded-xl border p-4">
            <h3 className="font-bold">
              {t(
                "虛構創作者範本：關聯與雙語缺項",
                "Fictional creator templates: relations and bilingual completeness",
              )}
            </h3>
            <p>
              {t(
                "僅列識別、版本與缺項代碼，不輸出私人正文。完整不等於素材權利或發布核准。",
                "Only identifiers, versions and missing-field codes; no private prose. Completeness is not material-rights or publication approval.",
              )}
            </p>
            {data.creatorTemplates.length ? (
              <ul className="space-y-2">
                {data.creatorTemplates.map((v, i) => (
                  <li key={v.id + i}>
                    {v.id} · {v.seriesId} · v{v.version} ·{" "}
                    {v.complete
                      ? t("示意範本完整（未上架）", "Sample complete (unpublished)")
                      : v.missing.join(" · ")}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t("沒有創作者範本。", "No creator templates.")}</p>
            )}
          </section>
          {data.playChecks && (
            <aside data-private-play-health className="space-y-3 rounded-xl border p-4">
              {data.playChecks.quizReviews && (
                <section data-quiz-review-health className="space-y-2">
                  <h4 className="font-bold">
                    {t("逐題快照完整性（唯讀）", "Question snapshot integrity (read-only)")}
                  </h4>
                  <p>
                    {t(
                      "已核對／不相容／舊摘要缺逐題／來源失效",
                      "Checked / incompatible / old summary lacks questions / unavailable sources",
                    )}
                    : {data.playChecks.quizReviews.checked} /{" "}
                    {data.playChecks.quizReviews.incompatible} /{" "}
                    {data.playChecks.quizReviews.legacyWithoutReview} /{" "}
                    {data.playChecks.quizReviews.unavailableSources}
                  </p>
                  <p>
                    {t(
                      "僅計數，不輸出私人題文、答案或帳戶。不可變紀錄不提供覆寫修復，先隔離備份核對。",
                      "Counts only, without private questions, answers or accounts. Immutable records have no overwrite repair; inspect isolated backups first.",
                    )}
                  </p>
                  {data.playChecks.quizReviews.truncated && (
                    <p>
                      {t(
                        "只核對近期1000筆，不宣稱全庫通過。",
                        "Only the latest 1000 records checked, not full-database approval.",
                      )}
                    </p>
                  )}
                </section>
              )}
              <h3 className="font-bold">
                {t("私人玩法保存診斷（唯讀）", "Private play storage diagnosis (read-only)")}
              </h3>
              <p>
                {t("設定筆數", "Settings checked")}: {data.playChecks.checked} ·{" "}
                {t("不相容", "Incompatible")}: {data.playChecks.incompatible} ·{" "}
                {t("失效關聯", "Unavailable references")}: {data.playChecks.missingReferences}
              </p>
              <p>
                {t(
                  "不含帳戶、私人正文或proof；沒有自動修復。不相容來源停止讀写，備份／隔離還原後核對；不覆寫原庫或資產歷史。",
                  "No accounts, private prose or proof; no automatic repair. Incompatible sources stop reads and writes. Check backup / isolated restoration without overwriting the original database or asset history.",
                )}
              </p>
            </aside>
          )}
          {data.profileChecks && (
            <aside data-play-quality className="space-y-3 rounded-xl border p-4">
              <h3 className="font-bold">
                {t("題組品質：唯讀／未核准", "Question quality: read-only / unapproved")}
              </h3>
              <p>
                {t(
                  "重複版型是內容核對提示，不自動裁定正式審核政策。指定版預覽與發布仍分開。報告不含私人題文、答案或帳戶。",
                  "Repeated layouts are review hints, not an automatic formal review policy. Specified-version previews and publication stay separate. Reports omit private prose, answers and accounts.",
                )}
              </p>
              {data.playPacks?.packs.map((p) => (
                <p key={p.id}>
                  {p.id} · v{p.version} · {p.questionCount} ·{" "}
                  {p.issues.join(" / ") || t("必要欄位完整", "Required fields complete")} ·{" "}
                  {t("共用題目版型", "Reused question layouts")}: {p.sharedQuestionLayouts}
                </p>
              ))}
            </aside>
          )}
          {data.profileChecks && (
            <aside data-profile-repair-preview className="space-y-2 rounded-xl border p-4">
              <h3 className="font-bold">
                {t(
                  "失效展示與相容性：唯讀修復預覽",
                  "Unavailable display and compatibility: read-only repair preview",
                )}
              </h3>
              <p>
                {t("不相容設定", "Incompatible settings")}: {data.profileChecks.incompatible} ·{" "}
                {t("可由本人移除失效選项", "Settings with removable unavailable choices")}:{" "}
                {data.profileChecks.repairable} · {t("失效選擇", "Unavailable selections")}:{" "}
                {data.profileChecks.removableSelections}
              </p>
              <p className="text-sm">
                {t(
                  "沒有套用修復、不輸出私人正文或帳戶識別。只預覽依目前來源移除不可展示選項；未知schema不推定修復。本人仍由原編輯頁確認保存，備份／不同檔還原沿既有工具。",
                  "No repairs are applied, private prose and account identifiers are not output. Only removing unavailable choices is previewed against current sources; unknown schemas are not assumed repairable. Owners confirm changes in the existing editor; backup and different-file restore use existing tools.",
                )}
              </p>
            </aside>
          )}
        </>
      )}
    </section>
  );
}
