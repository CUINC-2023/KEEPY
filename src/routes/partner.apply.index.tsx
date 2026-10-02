import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CARD_THEMES,
  CONTENT_TYPES,
  COOP_WILLINGNESS,
  FOLLOWER_RANGES,
  LANGUAGES,
  MATERIAL_SLOTS,
  NO_SENSITIVE_DATA_NOTE,
  PARTNER_SPLIT_NOTES,
  REGIONS,
  RULE_ACKS,
  SOCIAL_PLATFORMS,
  STYLE_TAGS,
  isLikelyUrl,
} from "@/data/partner";
import { usePartner } from "@/lib/partner-store";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusTag } from "@/components/ui/status-tag";
import { StateSwitcher, StatePlaceholder, useDemoState } from "@/components/ui/state-demo";

export const Route = createFileRoute("/partner/apply/")({
  head: () => ({
    meta: [
      { title: "填寫合作申請 — KEEPY" },
      {
        name: "description",
        content: "分步填寫藝名、公開社群、創作資料、素材與合作規則確認，送出後進入官方審核。（Demo）",
      },
      { property: "og:title", content: "填寫合作申請 — KEEPY" },
      {
        property: "og:description",
        content: "六個步驟完成合作女神申請，不收集敏感個資，全流程為 Demo。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PartnerApply,
});

const STEPS = [
  "基本資料",
  "公開社群",
  "創作與合作",
  "素材與權利",
  "合作規則確認",
  "預覽與送出",
];

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "border-primary/50 bg-primary/15 text-foreground"
          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm outline-none focus:border-primary/60";

function Field({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string | undefined;
  required?: boolean | undefined;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold">
        {label}
        {required && <span className="ml-1 text-gold">*</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
      {error && <span className="block text-[11px] font-semibold text-destructive">{error}</span>}
    </label>
  );
}

function PartnerApply() {
  const [state, setState] = useDemoState();
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [leaveWarn, setLeaveWarn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { push } = useToast();
  const { draft, updateDraft, draftSavedAt, myStatus, setMyStatus, resetDraft } = usePartner();

  const toggle = (key: "languages" | "contentTypes" | "styleTags" | "cardThemes" | "materialsReady" | "ruleAcks", v: string) => {
    const list = draft[key];
    updateDraft({
      [key]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v],
    } as never);
    setTouched(true);
  };

  const socialErrors = useMemo(
    () =>
      Object.entries(draft.socials)
        .filter(([, v]) => v.trim() !== "" && !isLikelyUrl(v))
        .map(([k]) => k),
    [draft.socials]
  );
  const socialCount = Object.values(draft.socials).filter((v) => v.trim() !== "").length;

  const errors: Record<number, string[]> = {
    0: [
      !draft.stageName.trim() && "請填寫藝名",
      !draft.displayName.trim() && "請填寫公開顯示名稱",
      draft.intro.trim().length < 10 && "簡介請至少 10 個字",
      !draft.region && "請選擇所在縣市",
      draft.languages.length === 0 && "請選擇至少 1 種主要語言",
    ].filter(Boolean) as string[],
    1: [
      socialCount === 0 && "請填寫至少 1 個公開社群連結",
      socialErrors.length > 0 && `連結格式需為 http(s) 開頭：${socialErrors.join("、")}`,
    ].filter(Boolean) as string[],
    2: [
      draft.contentTypes.length === 0 && "請選擇至少 1 種內容類型",
      draft.styleTags.length === 0 && "請選擇至少 1 個風格標籤",
      !draft.shootWilling && "請選擇是否願意參與拍攝／活動",
    ].filter(Boolean) as string[],
    3: [draft.materialsReady.length === 0 && "請至少勾選 1 項素材（Mock）"].filter(Boolean) as string[],
    4: [draft.ruleAcks.length !== RULE_ACKS.length && "請確認全部合作規則"].filter(Boolean) as string[],
    5: [],
  };
  const stepErrors = errors[step] ?? [];
  const allValid = [0, 1, 2, 3, 4].every((s) => (errors[s] ?? []).length === 0);

  // 已送出且尚未結案的狀態：不可再次送出新申請，引導至進度頁
  const BLOCKED: typeof myStatus[] = ["已送出", "審核中", "待補件", "已核准", "待合約確認"];
  if (BLOCKED.includes(myStatus)) {
    return (
      <EmptyState
        icon="⏳"
        title={`目前申請狀態為「${myStatus}」`}
        description="已有進行中的合作申請，在審核結束前不可重複送出新申請。若要查看進度、補件說明或合約確認，請前往申請進度頁（Demo）。"
        action={
          <Link
            to="/partner/apply/status"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            前往申請進度
          </Link>
        }
      />
    );
  }

  if (myStatus === "女神身分已開通") {
    return (
      <EmptyState
        icon="♛"
        title="此帳號已具備女神身分"
        description="已開通女神身分的帳號不可重複送出新申請。若要調整合作卡池或素材，請於女神後台處理（Demo）。"
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              to="/goddess/dashboard"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              前往女神後台
            </Link>
            <Link
              to="/partner/apply/status"
              className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              查看目前合作狀態
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-wide">合作申請</h1>
          <span className="demo-chip">Demo</span>
          <StatusTag tone="info" label={`目前申請狀態：${myStatus}`} />
        </div>
        <p className="text-sm text-muted-foreground">
          共 {STEPS.length} 個步驟。草稿會自動儲存（Demo）
          {draftSavedAt ? `，最後儲存 ${draftSavedAt}` : "，尚未有變更"}。
        </p>
      </header>

      <StateSwitcher state={state} onChange={setState} />
      {state !== "ok" ? (
        <StatePlaceholder
          state={state}
          emptyTitle="申請表尚未開放"
          emptyDescription="合作申請將於審核流程上線後開放（Demo）。"
        />
      ) : (
        <>
          {/* 步驟指示 */}
          <ol className="panel flex gap-1.5 overflow-x-auto px-2 py-2 text-[11px] font-bold">
            {STEPS.map((s, i) => (
              <li key={s}>
                <button
                  onClick={() => setStep(i)}
                  className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2 transition-colors ${
                    i === step
                      ? "bg-primary/15 text-foreground ring-1 ring-primary/30"
                      : (errors[i] ?? []).length === 0
                        ? "text-muted-foreground hover:text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {i + 1}. {s}
                </button>
              </li>
            ))}
          </ol>

          <section className="panel space-y-4 p-5">
            {step === 0 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="藝名" required>
                    <input
                      className={inputCls}
                      value={draft.stageName}
                      onChange={(e) => {
                        updateDraft({ stageName: e.target.value });
                        setTouched(true);
                      }}
                      placeholder="例：夜澄"
                    />
                  </Field>
                  <Field label="公開顯示名稱" required hint="顯示於卡牌與女神公開頁">
                    <input
                      className={inputCls}
                      value={draft.displayName}
                      onChange={(e) => {
                        updateDraft({ displayName: e.target.value });
                        setTouched(true);
                      }}
                      placeholder="例：夜澄 Yozumi"
                    />
                  </Field>
                </div>
                <Field label="簡介" required hint="建議 50–200 字，描述創作方向與風格">
                  <textarea
                    className={`${inputCls} min-h-24`}
                    value={draft.intro}
                    onChange={(e) => {
                      updateDraft({ intro: e.target.value });
                      setTouched(true);
                    }}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="所在地區（只到縣市）" required>
                    <select
                      className={inputCls}
                      value={draft.region}
                      onChange={(e) => {
                        updateDraft({ region: e.target.value });
                        setTouched(true);
                      }}
                    >
                      <option value="">請選擇</option>
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="主要語言" required>
                    <div className="flex flex-wrap gap-1.5">
                      {LANGUAGES.map((l) => (
                        <Chip
                          key={l}
                          label={l}
                          active={draft.languages.includes(l)}
                          onClick={() => toggle("languages", l)}
                        />
                      ))}
                    </div>
                  </Field>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <p className="text-sm text-muted-foreground">
                  只需公開頁面連結，不需要登入社群帳號；粉絲數僅做區間選擇。
                </p>
                <div className="space-y-4">
                  {SOCIAL_PLATFORMS.map((p) => {
                    const v = draft.socials[p] ?? "";
                    const bad = v.trim() !== "" && !isLikelyUrl(v);
                    return (
                      <div key={p} className="grid gap-2 sm:grid-cols-[1fr_200px]">
                        <Field
                          label={`${p} 連結`}
                          error={bad ? "連結格式需為 https:// 開頭（Demo 檢查）" : undefined}
                        >
                          <input
                            className={inputCls}
                            value={v}
                            placeholder="https://example.com/your-page"
                            onChange={(e) => {
                              updateDraft({ socials: { ...draft.socials, [p]: e.target.value } });
                              setTouched(true);
                            }}
                          />
                        </Field>
                        <Field label="粉絲數區間">
                          <select
                            className={inputCls}
                            value={draft.followers[p] ?? ""}
                            onChange={(e) => {
                              updateDraft({ followers: { ...draft.followers, [p]: e.target.value } });
                              setTouched(true);
                            }}
                          >
                            <option value="">未填寫</option>
                            {FOLLOWER_RANGES.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="內容類型" required>
                  <div className="flex flex-wrap gap-1.5">
                    {CONTENT_TYPES.map((c) => (
                      <Chip
                        key={c}
                        label={c}
                        active={draft.contentTypes.includes(c)}
                        onClick={() => toggle("contentTypes", c)}
                      />
                    ))}
                  </div>
                </Field>
                <Field label="風格標籤" required>
                  <div className="flex flex-wrap gap-1.5">
                    {STYLE_TAGS.map((c) => (
                      <Chip
                        key={c}
                        label={c}
                        active={draft.styleTags.includes(c)}
                        onClick={() => toggle("styleTags", c)}
                      />
                    ))}
                  </div>
                </Field>
                <Field label="是否願意參與拍攝／活動" required>
                  <div className="flex flex-wrap gap-1.5">
                    {COOP_WILLINGNESS.map((c) => (
                      <Chip
                        key={c}
                        label={c}
                        active={draft.shootWilling === c}
                        onClick={() => {
                          updateDraft({ shootWilling: c });
                          setTouched(true);
                        }}
                      />
                    ))}
                  </div>
                </Field>
                <Field label="可合作卡牌主題">
                  <div className="flex flex-wrap gap-1.5">
                    {CARD_THEMES.map((c) => (
                      <Chip
                        key={c}
                        label={c}
                        active={draft.cardThemes.includes(c)}
                        onClick={() => toggle("cardThemes", c)}
                      />
                    ))}
                  </div>
                </Field>
                <Field label="過往合作簡介" hint="可留空；請勿填入未公開的商業機密">
                  <textarea
                    className={`${inputCls} min-h-20`}
                    value={draft.pastCoop}
                    onChange={(e) => {
                      updateDraft({ pastCoop: e.target.value });
                      setTouched(true);
                    }}
                  />
                </Field>
              </>
            )}

            {step === 3 && (
              <>
                <p className="text-sm text-muted-foreground">
                  以下上傳框僅為介面示意，不會真的上傳任何檔案。勾選代表「素材已準備好，可於審核時提供」。
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {MATERIAL_SLOTS.map((m) => {
                    const on = draft.materialsReady.includes(m.key);
                    return (
                      <button
                        key={m.key}
                        onClick={() => toggle("materialsReady", m.key)}
                        className={`rounded-2xl border border-dashed px-4 py-6 text-left transition-colors ${
                          on ? "border-primary/60 bg-primary/10" : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <span className="text-2xl text-muted-foreground/60">＋</span>
                        <p className="mt-2 text-sm font-bold">{m.label}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{m.spec}</p>
                        <p className="mt-2 text-[11px] font-bold text-primary">
                          {on ? "已勾選（Mock）" : "點擊勾選（Mock）"}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <p className="panel hairline-gold p-4 text-sm text-muted-foreground">
                  肖像、作品與卡牌素材的授權範圍、使用期間與下架處理，皆需於正式合約確認；
                  本原型不進行任何授權確認或電子簽署。
                </p>
              </>
            )}

            {step === 4 && (
              <>
                <div className="space-y-2">
                  {RULE_ACKS.map((r) => {
                    const on = draft.ruleAcks.includes(r.key);
                    return (
                      <button
                        key={r.key}
                        onClick={() => toggle("ruleAcks", r.key)}
                        className={`flex w-full gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${
                          on ? "border-primary/50 bg-primary/10" : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] font-black ${
                            on ? "border-primary bg-primary text-primary-foreground" : "border-border"
                          }`}
                        >
                          {on ? "✓" : ""}
                        </span>
                        <span className="leading-relaxed">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
                <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                  {PARTNER_SPLIT_NOTES.map((n) => (
                    <li key={n}>・{n}</li>
                  ))}
                </ul>
              </>
            )}

            {step === 5 && (
              <div className="space-y-3 text-sm">
                <h2 className="font-black">送出前摘要</h2>
                <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                  {[
                    ["藝名", draft.stageName || "—"],
                    ["公開顯示名稱", draft.displayName || "—"],
                    ["所在地區", draft.region || "—"],
                    ["主要語言", draft.languages.join("、") || "—"],
                    ["公開社群", `${socialCount} 個連結`],
                    ["內容類型", draft.contentTypes.join("、") || "—"],
                    ["風格標籤", draft.styleTags.join("、") || "—"],
                    ["拍攝／活動", draft.shootWilling || "—"],
                    ["可合作卡牌主題", draft.cardThemes.join("、") || "—"],
                    ["素材（Mock）", `${draft.materialsReady.length} / ${MATERIAL_SLOTS.length} 項已勾選`],
                    ["規則確認", `${draft.ruleAcks.length} / ${RULE_ACKS.length} 項`],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex gap-2 border-b border-border/50 pb-1.5">
                      <dt className="w-28 shrink-0 text-muted-foreground">{k}</dt>
                      <dd className="min-w-0 font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="text-sm leading-relaxed text-muted-foreground">{draft.intro || "（尚未填寫簡介）"}</p>
                {!allValid && (
                  <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                    仍有必填欄位未完成，請回到前面的步驟補齊後再送出。
                  </div>
                )}
              </div>
            )}

            {touched && stepErrors.length > 0 && (
              <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                {stepErrors.map((e) => (
                  <p key={e}>・{e}</p>
                ))}
              </div>
            )}
          </section>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
            >
              上一步
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => {
                  setTouched(true);
                  if (stepErrors.length === 0) setStep((s) => s + 1);
                }}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                下一步
              </button>
            ) : (
              <button
                onClick={() => setConfirm(true)}
                disabled={!allValid || submitting}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? "送出中…" : "送出申請（Demo）"}
              </button>
            )}
            <button
              onClick={() => setLeaveWarn(true)}
              className="ml-auto rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              離開申請
            </button>
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {NO_SENSITIVE_DATA_NOTE}送出僅改變本地 Mock 狀態，不會寄出通知。
          </p>
        </>
      )}

      <ConfirmDialog
        open={confirm}
        title="送出合作申請（Demo）"
        description="送出後狀態將變為「已送出」，並可於申請進度頁查看時間軸。原型不會真的送出資料或寄出通知。"
        confirmLabel="確認送出"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          setSubmitting(true);
          setTimeout(() => {
            setSubmitting(false);
            setMyStatus("已送出");
            push({ title: "已送出申請（Demo）", description: "可到申請進度頁查看審核狀態。", tone: "gold" });
          }, 600);
        }}
      />

      <ConfirmDialog
        open={leaveWarn}
        title="離開申請？"
        description="草稿已自動儲存（Demo）。離開後回到合作說明頁，可隨時回來繼續填寫；選擇清除草稿會重設所有欄位。"
        confirmLabel="清除草稿並離開"
        cancelLabel="繼續填寫"
        tone="danger"
        onCancel={() => setLeaveWarn(false)}
        onConfirm={() => {
          setLeaveWarn(false);
          resetDraft();
          setStep(0);
          setTouched(false);
          push({ title: "已清除草稿（Demo）" });
        }}
      />
    </div>
  );
}
