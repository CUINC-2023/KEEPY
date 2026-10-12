import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useCollection, refreshCollectionMe } from "@/lib/collection-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { READING_GUIDES, type ReadingGuide } from "@/lib/collection-reading-guide.mjs";
import {
  discoveryCommand,
  retryDiscoveryCommand,
  hasPendingDiscovery,
} from "@/lib/discovery-store";
export function CollectionReadingGuide() {
  const d = useCollection(),
    t = useDiscoveryText();
  return d.me && d.catalogue && !d.meError && d.catalogueValid ? (
    <Guide
      key={d.me.actorId + ":" + d.me.profile.version + ":" + d.me.visibilityKey}
      actor={d.me.actorId}
    />
  ) : null;
}
function Guide({ actor }: { actor: string }) {
  const d = useCollection(),
    t = useDiscoveryText(),
    { locale } = useLocale(),
    saved = d.me?.profile.data.readingGuide,
    [template, setTemplate] = useState(saved?.template ?? "starter"),
    [poolId, setPoolId] = useState(saved?.poolId ?? d.catalogue?.pools[0]?.poolId ?? ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const pending = hasPendingDiscovery("/collection/profile"),
    me = d.me,
    guide = READING_GUIDES.find((g) => g.id === saved?.template);
  async function save(next: ReadingGuide | undefined, retry = false) {
    if (busy || !me || me.actorId !== actor) return;
    setBusy(true);
    try {
      if (retry) await retryDiscoveryCommand("/collection/profile");
      else {
        const data = { ...me.profile.data };
        if (next) data.readingGuide = next;
        else delete data.readingGuide;
        await discoveryCommand("/collection/profile", {
          expectedVersion: me.profile.version,
          data,
        });
      }
      await refreshCollectionMe();
    } catch {
      setError(
        t(
          "保存未確認或版本衝突；先讀回或確認原key，不建立新重送。",
          "Save unconfirmed or version conflict. Read back or confirm the original key, without a new request.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      id="collection-reading-guide"
      data-collection-reading-guide
      className="panel space-y-3 p-4"
    >
      <h2 className="text-xl font-bold">
        {t("本人收藏閱讀導覽", "Your collection reading guide")}
      </h2>
      <p>
        {t(
          "私人閱讀位置與明確已讀標記；不是持卡、成就或閱讀追蹤。只選目前公開卡冊，來源失效即遮蔽。",
          "Private reading position and explicit read marks, not holdings, achievements or reading tracking. Only currently public albums can be selected; unavailable sources are concealed.",
        )}
      </p>
      <label>
        {t("範本", "Template")}{" "}
        <select
          aria-label="Reading guide template"
          value={template}
          disabled={busy || pending}
          onChange={(e) => setTemplate(e.target.value)}
        >
          {READING_GUIDES.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title[locale]}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("公開卡冊", "Public album")}{" "}
        <select
          aria-label="Reading guide album"
          value={poolId}
          disabled={busy || pending}
          onChange={(e) => setPoolId(e.target.value)}
        >
          {d.catalogue?.pools.map((p) => (
            <option key={p.poolId} value={p.poolId}>
              {p.title[locale]}
            </option>
          ))}
        </select>
      </label>
      <Button
        disabled={busy || pending || !poolId}
        onClick={() => void save({ schema: 1, template, poolId, step: 0 })}
      >
        {t("保存並開始閱讀導覽", "Save and start reading guide")}
      </Button>
      {saved && guide ? (
        <div data-reading-guide-progress>
          <p>
            {guide.title[locale]} · {t("私人已讀標記", "Private read marks")} {saved.step}/3 · v
            {me?.profile.version}
          </p>
          {saved.step < 3 ? (
            <>
              <p>{guide.steps[saved.step]?.[locale]}</p>
              <Link
                to="/pools/$poolId"
                params={{ poolId: saved.poolId }}
                className="underline text-primary"
              >
                {t("閱讀目前公開系列", "Read the currently public series")}
              </Link>
              <Link
                to="/app/album/$poolId"
                params={{ poolId: saved.poolId }}
                className="underline text-primary"
              >
                {t("查看本人卡冊", "Check your album")}
              </Link>
              <Button
                disabled={busy || pending}
                onClick={() => void save({ ...saved, step: saved.step + 1 })}
              >
                {t("已讀此說明，保存下一步", "Read this explanation; save next step")}
              </Button>
            </>
          ) : (
            <p>
              {t(
                "閱讀導覽標記完成；不代表持卡或取得成就。",
                "Reading guide marks complete; this does not mean holdings or an earned achievement.",
              )}
            </p>
          )}
          <Button variant="outline" disabled={busy || pending} onClick={() => void save(undefined)}>
            {t("取消本人閱讀導覽", "Cancel my reading guide")}
          </Button>
        </div>
      ) : (
        <p>
          {t(
            "沒有目前有效的本人閱讀導覽；可選擇公開卡冊開始。",
            "No currently valid personal guide. Choose a public album to begin.",
          )}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {(error || pending) && (
        <Button disabled={busy} variant="outline" onClick={() => void save(undefined, true)}>
          {t("確認閱讀導覽原操作", "Confirm original reading guide operation")}
        </Button>
      )}
    </section>
  );
}
