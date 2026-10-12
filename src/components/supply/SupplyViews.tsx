import { FeedbackEditor, SupplyFeedback } from "./SupplyFeedback";
import { SupplyTemplateReuse } from "./SupplyTemplateReuse";
import { SupplyPlayReuse } from "./SupplyPlayReuse";
import type { ReviewFeedback } from "@/lib/supply-feedback.mjs";
import type { TaskFilters } from "@/lib/supply-tasks.mjs";
import { SupplyWorkList } from "./SupplyWorkList";
import { supplyHasPending } from "@/lib/supply-store";
import { SupplyPublicPreview } from "./SupplyPublicPreview";
import { moveItem } from "@/lib/editorial-draft.mjs";
import { SupplyComparison } from "./SupplyComparison";
import { localApi, localTestState, localSessionGeneration } from "@/lib/local-test-client";
import type { SupplyList } from "@/lib/supply-store";
import { EditorialEditor } from "./EditorialEditor";
import { SAMPLE_PACKAGE_ID, sampleUniformPackage } from "@/lib/sample-022.mjs";
import { SupplyChecklistView } from "./SupplyChecklistView";
import { supplyChecklist } from "@/lib/supply-checklist.mjs";
import { SupplyTasks } from "./SupplyTasks";
import { ReviewReadiness } from "./ReviewReadiness";
import { useEffect, useState } from "react";
import { Link, useBlocker } from "@tanstack/react-router";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { useSupply, useLocalHead } from "@/lib/content-store";
import {
  supplySend,
  supplyRetry,
  emptySupply,
  type SupplyValue,
  type SupplyMaterial,
  type SampleUse,
} from "@/lib/supply-store";
import type { SupplyCheckItem } from "@/lib/supply-checklist.mjs";
import type { Bilingual } from "@/lib/collection-store";
const steps = [
  ["合作申請", "Application"],
  ["素材與權利", "Materials and rights"],
  ["系列企劃", "Series planning"],
  ["卡面製作", "Card production"],
  ["上架檢查", "Publication checks"],
  ["宣傳配套", "Promotion"],
  ["成效回顧", "Retrospective"],
];
const labels = {
  title: ["標題", "Title"],
  summary: ["摘要", "Summary"],
  story: ["故事", "Story"],
  goal: ["收藏目標", "Collection goal"],
  endPolicy: ["結束後政策", "After-series policy"],
  teaser: ["預告", "Teaser"],
};
function TextPair({
  label,
  value,
  onChange,
  field,
}: {
  field?: string;
  label: string;
  value: Bilingual;
  onChange?: ((v: Bilingual) => void) | undefined;
}) {
  return (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className="mb-2 font-semibold">{label}</legend>
      {(["zh-TW", "en"] as const).map((l) => (
        <label key={l} className="block space-y-1 text-sm">
          <span>
            {label} · {l}
          </span>
          <textarea
            data-supply-field={field}
            data-locale={l}
            aria-label={label + " " + l}
            className="w-full rounded-lg border bg-background p-3"
            rows={3}
            maxLength={2000}
            readOnly={!onChange}
            value={value[l]}
            onChange={(e) => onChange?.({ ...value, [l]: e.target.value })}
          />
        </label>
      ))}
    </fieldset>
  );
}
function MaterialEditor({
  m,
  change,
  remove,
}: {
  m: SupplyMaterial;
  change?: ((m: SupplyMaterial) => void) | undefined;
  remove?: (() => void) | undefined;
}) {
  const t = useDiscoveryText(),
    update = (v: Partial<SupplyMaterial>) => change?.({ ...m, ...v });
  return (
    <article className="panel space-y-3 p-4" data-material-id={m.id}>
      <p className="font-semibold">{m.id}</p>
      <label className="block">
        {t("本機素材", "Local material")}
        <select
          aria-label={"Material reference " + m.id}
          className="ml-2 border bg-background p-2"
          disabled={!change}
          value={m.ref}
          onChange={(e) => update({ ref: e.target.value as SupplyMaterial["ref"] })}
        >
          <option value="season-hero">
            {t("既有季節主視覺（示意）", "Existing season artwork (sample)")}
          </option>
          <option value="text-only">{t("純文字示意素材", "Text-only sample")}</option>
        </select>
      </label>
      {(["version", "source", "evidence", "startAt", "endAt", "cardId"] as const).map((k) => (
        <label key={k} className="block space-y-1">
          <span>
            {t(
              {
                version: "素材版本（修改時增加）",
                source: "素材來源",
                evidence: "來源證據／權利說明",
                startAt: "使用開始（含）",
                endAt: "使用結束（不含）",
                cardId: "關聯卡牌 ID（選填）",
              }[k],
              {
                version: "Material version (increase on change)",
                source: "Source",
                evidence: "Source evidence / rights note",
                startAt: "Use begins (inclusive)",
                endAt: "Use ends (exclusive)",
                cardId: "Related card ID (optional)",
              }[k],
            )}
          </span>
          <input
            aria-label={"Material " + k + " " + m.id}
            className="w-full rounded border bg-background p-2"
            type={k === "version" ? "number" : "text"}
            min={1}
            maxLength={2000}
            readOnly={!change}
            value={m[k]}
            onChange={(e) =>
              update({ [k]: k === "version" ? Number(e.target.value) : e.target.value })
            }
          />
        </label>
      ))}
      <div className="grid gap-3 sm:grid-cols-3">
        {(["website", "social", "print"] as const).map((k) => (
          <label key={k}>
            {t(
              { website: "網站展示", social: "社群宣傳", print: "印製用途" }[k],
              { website: "Website display", social: "Social promotion", print: "Printing" }[k],
            )}
            <select
              aria-label={"Material use " + k + " " + m.id}
              className="block w-full border bg-background p-2"
              disabled={!change}
              value={m.uses[k]}
              onChange={(e) => update({ uses: { ...m.uses, [k]: e.target.value as SampleUse } })}
            >
              <option value="pending">{t("待核定", "Pending")}</option>
              <option value="sample-confirmed">
                {t("本機示意可用", "Local sample confirmed")}
              </option>
              <option value="not-requested">{t("未申請", "Not requested")}</option>
            </select>
          </label>
        ))}
      </div>
      <TextPair
        label={t("替代文字", "Alternative text")}
        value={m.alt}
        onChange={change ? (v) => update({ alt: v }) : undefined}
      />
      {remove && (
        <Button variant="outline" onClick={remove}>
          {t("移除此草稿素材", "Remove draft material")}
        </Button>
      )}
    </article>
  );
}
export function SupplyPage({ official = false }: { official?: boolean }) {
  const d = useSupply(official),
    t = useDiscoveryText(),
    { locale } = useLocale();
  const [selected, setSelected] = useState(""),
    [id, setId] = useState(""),
    [taskConditions, setTaskConditions] = useState<TaskFilters>({
      q: "",
      creator: "",
      status: "all",
      sort: "submitted",
    }),
    [workQuery, setWorkQuery] = useState(""),
    [workFilter, setWorkFilter] = useState("all"),
    [value, setValue] = useState<SupplyValue | null>(null),
    [step, setStep] = useState(0),
    [message, setMessage] = useState(""),
    [reason, setReason] = useState(""),
    [feedback, setFeedback] = useState<ReviewFeedback[]>([]),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [boundVersion, setBoundVersion] = useState(0),
    [comparisonTarget, setComparisonTarget] = useState("working"),
    [reviewConflict, setReviewConflict] = useState(false),
    [discardAction, setDiscardAction] = useState<(() => void) | null>(null);
  const blocker = useBlocker({
    shouldBlockFn: () => dirty && d.allowed,
    disabled: official || !dirty || !d.allowed,
    enableBeforeUnload: !official && dirty && d.allowed,
    withResolver: true,
  });
  const awaiting = supplyHasPending(official);
  const protectDraft = (action: () => void, confirmingOriginal = false) => {
    if (awaiting && !confirmingOriginal) {
      setMessage(
        t(
          "先以原key確認待確認操作，再修改或換內容包。",
          "Confirm the pending operation with its original key before editing or switching packages.",
        ),
      );
      return;
    }
    if (dirty && !official && !confirmingOriginal) setDiscardAction(() => action);
    else action();
  };
  useLocalHead(
    t(
      official ? "KEEPY · 創作者素材審核" : "KEEPY · 創作者七步交付",
      official ? "KEEPY · Creator material review" : "KEEPY · Seven-step creator delivery",
    ),
    t(
      "本機示意內容交付與版本審核，非有效電子簽約。",
      "Local sample delivery and version review, not electronic signing.",
    ),
  );
  useEffect(() => {
    setSelected("");
    setTaskConditions({ q: "", creator: "", status: "all", sort: "submitted" });
    setWorkQuery("");
    setWorkFilter("all");
    setValue(null);
    setMessage("");
    setDirty(false);
    setReason("");
    setFeedback([]);
    setDiscardAction(null);
    setReviewConflict(false);
    setComparisonTarget("working");
  }, [d.actor]);
  const packages = d.data?.packages ?? [],
    current = packages.find((p) => p.data.id === selected);
  useEffect(() => {
    if (official && (!d.data || (selected && !current))) {
      setSelected("");
      setValue(null);
      setReason("");
      setFeedback([]);
      setReviewConflict(false);
    }
  }, [official, d.data, selected, current]);
  const select = (next: string) => {
    setSelected(next);
    setReason("");
    setFeedback([]);
    setMessage("");
    setDirty(false);
    const p = packages.find((p) => p.data.id === next);
    setValue(
      p
        ? structuredClone(p.data.revisions.find((r) => r.revision === p.data.draftRevision)!.value)
        : d.data?.context
          ? emptySupply(d.data.context)
          : null,
    );
    setBoundVersion(p?.version ?? 0);
    setComparisonTarget(official ? String(p?.data.draftRevision ?? 0) : "working");
    setReviewConflict(false);
    setId(next || "local-package-" + Date.now().toString(36));
  };
  const locate = (next: number, item: SupplyCheckItem) => {
    setStep(next - 1);
    requestAnimationFrame(() => {
      const article = Array.from(
        document.querySelectorAll<HTMLElement>("[data-editorial-article-id]"),
      ).find((e) => e.dataset["editorialArticleId"] === item.materialId);
      let target: HTMLElement | undefined;
      if (article) {
        const match = item.field.match(/(?:block|material-block)-(\d+)/);
        const scope = match
          ? article.querySelector<HTMLElement>(
              '[data-editorial-block-index="' + (Number(match[1]) - 1) + '"]',
            )
          : article;
        target = Array.from(
          scope?.querySelectorAll<HTMLElement>("textarea,select,input") ?? [],
        ).find(
          (e) =>
            (!item.locale || e.dataset["locale"] === item.locale) &&
            (match ||
              e.dataset["editorialField"] ===
                (item.field === "questions" ? "question-1" : item.field)),
        );
        if (item.field === "blocks") {
          article.setAttribute("tabindex", "-1");
          target = article;
        }
      } else if (item.materialId) {
        const material = Array.from(
          document.querySelectorAll<HTMLElement>("[data-material-id]"),
        ).find((e) => e.dataset["materialId"] === item.materialId);
        target = Array.from(
          material?.querySelectorAll<HTMLElement>("input,textarea,select") ?? [],
        ).find((e) =>
          item.field === "alt"
            ? e.getAttribute("aria-label")?.endsWith(item.locale)
            : e.getAttribute("aria-label") ===
              "Material " +
                (["website", "social", "print"].includes(item.field)
                  ? "use " + item.field
                  : item.field === "reference"
                    ? "reference"
                    : item.field === "coverage"
                      ? "startAt"
                      : item.field) +
                " " +
                item.materialId,
        );
        if (!target && material) {
          material.setAttribute("tabindex", "-1");
          target = material;
        }
      } else
        target = Array.from(
          document.querySelectorAll<HTMLElement>("textarea,input,select,[data-supply-field]"),
        ).find(
          (e) =>
            (e.dataset["supplyField"] === item.field ||
              e.dataset["editorialField"] ===
                (item.field === "questions" ? "question-1" : item.field)) &&
            (!item.locale || e.dataset["locale"] === item.locale),
        );
      target ??= document.querySelector<HTMLElement>("[data-editorial-editor]") ?? undefined;
      if (target?.matches(":disabled")) {
        target = target.closest<HTMLElement>("label") ?? target;
        target.setAttribute("tabindex", "-1");
      }
      target?.focus();
      target?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  };
  const update = (v: SupplyValue) => {
    if (awaiting) return;
    setValue(v);
    setDirty(true);
  };
  const reorderMaterial = (index: number, delta: number) => {
    if (!value || official || awaiting) return;
    const materialId = value.materials[index]?.id;
    update({ ...value, materials: moveItem(value.materials, index, delta) });
    requestAnimationFrame(() => {
      const entry = [...document.querySelectorAll<HTMLElement>("[data-material-order]")].find(
        (el) => el.dataset["materialOrder"] === materialId,
      );
      entry?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    });
  };
  const refresh = async () => {
    await d.load();
    setValue(null);
    setSelected("");
    setDirty(false);
    setMessage(t("已重新載入，請選擇內容包。", "Reloaded. Select a package."));
  };
  const checkVersion = async () => {
    const actor = d.actor;
    const latest = await localApi<SupplyList>("/admin/supply");
    if (actor !== localTestState().summary?.user.id || latest.actorId !== actor)
      throw Error(t("身分已變更，請重新讀取。", "Identity changed. Reload."));
    if (latest.packages.find((p) => p.data.id === selected)?.version !== boundVersion) {
      setReviewConflict(true);
      throw Error(
        t(
          "已保存版本已變更；請重新載入版本後比較與審核。",
          "Saved version changed. Reload before comparing or reviewing.",
        ),
      );
    }
    return true;
  };
  const reviewBlocked = reviewConflict || comparisonTarget !== String(current?.data.draftRevision);
  const [submitSummary, setSubmitSummary] = useState<{
    actor: string | undefined;
    id: string;
    version: number;
    revision: number;
  } | null>(null);
  const requiredMissing = value
    ? supplyChecklist(value, current?.data.issues ?? [])
        .filter((c) => c.requiredForSubmission)
        .flatMap((c) => c.missing)
    : [];
  const submission =
    submitSummary &&
    submitSummary.actor === d.actor &&
    submitSummary.id === selected &&
    submitSummary.version === boundVersion &&
    submitSummary.revision === current?.data.draftRevision &&
    !dirty &&
    !official
      ? submitSummary
      : null;
  const send = async (action: string) => {
    if (!value) return;
    const actionActor = d.actor,
      actionEpoch = localSessionGeneration();
    const active = () =>
      actionActor === localTestState().summary?.user.id && actionEpoch === localSessionGeneration();
    setBusy(true);
    setMessage("");
    try {
      if (official) {
        if (reviewBlocked)
          throw Error(
            t(
              "請比較目前指定版本並重新確認。",
              "Compare the current specified revision and confirm again.",
            ),
          );
        await checkVersion();
      }
      await supplySend(official, {
        action,
        id: current?.data.id ?? id,
        expectedVersion: boundVersion,
        revision:
          action === "save"
            ? null
            : action === "withdraw"
              ? current?.data.publishedRevision
              : current?.data.draftRevision,
        expectedDiscoveryVersion: ["publish", "withdraw"].includes(action)
          ? d.data?.discoveryVersion
          : null,
        value: action === "save" ? value : null,
        reason: ["return", "approve"].includes(action) ? reason : "",
        ...(action === "return" && feedback.length ? { feedback } : {}),
      });
      if (!active()) return;
      await d.load();
      if (!active()) return;
      setValue(null);
      setSelected("");
      setDirty(false);
      setMessage(t("已保存版本，請重新選擇內容包。", "Version saved. Select the package again."));
    } catch (e) {
      if (active()) setMessage(String(e));
    } finally {
      if (active()) setBusy(false);
    }
  };
  if (!d.allowed)
    return (
      <div className="panel space-y-3 p-6">
        <h1>{t("創作者供給與素材審核", "Creator delivery and material review")}</h1>
        <p>
          {t(
            official ? "需要目前有效官方身分。" : "需要目前有效創作者身分。",
            official
              ? "A current official role is required."
              : "A current creator role is required.",
          )}
        </p>
        <Link to="/local-test">{t("選擇本機測試身分", "Select a Local Test identity")}</Link>
      </div>
    );
  const readOnly = official || awaiting;
  return (
    <div className="space-y-6 p-4 md:p-8" data-supply-page>
      <ConfirmDialog
        open={!!submission}
        title={t("送審指定保存版本？", "Submit the specified saved revision?")}
        description={
          submission
            ? `${submission.id} · v${submission.revision} · ${t("保存文件版本", "Saved document version")} ${submission.version}`
            : ""
        }
        onCancel={() => setSubmitSummary(null)}
        onConfirm={() => {
          if (!submission || busy || awaiting || requiredMissing.length) return;
          setSubmitSummary(null);
          void send("submit");
        }}
      >
        <p>
          {t(
            "本次只送審已保存版本，舊公開快照保持；修改後仍須指定版重新核准。",
            "Only this saved revision is submitted. The previous public snapshot remains; modifications require exact-version reapproval.",
          )}
        </p>
        <p>
          {t("必要缺項", "Required missing items")}: {requiredMissing.length}
        </p>
      </ConfirmDialog>
      <ConfirmDialog
        open={discardAction !== null || blocker.status === "blocked"}
        title={t("放棄未保存修改？", "Discard unsaved changes?")}
        description={t(
          "修改尚未保存。繼續將放棄本次編輯；已保存、送審與發布版本不會改變。",
          "Your edits have not been saved. Continuing discards these edits; saved, submitted and published revisions stay intact.",
        )}
        confirmLabel={t("放棄修改並繼續", "Discard and continue")}
        cancelLabel={t("繼續編輯", "Keep editing")}
        tone="danger"
        onCancel={() => {
          setDiscardAction(null);
          if (blocker.status === "blocked") blocker.reset();
        }}
        onConfirm={() => {
          const action = discardAction;
          setDiscardAction(null);
          setDirty(false);
          if (action) action();
          else if (blocker.status === "blocked") blocker.proceed();
        }}
      />
      <h1 className="text-2xl font-bold">
        {t(
          official ? "創作者內容包與素材審核" : "創作者七步交付",
          official ? "Creator packages and material review" : "Seven-step creator delivery",
        )}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t(
          "本機測試 · 所有合作與素材為示意。網站、社群及印製用途分開，報酬沿既有合約；未知條件待核定。這不是有效簽約、抽卡授權或實體履約。",
          "Local Test · All collaborations and materials are samples. Website, social and printing uses are separate; remuneration uses existing contracts. Unknown terms remain pending. This is not signing, draw authorization or physical fulfillment.",
        )}
      </p>
      <details className="panel p-3" data-save-guidance>
        <summary className="cursor-pointer font-semibold">
          {t("保存與審核操作提示", "Saving and review guidance")}
        </summary>
        <p className="mt-2 text-sm">
          {t(
            "先保存，再送審已保存版本；核准不等於發布，修改後須重新審核。版本衝突請保留／複製本人編輯，重新載入比較。回應丟失請使用下方待確認操作按鈕，以原 key 和原輸入確認；不要另建請求或換帳號重送。本機示意用途不等於正式授權。",
            "Save before submitting the saved revision. Approval is not publication; changes require re-review. On conflict, retain/copy your edits and reload to compare. If a response is lost, use the pending-operation button below with the original key/input; do not create a new request or retry as another account. Sample uses are not formal authorization.",
          )}
        </p>
        <Link className="underline" to="/local-test">
          {t("本機操作與保存說明", "Local operation and storage guide")}
        </Link>
      </details>
      {d.error ? (
        <div role="alert">
          <p>{t("內容包無法載入。", "Packages unavailable.")}</p>
          <Button onClick={() => protectDraft(() => void refresh())}>
            {t("重試載入", "Retry loading")}
          </Button>
        </div>
      ) : !d.loaded ? (
        <p role="status">{t("載入中…", "Loading…")}</p>
      ) : null}
      {official && d.loaded && !d.error && (
        <SupplyTasks
          packages={packages}
          conditions={taskConditions}
          change={setTaskConditions}
          select={(id) =>
            protectDraft(() => {
              select(id);
              requestAnimationFrame(() =>
                document.querySelector<HTMLElement>('[aria-label="Supply package"]')?.focus(),
              );
            })
          }
        />
      )}
      {official && current && (
        <Button
          data-return-tasks
          variant="outline"
          onClick={() =>
            protectDraft(() => {
              const old = selected;
              setSelected("");
              setValue(null);
              requestAnimationFrame(() => {
                const target =
                  Array.from(document.querySelectorAll<HTMLElement>("[data-task-open]")).find(
                    (e) => e.dataset["taskOpen"] === old,
                  ) ?? document.querySelector<HTMLElement>('[aria-label="Supply task search"]');
                target?.focus();
                target?.scrollIntoView({ block: "center" });
              });
            })
          }
        >
          {t("返回待辦（保留條件）", "Back to tasks (keep filters)")}
        </Button>
      )}
      {!official && d.loaded && !d.error && (
        <SupplyWorkList
          packages={packages}
          query={workQuery}
          filter={workFilter}
          onQuery={(q) =>
            protectDraft(() => {
              if (dirty) select(selected);
              setWorkQuery(q);
            })
          }
          onFilter={(f) =>
            protectDraft(() => {
              if (dirty) select(selected);
              setWorkFilter(f);
            })
          }
          select={(id) => protectDraft(() => select(id))}
          selected={selected}
          dirty={dirty}
          disabled={busy || awaiting}
        />
      )}
      {awaiting && (
        <p role="alert" data-supply-pending>
          {t(
            "原操作待確認：編輯與換包暫停。請使用下方原key確認按鈕。",
            "Original operation unconfirmed: editing and package switching paused. Use the original-key confirmation button below.",
          )}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <label>
          {t("內容包", "Package")}
          <select
            aria-label="Supply package"
            className="ml-2 max-w-full border bg-background p-2"
            value={selected}
            disabled={busy || awaiting}
            onChange={(e) => {
              const next = e.target.value;
              protectDraft(() => select(next));
            }}
          >
            <option value="">{t("選擇内容包", "Select a package")}</option>
            {packages.map((p) => (
              <option key={p.data.id} value={p.data.id}>
                {p.data.id} · v{p.data.draftRevision} · {p.data.status}
              </option>
            ))}
          </select>
        </label>
        {!official && (
          <Button disabled={busy} onClick={() => protectDraft(() => select(""))}>
            {t("新增本人內容包", "New own package")}
          </Button>
        )}
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => protectDraft(() => void refresh())}
        >
          {t("重新載入版本", "Reload versions")}
        </Button>
      </div>
      {d.loaded && !d.error && !packages.length && <p>{t("尚無內容包。", "No packages yet.")}</p>}
      {message && d.data && d.allowed && (
        <p role="status" className="break-words">
          {message}
        </p>
      )}
      <Button
        variant="outline"
        disabled={busy}
        onClick={() =>
          protectDraft(async () => {
            setBusy(true);
            try {
              await supplyRetry(official);
              await refresh();
              setMessage(
                t(
                  "已確認原操作，請選擇內容包。",
                  "Original operation confirmed. Select a package.",
                ),
              );
            } catch (e) {
              setMessage(String(e));
            } finally {
              setBusy(false);
            }
          }, true)
        }
      >
        {t("重試內容包待確認操作", "Retry unconfirmed package operation")}
      </Button>
      {!official &&
        d.data?.context?.creatorId === "g-yoru" &&
        !packages.some((p) => p.data.id === SAMPLE_PACKAGE_ID) && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              protectDraft(() => {
                setSelected("");
                setBoundVersion(0);
                setId(SAMPLE_PACKAGE_ID);
                setValue(sampleUniformPackage(d.data!.context!.partners[0]!.id));
                setDirty(true);
                setMessage(
                  t(
                    "已載入制服序章虛構草稿；尚未保存、送審或發布。期間僅供本機測試。",
                    "Fictional Uniform Prologue draft loaded; not saved, submitted or published. Dates are for local testing only.",
                  ),
                );
              })
            }
          >
            {t("載入 0.22 制服序章示意草稿", "Load 0.22 Uniform Prologue sample draft")}
          </Button>
        )}
      {value && d.data && !d.error && d.allowed && (
        <>
          {!official && (
            <SupplyTemplateReuse
              key={"template:" + d.actor + ":" + (current?.data.id ?? id)}
              value={value}
              disabled={busy || awaiting}
              onChange={update}
            />
          )}
          {official && current && (
            <ReviewReadiness pack={current} target={comparisonTarget} blocked={reviewBlocked} />
          )}
          {!official && (
            <SupplyPlayReuse
              key={"play-outline:" + d.actor + ":" + (current?.data.id ?? id)}
              value={value}
              disabled={busy || awaiting}
              onChange={update}
            />
          )}
          {current && (
            <SupplyComparison
              key={current.data.id}
              pack={current}
              value={value}
              dirty={dirty}
              official={official}
              target={comparisonTarget}
              onTarget={setComparisonTarget}
            />
          )}
          {current && (
            <SupplyFeedback
              key={"feedback:" + (d.actor ?? "") + current.data.id}
              pack={current}
              value={value}
              dirty={dirty}
              official={official}
              locate={locate}
            />
          )}
          {official && current && (
            <div className="space-y-2" data-review-version-check>
              <Button
                disabled={busy}
                variant="outline"
                onClick={async () => {
                  setBusy(true);
                  try {
                    await checkVersion();
                    setMessage(
                      t("指定保存版本仍為目前版本。", "The specified saved version is current."),
                    );
                  } catch (e) {
                    setMessage(String(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {t("確認目前保存版本", "Check current saved version")}
              </Button>
              {reviewBlocked && (
                <p role="alert">
                  {t(
                    "比較的是舊版或版本已變更：審核操作已停用，請選目前草稿版本或重新載入。",
                    "Comparing an older revision or a changed version: review actions are disabled. Select the current draft or reload.",
                  )}
                </p>
              )}
            </div>
          )}
          <SupplyPublicPreview
            actor={d.actor}
            official={official}
            id={current?.data.id ?? id}
            version={boundVersion}
            revision={comparisonTarget}
            value={value}
            dirty={dirty}
          />
          <div className="panel space-y-2 p-4" data-supply-save-state>
            <p role="status">
              {dirty
                ? t(
                    "未保存修改：僅此頁編輯，尚未送審。",
                    "Unsaved changes: page edits only, not submitted.",
                  )
                : current
                  ? t(
                      "正在查看已保存版本；送審、核准與公開版本分開記錄。",
                      "Viewing a saved revision; submitted, approved and public revisions are recorded separately.",
                    )
                  : t("新內容包尚未保存。", "New package has not been saved.")}
            </p>
            <p>
              {t(
                "草稿／送審／核准／已發布版本",
                "Draft / submitted / approved / published revision",
              )}
              : {current?.data.draftRevision ?? 0} / {current?.data.submittedRevision ?? "—"} /{" "}
              {current?.data.approvedRevision ?? "—"} / {current?.data.publishedRevision ?? "—"}
            </p>
            <p>
              {t("前台狀態", "Public state")}:{" "}
              {current?.data.published
                ? t("已發布，仍依期間判斷", "Published, subject to period")
                : t("未發布／已下架", "Unpublished / withdrawn")}
            </p>
            {current && (
              <p>
                {t("尚缺檢查項目", "Outstanding checks")}:{" "}
                {current.data.issues.join(", ") ||
                  t("已補齊送審必要項", "Submission requirements complete")}
              </p>
            )}
          </div>
          <SupplyChecklistView
            locate={locate}
            checks={supplyChecklist(value, current?.data.issues ?? [])}
            dirty={dirty}
          />
          <p data-bilingual-completion className="text-sm text-muted-foreground">
            {t(
              "雙語必要缺項（目前編輯／指定保存版）",
              "Required bilingual gaps (current edit / specified saved revision)",
            )}
            : 繁中 {requiredMissing.filter((m) => m.locale === "zh-TW").length} · English{" "}
            {requiredMissing.filter((m) => m.locale === "en").length} ·{" "}
            {t("全部必要缺項", "All required gaps")} {requiredMissing.length}{" "}
            {t(
              "；服務端仍會重新檢查，不代表素材授權。",
              "; the server rechecks requirements; this does not grant material rights.",
            )}
          </p>
          <nav aria-label={t("七步交付", "Seven delivery steps")} className="flex flex-wrap gap-2">
            {steps.map((s, i) => (
              <Button
                key={i}
                variant={step === i ? "default" : "outline"}
                aria-pressed={step === i}
                aria-current={step === i ? "step" : undefined}
                onClick={() => setStep(i)}
              >
                {i + 1}. {s[locale === "en" ? 1 : 0]}
              </Button>
            ))}
          </nav>
          <section className="panel space-y-5 p-5">
            <h2 className="text-xl font-bold">{steps[step]![locale === "en" ? 1 : 0]}</h2>
            {step === 0 && (
              <>
                {!current && !official && (
                  <label className="block">
                    {t("本機內容包 ID", "Local package ID")}
                    <input
                      readOnly={readOnly}
                      aria-label="Supply new ID"
                      className="block w-full border bg-background p-2"
                      value={id}
                      onChange={(e) => setId(e.target.value)}
                    />
                  </label>
                )}
                <p tabIndex={-1} data-supply-field="creatorId">
                  {t("本人關聯創作者", "Own linked creator")}: {value.creatorId}
                </p>
                <label className="block">
                  {t("既有合作對象", "Existing partner")}
                  <select
                    data-supply-field="partnerId"
                    aria-label="Supply partner"
                    className="block w-full border bg-background p-2"
                    disabled={readOnly || !!current}
                    value={value.partnerId}
                    onChange={(e) => update({ ...value, partnerId: e.target.value })}
                  >
                    {d.data?.context?.partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                    {official && <option>{value.partnerId}</option>}
                  </select>
                </label>
                <label className="block">
                  {t("關聯系列", "Related series")}
                  <select
                    data-supply-field="poolId"
                    aria-label="Supply pool"
                    className="block w-full border bg-background p-2"
                    disabled={readOnly || !!current}
                    value={value.poolId}
                    onChange={(e) => update({ ...value, poolId: e.target.value, articleIds: [] })}
                  >
                    {d.data?.context?.pools.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                    {official && <option>{value.poolId}</option>}
                  </select>
                </label>
                <TextPair
                  field="application"
                  label={t("申請說明", "Application note")}
                  value={value.application}
                  onChange={readOnly ? undefined : (v) => update({ ...value, application: v })}
                />
                <Link to="/goddess/cooperation">
                  {t("既有合作與合約", "Existing cooperation and contracts")}
                </Link>
              </>
            )}
            {step === 1 && (
              <>
                {value.materials.map((m, i) => (
                  <div key={m.id} className="space-y-2" data-material-order={m.id}>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        aria-label={"Move material up " + m.id}
                        disabled={readOnly || i === 0}
                        onClick={() => reorderMaterial(i, -1)}
                      >
                        {t("素材上移", "Move material up")}
                      </Button>
                      <Button
                        variant="outline"
                        aria-label={"Move material down " + m.id}
                        disabled={readOnly || i === value.materials.length - 1}
                        onClick={() => reorderMaterial(i, 1)}
                      >
                        {t("素材下移", "Move material down")}
                      </Button>
                    </div>
                    <MaterialEditor
                      m={m}
                      change={
                        readOnly
                          ? undefined
                          : (next) =>
                              update({
                                ...value,
                                materials: value.materials.map((m, n) => (n === i ? next : m)),
                              })
                      }
                      remove={
                        readOnly
                          ? undefined
                          : () =>
                              update({
                                ...value,
                                materials: value.materials.filter((_, n) => n !== i),
                              })
                      }
                    />
                  </div>
                ))}
                {!readOnly && (
                  <Button
                    onClick={() =>
                      update({
                        ...value,
                        materials: [
                          ...value.materials,
                          {
                            id: "m-" + Date.now().toString(36),
                            ref: "text-only",
                            version: 1,
                            source: "",
                            evidence: "",
                            uses: { website: "pending", social: "pending", print: "pending" },
                            startAt: "",
                            endAt: "",
                            alt: { "zh-TW": "", en: "" },
                            cardId: "",
                          },
                        ],
                      })
                    }
                  >
                    {t("新增示意素材", "Add sample material")}
                  </Button>
                )}
                <details>
                  <summary>
                    {t(
                      "報酬與合約版本（獨立於素材用途）",
                      "Remuneration and contract versions (separate from material uses)",
                    )}
                  </summary>
                  {current?.data.remuneration.map((c) => (
                    <p key={c.id}>
                      {c.id} · v{c.version} · {c.status} · {String(c.terms["remuneration"])} ·{" "}
                      {String(c.terms["basis"]) || t("計算基礎待核定", "Basis pending")}
                    </p>
                  ))}
                </details>
              </>
            )}
            {step === 2 && (
              <>
                {Object.entries(labels).map(([k, l]) => (
                  <TextPair
                    key={k}
                    field={k}
                    label={l[locale === "en" ? 1 : 0] ?? k}
                    value={value.copy[k as keyof SupplyValue["copy"]]}
                    onChange={
                      readOnly
                        ? undefined
                        : (v) => update({ ...value, copy: { ...value.copy, [k]: v } })
                    }
                  />
                ))}
                <fieldset tabIndex={-1} data-supply-field="articleIds">
                  <legend>
                    {t(
                      "關聯收藏誌（選填，不自動發布文章）",
                      "Related journals (optional; articles are not automatically published)",
                    )}
                  </legend>
                  {readOnly ? (
                    <p>{value.articleIds.join(", ") || "—"}</p>
                  ) : (
                    d.data?.context?.articles
                      .filter((a) => a.poolIds.includes(value.poolId))
                      .map((a) => (
                        <label key={a.id} className="block">
                          <input
                            type="checkbox"
                            checked={value.articleIds.includes(a.id)}
                            onChange={(e) =>
                              update({
                                ...value,
                                articleIds: e.target.checked
                                  ? [...value.articleIds, a.id]
                                  : value.articleIds.filter((id) => id !== a.id),
                              })
                            }
                          />
                          {a.id}
                        </label>
                      ))
                  )}
                </fieldset>
              </>
            )}
            {step === 3 && (
              <TextPair
                field="cardNotes"
                label={t("卡面製作與檢查說明", "Card production and check note")}
                value={value.cardNotes}
                onChange={readOnly ? undefined : (v) => update({ ...value, cardNotes: v })}
              />
            )}
            {step === 4 && (
              <>
                {(["releaseAt", "withdrawAt"] as const).map((k) => (
                  <label key={k} className="block">
                    {t(
                      k === "releaseAt" ? "發布開始（含）" : "撤下時間（不含）",
                      k === "releaseAt"
                        ? "Publication starts (inclusive)"
                        : "Withdrawal time (exclusive)",
                    )}
                    <input
                      data-supply-field={k}
                      aria-label={"Supply " + k}
                      className="block w-full border bg-background p-2"
                      placeholder="2026-10-05T00:00:00Z"
                      readOnly={readOnly}
                      value={value[k]}
                      onChange={(e) => update({ ...value, [k]: e.target.value })}
                    />
                  </label>
                ))}
                <p>
                  {t(
                    "必要項：雙語、來源證據、網站示意用途、素材期間涵蓋發布期間、目前合作與合約。印製待核定不會變成印製授權；内容核准不解除抽卡阻擋。",
                    "Required: both locales, source evidence, sample website use, material period covering publication, and current cooperation/contracts. Pending printing remains pending; content approval does not unlock draws.",
                  )}
                </p>
              </>
            )}
            {step === 5 && (
              <TextPair
                field="promotion"
                label={t("宣傳配套", "Promotion plan")}
                value={value.promotion}
                onChange={readOnly ? undefined : (v) => update({ ...value, promotion: v })}
              />
            )}
            {step === 6 && (
              <>
                <TextPair
                  field="retrospective"
                  label={t(
                    "回顧（未有真實資料時留白）",
                    "Retrospective (leave blank without real data)",
                  )}
                  value={value.retrospective}
                  onChange={readOnly ? undefined : (v) => update({ ...value, retrospective: v })}
                />
                <p>
                  {t(
                    "不顯示虛構成效；回顧修改也形成新草稿，發布前需重新審核。",
                    "No invented performance. Retrospective changes also create a new draft and require review before publication.",
                  )}
                </p>
              </>
            )}
          </section>
          <EditorialEditor
            key={(d.actor ?? "") + id}
            locateMaterial={(materialId) =>
              locate(2, { field: "reference", materialId, locale: "" })
            }
            value={value.editorial}
            materials={value.materials}
            materialIssues={supplyChecklist(value, current?.data.issues ?? [])[1]!.missing}
            materialIds={value.materials.map((m) => m.id)}
            onChange={
              readOnly
                ? undefined
                : (e) =>
                    update({
                      ...value,
                      editorial: e,
                      articleIds: [
                        ...value.articleIds.filter(
                          (id) => !value.editorial?.articles.some((a) => a.id === id),
                        ),
                        ...e.articles.map((a) => a.id),
                      ],
                    })
            }
          />
          <details className="panel p-4">
            <summary>{t("文字預覽與版本歷史", "Text preview and revision history")}</summary>
            <h3>{value.copy.title[locale]}</h3>
            <p className="whitespace-pre-wrap break-words">{value.copy.story[locale]}</p>
            <p>{value.copy.goal[locale]}</p>
            <p>{value.copy.endPolicy[locale]}</p>
            {current?.data.revisions.map((r) => (
              <p key={r.revision}>
                v{r.revision} · <time>{r.at}</time>
              </p>
            ))}
            {current?.data.reviews.map((r, i) => (
              <p key={i}>
                v{r.revision} · {r.decision} · {r.reason}
              </p>
            ))}
            {current?.data.publications.map((r, i) => (
              <p key={i}>
                v{r.revision} · {r.action} · {r.at}
              </p>
            ))}
          </details>
          <div className="flex flex-wrap gap-3">
            {!official ? (
              <>
                <Button disabled={busy || awaiting} onClick={() => void send("save")}>
                  {t("保存新草稿版本", "Save new draft revision")}
                </Button>
                <Button
                  disabled={
                    busy ||
                    awaiting ||
                    dirty ||
                    requiredMissing.length > 0 ||
                    !current ||
                    (current.data.status !== "draft" && current.data.status !== "returned")
                  }
                  onClick={() =>
                    current &&
                    setSubmitSummary({
                      actor: d.actor,
                      id: current.data.id,
                      version: boundVersion,
                      revision: current.data.draftRevision,
                    })
                  }
                >
                  {t("送審已保存版本", "Submit saved revision")}
                </Button>
              </>
            ) : (
              <>
                <FeedbackEditor
                  value={value}
                  rows={feedback}
                  change={setFeedback}
                  disabled={busy || awaiting || reviewBlocked}
                />
                <label className="block w-full">
                  {t("核准／退回理由（必填）", "Approval / return reason (required)")}
                  <textarea
                    readOnly={awaiting}
                    aria-label="Supply review reason"
                    className="block w-full rounded border bg-background p-2"
                    maxLength={2000}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                <Button
                  disabled={
                    busy ||
                    awaiting ||
                    reviewBlocked ||
                    current?.data.status !== "submitted" ||
                    !reason.trim()
                  }
                  onClick={() => void send("return")}
                >
                  {t("退回指定版本", "Return specified revision")}
                </Button>
                <Button
                  disabled={
                    busy || reviewBlocked || current?.data.status !== "submitted" || !reason.trim()
                  }
                  onClick={() => void send("approve")}
                >
                  {t("核准指定版本", "Approve specified revision")}
                </Button>
                <Button
                  disabled={
                    busy ||
                    awaiting ||
                    !current ||
                    reviewBlocked ||
                    current.data.approvedRevision !== current.data.draftRevision ||
                    !(
                      current.data.status === "approved" ||
                      (current.data.status === "published" && !current.data.published)
                    )
                  }
                  onClick={() => void send("publish")}
                >
                  {t("發布核准版本", "Publish approved revision")}
                </Button>
                <Button
                  variant="outline"
                  disabled={busy || reviewBlocked || !current?.data.published}
                  onClick={() => void send("withdraw")}
                >
                  {t("下架已發布版本", "Withdraw published revision")}
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
