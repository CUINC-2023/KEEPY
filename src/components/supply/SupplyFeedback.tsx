import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useDiscoveryText } from "@/lib/discovery-copy";
import {
  feedbackTargets,
  feedbackIdentity,
  resolveFeedback,
  feedbackLocation,
  type ReviewFeedback,
} from "@/lib/supply-feedback.mjs";
import { supplyDiff } from "@/lib/supply-diff.mjs";
import type { SupplyPackage, SupplyValue } from "@/lib/supply-store";
import type { SupplyCheckItem } from "@/lib/supply-checklist.mjs";
export function FeedbackEditor({
  value,
  rows,
  change,
  disabled,
}: {
  value: SupplyValue;
  rows: ReviewFeedback[];
  change: (rows: ReviewFeedback[]) => void;
  disabled: boolean;
}) {
  const t = useDiscoveryText(),
    targets = feedbackTargets(value),
    [target, setTarget] = useState(""),
    [note, setNote] = useState("");
  useEffect(() => {
    setTarget("");
    setNote("");
  }, [value]);
  const selected = targets.find((r) => feedbackIdentity(r) === target);
  return (
    <section data-feedback-editor className="panel space-y-3 p-4">
      <h3>{t("退回欄位補充（選填）", "Return field feedback (optional)")}</h3>
      <p>
        {t(
          "只綁定目前指定保存版本；最多10項，每項500字。仍須必填退回理由，不代替正式授權。",
          "Bound only to this specified saved revision; up to 10 entries, 500 characters each. A return reason remains required; this is not formal authorization.",
        )}
      </p>
      <label>
        {t("指定欄位", "Target field")}
        <select
          aria-label="Review feedback target"
          className="block w-full rounded border bg-background p-2"
          value={target}
          disabled={disabled}
          onChange={(e) => setTarget(e.target.value)}
        >
          <option value="">{t("選擇欄位", "Select field")}</option>
          {targets.map((r) => (
            <option key={feedbackIdentity(r)} value={feedbackIdentity(r)}>
              {r.kind} · {r.id || "series"} · {r.field} · {r.locale || "—"}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("具體說明", "Specific note")}
        <textarea
          aria-label="Review feedback note"
          className="block w-full rounded border bg-background p-2"
          maxLength={500}
          value={note}
          disabled={disabled}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <Button
        disabled={disabled || rows.length >= 10 || !selected || !note.trim()}
        onClick={() => {
          if (selected) {
            change([...rows, { ...selected, note }]);
            setNote("");
          }
        }}
      >
        {t("加入退回欄位", "Add return feedback")}
      </Button>
      {rows.map((r, i) => (
        <div key={i} data-pending-feedback className="break-words">
          <p>
            {r.id || "series"} · {r.field} · {r.locale} · {r.note}
          </p>
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => change(rows.filter((_, n) => i !== n))}
          >
            {t("移除此項補充", "Remove this feedback")}
          </Button>
        </div>
      ))}
    </section>
  );
}
export function SupplyFeedback({
  pack,
  value,
  dirty,
  official,
  locate,
}: {
  pack: SupplyPackage;
  value: SupplyValue;
  dirty: boolean;
  official: boolean;
  locate: (step: number, item: SupplyCheckItem) => void;
}) {
  const t = useDiscoveryText(),
    returns = pack.data.reviews.filter((r) => r.decision === "return"),
    [review, setReview] = useState("latest"),
    last = review === "latest" ? returns.at(-1) : returns[Number(review)],
    before = pack.data.revisions.find((r) => r.revision === last?.revision)?.value,
    saved = pack.data.revisions.find((r) => r.revision === pack.data.draftRevision)?.value;
  if (!last || !before || !saved) return null;
  const diffs = supplyDiff(before, saved);
  return (
    <section data-supply-feedback className="panel space-y-3 p-4">
      <h2 className="font-bold">
        {t("指定版本退回與重審", "Revision-bound return and re-review")}
      </h2>
      <details data-review-history className="rounded-lg border p-3">
        <summary>{t("對照既有退回紀錄", "Compare recorded returns")}</summary>
        <ol className="mt-2 space-y-2">
          {returns.map((r, i) => (
            <li key={i} className="break-words">
              v{r.revision} · {r.at}
              <p>{r.reason}</p>
              <p>
                {t("指定欄位補充", "Targeted feedback")}: {r.feedback?.length ?? 0}
              </p>
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted-foreground">
          {t(
            "原事件與理由保持；下方所選事件只對照已保存版本，不宣稱問題已解決。",
            "Original events and reasons remain unchanged. The selected event below compares saved revisions, without claiming resolution.",
          )}
        </p>
      </details>
      <label>
        {t("選擇既有退回事件", "Select existing return event")}
        <select
          aria-label="Return feedback revision"
          className="block w-full rounded border bg-background p-2"
          value={review}
          onChange={(e) => setReview(e.target.value)}
        >
          <option value="latest">{t("最近退回", "Latest return")}</option>
          {returns.map((r, i) => (
            <option key={i} value={i}>
              v{r.revision} · {r.at}
            </option>
          ))}
        </select>
      </label>
      <p>
        {t("所選退回版本", "Selected returned revision")} v{last.revision} · {last.reason}
      </p>
      <p>
        {t("對照目前已保存草稿", "Compared with current saved draft")} v{pack.data.draftRevision} ·{" "}
        {t(
          "欄位變動不代表問題已解決；仍須明確重送與指定版核准。",
          "Changed fields do not mean resolved feedback; explicit resubmission and exact-version approval remain required.",
        )}
      </p>
      {dirty && !official && (
        <p>
          {t(
            "定位可進入本人本機未保存草稿；下方差異只比較已保存版本，官方讀不到未保存內容。",
            "Navigation uses your local unsaved draft; the differences below compare saved revisions only. Officials cannot read unsaved content.",
          )}
        </p>
      )}
      {(last.feedback ?? []).map((r, i) => {
        const old = resolveFeedback(before, r),
          next = resolveFeedback(saved, r),
          working = resolveFeedback(value, r),
          moved =
            (r.kind === "article" &&
              before.editorial?.articles.findIndex((a) => a.id === r.id) !==
                value.editorial?.articles.findIndex((a) => a.id === r.id)) ||
            (r.kind === "material" &&
              before.materials.findIndex((m) => m.id === r.id) !==
                value.materials.findIndex((m) => m.id === r.id));
        const state = !next.exists
          ? t("已保存目標已刪除", "Saved target removed")
          : JSON.stringify(old.value) !== JSON.stringify(next.value)
            ? t("已保存欄位有變動，待重審", "Saved field changed; awaiting re-review")
            : t("已保存欄位相同", "Saved field unchanged");
        return (
          <div key={i} data-return-feedback className="rounded border p-3 break-words">
            <p>
              v{last.revision} · {r.id || "series"} · {r.field} · {r.locale} · {r.note}
            </p>
            <p>{state}</p>
            {(!working.exists || moved) && (
              <p data-feedback-target-changed>
                {t(
                  "原版目標已變更；按ID重新定位，不使用舊索引。",
                  "Original target changed; navigation resolves by ID, never an old index.",
                )}
              </p>
            )}
            <Button
              variant="outline"
              disabled={!working.exists}
              onClick={() => {
                const l = feedbackLocation(r);
                locate(l.step, l.item);
              }}
            >
              {t("定位本人／官方可見欄位", "Locate authorized field")}
            </Button>
          </div>
        );
      })}
      <details data-return-diff>
        <summary>
          {t("退回版 → 目前已保存版差異", "Returned → current saved revision differences")} (
          {diffs.length})
        </summary>
        {!diffs.length ? (
          <p>{t("沒有差異。", "No differences.")}</p>
        ) : (
          <ul className="space-y-2">
            {diffs.map((r) => (
              <li key={r.path} className="break-words">
                <p>
                  {r.kind} · {r.path}
                </p>
                <pre className="whitespace-pre-wrap break-words font-sans">
                  {r.before ?? "—"} → {r.after ?? "—"}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </details>
      <details>
        <summary>{t("既有退回歷史", "Existing return history")}</summary>
        {returns.map((r, i) => (
          <p key={i}>
            v{r.revision} · {r.reason} · {r.at} · {t("欄位補充", "Field entries")}:{" "}
            {r.feedback?.length ?? 0}
          </p>
        ))}
      </details>
    </section>
  );
}
