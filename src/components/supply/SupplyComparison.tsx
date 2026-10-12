import { useMemo, useState } from "react";
import { supplyDiff } from "@/lib/supply-diff.mjs";
import { useDiscoveryText } from "@/lib/discovery-copy";
import type { SupplyPackage, SupplyValue } from "@/lib/supply-store";
export function SupplyComparison({
  pack,
  value,
  dirty,
  official,
  target,
  onTarget,
}: {
  pack: SupplyPackage;
  value: SupplyValue;
  dirty: boolean;
  official: boolean;
  target: string;
  onTarget: (v: string) => void;
}) {
  const t = useDiscoveryText();
  const [base, setBase] = useState(String(pack.data.publishedRevision ?? pack.data.draftRevision));
  const from = pack.data.revisions.find((r) => String(r.revision) === base)?.value;
  const to =
    target === "working"
      ? value
      : pack.data.revisions.find((r) => String(r.revision) === target)?.value;
  const rows = useMemo(() => supplyDiff(from, to), [from, to]);
  return (
    <section className="panel space-y-3 p-4" data-supply-comparison>
      <h2 className="font-semibold">{t("內容版本比較", "Content revision comparison")}</h2>
      <p>
        {t(
          "只使用本人／官方可讀的既有版本；比較不代表核准。素材示意用途不是正式授權。",
          "Uses existing revisions accessible to the current creator or official. Comparison is not approval; sample uses are not formal authorization.",
        )}
      </p>
      <div className="flex flex-wrap gap-4">
        <label>
          {t("比較基準", "Baseline")}
          <select
            aria-label="Comparison baseline"
            className="ml-2 border bg-background p-2"
            value={base}
            onChange={(e) => setBase(e.target.value)}
          >
            {pack.data.revisions.map((r) => (
              <option key={r.revision} value={r.revision}>
                v{r.revision}
                {r.revision === pack.data.publishedRevision
                  ? t("（公開快照）", " (public snapshot)")
                  : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("比較目標", "Target")}
          <select
            aria-label="Comparison target"
            className="ml-2 border bg-background p-2"
            value={target}
            onChange={(e) => onTarget(e.target.value)}
          >
            {!official && (
              <option value="working">
                {dirty
                  ? t("本機未保存草稿", "Local unsaved draft")
                  : t("目前編輯（與已保存版相同）", "Current editor (same as saved)")}
              </option>
            )}
            {pack.data.revisions.map((r) => (
              <option key={r.revision} value={r.revision}>
                v{r.revision}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p role="status">
        {t("文件版本", "Document version")} {pack.version} ·{" "}
        {official
          ? t("官方只比較服務端已保存版本。", "Officials compare server-saved revisions only.")
          : target === "working" && dirty
            ? t(
                "本機未保存比較：官方無法讀取。",
                "Local unsaved comparison: unavailable to officials.",
              )
            : t("既有版本比較，不寫入資料。", "Existing revision comparison; no data is written.")}
      </p>
      {!rows.length ? (
        <p data-no-difference>{t("沒有差異。", "No differences.")}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.path}>
              <details className="rounded border p-2" data-diff-kind={row.kind}>
                <summary className="cursor-pointer break-all">
                  {t(
                    { added: "新增", changed: "修改", removed: "移除" }[row.kind],
                    { added: "Added", changed: "Changed", removed: "Removed" }[row.kind],
                  )}{" "}
                  · {row.path}
                </summary>
                <div className="grid gap-2 py-2 sm:grid-cols-2">
                  <div>
                    <p>{t("原內容", "Before")}</p>
                    <pre className="whitespace-pre-wrap break-words font-sans">
                      {row.before ?? "—"}
                    </pre>
                  </div>
                  <div>
                    <p>{t("目標內容", "After")}</p>
                    <pre className="whitespace-pre-wrap break-words font-sans">
                      {row.after ?? "—"}
                    </pre>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
