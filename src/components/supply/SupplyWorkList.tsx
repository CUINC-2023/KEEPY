import { supplyWorkRows } from "@/lib/supply-work.mjs";
import { supplyChecklist } from "@/lib/supply-checklist.mjs";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import type { SupplyPackage } from "@/lib/supply-store";
import { Button } from "@/components/ui/button";
export function SupplyWorkList({
  packages,
  query,
  filter,
  onQuery,
  onFilter,
  select,
  selected,
  dirty,
  disabled,
}: {
  packages: SupplyPackage[];
  query: string;
  filter: string;
  onQuery: (v: string) => void;
  onFilter: (v: string) => void;
  select: (id: string) => void;
  selected: string;
  dirty: boolean;
  disabled: boolean;
}) {
  const t = useDiscoveryText(),
    { locale } = useLocale(),
    rows = supplyWorkRows(packages, query, filter);
  return (
    <section className="panel space-y-3 p-4" data-supply-work-list>
      <h2 className="font-semibold">{t("本人內容包工作清單", "My package work list")}</h2>
      <p className="text-sm">
        {t(
          "只查找本人服務端清單；查詢僅留在此頁，不寫入公開URL或瀏覽器共享紀錄。未保存修改不會自動保存。",
          "Searches your server-side list only. Queries stay on this page, outside public URLs and shared browser records. Unsaved edits are not saved automatically.",
        )}
      </p>
      {dirty && (
        <p role="status">
          {t(
            "目前有未保存的本機編輯；查找、篩選或換包會先確認。",
            "Current local edits are unsaved; search, filters or package changes require confirmation.",
          )}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          {t("名稱／ID查找", "Find name / ID")}
          <input
            aria-label="Own package search"
            maxLength={200}
            className="block w-full border bg-background p-2"
            value={query}
            disabled={disabled}
            onChange={(e) => onQuery(e.target.value)}
          />
        </label>
        <label>
          {t("工作狀態", "Work status")}
          <select
            aria-label="Own package status"
            className="block w-full border bg-background p-2"
            value={filter}
            disabled={disabled}
            onChange={(e) => onFilter(e.target.value)}
          >
            {[
              ["all", "全部", "All"],
              ["draft", "服務端草稿", "Server draft"],
              ["submitted", "已送審", "Submitted"],
              ["returned", "退回修改", "Returned"],
              ["approved", "已核准", "Approved"],
              ["published", "已發布快照", "Published snapshot"],
            ].map(([id, zh, en]) => (
              <option key={id} value={id}>
                {t(zh!, en!)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!rows.length && (
        <p data-work-empty role="status">
          {t("沒有符合查找條件的本人內容包。", "No own packages match these conditions.")}
        </p>
      )}
      {rows.map((pack) => {
        const p = pack.data,
          v = p.revisions.find((r) => r.revision === p.draftRevision)!.value,
          checks = supplyChecklist(v, p.issues);
        return (
          <article
            key={p.id}
            className="space-y-2 border-t pt-3 break-words"
            data-work-package={p.id}
          >
            <h3 className="font-bold">{v.copy.title[locale] || p.id}</h3>
            <p>
              {p.id} ·{" "}
              {t(
                {
                  draft: "服務端草稿",
                  submitted: "已送審",
                  returned: "退回",
                  approved: "已核准",
                  published: "已發布",
                }[p.status] ?? p.status,
                p.status,
              )}
              {dirty && selected === p.id
                ? " · " + t("另有未保存編輯", "Also has unsaved edits")
                : ""}
            </p>
            <p>
              {t("草稿／送審／核准／發布版本", "Draft / submitted / approved / public revision")}:{" "}
              {p.draftRevision} / {p.submittedRevision ?? "—"} / {p.approvedRevision ?? "—"} /{" "}
              {p.publishedRevision ?? "—"}
            </p>
            <ol className="space-y-1 text-sm" data-work-checks>
              {checks.map((c) => (
                <li key={c.step}>
                  {t("步驟", "Step")} {c.step} ·{" "}
                  {c.complete ? t("完成", "Complete") : t("缺項", "Missing")}
                  {c.missing.length
                    ? ": " +
                      c.missing
                        .map((m) => [m.field, m.materialId, m.locale].filter(Boolean).join(" / "))
                        .join(", ")
                    : ""}
                  {c.pending.length
                    ? " · " +
                      t("待核定用途", "Uses pending") +
                      ": " +
                      c.pending.map((m) => m.field).join(", ")
                    : ""}
                </li>
              ))}
            </ol>
            <Button variant="outline" disabled={disabled} onClick={() => select(p.id)}>
              {t("進入正常編輯", "Open normal editor")}
            </Button>
          </article>
        );
      })}
    </section>
  );
}
