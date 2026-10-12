import { taskRows, type TaskFilters } from "@/lib/supply-tasks.mjs";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { useDiscoveryText } from "@/lib/discovery-copy";
import type { SupplyPackage } from "@/lib/supply-store";
const filters = [
  ["all", "全部", "All"],
  ["submitted", "待審", "Submitted"],
  ["returned", "退回", "Returned"],
  ["approved", "已核准", "Approved"],
  ["published", "已發布快照", "Published snapshot"],
  ["upcoming", "即將公開", "Upcoming"],
  ["expired", "已到期", "Expired"],
];
export function SupplyTasks({
  packages,
  select,
  conditions,
  change,
}: {
  packages: SupplyPackage[];
  select: (id: string) => void;
  conditions: TaskFilters;
  change: (next: TaskFilters) => void;
}) {
  const t = useDiscoveryText(),
    { locale } = useLocale(),
    filter = conditions.status,
    setFilter = (status: string) => change({ ...conditions, status });
  const rows = taskRows(packages, conditions, locale);
  return (
    <section className="panel space-y-4 p-4" data-supply-tasks>
      <h2 className="text-xl font-semibold">
        {t("官方內容排程與待辦", "Official publication tasks")}
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <label>
          {t("名稱／ID查找", "Find name / ID")}
          <input
            aria-label="Supply task search"
            className="block w-full rounded border bg-background p-2"
            maxLength={200}
            value={conditions.q}
            onChange={(e) => change({ ...conditions, q: e.target.value })}
          />
        </label>
        <label>
          {t("創作者", "Creator")}
          <select
            aria-label="Supply task creator"
            className="block w-full rounded border bg-background p-2"
            value={conditions.creator}
            onChange={(e) => change({ ...conditions, creator: e.target.value })}
          >
            <option value="">{t("全部創作者", "All creators")}</option>
            {[...new Set(packages.map((p) => p.data.creatorId))].sort().map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("排序", "Sort")}
          <select
            aria-label="Supply task sort"
            className="block w-full rounded border bg-background p-2"
            value={conditions.sort}
            onChange={(e) => change({ ...conditions, sort: e.target.value })}
          >
            <option value="submitted">{t("送審時間在前", "Submission time first")}</option>
            <option value="deadline">{t("下一個已知期限在前", "Next known boundary first")}</option>
          </select>
        </label>
      </div>
      <Button
        variant="outline"
        onClick={() => change({ q: "", creator: "", status: "all", sort: "submitted" })}
      >
        {t("清除待辦條件", "Clear task filters")}
      </Button>
      <label className="block">
        {t("狀態篩選", "Filter status")}{" "}
        <select
          aria-label="Supply task filter"
          className="border bg-background p-2"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {filters.map(([id, zh, en]) => (
            <option key={id} value={id}>
              {t(zh!, en!)}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm">
        {t(
          "發布快照不代表目前公開。期間由伺服器判斷；重新載入可確認最新期限。示意用途不是正式授權。",
          "A published snapshot is not necessarily public now. Periods are evaluated by the server; reload to check deadlines. Sample uses are not formal authorization.",
        )}
      </p>
      {!rows.length && (
        <p role="status">{t("此篩選目前沒有待辦內容。", "No packages match this filter.")}</p>
      )}
      <p role="status" data-task-count>
        {t("目前結果：", "Current results: ")}
        {rows.length}
      </p>
      <p data-task-summary className="text-sm text-muted-foreground">
        {t("本篩選待審", "Submitted in this filter")}{" "}
        {rows.filter((p) => p.data.status === "submitted").length} ·{" "}
        {t("需重新審核", "Re-review needed")}{" "}
        {rows.filter((p) => p.data.schedule.needsReview).length} ·{" "}
        {t("有必要缺項的內容包", "Packages with missing requirements")}{" "}
        {rows.filter((p) => p.data.issues.length > 0).length}
      </p>
      {rows.map(({ data: p }) => {
        const v = p.revisions.find((r) => r.revision === p.draftRevision)!.value;
        return (
          <article key={p.id} className="space-y-2 border-t pt-3 break-words" data-task-id={p.id}>
            <p>
              {p.id} · {p.creatorId}
            </p>
            <p>
              {t("既有送審時間／下一已知期限", "Recorded submission / next known boundary")}:{" "}
              {p.schedule.submittedAt ?? "—"} / {p.schedule.nextBoundary ?? "—"}
            </p>
            <h3 className="font-semibold">{v.copy.title[locale] || p.id}</h3>
            <p>
              {t("草稿／待審／核准／發布版本", "Draft / submitted / approved / published revision")}
              : {p.draftRevision} / {p.submittedRevision ?? "—"} / {p.approvedRevision ?? "—"} /{" "}
              {p.publishedRevision ?? "—"}
            </p>
            <p>
              {t(
                "草稿公開期間（起含／迄不含）",
                "Draft publication period (start inclusive / end exclusive)",
              )}
              : {v.releaseAt || "—"} → {v.withdrawAt || "—"}
            </p>
            <p>
              {p.schedule.visible
                ? t("目前公開", "Public now")
                : t("目前不在公開投影", "Absent from public projection")}{" "}
              ·{" "}
              {p.schedule.publicPeriod === "expired" || p.schedule.draftPeriod === "expired"
                ? t("內容到期", "Content expired")
                : p.schedule.publicPeriod === "upcoming" || p.schedule.draftPeriod === "upcoming"
                  ? t("尚未到公開期間", "Publication has not begun")
                  : t("期間有效／尚未設定", "Current period / not set")}
            </p>
            {p.schedule.needsReview && (
              <p>
                {t(
                  "目前草稿需要重新審核；既有公開快照保留。",
                  "Current draft needs review; any published snapshot is retained.",
                )}
              </p>
            )}
            {v.materials.map((m) => (
              <p key={m.id}>
                {t("草稿素材", "Draft material")} {m.id} v{m.version}: {m.startAt || "—"} →{" "}
                {m.endAt || "—"} · {t("網站／社群／印製", "Website / social / printing")}:{" "}
                {m.uses.website} / {m.uses.social} / {m.uses.print}{" "}
                {Object.values(m.uses).includes("pending") &&
                  t("· 素材用途待核定", "· Material use pending")}
              </p>
            ))}
            {p.issues.length > 0 && (
              <p>
                {t("必要缺項", "Required missing items")}: {p.issues.join(", ")}
              </p>
            )}
            <Button variant="outline" data-task-open={p.id} onClick={() => select(p.id)}>
              {t("進入原審核流程", "Open existing review workflow")}
            </Button>
          </article>
        );
      })}
      <Link className="underline" to="/admin/discovery">
        {t("其他 discovery 內容管理", "Manage other discovery content")}
      </Link>
    </section>
  );
}
