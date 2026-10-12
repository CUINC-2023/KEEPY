import { saveLocalContent, useLocalTest } from "@/lib/local-test-client";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useContent, useOverrides, writeOverrides } from "@/lib/content-store";
import { usePlayerCopy } from "@/lib/player-copy";
import { updateOperations, operationId, operationTime } from "@/lib/operations-store";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/keepy-i18n-shared";

export function FaqAdmin() {
  const local = useLocalTest();
  const t = usePlayerCopy(),
    content = useContent(),
    saved = useOverrides();
  const [selected, setSelected] = useState(content.faq[0]!.id),
    [locale, setLocale] = useState<Locale>("zh-TW"),
    [title, setTitle] = useState(""),
    [body, setBody] = useState(""),
    [hint, setHint] = useState(""),
    [editing, setEditing] = useState(false),
    [message, setMessage] = useState("");
  const entry = content.faq.find((f) => f.id === selected)!;
  function edit() {
    setTitle(entry.title[locale]);
    setBody(entry.body[locale]);
    setHint(entry.hint[locale]);
    setEditing(true);
    setMessage("");
  }
  if (local.enabled && local.summary?.user.role !== "official")
    return <p>syntheticLocalTest: official role required for FAQ editing.</p>;
  return (
    <section className="panel space-y-3 p-4">
      {local.enabled && (
        <p data-testid="local-content-version">
          syntheticLocalTest · SQLite content v{local.contentVersion} · local publication only; no
          external publication.
        </p>
      )}
      <h2 className="font-black">
        {t("FAQ 管理（穩定問題 ID）", "FAQ management (stable question IDs)")}
      </h2>
      <p className="text-xs text-muted-foreground">
        {local.enabled
          ? "syntheticLocalTest: shared SQLite FAQ version. Stable IDs and direct links remain unchanged; no external publication."
          : t(
              "沿用共用內容來源；修改標題不改 ID 或直達連結。僅此瀏覽器，不發布。",
              "Uses the shared content source; titles do not change IDs or direct links. Browser-only, not published.",
            )}
      </p>
      <select
        aria-label={t("FAQ 問題", "FAQ question")}
        className="w-full rounded-lg border border-border bg-background p-3"
        value={selected}
        onChange={(e) => {
          setSelected(e.target.value);
          setEditing(false);
        }}
      >
        {content.faq.map((f) => (
          <option key={f.id} value={f.id}>
            {f.id} · {f.title[locale]}
          </option>
        ))}
      </select>
      <select
        aria-label={t("編輯語言", "Edit language")}
        className="w-full rounded-lg border border-border bg-background p-3"
        value={locale}
        onChange={(e) => {
          setLocale(e.target.value as Locale);
          setEditing(false);
        }}
      >
        <option value="zh-TW">繁體中文</option>
        <option value="en">English</option>
      </select>
      <p className="text-sm">{entry.title[locale]}</p>
      <p className="text-sm whitespace-pre-wrap">{entry.body[locale]}</p>
      <Link to="/faq" hash={entry.id} className="text-sm text-primary underline">
        {t("前台預覽直達", "Preview direct link")}: #{entry.id}
      </Link>
      {!editing ? (
        <Button onClick={edit}>{t("編輯此語言草稿", "Edit language draft")}</Button>
      ) : (
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              if (!title.trim() || !body.trim() || !hint.trim()) {
                setMessage(t("請填寫標題、內文與短提示", "Title, body and hint are required"));
                return;
              }
              const next = structuredClone(saved);
              const old = next.faq[entry.id] ?? {};
              next.faq[entry.id] = {
                title: { ...old.title, [locale]: title },
                body: { ...old.body, [locale]: body },
                hint: { ...old.hint, [locale]: hint },
              };
              const stored = local.enabled ? await saveLocalContent(next) : writeOverrides(next);
              if (!local.enabled)
                updateOperations((s) => ({
                  ...s,
                  audit: [
                    ...s.audit,
                    {
                      id: operationId(),
                      action: "faq.save",
                      target: entry.id,
                      at: operationTime(),
                      note: locale + "; stable ID preserved",
                    },
                  ],
                }));
              setEditing(false);
              setMessage(
                stored
                  ? t("已保存本機 FAQ；直達 ID 保留", "Local FAQ saved; direct-link ID preserved")
                  : t("儲存不可用，只保留於記憶體", "Storage unavailable; retained in memory only"),
              );
            } catch (error) {
              setMessage(String(error));
            }
          }}
        >
          <label className="block">
            {t("標題", "Title")}
            <input
              required
              maxLength={300}
              className="w-full rounded border border-border bg-background p-3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="faq-title"
            />
          </label>
          <label className="block">
            {t("內文", "Body")}
            <textarea
              required
              maxLength={8000}
              className="w-full rounded border border-border bg-background p-3"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
          <label className="block">
            {t("欄位短提示", "Field hint")}
            <input
              required
              maxLength={300}
              className="w-full rounded border border-border bg-background p-3"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button>{t("保存 FAQ", "Save FAQ")}</Button>
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              {t("捨棄草稿", "Discard draft")}
            </Button>
          </div>
        </form>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </section>
  );
}
