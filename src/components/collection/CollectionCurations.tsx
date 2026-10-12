import { useState } from "react";
import { Link, useBlocker } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CollectionCardView } from "./CollectionCardView";
import {
  useCollection,
  refreshCollectionMe,
  type CollectionMe,
  type CollectionProfile,
} from "@/lib/collection-store";
import { discoveryCommand, retryDiscoveryCommand } from "@/lib/discovery-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
type Groups = NonNullable<CollectionProfile["curations"]>;
export function CollectionCurations() {
  const d = useCollection(),
    t = useDiscoveryText();
  return (
    <main className="space-y-4 p-4 md:p-8" data-collection-curations>
      <h1 className="text-2xl font-bold">{t("本人收藏策展", "Your collection curations")}</h1>
      <Link className="text-primary underline" to="/app/collection">
        {t("返回本人收藏", "Back to your collection")}
      </Link>
      {d.error || d.meError ? (
        <div role="alert">
          <p>
            {t(
              "來源無法讀取，沒有保留舊帳號策展。",
              "Sources unavailable; old account curations are not retained.",
            )}
          </p>
          <Button onClick={() => void refreshCollectionMe()}>{t("重新讀取", "Reload")}</Button>
        </div>
      ) : d.me ? (
        <Editor key={d.me.actorId + ":" + d.me.profile.version} me={d.me} />
      ) : (
        <p>
          {t(
            "請選擇本人Local Test帳號；這不是真人登入。",
            "Choose your Local Test account; this is not a real login.",
          )}
        </p>
      )}
    </main>
  );
}
function Editor({ me }: { me: CollectionMe }) {
  const t = useDiscoveryText(),
    saved = me.profile.data.curations ?? [],
    [groups, setGroups] = useState<Groups>(saved),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const dirty = JSON.stringify(groups) !== JSON.stringify(saved),
    valid = new Set(me.cards.map((c) => c.cardId));
  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    disabled: !dirty,
    enableBeforeUnload: dirty,
    withResolver: true,
  });
  const change = (id: string, patch: Partial<Groups[number]>) =>
    setGroups(groups.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  const save = async (retry = false) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (retry) await retryDiscoveryCommand("/collection/profile");
      else
        await discoveryCommand("/collection/profile", {
          expectedVersion: me.profile.version,
          data: {
            ...me.profile.data,
            curations: groups.map((g) => ({
              ...g,
              cardIds: g.cardIds.filter((id) => valid.has(id)),
            })),
          },
        });
      await refreshCollectionMe();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="space-y-4" data-curation-editor>
      <p>
        {t(
          "最多6組、每組12款目前合法持有卡；不消耗、不授予資產。預設私人，公開須同時開啟個人頁與卡牌展示，再明確選擇此組。",
          "Up to six groups, each with 12 currently eligible held designs. No consumption or asset grants. Private by default; public display requires your public profile, cards enabled and explicit group consent.",
        )}
      </p>
      <p role="status">
        {dirty ? t("未保存策展", "Unsaved curations") : t("已保存策展", "Saved curations")} · v
        {me.profile.version}
      </p>
      <Button
        disabled={busy || groups.length >= 6}
        onClick={() =>
          setGroups([
            ...groups,
            {
              id: "curation-" + crypto.randomUUID(),
              title: t("私人主題", "Private theme"),
              note: "",
              cardIds: [],
              showPublic: false,
            },
          ])
        }
      >
        {t("新增私人分組", "Add private group")}
      </Button>
      {!groups.length && <p>{t("尚無本人策展分組。", "No personal curation groups yet.")}</p>}
      {groups.map((g, index) => (
        <fieldset key={g.id} className="panel space-y-3 p-4">
          <legend>
            {t("策展分組", "Curation group")} {index + 1}
          </legend>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              disabled={busy || index === 0}
              onClick={() => {
                const next = [...groups];
                [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];
                setGroups(next);
              }}
            >
              {t("展區上移", "Move exhibition section up")}
            </Button>
            <Button
              variant="outline"
              disabled={busy || index === groups.length - 1}
              onClick={() => {
                const next = [...groups];
                [next[index + 1], next[index]] = [next[index]!, next[index + 1]!];
                setGroups(next);
              }}
            >
              {t("展區下移", "Move exhibition section down")}
            </Button>
          </div>
          <label>
            {t("主題", "Theme")}
            <input
              className="block w-full rounded border bg-background p-2"
              aria-label={"Curation title " + index}
              maxLength={60}
              value={g.title}
              disabled={busy}
              onChange={(e) => change(g.id, { title: e.target.value })}
            />
          </label>
          <label>
            {t("註記（公開選擇後會展示）", "Note (displayed if you choose public)")}
            <textarea
              className="block w-full rounded border bg-background p-2"
              aria-label={"Curation note " + index}
              maxLength={240}
              value={g.note}
              disabled={busy}
              onChange={(e) => change(g.id, { note: e.target.value })}
            />
          </label>
          <fieldset>
            <legend>
              {t(
                "目前合法持有款式（勾選順序）",
                "Currently eligible held designs (selection order)",
              )}
            </legend>
            {me.cards.map((c) => (
              <label key={c.cardId} className="block break-words">
                <input
                  aria-label={"Curation card " + index + " " + c.cardId}
                  type="checkbox"
                  checked={g.cardIds.includes(c.cardId)}
                  disabled={
                    busy ||
                    (!g.cardIds.includes(c.cardId) &&
                      g.cardIds.filter((id) => valid.has(id)).length >= 12)
                  }
                  onChange={(e) =>
                    change(g.id, {
                      cardIds: e.target.checked
                        ? [...g.cardIds, c.cardId]
                        : g.cardIds.filter((id) => id !== c.cardId),
                    })
                  }
                />
                {c.name} · {c.poolId}
              </label>
            ))}
          </fieldset>
          <ol>
            {g.cardIds
              .filter((id) => valid.has(id))
              .map((id, n) => (
                <li key={id} className="flex flex-wrap items-center gap-2">
                  {me.cards.find((c) => c.cardId === id)?.name}
                  <Button
                    variant="outline"
                    disabled={busy || n === 0}
                    onClick={() => {
                      const next = g.cardIds.filter((v) => valid.has(v));
                      [next[n - 1], next[n]] = [next[n]!, next[n - 1]!];
                      change(g.id, { cardIds: next });
                    }}
                  >
                    {t("上移", "Move up")}
                  </Button>
                </li>
              ))}
          </ol>
          <label>
            <input
              aria-label={"Public curation " + index}
              type="checkbox"
              disabled={busy}
              checked={g.showPublic}
              onChange={(e) => change(g.id, { showPublic: e.target.checked })}
            />
            {t("允許此組公開展示", "Permit public display of this group")}
          </label>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => setGroups(groups.filter((x) => x.id !== g.id))}
          >
            {t("移除分組（保存後生效）", "Remove group (effective after save)")}
          </Button>
        </fieldset>
      ))}
      <div className="flex flex-wrap gap-3">
        <Button disabled={busy || !dirty} onClick={() => void save()}>
          {t("保存策展", "Save curations")}
        </Button>
        <Button
          variant="outline"
          disabled={busy || !dirty}
          onClick={() => {
            setGroups(saved);
            setError("");
          }}
        >
          {t("取消策展修改", "Cancel curation changes")}
        </Button>
        <Link className="text-primary underline" to="/app/settings/privacy">
          {t("確認公開範圍與預覽", "Check public scope and preview")}
        </Link>
      </div>
      <details className="panel space-y-4 p-4" data-private-exhibition-preview>
        <summary>
          {t("目前草稿私人展覽預覽", "Private exhibition preview of the current draft")}
        </summary>
        <p>
          {t(
            "尚未保存的分區、介紹與敘事順序；這不是匿名公開投影，也不代表同意公開。只有目前合法持卡可見。",
            "Unsaved sections, introductions and narrative order. This is not the anonymous public projection or public consent. Only currently eligible held cards are shown.",
          )}
        </p>
        {groups.map((g, i) => (
          <section key={"preview:" + g.id} className="space-y-3">
            <h3 className="text-lg font-bold">
              {i + 1} · {g.title || t("未命名展區", "Untitled section")}
            </h3>
            <p className="whitespace-pre-wrap break-words">{g.note}</p>
            <p>
              {g.showPublic
                ? t(
                    "本組已勾選允許，仍須本人整體公開與持卡公開設定才能展示。",
                    "Group permission selected; overall profile and card permissions are still required.",
                  )
                : t("本組保持私人。", "This group remains private.")}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {g.cardIds
                .filter((id) => valid.has(id))
                .map((id) => (
                  <CollectionCardView key={id} card={me.cards.find((c) => c.cardId === id)!} />
                ))}
            </div>
            {!g.cardIds.some((id) => valid.has(id)) && (
              <p>{t("目前沒有合法展出選卡。", "No eligible cards selected for this section.")}</p>
            )}
          </section>
        ))}
      </details>
      {error && (
        <div role="alert">
          <p>{error}</p>
          <p>
            {t(
              "衝突先取消並重讀；回應丟失以原key確認，勿重建分組重送。",
              "Cancel and reload after a conflict; confirm a lost response with the original key rather than recreate groups.",
            )}
          </p>
          <Button disabled={busy} onClick={() => void save(true)}>
            {t("確認原操作", "Confirm original operation")}
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={blocker.status === "blocked"}
        title={t("離開未保存策展？", "Leave unsaved curations?")}
        description={t(
          "未保存分組會捨棄；取消可繼續編輯。",
          "Unsaved groups will be discarded; cancel to keep editing.",
        )}
        confirmLabel={t("捨棄並離開", "Discard and leave")}
        cancelLabel={t("繼續編輯", "Keep editing")}
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </section>
  );
}
