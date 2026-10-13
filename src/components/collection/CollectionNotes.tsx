import { useState } from "react";
import { Link, useBlocker } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCollection, refreshCollectionMe, type CollectionMe } from "@/lib/collection-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { NOTE_CATEGORIES, NOTE_TAGS, type CollectionNote } from "@/lib/collection-notes.mjs";
import {
  discoveryCommand,
  retryDiscoveryCommand,
  hasPendingDiscovery,
} from "@/lib/discovery-store";
export function CollectionNotes() {
  const d = useCollection(),
    t = useDiscoveryText();
  return (
    <main className="space-y-4 p-4 md:p-8">
      <h1 className="text-2xl font-bold">{t("私人收藏筆記", "Private collection notes")}</h1>
      <Link to="/app/collection" className="underline text-primary">
        {t("返回本人收藏", "Back to your collection")}
      </Link>
      {d.meError || d.error ? (
        <div role="alert">
          <p>
            {t(
              "筆記來源無法讀取，舊私人資料已清空；Staging僅前端預覽。",
              "Notes source unavailable; previous private data cleared. Staging is a front-end preview.",
            )}
          </p>
          <Button onClick={() => void refreshCollectionMe()}>
            {t("重讀本人筆記", "Reload your notes")}
          </Button>
        </div>
      ) : d.me && d.catalogueValid ? (
        <Editor
          key={
            d.me.actorId +
            ":" +
            d.me.profile.version +
            ":" +
            d.me.visibilityKey +
            ":" +
            d.me.cards.map((c) => c.cardId).join(",")
          }
          me={d.me}
        />
      ) : (
        <p>
          {t(
            "請在本機確認本人Local Test身分；這不是真人登入。",
            "Confirm your Local Test identity locally; this is not a real login.",
          )}
        </p>
      )}
    </main>
  );
}
function Editor({ me }: { me: CollectionMe }) {
  const d = useCollection(),
    t = useDiscoveryText(),
    { locale } = useLocale(),
    saved = me.profile.data.notes ?? [],
    [notes, setNotes] = useState<CollectionNote[]>(saved),
    [kind, setKind] = useState<"card" | "album" | "award">("card"),
    [subject, setSubject] = useState(""),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [selection, setSelection] = useState<string[]>([]),
    [batchTag, setBatchTag] = useState("review"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const dirty = JSON.stringify(notes) !== JSON.stringify(saved),
    pending = hasPendingDiscovery("/collection/profile"),
    subjects =
      kind === "card"
        ? me.cards.map((c) => ({ id: c.cardId, title: c.name }))
        : kind === "award"
          ? me.awards.map((a) => ({ id: a.id, title: a.title[locale] }))
          : (d.catalogue?.pools.map((p) => ({ id: p.poolId, title: p.title[locale] })) ?? []),
    selected = subjects.some((s) => s.id === subject) ? subject : (subjects[0]?.id ?? ""),
    blocker = useBlocker({
      shouldBlockFn: () => dirty,
      disabled: !dirty,
      enableBeforeUnload: dirty,
      withResolver: true,
    });
  async function save(replay = false) {
    if (busy) return;
    setBusy(true);
    try {
      if (replay) await retryDiscoveryCommand("/collection/profile");
      else
        await discoveryCommand("/collection/profile", {
          expectedVersion: me.profile.version,
          data: { ...me.profile.data, notes },
        });
      await refreshCollectionMe();
    } catch {
      setError(
        t(
          "保存未確認／版本衝突；先重讀或確認原key，不覆寫或另建新重送。",
          "Save unconfirmed / version conflict. Read back or confirm the original key, without overwriting or creating a new request.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  const shown = notes.filter(
    (n) =>
      (filter === "all" || n.category === filter) &&
      n.text.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  const subjectName = (n: CollectionNote) =>
    n.kind === "card"
      ? me.cards.find((c) => c.cardId === n.subjectId)?.name
      : n.kind === "album"
        ? d.catalogue?.pools.find((p) => p.poolId === n.subjectId)?.title[locale]
        : me.awards.find((a) => a.id === n.subjectId)?.title[locale];
  return (
    <section data-private-notes className="panel space-y-4 p-4">
      <p>
        {t(
          "最多30則、每則1000字，僅本人本機保存。來源須目前合法持卡、公開卡冊或已取得成就；失效與隱藏來源不出現在筆記、數量或連結。未取得成就完全隱藏，筆記不加入公開頁或分享網址。",
          "Up to 30 notes, 1000 characters each, saved locally for you only. Sources must be eligible held cards, public albums or earned achievements. Unavailable or hidden sources are excluded from notes, counts and links. Unearned achievements are completely hidden; notes never enter public pages or sharing URLs.",
        )}
      </p>
      <p role="status">
        {dirty ? t("未保存筆記", "Unsaved notes") : t("已保存筆記", "Saved notes")} · v
        {me.profile.version}
      </p>
      <label>
        {t("來源類型", "Source type")}{" "}
        <select
          aria-label="Note subject kind"
          value={kind}
          disabled={busy}
          onChange={(e) => {
            setKind(e.target.value as "card" | "album" | "award");
            setSubject("");
          }}
        >
          <option value="card">{t("本人合法持卡", "Your eligible held card")}</option>
          <option value="album">{t("公開卡冊", "Public album")}</option>
          {!!me.awards.length && (
            <option value="award">{t("已取得成就", "Earned achievement")}</option>
          )}
        </select>
      </label>
      <label>
        {t("來源", "Source")}{" "}
        <select
          aria-label="Note subject"
          value={selected}
          disabled={busy}
          onChange={(e) => setSubject(e.target.value)}
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </label>
      <Button
        disabled={busy || !selected || notes.length >= 30}
        onClick={() =>
          setNotes([
            ...notes,
            {
              schema: 1,
              id: "note-" + crypto.randomUUID(),
              kind,
              subjectId: selected,
              category: "story",
              text: t("我的私人收藏筆記", "My private collection note"),
            },
          ])
        }
      >
        {t("新增私人筆記草稿", "Add private note draft")}
      </Button>
      <label>
        {t("查找本人筆記", "Find your notes")}
        <input
          aria-label="Private note query"
          className="block w-full rounded border bg-background p-2"
          maxLength={100}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <label>
        {t("分類", "Category")}{" "}
        <select
          aria-label="Private note category"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">{t("全部", "All")}</option>
          {NOTE_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      {shown.length ? (
        <>
          <section data-note-batch className="space-y-3 rounded border p-3">
            <h2 className="font-bold">
              {t("整理目前查找的本人筆記草稿", "Arrange drafts of your currently found notes")}
            </h2>
            <p>
              {t(
                "每則最多3個受控標籤；批次只修改所選本人草稿，保存時同一原子操作。取消恢復已保存資料。",
                "Up to 3 controlled tags per note. Batch edits affect selected personal drafts only, saved as one atomic operation. Cancel restores saved data.",
              )}
            </p>
            <Button variant="outline" onClick={() => setSelection(shown.map((n) => n.id))}>
              {t("選取目前結果", "Select current results")}
            </Button>
            <Button variant="outline" onClick={() => setSelection([])}>
              {t("取消選取", "Clear selection")}
            </Button>
            <label>
              {t("批次標籤", "Batch tag")}{" "}
              <select
                aria-label="Batch note tag"
                value={batchTag}
                onChange={(e) => setBatchTag(e.target.value)}
              >
                {NOTE_TAGS.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <p>
              {t("已選目前結果", "Selected current results")}:{" "}
              {shown.filter((n) => selection.includes(n.id)).length}
            </p>
            <Button
              disabled={
                busy ||
                !shown.some((n) => selection.includes(n.id)) ||
                shown.some(
                  (n) =>
                    selection.includes(n.id) &&
                    (n.tags?.length ?? 0) >= 3 &&
                    !n.tags?.includes(batchTag),
                )
              }
              onClick={() =>
                setNotes(
                  notes.map((n) =>
                    shown.some((s) => s.id === n.id) && selection.includes(n.id)
                      ? { ...n, tags: [...new Set([...(n.tags ?? []), batchTag])] }
                      : n,
                  ),
                )
              }
            >
              {t("套用所選標籤草稿", "Apply selected tag to drafts")}
            </Button>
            <Button
              disabled={busy || !shown.some((n) => selection.includes(n.id))}
              variant="outline"
              onClick={() =>
                setNotes(
                  notes.map((n) =>
                    shown.some((s) => s.id === n.id) && selection.includes(n.id)
                      ? { ...n, tags: (n.tags ?? []).filter((v) => v !== batchTag) }
                      : n,
                  ),
                )
              }
            >
              {t("移除所選標籤草稿", "Remove selected tag from drafts")}
            </Button>
          </section>
          <ul className="space-y-4">
            {shown.map((n) => (
              <li key={n.id} className="space-y-2 rounded border p-3">
                <h2>{subjectName(n)}</h2>
                <label>
                  <input
                    type="checkbox"
                    aria-label={"Select note " + n.id}
                    checked={selection.includes(n.id)}
                    disabled={busy}
                    onChange={(e) =>
                      setSelection(
                        e.target.checked
                          ? [...selection, n.id]
                          : selection.filter((id) => id !== n.id),
                      )
                    }
                  />
                  {t("選入批次草稿", "Select for batch draft")}
                </label>
                <p>
                  {t("本人標籤", "Your tags")}:{" "}
                  {(n.tags ?? []).join(" · ") || t("未選標籤", "No tags selected")}
                </p>
                {notes.some(
                  (other) =>
                    other.id !== n.id && other.kind === n.kind && other.subjectId === n.subjectId,
                ) && (
                  <details data-related-private-notes>
                    <summary>
                      {t(
                        "同一合法來源的本人相關筆記",
                        "Your related notes from the same eligible source",
                      )}
                    </summary>
                    <ul>
                      {notes
                        .filter(
                          (other) =>
                            other.id !== n.id &&
                            other.kind === n.kind &&
                            other.subjectId === n.subjectId,
                        )
                        .map((other) => (
                          <li key={other.id} className="break-words">
                            {other.category} · {other.text.slice(0, 80)}
                          </li>
                        ))}
                    </ul>
                  </details>
                )}
                <label>
                  {t("筆記分類", "Note category")}{" "}
                  <select
                    aria-label={"Note category " + n.id}
                    value={n.category}
                    disabled={busy}
                    onChange={(e) =>
                      setNotes(
                        notes.map((v) => (v.id === n.id ? { ...v, category: e.target.value } : v)),
                      )
                    }
                  >
                    {NOTE_CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <textarea
                  aria-label={"Note text " + n.id}
                  className="block min-h-32 w-full rounded border bg-background p-2"
                  maxLength={1000}
                  value={n.text}
                  disabled={busy}
                  onChange={(e) =>
                    setNotes(notes.map((v) => (v.id === n.id ? { ...v, text: e.target.value } : v)))
                  }
                />
                {n.kind === "card" ? (
                  <Link
                    className="underline"
                    to="/app/cards/$cardId"
                    params={{ cardId: n.subjectId }}
                  >
                    {t("核對本人卡牌來源", "Check your card source")}
                  </Link>
                ) : n.kind === "album" ? (
                  <Link className="underline" to="/pools/$poolId" params={{ poolId: n.subjectId }}>
                    {t("閱讀目前公開系列", "Read the current public series")}
                  </Link>
                ) : (
                  <Link to="/app/achievements" className="underline">
                    {t("查看已取得成就", "View earned achievements")}
                  </Link>
                )}
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setNotes(notes.filter((v) => v.id !== n.id))}
                >
                  {t("移除筆記草稿", "Remove note draft")}
                </Button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>
          {notes.length
            ? t("沒有符合條件的合法本人筆記。", "No eligible personal notes match.")
            : t(
                "沒有目前合法本人筆記；可先閱讀公開卡冊。",
                "No currently eligible personal notes. Read a public album first.",
              )}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button
          disabled={busy || !dirty || pending || notes.some((n) => !n.text.trim())}
          onClick={() => void save()}
        >
          {t("保存本人筆記", "Save my notes")}
        </Button>
        <Button
          variant="outline"
          disabled={busy || !dirty}
          onClick={() => {
            setNotes(saved);
            setError("");
          }}
        >
          {t("取消筆記修改", "Cancel note changes")}
        </Button>
      </div>
      {error && <p role="alert">{error}</p>}
      {(pending || error) && (
        <Button disabled={busy} variant="outline" onClick={() => void save(true)}>
          {t("確認笔記原操作", "Confirm original note operation")}
        </Button>
      )}
      <ConfirmDialog
        open={blocker.status === "blocked"}
        title={t("離開未保存筆記？", "Leave unsaved notes?")}
        description={t(
          "未保存草稿會捨棄，取消可繼續編輯；已保存資料保持。",
          "Unsaved drafts will be discarded; cancel to keep editing. Saved data remains.",
        )}
        confirmLabel={t("捨棄並離開", "Discard and leave")}
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </section>
  );
}
