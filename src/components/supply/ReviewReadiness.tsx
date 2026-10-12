import type { SupplyPackage } from "@/lib/supply-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
export function ReviewReadiness({
  pack,
  target,
  blocked,
}: {
  pack: SupplyPackage;
  target: string;
  blocked: boolean;
}) {
  const t = useDiscoveryText(),
    p = pack.data,
    current = target === String(p.draftRevision);
  return (
    <section data-review-readiness className="panel space-y-2 p-4">
      <h3 className="font-bold">{t("指定保存版審核前檢查", "Saved-revision review precheck")}</h3>
      <p>
        {t("比較目標", "Comparison target")} v{target} ·{" "}
        {current
          ? t("目前保存版", "Current saved revision")
          : t(
              "舊版比較，不可審核目前新版",
              "Historical comparison; current review is blocked",
            )}{" "}
        · {t("文件版本", "Document version")} {pack.version}
      </p>
      <p>
        {t("送審／核准／公開快照", "Submitted / approved / public snapshot")}:{" "}
        {p.submittedRevision ?? "—"} / {p.approvedRevision ?? "—"} / {p.publishedRevision ?? "—"}
      </p>
      <p>
        {t("服務端讀取時檢查", "Server check at read")}: {p.schedule.checkedAt} · {p.status}
      </p>
      <p>
        {blocked
          ? t(
              "版本比較不符合／資料已變更：先重新讀取再審核。",
              "Comparison mismatch or changed data: reload before review.",
            )
          : t(
              "每次操作仍重新驗證版本、角色與完整性；此摘要不是核准。",
              "Every action rechecks version, role and completeness; this summary is not approval.",
            )}
      </p>
      {current && (
        <p>
          {t("服務端必要缺項", "Server-required gaps")}:{" "}
          {p.issues.length ? p.issues.join(" · ") : t("目前無缺項", "None at this read")}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {t(
          "素材示意用途與內容核准不代替正式權利或抽卡授權。",
          "Sample material uses and content approval do not grant formal rights or draw authorization.",
        )}
      </p>
    </section>
  );
}
