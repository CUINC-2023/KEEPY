import { useEffect, useRef, useState } from "react";
import { Link, useBlocker } from "@tanstack/react-router";
import {
  localApi,
  localSessionGeneration,
  localTestState,
  useLocalTest,
} from "@/lib/local-test-client";
import {
  discoveryCommand,
  hasPendingDiscovery,
  retryDiscoveryCommand,
} from "@/lib/discovery-store";
import {
  isCreatorProfileProjection,
  validCreatorProfile,
  type CreatorProfile,
  type CreatorProfileProjection,
} from "@/lib/creator-profile.mjs";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ContentState } from "@/components/content/ContentState";
import { AccountWorkspace } from "@/components/player/AccountWorkspace";
const path = "/creator/profile";
export function CreatorProfileEditor() {
  const local = useLocalTest(),
    epoch = localSessionGeneration();
  return (
    <div className="space-y-5">
      <AccountWorkspace />
      {local.summary?.user.role === "creator" && (
        <Editor
          key={local.summary.user.id + ":" + epoch}
          actor={local.summary.user.id}
          epoch={epoch}
        />
      )}
    </div>
  );
}
function Editor({ actor, epoch }: { actor: string; epoch: number }) {
  const t = useDiscoveryText(),
    { locale } = useLocale();
  const [saved, setSaved] = useState<CreatorProfileProjection | null>(null),
    [draft, setDraft] = useState<CreatorProfile | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [refresh, setRefresh] = useState(0),
    [preview, setPreview] = useState(false);
  const active = useRef(true),
    formError = useRef<HTMLParagraphElement>(null);
  const current = () =>
    active.current &&
    localSessionGeneration() === epoch &&
    localTestState().summary?.user.id === actor &&
    localTestState().summary?.user.role === "creator";
  const dirty = !!saved && !!draft && JSON.stringify(saved.data) !== JSON.stringify(draft),
    pending = hasPendingDiscovery(path);
  const blocker = useBlocker({
    shouldBlockFn: () => dirty || busy || pending,
    disabled: !dirty && !busy && !pending,
    enableBeforeUnload: dirty || busy || pending,
    withResolver: true,
  });
  useEffect(() => {
    active.current = true;
    const control = new AbortController();
    setLoading(true);
    setSaved(null);
    setDraft(null);
    setError("");
    void localApi<unknown>(path, undefined, "GET", undefined, control.signal)
      .then((value) => {
        if (
          !active.current ||
          localSessionGeneration() !== epoch ||
          localTestState().summary?.user.id !== actor
        )
          return;
        if (!isCreatorProfileProjection(value) || value.actorId !== actor)
          throw Error("Invalid actor-bound creator projection");
        setSaved(value);
        setDraft(structuredClone(value.data));
      })
      .catch((e) => {
        if (active.current && !control.signal.aborted) setError(String(e));
      })
      .finally(() => {
        if (active.current && !control.signal.aborted) setLoading(false);
      });
    return () => {
      active.current = false;
      control.abort();
    };
  }, [actor, epoch, refresh]);
  const save = async (retry = false) => {
    if (busy || !saved || !draft || (!retry && pending)) return;
    const data = { ...draft, links: draft.links.filter((link) => link.trim() !== "") };
    if (!retry && !validCreatorProfile(data)) {
      setError(
        t(
          "請檢查字數與 HTTPS 連結（最多三筆、不含帳密）。",
          "Check text limits and HTTPS links (up to three, without credentials).",
        ),
      );
      requestAnimationFrame(() => formError.current?.focus());
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (retry) await retryDiscoveryCommand(path);
      else await discoveryCommand(path, { expectedVersion: saved.version, data });
      if (current()) {
        setRefresh((n) => n + 1);
        setMessage(
          t("已保存本人草稿；尚未送審或公開。", "Own draft saved; not submitted or published."),
        );
      }
    } catch (e) {
      if (current()) setError(String(e));
    } finally {
      if (current()) setBusy(false);
    }
  };
  if (loading)
    return <ContentState kind="loading">{t("讀取本人草稿…", "Loading your draft…")}</ContentState>;
  if (!saved || !draft)
    return (
      <ContentState kind="error">
        {error}
        <Button onClick={() => setRefresh((n) => n + 1)}>{t("重新讀取", "Reload")}</Button>
      </ContentState>
    );
  return (
    <section className="panel min-w-0 space-y-4 p-4" data-creator-profile>
      <h2 className="text-xl font-bold">{t("創作者本人資料草稿", "My creator profile draft")}</h2>
      <p className="text-sm text-muted-foreground">
        {t(
          "僅本機 SQLite 保存本人草稿，不會修改公開創作者頁。公開介紹須在內容包編輯後，經指定版本審查與官方發布；保存不代表素材權利核准。",
          "Only your draft is saved in local SQLite; the public creator page stays unchanged. Public introductions require content-package editing, exact-version review and official publication. Saving grants no material rights.",
        )}
      </p>
      <p role="status">
        {dirty ? t("未保存修改", "Unsaved changes") : t("已保存版本", "Saved version")} · v
        {saved.version}
      </p>
      {error && (
        <p role="alert" tabIndex={-1} ref={formError}>
          {error}
        </p>
      )}
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <fieldset disabled={busy || pending} className="space-y-4">
          {(["zh-TW", "en"] as const).map((language) => (
            <fieldset key={language} className="space-y-3 rounded-xl border p-3">
              <legend>{language === "en" ? "English" : "繁體中文"}</legend>
              {(["displayName", "tagline", "intro"] as const).map((field) => (
                <label key={field} className="block text-sm">
                  {field === "displayName"
                    ? t("顯示名稱（80字）", "Display name (80 characters)")
                    : field === "tagline"
                      ? t("短標題（120字）", "Tagline (120 characters)")
                      : t("介紹（1000字）", "Introduction (1000 characters)")}
                  <textarea
                    rows={field === "intro" ? 4 : 2}
                    maxLength={field === "intro" ? 1000 : field === "tagline" ? 120 : 80}
                    aria-label={"Creator " + field + " " + language}
                    className="mt-1 block min-h-11 w-full rounded-lg border bg-background p-2"
                    value={draft[field][language]}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        [field]: { ...draft[field], [language]: e.target.value },
                      })
                    }
                  />
                </label>
              ))}
              <p className="text-xs text-muted-foreground">
                {
                  [
                    draft.displayName[language],
                    draft.tagline[language],
                    draft.intro[language],
                  ].filter((s) => s.trim()).length
                }
                /3 {t("已填寫（不等於審核通過）", "filled (not review approval)")}
              </p>
            </fieldset>
          ))}
          {[0, 1, 2].map((i) => (
            <label key={i} className="block text-sm">
              {t("官方社群或網站 HTTPS 連結", "Official social or website HTTPS link")} {i + 1}
              <input
                aria-label={"Creator link " + i}
                type="url"
                maxLength={300}
                value={draft.links[i] ?? ""}
                className="mt-1 min-h-11 w-full rounded-lg border bg-background p-2"
                onChange={(e) => {
                  const links = [...draft.links];
                  links[i] = e.target.value;
                  setDraft({ ...draft, links });
                }}
              />
            </label>
          ))}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={!dirty}>
              {busy ? t("保存中…", "Saving…") : t("保存本人草稿", "Save my draft")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!dirty}
              onClick={() => {
                setDraft(structuredClone(saved.data));
                setError("");
                setMessage("");
              }}
            >
              {t("取消修改", "Cancel changes")}
            </Button>
          </div>
        </fieldset>
      </form>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          disabled={busy || dirty || pending}
          onClick={() => setRefresh((n) => n + 1)}
        >
          {t("重新讀取", "Reload")}
        </Button>
        <Button variant="outline" onClick={() => setPreview((v) => !v)}>
          {t("本人草稿預覽", "Preview my private draft")}
        </Button>
      </div>
      {pending && (
        <ContentState kind="error">
          {t(
            "結果尚未確認；請確認原操作，不建立新請求。",
            "Outcome unconfirmed; confirm the original operation, without a new request.",
          )}
          <Button disabled={busy} onClick={() => void save(true)}>
            {t("確認原操作", "Confirm original operation")}
          </Button>
        </ContentState>
      )}
      <p role="status">{message}</p>
      {preview && (
        <article className="space-y-2 rounded-lg border p-4" data-creator-draft-preview>
          <h3 className="font-bold">
            {t("私人預覽，非匿名公開投影", "Private preview, not an anonymous public projection")}
          </h3>
          <p>{draft.displayName[locale] || t("尚未填寫名稱", "Name not entered")}</p>
          <p>{draft.tagline[locale]}</p>
          <p className="whitespace-pre-wrap break-words">{draft.intro[locale]}</p>
          <ul className="break-all">
            {draft.links.map((link, i) => (
              <li key={i}>{link}</li>
            ))}
          </ul>
        </article>
      )}
      <Link
        to="/goddess/supply"
        className="inline-flex min-h-11 items-center text-primary underline"
      >
        {t("開啟本人內容包與審查流程", "Open my content packages & review workflow")}
      </Link>
      <ConfirmDialog
        open={blocker.status === "blocked"}
        title={t("離開本人草稿？", "Leave your draft?")}
        description={t(
          "未保存修改會捨棄；未確認操作請先確認原 key 結果。",
          "Unsaved changes will be discarded. Confirm pending outcomes with the original key first.",
        )}
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </section>
  );
}
