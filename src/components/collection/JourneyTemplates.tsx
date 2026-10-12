import { useState } from "react";
import type { CollectionMe, CollectionCatalogue } from "@/lib/collection-store";
import { refreshCollectionMe } from "@/lib/collection-store";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import {
  discoveryCommand,
  retryDiscoveryCommand,
  hasPendingDiscovery,
} from "@/lib/discovery-store";
import { localSessionGeneration, localTestState } from "@/lib/local-test-client";
const templates = [
  { id: "solo", count: 1, zh: "單冊閱讀旅程", en: "Single-album reading" },
  { id: "duet", count: 2, zh: "雙冊交錯旅程", en: "Two-album journey" },
  { id: "trio", count: 3, zh: "三冊主題旅程", en: "Three-album journey" },
];
export function JourneyTemplates({
  me,
  catalogue,
}: {
  me: CollectionMe;
  catalogue: CollectionCatalogue;
}) {
  const t = useDiscoveryText(),
    { locale } = useLocale(),
    [id, setId] = useState("solo"),
    [selected, setSelected] = useState<string[]>([]),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const preset = templates.find((v) => v.id === id)!,
    eligible = catalogue.pools.filter((p) => p.visibleDesigns > 0),
    pending = hasPendingDiscovery("/collection/profile"),
    valid =
      selected.length === preset.count &&
      selected.every((id) => eligible.some((p) => p.poolId === id));
  const save = async (retry = false) => {
    if (busy) return;
    const epoch = localSessionGeneration(),
      current = () =>
        epoch === localSessionGeneration() && localTestState().summary?.user.id === me.actorId;
    setBusy(true);
    try {
      if (retry) await retryDiscoveryCommand("/collection/profile");
      else
        await discoveryCommand("/collection/profile", {
          expectedVersion: me.profile.version,
          data: { ...me.profile.data, goalPoolIds: selected },
        });
      if (current()) {
        setConfirm(false);
        await refreshCollectionMe();
      }
    } catch {
      if (current())
        setMessage(
          t(
            "版本／來源可能變更，請重讀或確認原操作；未確認時不建立新請求。",
            "Version/source may have changed. Reload or confirm the original operation; no new request while unconfirmed.",
          ),
        );
    } finally {
      if (current()) setBusy(false);
    }
  };
  return (
    <section id="journey-templates" data-journey-templates className="panel space-y-4 p-4">
      <h2 className="text-xl font-bold">
        {t("受控多卡冊旅程編排", "Controlled multi-album journey plans")}
      </h2>
      <p>
        {t(
          "沿本人既有目標、公開不同款式與三階段來源：選擇卡冊 → 至少取得款式 → 完成目前公開系列。保存只替換私人目標順序，暫停狀態保持；不增加獎勵、事件或正式規則。",
          "Uses your existing goals, public distinct designs and three source stages: choose albums → acquire a design → complete current public series. Saving replaces only private goal order and preserves pause state; no rewards, events or formal rules added.",
        )}
      </p>
      <label>
        {t("旅程範本", "Journey template")}{" "}
        <select
          aria-label="Journey template"
          value={id}
          disabled={busy || pending}
          onChange={(e) => {
            setId(e.target.value);
            setSelected([]);
            setMessage("");
          }}
        >
          {templates.map((v) => (
            <option key={v.id} value={v.id}>
              {locale === "en" ? v.en : v.zh}
            </option>
          ))}
        </select>
      </label>
      {eligible.length < preset.count ? (
        <p>
          {t(
            "目前合法公開卡冊不足，不補造系列或延長期間。",
            "Not enough eligible public albums; no invented series or extended periods.",
          )}
        </p>
      ) : (
        <fieldset disabled={busy || pending}>
          <legend>
            {t("依勾選順序編排", "Arrange in selection order")} ({selected.length}/{preset.count})
          </legend>
          {eligible.map((p) => (
            <label key={p.poolId} className="flex gap-3 py-2">
              <input
                type="checkbox"
                aria-label={"Journey album " + p.poolId}
                checked={selected.includes(p.poolId)}
                disabled={!selected.includes(p.poolId) && selected.length >= preset.count}
                onChange={(e) =>
                  setSelected((ids) =>
                    e.target.checked ? [...ids, p.poolId] : ids.filter((id) => id !== p.poolId),
                  )
                }
              />
              {p.title[locale]}
            </label>
          ))}
        </fieldset>
      )}
      <ol>
        {selected.map((id, i) => {
          const progress = me.progress.find((p) => p.poolId === id);
          return (
            <li key={id}>
              {i + 1} · {eligible.find((p) => p.poolId === id)?.title[locale]} ·{" "}
              {progress?.owned ?? 0}/{progress?.total ?? 0} ·{" "}
              {t("以当前公开分母重算", "Recomputed against the current public denominator")}
            </li>
          );
        })}
      </ol>
      <Button disabled={!valid || busy || pending} onClick={() => setConfirm(true)}>
        {t("保存旅程到私人目標", "Save journey as private goals")}
      </Button>
      <Button
        variant="outline"
        disabled={busy || pending || !selected.length}
        onClick={() => {
          setSelected([]);
          setConfirm(false);
        }}
      >
        {t("取消旅程編排", "Cancel journey planning")}
      </Button>
      <p role="status">{message}</p>
      {pending && (
        <Button disabled={busy} onClick={() => void save(true)}>
          {t("確認原旅程操作", "Confirm original journey operation")}
        </Button>
      )}
      <ConfirmDialog
        open={confirm}
        title={t("替換本人私人目標順序？", "Replace your private goal order?")}
        description={t(
          "只更新既有目標來源；不改持卡、成就或公開設定，保留目前暫停狀態。",
          "Updates only the existing goal source. Holdings, achievements, public settings and pause state stay intact.",
        )}
        confirmLabel={t("確認保存旅程", "Confirm saving the journey")}
        onCancel={() => setConfirm(false)}
        onConfirm={() => void save()}
      />
    </section>
  );
}
