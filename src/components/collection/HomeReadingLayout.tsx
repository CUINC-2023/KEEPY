import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { type CollectionMe, refreshCollectionMe } from "@/lib/collection-store";
import {
  discoveryCommand,
  retryDiscoveryCommand,
  hasPendingDiscovery,
} from "@/lib/discovery-store";
import { localSessionGeneration, localTestState } from "@/lib/local-test-client";
type Preference = NonNullable<CollectionMe["profile"]["data"]["readingLayout"]>;
const initial: Preference = { schema: 1, mode: "full", first: "timeline" };
function read(actor: string, suffix = ""): Preference | null {
  try {
    const raw = sessionStorage.getItem("keepy-home-reading-v1:" + actor + suffix);
    if (!raw || raw.length > 512) return null;
    const p = JSON.parse(raw);
    return p?.schema === 1 &&
      ["full", "compact"].includes(p.mode) &&
      ["timeline", "awards", "growth", "play", "curations", "notes"].includes(p.first)
      ? { schema: 1, mode: p.mode, first: p.first }
      : null;
  } catch {
    return null;
  }
}
export function HomeReadingLayout({
  me,
  timeline,
  awards,
  growth,
  play,
  curations,
  notes,
}: {
  me: CollectionMe;
  timeline: ReactNode;
  awards: ReactNode;
  growth: ReactNode;
  play: ReactNode;
  curations: ReactNode;
  notes: ReactNode;
}) {
  const actor = me.actorId,
    t = useDiscoveryText(),
    [saved, setSaved] = useState(() => me.profile.data.readingLayout ?? read(actor) ?? initial),
    [draft, setDraft] = useState(saved),
    [pendingDraft, setPendingDraft] = useState(() => read(actor, ":draft")),
    [error, setError] = useState(false),
    [busy, setBusy] = useState(false),
    [saveError, setSaveError] = useState("");
  const pending = hasPendingDiscovery("/collection/profile");
  const save = async (retry = false) => {
    if (busy) return;
    const serial = localSessionGeneration(),
      current = () =>
        serial === localSessionGeneration() && localTestState().summary?.user.id === actor;
    setBusy(true);
    setSaveError("");
    try {
      if (retry) await retryDiscoveryCommand("/collection/profile");
      else
        await discoveryCommand("/collection/profile", {
          expectedVersion: me.profile.version,
          data: { ...me.profile.data, readingLayout: draft },
        });
      if (!current()) return;
      sessionStorage.removeItem("keepy-home-reading-v1:" + actor + ":draft");
      setSaved(draft);
      setPendingDraft(null);
      await refreshCollectionMe();
    } catch (e) {
      if (current())
        setSaveError((e as { status?: number }).status === 409 ? "conflict" : "unconfirmed");
    } finally {
      if (current()) setBusy(false);
    }
  };
  const edit = (value: Preference) => {
    setDraft(value);
    setPendingDraft(value);
    try {
      sessionStorage.setItem("keepy-home-reading-v1:" + actor + ":draft", JSON.stringify(value));
      setError(false);
    } catch {
      setError(true);
    }
  };
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);
  const available = [
    ["timeline", timeline],
    ["awards", awards],
    ["growth", growth],
    ["play", play],
    ["curations", curations],
    ["notes", notes],
  ] as const;
  const blocks = [
    ...available.filter(([id]) => id === draft.first),
    ...available.filter(([id]) => id !== draft.first),
  ];
  return (
    <section data-home-reading-layout className="space-y-4">
      <fieldset className="flex flex-wrap gap-3">
        <legend>
          {t("本人頁閱讀配置 · 本機SQLite", "Personal reading layout · local SQLite")}
        </legend>
        <label>
          {t("閱讀模式", "Reading mode")}{" "}
          <select
            aria-label="Home reading mode"
            disabled={busy || pending}
            value={draft.mode}
            onChange={(e) =>
              edit({ ...draft, mode: e.target.value === "compact" ? "compact" : "full" })
            }
          >
            <option value="full">{t("完整", "Full")}</option>
            <option value="compact">{t("精簡", "Compact")}</option>
          </select>
        </label>
        <label>
          {t("第一區塊", "First block")}{" "}
          <select
            aria-label="Home first block"
            disabled={busy || pending}
            value={draft.first}
            onChange={(e) =>
              edit({
                ...draft,
                first:
                  e.target.value === "notes"
                    ? "notes"
                    : e.target.value === "play"
                      ? "play"
                      : e.target.value === "curations"
                        ? "curations"
                        : e.target.value === "growth"
                          ? "growth"
                          : e.target.value === "awards"
                            ? "awards"
                            : "timeline",
              })
            }
          >
            <option value="timeline">{t("取得年表", "Acquisition timeline")}</option>
            <option value="awards">{t("已取得成就", "Earned achievements")}</option>
            <option value="growth">
              {t("成長與參與摘要", "Growth and participation summaries")}
            </option>
            <option value="play">{t("私人遊玩摘要", "Private play summary")}</option>
            <option value="curations">{t("私人策展摘要", "Private curation summary")}</option>
            <option value="notes">{t("私人筆記摘要", "Private note summary")}</option>
          </select>
        </label>
      </fieldset>
      <p role="status">
        {dirty
          ? t("未保存配置", "Unsaved layout")
          : t("已保存／預設配置", "Saved / default layout")}
      </p>
      <p className="text-sm text-muted-foreground">
        {t(
          "保存後以本人本機SQLite配置為準，不是雲端或跨裝置同步。舊頁籤偏好須明確按保存才寫入；未保存配置仍只在此頁籤恢復，不自動套用或公開。",
          "Saved preferences use your local SQLite record, without cloud or cross-device sync. Legacy tab preferences enter SQLite only after explicit save. Unsaved layouts remain tab-only with explicit restoration, never automatically applied or published.",
        )}
      </p>
      <div className="flex gap-3">
        <Button
          disabled={busy || pending || (!dirty && me.profile.data.readingLayout !== undefined)}
          onClick={() => void save()}
        >
          {t("保存配置", "Save layout")}
        </Button>
        <Button
          variant="outline"
          disabled={busy || pending || !dirty}
          onClick={() => {
            setDraft(saved);
            setPendingDraft(null);
            try {
              sessionStorage.removeItem("keepy-home-reading-v1:" + actor + ":draft");
              setError(false);
            } catch {
              setError(true);
            }
          }}
        >
          {t("取消配置", "Cancel layout")}
        </Button>
        {!dirty && pendingDraft && JSON.stringify(pendingDraft) !== JSON.stringify(saved) && (
          <Button variant="outline" disabled={busy || pending} onClick={() => edit(pendingDraft)}>
            {t("恢復本頁籤未保存配置", "Restore this tab’s unsaved layout")}
          </Button>
        )}
      </div>
      {(saveError || pending) && (
        <div role="alert">
          <p>
            {saveError === "conflict"
              ? t(
                  "保存版衝突，請重讀SQLite後確認自己的配置，不覆蓋別版。",
                  "Saved-version conflict: reload SQLite and review your layout without overwriting another revision.",
                )
              : t(
                  "保存結果未確認，請讀回或以原key確認，勿新增重複請求。",
                  "Save result unconfirmed: read back or confirm with the original key, without a new request.",
                )}
          </p>
          <Button disabled={busy} variant="outline" onClick={() => void refreshCollectionMe()}>
            {t("重讀SQLite配置", "Reload SQLite layout")}
          </Button>
          {pending && (
            <Button disabled={busy} onClick={() => void save(true)}>
              {t("確認原配置操作", "Confirm original layout operation")}
            </Button>
          )}
        </div>
      )}
      {error && (
        <p role="alert">
          {t(
            "本頁籤儲存不可用，配置仍未保存。",
            "Tab storage is unavailable; the layout remains unsaved.",
          )}
        </p>
      )}
      {blocks.map(([id, content]) =>
        draft.mode === "compact" ? (
          <details key={id} data-home-block={id}>
            <summary>
              {id === "notes"
                ? t("私人筆記摘要", "Private note summary")
                : id === "timeline"
                  ? t("私人取得年表", "Private acquisition timeline")
                  : id === "play"
                    ? t("私人遊玩摘要", "Private play summary")
                    : id === "curations"
                      ? t("私人策展摘要", "Private curation summary")
                      : id === "growth"
                        ? t("成長與參與摘要", "Growth and participation summaries")
                        : t("已取得成就精選", "Earned achievements")}
            </summary>
            {content}
          </details>
        ) : (
          <div key={id} data-home-block={id}>
            {content}
          </div>
        ),
      )}
    </section>
  );
}
