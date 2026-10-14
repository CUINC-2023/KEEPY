import { useDiscoveryText } from "@/lib/discovery-copy";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useBlocker } from "@tanstack/react-router";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  useLocalTest,
  localApi,
  localTestState,
  localSessionGeneration,
} from "@/lib/local-test-client";
import {
  discoveryFields,
  discoveryCommand,
  refreshDiscovery,
  hasPendingDiscovery,
  retryDiscoveryCommand,
  type DiscoveryDocument,
  type DiscoveryValue,
} from "@/lib/discovery-store";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { GODDESSES, POOLS } from "@/data/mock";
import { DiscoveryEntry, DiscoveryNotice } from "./DiscoveryContent";
const fieldLabels = {
  title: ["標題", "Title"],
  summary: ["摘要／介紹", "Summary / introduction"],
  body: ["正文／公開花絮", "Body / public behind the scenes"],
  story: ["作品故事", "Work story"],
  period: ["期間說明", "Schedule note"],
  goal: ["收藏目標", "Collection goal"],
  endPolicy: ["結束後政策", "After the series"],
  teaser: ["下一季預告", "Next season teaser"],
  social: ["官方社群 HTTPS 網址（每行一個）", "Official HTTPS social URLs (one per line)"],
};
export function DiscoveryAdmin() {
  const local = useLocalTest(),
    t = useDiscoveryText(),
    { locale } = useLocale();
  const [doc, setDoc] = useState<DiscoveryDocument | null>(null),
    [error, setError] = useState(""),
    [selected, setSelected] = useState("home");
  const official = local.enabled && local.summary?.user.role === "official";
  const actor = local.summary?.user.id;
  const [dirty, setDirty] = useState(false),
    [discard, setDiscard] = useState<(() => void) | null>(null),
    [query, setQuery] = useState(""),
    [kind, setKind] = useState("all"),
    [filter, setFilter] = useState("all"),
    [boundActor, setBoundActor] = useState<string | undefined>();
  const generation = useRef(0);
  const [editorPending, setEditorPending] = useState(false);
  const locked = editorPending || hasPendingDiscovery("/admin/discovery/commands");
  const protect = (action: () => void) => {
    if (locked) return;
    if (dirty) setDiscard(() => action);
    else action();
  };
  const blocker = useBlocker({
    shouldBlockFn: () => dirty && official,
    disabled: !dirty || !official,
    enableBeforeUnload: dirty && official,
    withResolver: true,
  });
  const load = useCallback(async () => {
    const request = ++generation.current,
      epoch = localSessionGeneration();
    setError("");
    setDoc(null);
    if (!official) return;
    try {
      const next = await localApi<DiscoveryDocument>("/admin/discovery");
      if (
        request === generation.current &&
        epoch === localSessionGeneration() &&
        actor === localTestState().summary?.user.id
      ) {
        setBoundActor(actor);
        setDoc(next);
      }
    } catch (e) {
      if (request === generation.current && epoch === localSessionGeneration()) setError(String(e));
    }
  }, [official, actor]);
  useEffect(() => {
    const requestGeneration = generation;
    setDirty(false);
    setEditorPending(false);
    setDiscard(null);
    setSelected("home");
    setQuery("");
    setKind("all");
    setFilter("all");
    void load();
    return () => {
      requestGeneration.current++;
    };
  }, [load, actor]);
  if (!official)
    return (
      <div className="panel space-y-3 p-5">
        <h1 className="text-2xl font-black">
          {t("內容與發現管理", "Content & discovery management")}
        </h1>
        <p>
          {t(
            "需要有效的本機官方測試身分；Mock 登入不提供寫入權限。",
            "An active Local Test official role is required. Mock login grants no write access.",
          )}
        </p>
        <Link to="/local-test" className="text-primary underline">
          {t("選擇測試身分", "Select test identity")}
        </Link>
      </div>
    );
  const visibleDoc = boundActor === actor ? doc : null;
  const item = visibleDoc?.data.items.find((i) => i.id === selected);
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="space-y-2">
        <h1 className="text-2xl font-black">
          {t("內容與發現管理", "Content & discovery management")}
        </h1>
        <DiscoveryNotice />
        <p className="text-sm text-muted-foreground">
          {t(
            "草稿不影響前台。預覽確認後再發布；發布僅寫入本機。下架不刪持卡或歷史。",
            "Drafts do not change the public view. Preview before publishing locally. Withdrawal retains cards and history.",
          )}
        </p>
        <Link to="/admin/content" className="text-sm text-primary underline">
          {t("既有 FAQ 與展示內容管理 →", "Existing FAQ and mock content management →")}
        </Link>
      </header>
      <ConfirmDialog
        open={discard !== null || blocker.status === "blocked"}
        title={t("放棄未保存修改？", "Discard unsaved changes?")}
        description={t(
          "繼續將放棄本機編輯，已保存與公開版本不變。",
          "Continuing discards local edits; saved and public versions stay unchanged.",
        )}
        onCancel={() => {
          setDiscard(null);
          if (blocker.status === "blocked") blocker.reset();
        }}
        onConfirm={() => {
          const action = discard;
          setDiscard(null);
          setDirty(false);
          if (action) action();
          else if (blocker.status === "blocked") blocker.proceed();
        }}
      />
      {locked && (
        <div role="status" className="panel space-y-2 p-3">
          <p>
            {t(
              "先以原key確認待確認操作；勿另建請求。",
              "Confirm the pending operation with its original key; do not create another request.",
            )}
          </p>
          <Button
            onClick={async () => {
              const epoch = localSessionGeneration();
              const active = () =>
                epoch === localSessionGeneration() && actor === localTestState().summary?.user.id;
              try {
                await retryDiscoveryCommand("/admin/discovery/commands");
                if (!active()) return;
                setDirty(false);
                await refreshDiscovery();
                if (active()) await load();
              } catch (e) {
                if (active()) setError(String(e));
              }
            }}
          >
            {t("確認原操作", "Confirm original operation")}
          </Button>
        </div>
      )}
      <Button disabled={locked} onClick={() => protect(() => void load())} variant="outline">
        {t("重新讀取", "Reload")}
      </Button>
      {error && (
        <p role="alert" className="break-words text-destructive">
          {error}
        </p>
      )}
      {visibleDoc ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <label>
              {t("查找名稱／ID", "Find title / ID")}
              <input
                aria-label="Find official content"
                className="w-full rounded-lg border bg-background p-2"
                maxLength={200}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label>
              {t("類型", "Type")}
              <select
                aria-label="Official content kind"
                className="w-full rounded-lg border bg-background p-2"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                {["all", "home", "series", "creator", "article"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              {t("狀態", "Status")}
              <select
                aria-label="Official content status"
                className="w-full rounded-lg border bg-background p-2"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {["all", "draft", "published", "archived"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block space-y-2">
            <span>
              {t("內容項目", "Content item")} · v{visibleDoc.version}
            </span>
            <select
              aria-label="Content item"
              className="w-full rounded-lg border border-border bg-background p-3"
              value={selected}
              disabled={locked}
              onChange={(e) => protect(() => setSelected(e.target.value))}
            >
              {visibleDoc.data.items
                .filter(
                  (i) =>
                    i.id === selected ||
                    ((kind === "all" || i.draft.kind === kind) &&
                      (filter === "all" || i.status === filter) &&
                      [i.id, i.draft.copy.title[locale]]
                        .join(" ")
                        .normalize("NFKC")
                        .toLocaleLowerCase()
                        .includes(query.normalize("NFKC").toLocaleLowerCase())),
                )
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.id} · {i.status} · {i.draft.copy.title[locale]}
                  </option>
                ))}
              <option value="new-article">{t("＋新增收藏誌文章", "+ Add journal article")}</option>
            </select>
          </label>
          {item?.supplyPackId ? (
            <div className="panel space-y-2 p-4">
              <p>
                {t(
                  "此內容由創作者內容包管理，須核准指定保存版本。",
                  "This content is managed by a creator package and requires exact saved-version approval.",
                )}
              </p>
              <Link to="/admin/supply" className="text-primary underline">
                {t("前往供稿審核", "Open supply review")}
              </Link>
            </div>
          ) : (
            <Editor
              key={actor + ":" + selected + ":" + visibleDoc.version}
              doc={visibleDoc}
              id={selected}
              value={item?.draft ?? newArticle()}
              status={item?.status ?? "new"}
              reload={load}
              onCreated={setSelected}
              onDirty={setDirty}
              onPending={setEditorPending}
            />
          )}
        </>
      ) : !error ? (
        <p role="status">{t("載入中…", "Loading…")}</p>
      ) : null}
    </div>
  );
}
function newArticle(): DiscoveryValue {
  return {
    kind: "article",
    referenceId: "",
    category: "guide",
    creatorIds: [],
    poolIds: [],
    order: 0,
    featured: false,
    releaseAt: "",
    withdrawAt: "",
    copy: Object.fromEntries(
      discoveryFields.map((f) => [
        f,
        {
          "zh-TW": f === "title" ? "新示意文章" : "",
          en: f === "title" ? "New sample article" : "",
        },
      ]),
    ) as DiscoveryValue["copy"],
  };
}
function Editor({
  doc,
  id,
  value,
  status,
  reload,
  onCreated,
  onDirty,
  onPending,
}: {
  doc: DiscoveryDocument;
  id: string;
  value: DiscoveryValue;
  status: string;
  reload: () => Promise<void>;
  onCreated: (id: string) => void;
  onDirty: (dirty: boolean) => void;
  onPending: (pending: boolean) => void;
}) {
  const t = useDiscoveryText();
  const [confirm, setConfirm] = useState<"publish" | "archive" | null>(null),
    [comparison, setComparison] = useState(false);
  const [draft, setDraft] = useState(value),
    [articleId, setArticleId] = useState("journal-" + Date.now().toString(36)),
    [locale, setLocale] = useState<"zh-TW" | "en">("zh-TW"),
    [preview, setPreview] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [pending, setPending] = useState<{
    action: string;
    expectedVersion: number;
    id: string;
    value: DiscoveryValue | null;
  } | null>(null);
  const originalArticleId = useRef(articleId).current;
  const dirty =
    JSON.stringify(draft) !== JSON.stringify(value) ||
    (id === "new-article" && articleId !== originalArticleId);
  useEffect(() => onDirty(dirty), [dirty, onDirty]);
  useEffect(() => onPending(!!pending || busy), [pending, busy, onPending]);
  const locked = busy || !!pending || hasPendingDiscovery("/admin/discovery/commands");
  const send = async (action: "save" | "publish" | "archive") => {
    if (busy) return;
    const actor = localTestState().summary?.user.id,
      epoch = localSessionGeneration();
    const active = () =>
      epoch === localSessionGeneration() && actor === localTestState().summary?.user.id;
    const command = pending ?? {
      action,
      expectedVersion: doc.version,
      id: id === "new-article" ? articleId : id,
      value: action === "save" ? draft : null,
    };
    setPending(command);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await discoveryCommand("/admin/discovery/commands", command);
      if (!active()) return;
      setPending(null);
      onDirty(false);
      await refreshDiscovery();
      if (!active()) return;
      onCreated(command.id);
      await reload();
      if (active()) setMessage(t("操作已保存。", "Saved."));
    } catch (e) {
      if (!active()) return;
      if ((e as { status?: number }).status && (e as { status: number }).status < 500)
        setPending(null);
      setError(String(e));
    } finally {
      if (active()) setBusy(false);
    }
  };
  const update = <K extends keyof DiscoveryValue>(key: K, v: DiscoveryValue[K]) =>
    setDraft((old) => ({ ...old, [key]: v }));
  return (
    <section className="panel space-y-4 p-5">
      <ConfirmDialog
        open={confirm !== null}
        title={t(
          confirm === "archive" ? "確認下架保存版本？" : "確認發布保存版本？",
          confirm === "archive" ? "Withdraw saved version?" : "Publish saved version?",
        )}
        description={t(
          "僅作用於已保存版本；未保存編輯不會發布，供稿內容仍須走指定版核准。",
          "Only the saved version is affected. Unsaved edits are excluded; supplied content requires exact-version review.",
        )}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const action = confirm;
          setConfirm(null);
          if (action) void send(action);
        }}
      >
        <p>
          {id} · v{doc.version}
        </p>
        <p>
          {value.copy.title["zh-TW"]} / {value.copy.title.en}
        </p>
        <p>
          {value.releaseAt || t("未指定開始", "No start specified")} →{" "}
          {value.withdrawAt || t("未指定結束", "No end specified")}
        </p>
        <p>
          {t(
            "首頁、探索、詳情、搜尋；不改持卡或歷史。",
            "Home, exploration, detail and search; ownership and history stay unchanged.",
          )}
        </p>
      </ConfirmDialog>
      <p role="status">
        {dirty ? t("未保存本機草稿", "Unsaved local draft") : t("已保存草稿", "Saved draft")} · v
        {doc.version} · {t("公開快照", "Public snapshot")} v
        {doc.data.items.find((i) => i.id === id)?.published?.revision ?? "—"}
      </p>
      <Button variant="outline" onClick={() => setComparison((v) => !v)}>
        {t("比較草稿／保存／公開版", "Compare draft / saved / public")}
      </Button>
      {comparison && (
        <div className="grid gap-3 md:grid-cols-3">
          {[
            [t("未保存編輯", "Local draft"), draft],
            [t("最後保存", "Last saved"), value],
            [t("公開快照", "Public snapshot"), doc.data.items.find((i) => i.id === id)?.published],
          ].map(([label, content]) => (
            <div key={String(label)} className="min-w-0 rounded-lg border p-3">
              <h2 className="font-bold">{String(label)}</h2>
              {content ? (
                <DiscoveryEntry
                  item={{ ...(content as DiscoveryValue), id, revision: 0, publishedAt: "" }}
                  detail
                />
              ) : (
                <p>{t("尚無公開版本", "No public version")}</p>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="text-sm">
        {t("目前狀態", "Current status")}: {status} · {draft.kind}
      </p>
      {id === "new-article" && (
        <label className="block space-y-1">
          <span>{t("文章固定 ID", "Stable article ID")}</span>
          <input
            className="w-full rounded-lg border bg-background p-2"
            value={articleId}
            disabled={locked}
            onChange={(e) => setArticleId(e.target.value)}
          />
        </label>
      )}
      <fieldset disabled={locked} className="min-w-0 space-y-4">
        <legend className="text-sm font-bold">{t("編輯草稿", "Edit draft")}</legend>
        <label className="block space-y-1">
          <span>{t("編輯語言", "Editing language")}</span>
          <select
            aria-label="Editing language"
            value={locale}
            onChange={(e) => setLocale(e.target.value as "zh-TW" | "en")}
            className="w-full rounded-lg border bg-background p-2"
          >
            <option value="zh-TW">繁體中文</option>
            <option value="en">English</option>
          </select>
        </label>
        {discoveryFields.map((field) => (
          <label key={field} className="block space-y-1">
            <span className="text-sm">{t(fieldLabels[field][0]!, fieldLabels[field][1]!)}</span>
            <textarea
              aria-label={field + " " + locale}
              rows={field === "body" ? 5 : 2}
              maxLength={field === "body" ? 12000 : 2000}
              value={draft.copy[field][locale]}
              className="w-full rounded-lg border bg-background p-2 text-sm"
              onChange={(e) =>
                update("copy", {
                  ...draft.copy,
                  [field]: { ...draft.copy[field], [locale]: e.target.value },
                })
              }
            />
          </label>
        ))}
        {["series", "article"].includes(draft.kind) && (
          <label className="block space-y-1">
            <span>{t("分類", "Category")}</span>
            <select
              aria-label="Category"
              className="w-full rounded-lg border bg-background p-2"
              value={draft.category}
              onChange={(e) => update("category", e.target.value)}
            >
              {(draft.kind === "series"
                ? [
                    ["permanent", "常駐"],
                    ["seasonal", "當季"],
                    ["upcoming", "即將推出"],
                    ["historical", "歷史系列"],
                  ]
                : [
                    ["interview", "創作者訪談"],
                    ["behind-scenes", "拍攝花絮"],
                    ["design", "卡面設計故事"],
                    ["guide", "收藏指南"],
                  ]
              ).map(([key, label]) => (
                <option key={key} value={key}>
                  {t(label!, key!)}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="block space-y-1">
          <span>{t("排序（小值優先）", "Order (lower first)")}</span>
          <input
            aria-label="Order"
            type="number"
            min={-10000}
            max={10000}
            value={draft.order}
            className="w-full rounded-lg border bg-background p-2"
            onChange={(e) => update("order", Number(e.target.value))}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={draft.featured}
            onChange={(e) => update("featured", e.target.checked)}
          />
          {t("精選", "Featured")}
        </label>
        {(["releaseAt", "withdrawAt"] as const).map((field) => (
          <label key={field} className="block space-y-1">
            <span>
              {t(
                field === "releaseAt" ? "內容公開時間" : "內容下架時間",
                field === "releaseAt" ? "Content release time" : "Content withdrawal time",
              )}{" "}
              · ISO / +08:00 / Z
            </span>
            <input
              aria-label={field}
              placeholder="2026-11-01T12:00:00+08:00"
              value={draft[field]}
              className="w-full rounded-lg border bg-background p-2 text-sm"
              onChange={(e) => update(field, e.target.value)}
            />
          </label>
        ))}
        <p className="text-xs text-muted-foreground">
          {t(
            "公開期間控制內容可見性，不改抽卡期間或交易政策；留白表示不排程。",
            "Publication dates control content visibility, not draw periods or transaction policy. Leave blank for no schedule.",
          )}
        </p>
        {[
          {
            key: "creatorIds" as const,
            title: t("關聯創作者", "Related creators"),
            choices: GODDESSES,
          },
          { key: "poolIds" as const, title: t("關聯系列", "Related series"), choices: POOLS },
        ].map((group) => (
          <fieldset key={group.key} className="min-w-0 rounded-lg border p-3">
            <legend className="text-sm">{group.title}</legend>
            <div className="flex flex-wrap gap-3">
              {group.choices.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft[group.key].includes(c.id)}
                    onChange={(e) =>
                      update(
                        group.key,
                        e.target.checked
                          ? [...draft[group.key], c.id]
                          : draft[group.key].filter((id) => id !== c.id),
                      )
                    }
                  />
                  {t(c.name, c.id)}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <Button disabled={locked} onClick={() => setPreview((v) => !v)} variant="outline">
          {t("預覽草稿", "Preview draft")}
        </Button>
        <Button disabled={locked} onClick={() => void send("save")}>
          {t("保存草稿", "Save draft")}
        </Button>
        <Button disabled={locked || id === "new-article"} onClick={() => setConfirm("publish")}>
          {t("發布已保存草稿", "Publish saved draft")}
        </Button>
        <Button
          disabled={locked || id === "new-article"}
          variant="outline"
          onClick={() => setConfirm("archive")}
        >
          {t("下架", "Withdraw")}
        </Button>
        {pending && !busy && (
          <Button onClick={() => void send(pending.action as "save" | "publish" | "archive")}>
            {t("重試待確認操作", "Retry pending command")}
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {t(
          "發布使用最後保存的草稿；尚未保存的編輯不會發布。",
          "Publication uses the last saved draft, excluding unsaved edits.",
        )}
      </p>
      {error && (
        <p role="alert" className="break-words text-destructive">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {preview && (
        <div className="space-y-3 border-t pt-4">
          <h2 className="font-bold">{t("未發布草稿預覽", "Unpublished draft preview")}</h2>
          <DiscoveryEntry
            item={{
              id: id === "new-article" ? articleId : id,
              ...draft,
              revision: 0,
              publishedAt: "",
            }}
            detail
          />
        </div>
      )}
    </section>
  );
}
