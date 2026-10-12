import { PublicRankings } from "./PublicRankings";
import { CollectionShare } from "./CollectionShare";
import { CollectionJourney } from "./CollectionJourney";
import { JourneyTemplates } from "./JourneyTemplates";
import { CollectionWorkbench } from "./CollectionWorkbench";
import { GrowthIntegration } from "./GrowthIntegration";
import { CatalogueIntegrity } from "./CatalogueIntegrity";
import { ThemeJourney } from "./ThemeJourney";
import { CollectionHistory } from "./CollectionHistory";
import { CollectionRecap } from "./CollectionRecap";
import { MultiStageChallenge } from "./MultiStageChallenge";
import { isCollectionProjection } from "@/lib/collection-contract.mjs";
import { CollectionFilters } from "./CollectionFilters";
import { CollectionHome } from "./CollectionHome";
import { CollectionAlbums } from "./CollectionAlbums";
import { ShowcaseEditor } from "./ShowcaseEditor";
import { CollectionGoals } from "./CollectionGoals";
import { ReturnEntrances } from "@/components/content/PublicExplore";
import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useBlocker } from "@tanstack/react-router";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BadgeMark } from "@/components/player/BadgeMark";
import { Button } from "@/components/ui/button";
import { CollectionCardView } from "./CollectionCardView";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { useDiscoveryText } from "@/lib/discovery-copy";
import {
  localApi,
  localTestState,
  useLocalTest,
  localSessionGeneration,
} from "@/lib/local-test-client";
import { discoveryCommand, retryDiscoveryCommand } from "@/lib/discovery-store";
import {
  useCollection,
  refreshCollection,
  refreshCollectionMe,
  type CollectionCard,
  type CollectionProgress,
  type CollectionAward,
  type CollectionProfile,
  type PublicCollection,
  type CollectionRules,
} from "@/lib/collection-store";
export function CollectionNotice() {
  const t = useDiscoveryText();
  return (
    <p className="text-sm text-muted-foreground">
      {t(
        "本機測試 · 示意帳號與素材。進度只計曾取得的公開不同款式；隱藏款式不列入分母。正式成長、合成及獎勵仍待核定。",
        "Local Test · Synthetic accounts and sample assets. Progress counts acquired distinct public designs; hidden designs are excluded. Growth, synthesis and reward policy remain unapproved.",
      )}
    </p>
  );
}
function CollectionStatus() {
  const d = useCollection(),
    t = useDiscoveryText();
  if (d.error || d.meError)
    return (
      <div role="alert" className="panel p-4">
        <p>
          {t(
            "收藏資料無法載入，請確認本機服務並重試。",
            "Collection unavailable. Check the local service and retry.",
          )}
        </p>
        <Button
          onClick={() => {
            void refreshCollection();
            void refreshCollectionMe();
          }}
        >
          {t("重試", "Retry")}
        </Button>
      </div>
    );
  return !d.loaded ? <p role="status">{t("載入中…", "Loading…")}</p> : null;
}
function Cards({ cards, wide = false }: { cards: CollectionCard[]; wide?: boolean }) {
  const t = useDiscoveryText();
  return (
    <div
      className={
        wide
          ? "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          : "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      }
    >
      {cards.map((c) => {
        return (
          <div key={c.cardId} className="space-y-2">
            <CollectionCardView card={c} />
            {c.count !== undefined && (
              <p className="text-sm">
                {t("目前持有", "Currently held")}: {c.count} · {t("重複卡", "Duplicates")}:{" "}
                {Math.max(0, c.count - 1)}
              </p>
            )}
            <p className="text-xs">
              {t("稀有度", "Rarity")}: {c.rarity} · {t("卡牌版本", "Card version")}: {c.cardVersion}
            </p>
          </div>
        );
      })}
    </div>
  );
}
function ProgressList({ rows }: { rows: CollectionProgress[] }) {
  const { locale } = useLocale(),
    t = useDiscoveryText();
  return (
    <div className="space-y-4">
      {rows.map((p) => (
        <div key={p.poolId} className="panel space-y-2 p-4">
          <Link to="/pools/$poolId" params={{ poolId: p.poolId }}>
            {p.title[locale]}
          </Link>
          <p>
            {p.owned} / {p.total} · {p.pct}% {p.complete && t("已完成", "Complete")}
          </p>
          <progress className="h-2 w-full" max={100} value={p.pct} aria-label={p.title[locale]} />
          <p className="text-xs text-muted-foreground">
            {t("公開款式 · 規則版本", "Public designs · Rules version")} {p.ruleVersion}
          </p>
        </div>
      ))}
    </div>
  );
}
function Awards({ rows, layout = "list" }: { rows: CollectionAward[]; layout?: "list" | "grid" }) {
  const { locale } = useLocale(),
    t = useDiscoveryText();
  return rows.length ? (
    <ul
      className={layout === "grid" ? "grid gap-3 sm:grid-cols-2" : "space-y-2"}
      data-badge-layout={layout}
    >
      {rows.map((a) => (
        <li className="panel p-3" key={a.id}>
          <div aria-hidden="true" className="mb-2 w-20">
            <BadgeMark
              label={a.title[locale]}
              variant={
                a.type === "series" ? "series" : a.type === "activity" ? "activity" : "first"
              }
            />
          </div>
          {a.title[locale]}{" "}
          <span className="text-xs text-muted-foreground">
            · {t("規則版本", "Rules version")} {a.ruleVersion} · {a.recordedAt.slice(0, 10)}
          </span>
        </li>
      ))}
    </ul>
  ) : (
    <p>{t("尚無已取得成就。", "No achievements yet.")}</p>
  );
}
export function CollectionPage() {
  const d = useCollection(),
    t = useDiscoveryText();
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-bold">
        {t("收藏進度與展示", "Collection progress & showcase")}
      </h1>
      <CollectionNotice />
      <CollectionStatus />
      {!d.me ? (
        <p>
          {t(
            "請先至本機測試選擇帳號並讀取保存資料。",
            "Select a Local Test account and load saved data first.",
          )}
        </p>
      ) : (
        <>
          <CollectionHome
            me={d.me}
            renderCard={(cards) => <Cards cards={cards} />}
            growth={
              d.catalogue ? (
                <GrowthIntegration
                  key={"growth-" + d.me.actorId}
                  me={d.me}
                  catalogue={d.catalogue}
                />
              ) : (
                <p>{t("成長來源尚未可用。", "Growth sources are not available yet.")}</p>
              )
            }
          />
          <CollectionJourney me={d.me} />
          {d.catalogue && (
            <CollectionWorkbench
              key={"workbench:" + d.me.actorId + ":" + d.me.profile.version}
              me={d.me}
              catalogue={d.catalogue}
            />
          )}
          {d.catalogue && (
            <JourneyTemplates
              key={"journey-template:" + d.me.actorId + ":" + d.me.profile.version}
              me={d.me}
              catalogue={d.catalogue}
            />
          )}
          <CollectionGoals key={"goals-" + d.me.actorId + ":" + d.me.profile.version} me={d.me} />
          {d.catalogue && <ThemeJourney me={d.me} catalogue={d.catalogue} />}
          {d.catalogue && (
            <MultiStageChallenge
              key={d.me.actorId + ":" + d.me.profile.version}
              me={d.me}
              catalogue={d.catalogue}
            />
          )}
          <CollectionAlbums key={"albums-" + d.me.actorId} me={d.me} />
          <CollectionHistory key={"history-" + d.me.actorId} me={d.me} />
          <CollectionRecap key={"recap-" + d.me.actorId} me={d.me} />
          <div className="flex flex-wrap gap-4">
            <Link to="/app/settings/privacy">{t("編輯公開收藏頁", "Edit public collection")}</Link>
            <Link to="/app/growth">{t("成長與合成預覽", "Growth & synthesis preview")}</Link>
            <Link to="/leaderboards">{t("排行榜", "Rankings")}</Link>
            <Link to="/app/rankings">{t("本人排行中心", "Your ranking center")}</Link>
            <Link to="/app/participation-level">
              {t("平台參與預覽", "Platform participation preview")}
            </Link>
          </div>
          <ProgressList rows={d.me.progress} />
          <h2 className="text-xl font-semibold">
            {t("系列徽章與成就", "Series badges & achievements")}
          </h2>
          <Awards rows={d.me.awards} />
          <h2 className="text-xl font-semibold">
            {t("目前持有的公開款式", "Currently held public designs")}
          </h2>
          <CollectionFilters
            key={d.me.actorId}
            cards={d.me.cards}
            pools={d.me.progress}
            render={(rows) => <Cards cards={rows} />}
          />
          <ReturnEntrances />
        </>
      )}
    </div>
  );
}
export function CollectionPrivacy() {
  const d = useCollection(),
    local = useLocalTest(),
    t = useDiscoveryText();
  const [draft, setDraft] = useState<CollectionProfile | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const epoch = localSessionGeneration();
  useEffect(() => {
    setBusy(false);
    setMessage("");
  }, [local.summary?.user.id, epoch]);
  const sessionMatches = (actor: string | undefined, serial: number) =>
    localTestState().enabled &&
    localTestState().summary?.user.id === actor &&
    localSessionGeneration() === serial;

  const revision = useRef<{ actor: string; version: number; data: CollectionProfile } | null>(null);
  const dirty =
    !!draft &&
    !!revision.current &&
    revision.current.actor === local.summary?.user.id &&
    JSON.stringify(draft) !== JSON.stringify(revision.current.data);
  const blocker = useBlocker({
    shouldBlockFn: () => dirty || busy,
    disabled: !dirty && !busy,
    enableBeforeUnload: dirty || busy,
    withResolver: true,
  });
  useEffect(() => {
    const actor = local.summary?.user.id;
    if (!d.me || !actor) {
      revision.current = null;
      setDraft(null);
      setMessage("");
      return;
    }
    if (revision.current?.actor === actor) {
      if (revision.current.version === d.me.profile.version) return;
      if (dirty && JSON.stringify(draft) !== JSON.stringify(d.me.profile.data)) return;
    }
    revision.current = {
      actor,
      version: d.me.profile.version,
      data: structuredClone(d.me.profile.data),
    };
    setDraft(d.me ? structuredClone(d.me.profile.data) : null);
    setMessage("");
  }, [d.me, local.summary?.user.id, dirty, draft]);
  if (!d.me || !draft) return <CollectionPage />;
  const controls: [
    [keyof CollectionProfile, string, string],
    ...Array<[keyof CollectionProfile, string, string]>,
  ] = [
    ["isPublic", "公開此收藏頁", "Publish this collection"],
    ["showCards", "展示主卡與收藏櫃", "Show main card & shelf"],
    ["showProgress", "展示公開系列進度", "Show public series progress"],
    ["showBadges", "展示系列徽章與成就", "Show badges & achievements"],
    [
      "showRanking",
      "允許參與排行榜（測試帳號仍排除）",
      "Opt in to rankings (test accounts stay excluded)",
    ],
  ];
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-bold">{t("公開收藏頁設定", "Public collection settings")}</h1>
      <CollectionNotice />
      <p>
        {t(
          "預設私人。公開頁不顯示 KP、交易、持卡數量、帳號 ID 或合約；下架與隱藏卡會自動移除。",
          "Private by default. Public pages omit KP, transactions, holding quantities, account IDs and contracts. Withdrawn and hidden designs are automatically removed.",
        )}
      </p>
      <form
        className="panel space-y-4 p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          const actor = local.summary?.user.id,
            serial = localSessionGeneration();
          setBusy(true);
          setMessage("");
          try {
            await discoveryCommand("/collection/profile", {
              expectedVersion: revision.current!.version,
              data: draft,
            });
            if (!sessionMatches(actor, serial)) return;
            await refreshCollectionMe();
            if (!sessionMatches(actor, serial)) return;
            setMessage(t("已保存", "Saved"));
          } catch (e) {
            if (sessionMatches(actor, serial)) setMessage(String(e));
          } finally {
            if (sessionMatches(actor, serial)) setBusy(false);
          }
        }}
      >
        <fieldset disabled={busy} className="space-y-4">
          <ShowcaseEditor draft={draft} change={setDraft} pools={d.me.progress} />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const clean = structuredClone(draft);
              clean.mainCardId = d.me!.cards.some((c) => c.cardId === draft.mainCardId)
                ? draft.mainCardId
                : null;
              clean.shelfIds = draft.shelfIds.filter((id) =>
                d.me!.cards.some((c) => c.cardId === id),
              );
              if (draft.badgeIds)
                clean.badgeIds = draft.badgeIds.filter((id) =>
                  d.me!.awards.some((a) => a.id === id),
                );
              if (draft.goalPoolIds)
                clean.goalPoolIds = draft.goalPoolIds.filter((id) =>
                  d.me!.progress.some((p) => p.poolId === id),
                );
              if (draft.presentation)
                clean.presentation = {
                  ...draft.presentation,
                  poolIds: draft.presentation.poolIds.filter((id) =>
                    d.me!.progress.some((p) => p.poolId === id),
                  ),
                };
              setDraft(clean);
            }}
          >
            {t("移除不可展示的選項（未保存）", "Remove unavailable selections (not saved)")}
          </Button>
          <label className="block">
            {t("顯示名稱", "Display name")}
            <input
              className="w-full rounded border p-2"
              aria-label="Collection display name"
              maxLength={80}
              required
              value={draft.displayName}
              onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
            />
          </label>
          <label className="block">
            {t("簡短介紹", "Short bio")}
            <textarea
              className="w-full rounded border p-2"
              aria-label="Collection bio"
              maxLength={500}
              value={draft.bio}
              onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
            />
          </label>
          {controls.map(([k, zh, en]) => (
            <label className="flex gap-2" key={k}>
              <input
                type="checkbox"
                aria-label={"Collection " + k}
                checked={Boolean(draft[k])}
                onChange={(e) => setDraft({ ...draft, [k]: e.target.checked })}
              />
              {t(zh, en)}
            </label>
          ))}
          <fieldset className="space-y-3 rounded-lg border p-4">
            <legend>
              {t(
                "候選成長摘要公開選擇（預設私人）",
                "Candidate growth summary choices (private by default)",
              )}
            </legend>
            {(["player", "platform"] as const).map((kind) => (
              <label key={kind} className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  aria-label={"Growth preview " + kind}
                  checked={draft.growthPreview?.[kind] ?? false}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      growthPreview: {
                        ...{ player: false, platform: false },
                        ...draft.growthPreview,
                        [kind]: e.target.checked,
                      },
                    })
                  }
                />
                {kind === "player"
                  ? t("公開玩家候選A摘要", "Share player candidate A summary")
                  : t("公開平台參與候選摘要", "Share platform participation candidate summary")}
              </label>
            ))}
            <p className="text-sm text-muted-foreground">
              {t(
                "僅已保存且公開頁啟用時提供摘要；不公開來源明細，不影響排行、資產或權限。",
                "Summaries appear only after saving and enabling the public page. Source details stay private; rankings, assets and permissions are unaffected.",
              )}
            </p>
          </fieldset>
          <label className="block">
            {t("主展示卡", "Main showcase card")}
            <select
              className="w-full rounded border p-2"
              aria-label="Main showcase card"
              value={draft.mainCardId ?? ""}
              onChange={(e) => setDraft({ ...draft, mainCardId: e.target.value || null })}
            >
              <option value="">{t("不展示", "None")}</option>
              {d.me.cards.map((c) => (
                <option key={c.cardId} value={c.cardId}>
                  {c.name} · {c.rarity}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend>{t("收藏櫃（最多 12 款）", "Shelf (up to 12 designs)")}</legend>
            {d.me.cards.map((c) => (
              <label className="block" key={c.cardId}>
                <input
                  type="checkbox"
                  aria-label={"Showcase " + c.cardId}
                  checked={draft.shelfIds.includes(c.cardId)}
                  disabled={!draft.shelfIds.includes(c.cardId) && draft.shelfIds.length >= 12}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      shelfIds: e.target.checked
                        ? [...draft.shelfIds, c.cardId]
                        : draft.shelfIds.filter((id) => id !== c.cardId),
                    })
                  }
                />{" "}
                {c.name} · {c.rarity}
              </label>
            ))}
          </fieldset>
          <Button type="submit">
            {busy ? t("保存中…", "Saving…") : t("保存公開設定", "Save public settings")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!dirty}
            onClick={() => {
              revision.current = {
                actor: d.me!.actorId,
                version: d.me!.profile.version,
                data: structuredClone(d.me!.profile.data),
              };
              setDraft(structuredClone(d.me!.profile.data));
              setMessage("");
            }}
          >
            {t("取消修改", "Cancel changes")}
          </Button>
        </fieldset>
      </form>
      <p role="status" data-collection-save-state>
        {!dirty ? t("已保存設定", "Saved settings") : t("有未保存修改", "Unsaved changes")} · v
        {revision.current?.version}
      </p>
      {revision.current?.version !== d.me.profile.version && (
        <p role="alert">
          {t(
            "保存版本已更新；本機修改仍保留。請取消並重讀後再編輯，不能覆寫新版。",
            "Saved revision changed; your local edits are retained. Cancel and reload before editing again; the newer revision cannot be overwritten.",
          )}
        </p>
      )}
      <CollectionDraftPreview
        key={local.summary?.user.id}
        draft={draft}
        version={revision.current?.version ?? d.me.profile.version}
      />
      <p role="status">{message}</p>
      {message && (
        <Button
          disabled={busy}
          variant="outline"
          onClick={async () => {
            setBusy(true);
            const actor = local.summary?.user.id,
              serial = localSessionGeneration();
            try {
              await retryDiscoveryCommand("/collection/profile");
              if (!sessionMatches(actor, serial)) return;
              await refreshCollectionMe();
              if (!sessionMatches(actor, serial)) return;
              setMessage(t("已確認保存結果", "Saved result confirmed"));
            } catch (e) {
              if (sessionMatches(actor, serial)) setMessage(String(e));
            } finally {
              if (sessionMatches(actor, serial)) setBusy(false);
            }
          }}
        >
          {t("重試待確認的保存", "Retry unconfirmed save")}
        </Button>
      )}
      <Button variant="outline" onClick={() => void refreshCollectionMe()} disabled={busy || dirty}>
        {t("重新載入保存設定", "Reload saved settings")}
      </Button>
      <Link
        className="block"
        to="/collectors/$collectorId"
        params={{ collectorId: d.me.profile.handle }}
      >
        {t("開啟公開頁（私人時無法存取）", "Open public page (unavailable while private)")}
      </Link>
      <Link className="block" to="/app/collection">
        {t("查看本人收藏與徽章", "View my collection & badges")}
      </Link>
      <ConfirmDialog
        open={blocker.status === "blocked"}
        title={t("離開未保存設定？", "Leave unsaved settings?")}
        description={t(
          "未保存修改會捨棄。若保存回應尚未確認，請留在此頁確認原操作，不新增請求。",
          "Unsaved changes will be discarded. If a save response is unconfirmed, stay here and confirm the original operation instead of submitting a new request.",
        )}
        confirmLabel={t("捨棄並離開", "Discard and leave")}
        cancelLabel={t("繼續編輯", "Keep editing")}
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </div>
  );
}
export function CollectionDraftPreview({
  draft,
  version,
}: {
  draft: CollectionProfile;
  version: number;
}) {
  const collection = useCollection(),
    epoch = localSessionGeneration();
  const t = useDiscoveryText(),
    local = useLocalTest(),
    actor = local.summary?.user.id,
    input = JSON.stringify(draft);
  const [result, setResult] = useState<{
      input: string;
      visibilityKey: string;
      projection: PublicCollection | null;
    } | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const previewRequest = useRef<AbortController | null>(null);
  const [viewport, setViewport] = useState("full");
  useEffect(() => {
    previewRequest.current?.abort();
    previewRequest.current = null;
    setResult(null);
    setError("");
    setBusy(false);
    return () => {
      previewRequest.current?.abort();
      previewRequest.current = null;
    };
  }, [input, version, actor, epoch, collection.catalogue?.visibilityKey]);
  const [autoPreview, setAutoPreview] = useState(false);
  const loadPreview = useCallback(async () => {
    const controller = new AbortController();
    previewRequest.current?.abort();
    previewRequest.current = controller;
    const isCurrent = () =>
      previewRequest.current === controller &&
      !controller.signal.aborted &&
      localTestState().summary?.user.id === actor &&
      epoch === localSessionGeneration();
    setBusy(true);
    setResult(null);
    setError("");
    try {
      const r = await localApi<{
        projection: PublicCollection | null;
        visibilityKey: string;
      }>(
        "/collection/profile-preview",
        {
          expectedVersion: version,
          data: draft,
        },
        "POST",
        undefined,
        controller.signal,
      );
      if (r.projection && !isCollectionProjection(r.projection, "showcase"))
        throw new Error("Collection projection mismatch");
      if (isCurrent())
        setResult({ input, visibilityKey: r.visibilityKey, projection: r.projection });
    } catch {
      if (isCurrent()) setError("preview-unavailable");
    } finally {
      if (isCurrent()) setBusy(false);
    }
  }, [actor, epoch, input, version, draft]);
  useEffect(() => {
    if (!autoPreview || !actor || !collection.catalogueValid) return;
    const timer = window.setTimeout(() => void loadPreview(), 300);
    return () => window.clearTimeout(timer);
  }, [
    autoPreview,
    actor,
    collection.catalogueValid,
    collection.catalogue?.visibilityKey,
    loadPreview,
  ]);
  const current =
    collection.catalogueValid &&
    result?.visibilityKey === collection.catalogue?.visibilityKey &&
    result?.input === input
      ? result
      : null;
  return (
    <section className="panel space-y-3 p-4" data-collection-draft-preview>
      <h2 className="text-xl font-semibold">
        {t("公開範圍預覽（不保存）", "Public-scope preview (does not save)")}
      </h2>
      <p>
        {t(
          "透過公開頁同一服務端投影，僅預覽本人的設定；私人時沒有匿名可讀內容。",
          "Uses the public page's server projection for your own settings only. Private settings yield no anonymous content.",
        )}
      </p>
      <Button disabled={busy} variant="outline" onClick={() => void loadPreview()}>
        {busy
          ? t("載入中…", "Loading…")
          : t("重新取得公開範圍預覽", "Refresh public-scope preview")}
      </Button>
      <label className="block">
        <input
          aria-label="Automatic public-scope preview"
          type="checkbox"
          checked={autoPreview}
          onChange={(e) => setAutoPreview(e.target.checked)}
        />
        {t(
          "自動更新公開範圍預覽（不保存，300ms後讀取）",
          "Automatically refresh public-scope preview (not saved; read after 300ms)",
        )}
      </label>
      {error && (
        <p role="alert">
          {t(
            "預覽無法載入，請確認服務與保存版本後重試；不以私人資料替代。",
            "Preview unavailable. Check service and saved revision, then retry; private data is never substituted.",
          )}
        </p>
      )}
      <label className="block">
        {t("預覽寬度（不保存）", "Preview width (not saved)")}{" "}
        <select
          aria-label="Showcase preview width"
          value={viewport}
          onChange={(e) => setViewport(e.target.value)}
        >
          <option value="full">{t("目前裝置", "Current device")}</option>
          <option value="360">{t("手機360", "Mobile 360")}</option>
          <option value="768">{t("平板768", "Tablet 768")}</option>
        </select>
      </label>
      {current &&
        (current.projection ? (
          <div
            data-preview-public
            style={{ maxWidth: viewport === "full" ? "100%" : `${viewport}px` }}
          >
            <h3>{current.projection.displayName}</h3>
            <ShowcaseContent data={current.projection} anchorPrefix="preview-exhibition" />
          </div>
        ) : (
          <p role="status">
            {t(
              "目前設定為私人；匿名無法讀取此收藏頁。",
              "These settings are private; anonymous visitors cannot read this collection.",
            )}
          </p>
        ))}
    </section>
  );
}

function ShowcaseContent({
  data,
  anchorPrefix = "public-exhibition",
}: {
  data: PublicCollection;
  anchorPrefix?: string;
}) {
  const { locale } = useLocale(),
    t = useDiscoveryText();
  const sections = {
    collector: (
      <section key="collector" id="collection-public-cards" className="space-y-4">
        <h2>{t("精選卡牌", "Featured cards")}</h2>
        {data.mainCard && <Cards cards={[data.mainCard]} />}
        <Cards cards={data.shelf} wide={data.shelfLayout === "wide"} />
      </section>
    ),
    albums: (
      <section key="albums" id="collection-public-albums" className="space-y-4">
        <h2>{t("精選卡冊", "Featured albums")}</h2>
        <ProgressList rows={data.featured} />
        <ProgressList
          rows={data.progress.filter((p) => !data.featured.some((f) => f.poolId === p.poolId))}
        />
      </section>
    ),
    badges: (
      <section key="badges" id="collection-public-badges" className="space-y-4">
        <h2>{t("展示徽章", "Showcase badges")}</h2>
        <Awards rows={data.awards} layout={data.badgeLayout} />
      </section>
    ),
  };
  const order: Array<keyof typeof sections> =
    data.layout === "albums"
      ? ["albums", "collector", "badges"]
      : data.layout === "badges"
        ? ["badges", "collector", "albums"]
        : ["collector", "albums", "badges"];
  return (
    <div
      className={
        "space-y-6 rounded-2xl p-3 motion-reduce:transition-none " +
        (data.coverMode === "band" ? "border-t-8 border-t-primary " : "") +
        (data.theme === "moss"
          ? "border-2 border-emerald-600/50 bg-gradient-to-b from-emerald-500/10 to-background text-foreground"
          : data.theme === "sepia"
            ? "border-2 border-amber-700/50 bg-gradient-to-br from-amber-500/10 via-background to-background text-foreground"
            : data.theme === "cobalt"
              ? "border-t-4 border-t-sky-600 bg-gradient-to-b from-sky-500/10 to-background text-foreground"
              : data.theme === "graphite"
                ? "border-2 border-foreground/70 bg-muted/20 text-foreground"
                : data.theme === "ink"
                  ? "border-2 border-foreground/60 bg-background text-foreground"
                  : data.theme === "dawn"
                    ? "border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-primary/10"
                    : data.theme === "linen"
                      ? "border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-background"
                      : data.theme === "aurora"
                        ? "border border-primary/30 bg-gradient-to-br from-primary/15 via-background to-sky-500/10"
                        : data.theme === "contrast"
                          ? "border-2 border-foreground"
                          : data.theme === "quiet"
                            ? "border border-border bg-muted/30"
                            : "")
      }
      data-showcase-layout={data.layout}
      data-showcase-style={data.theme}
      data-showcase-cover={data.coverMode}
    >
      <p className="whitespace-pre-wrap break-words">
        {locale === "en" && data.bioEn ? data.bioEn : data.bio}
      </p>
      {!!data.curations?.length && (
        <section data-public-curations className="space-y-4">
          <h2>{t("本人允許的公開策展", "Owner-permitted public curations")}</h2>
          <nav
            aria-label={t("展覽分區導覽", "Exhibition section navigation")}
            data-exhibition-navigation
          >
            <ol className="flex flex-wrap gap-3">
              {data.curations.map((g, n) => (
                <li key={n}>
                  <a
                    className="inline-flex min-h-11 items-center text-primary underline"
                    href={"#" + anchorPrefix + "-" + (n + 1)}
                    onClick={() => {
                      requestAnimationFrame(() =>
                        document.getElementById(anchorPrefix + "-" + (n + 1))?.focus(),
                      );
                    }}
                  >
                    {n + 1} · {g.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          {data.curations.map((g, n) => (
            <article key={n} className="space-y-3 rounded-xl border p-4">
              <h3
                id={anchorPrefix + "-" + (n + 1)}
                tabIndex={-1}
                className="scroll-mt-20 font-bold break-words focus-visible:outline-2 focus-visible:outline-primary"
              >
                {g.title}
              </h3>
              <p className="whitespace-pre-wrap break-words">{g.note}</p>
              <Cards cards={g.cards} />
              <nav
                className="flex flex-wrap gap-3"
                aria-label={t("公開策展相關故事", "Stories related to this public curation")}
                data-public-curation-stories
              >
                {[...new Set(g.cards.map((c) => c.poolId))].map((id, n) => (
                  <Link
                    key={id}
                    className="text-primary underline"
                    to="/pools/$poolId"
                    params={{ poolId: id }}
                  >
                    {t("閱讀相關公開系列", "Read related public series")} {n + 1}
                  </Link>
                ))}
              </nav>
            </article>
          ))}
        </section>
      )}
      {data.progress.length > 0 && (
        <nav
          data-public-album-guide
          aria-label={t("公開收藏閱讀路線", "Public collection reading route")}
          className="space-y-2 rounded-xl border p-4"
        >
          <h2 className="font-bold">
            {t("沿精選順序閱讀收藏故事", "Read collection stories in featured order")}
          </h2>
          <ol className="space-y-2">
            {[
              ...data.featured,
              ...data.progress.filter((p) => !data.featured.some((f) => f.poolId === p.poolId)),
            ].map((p, n) => (
              <li key={p.poolId}>
                {n + 1}.{" "}
                <Link
                  className="text-primary underline"
                  to="/pools/$poolId"
                  params={{ poolId: p.poolId }}
                >
                  {p.title[locale]}
                </Link>{" "}
                · {p.owned}/{p.total}
              </li>
            ))}
          </ol>
          <p className="text-sm text-muted-foreground">
            {t(
              "訪客只閱讀本人允許且目前公開的卡冊；不包含私人持卡或目標。",
              "Visitors read only permitted, currently public albums, without private holdings or goals.",
            )}
          </p>
        </nav>
      )}
      {(data.growthPreview?.player || data.growthPreview?.platform) && (
        <section data-public-growth-preview className="panel space-y-2 p-4">
          <h2>
            {t(
              "收藏家自選成長摘要 · 本機候選預覽",
              "Collector-selected growth summaries · local candidate previews",
            )}
          </h2>
          {data.growthPreview.player && (
            <p>
              {t("玩家候選A", "Player candidate A")}: {data.growthPreview.player.level} ·{" "}
              {data.growthPreview.player.xp} XP · {data.growthPreview.player.ruleVersion}
            </p>
          )}
          {data.growthPreview.platform && (
            <p>
              {t("平台參與候選階段", "Platform participation candidate stage")}:{" "}
              {data.growthPreview.platform.stage} · {data.growthPreview.platform.ruleVersion}
            </p>
          )}
          <p className="text-sm">
            {t(
              "兩種來源分開；不是正式等級、卡牌成長或稀有度，不發獎或授權。",
              "Separate sources; not official levels, card growth or rarity. No rewards or permissions.",
            )}
          </p>
        </section>
      )}
      <nav
        aria-label={t("公開展示區塊", "Public showcase sections")}
        className="flex flex-wrap gap-3 text-sm"
      >
        {(data.mainCard || data.shelf.length > 0) && (
          <a className="text-primary underline" href="#collection-public-cards">
            {t("公開卡牌", "Public cards")}
          </a>
        )}
        {data.progress.length > 0 && (
          <a className="text-primary underline" href="#collection-public-albums">
            {t("公開卡冊", "Public albums")}
          </a>
        )}
        {data.awards.length > 0 && (
          <a className="text-primary underline" href="#collection-public-badges">
            {t("已展示徽章", "Displayed badges")}
          </a>
        )}
      </nav>
      {order.map((k) => sections[k])}
    </div>
  );
}
export function PublicCollectionPage({ handle }: { handle: string }) {
  const catalogue = useCollection();
  const scope = JSON.stringify([
    handle,
    catalogue.catalogue?.visibilityKey,
    catalogue.me?.profile.version,
  ]);
  const [data, setData] = useState<{ scope: string; value: PublicCollection } | null>(null),
    [error, setError] = useState(""),
    [loaded, setLoaded] = useState(false),
    [retry, setRetry] = useState(0),
    t = useDiscoveryText();
  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    setData(null);
    setError("");
    setLoaded(false);
    localApi<PublicCollection>(
      "/collection/profiles/" + encodeURIComponent(handle),
      undefined,
      "GET",
      undefined,
      controller.signal,
    )
      .then((v) => {
        if (!isCollectionProjection(v, "showcase"))
          throw new Error("Collection projection mismatch");
        if (live) setData({ scope, value: v });
      })
      .catch((e) => {
        if (live) setError(String(e));
      })
      .finally(() => {
        if (live) setLoaded(true);
      });
    return () => {
      live = false;
      controller.abort();
    };
  }, [handle, retry, scope]);
  useEffect(() => {
    const reload = () => setRetry((n) => n + 1),
      timer = window.setInterval(reload, 30000);
    window.addEventListener("focus", reload);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", reload);
    };
  }, []);
  const visibleData =
    catalogue.catalogueValid && !catalogue.error && data?.scope === scope ? data.value : null;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-bold">
        {visibleData?.displayName ?? t("公開收藏頁", "Public collection")}
      </h1>
      <CollectionNotice />
      {!loaded ? (
        <p role="status">{t("載入中…", "Loading…")}</p>
      ) : error ? (
        <div role="alert">
          <p>
            {t("此收藏頁尚未公開或暫時無法存取。", "This collection is private or unavailable.")}
          </p>
          <Button onClick={() => setRetry((n) => n + 1)}>{t("重試", "Retry")}</Button>
        </div>
      ) : (
        visibleData && (
          <>
            <CollectionShare key={visibleData.handle} handle={visibleData.handle} />
            <ShowcaseContent data={visibleData} />
          </>
        )
      )}
    </div>
  );
}
export function CollectionPreview() {
  const d = useCollection(),
    t = useDiscoveryText(),
    { locale } = useLocale();
  const [cardId, setCardId] = useState(""),
    [count, setCount] = useState(0),
    [result, setResult] = useState<{
      owned: number;
      hypotheticalRemaining: number;
      sufficient: boolean;
      ruleVersion: number;
      rarity: string;
      cardVersion: number;
    } | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setCardId("");
    setResult(null);
    setError("");
  }, [d.me?.actorId, d.me?.rulesVersion]);
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-bold">
        {t("成長與合成操作預覽", "Growth & synthesis operation preview")}
      </h1>
      <CollectionNotice />
      <CollectionStatus />
      <p>{d.catalogue?.proposal.note[locale]}</p>
      <p>
        {t(
          "稀有度是款式屬性，成長等級尚未核定，卡牌版本記錄卡面定義。三者分開保存。重複卡目前仍是持卡數量；此預覽只試算假設材料，沒有成功率抽樣、卡牌產出、保底累積或任何消耗。",
          "Rarity describes a design. Growth levels await approval. Card versions identify card definitions. They are stored separately. Duplicates remain holdings; this preview only models hypothetical materials, without odds, results, pity or consumption.",
        )}
      </p>
      <form
        className="panel space-y-4 p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            setResult(await localApi("/collection/preview", { cardId, count }));
          } catch (e) {
            setResult(null);
            setError(String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block">
          {t("目前持有款式", "Held design")}
          <select
            className="w-full rounded border p-2"
            required
            aria-label="Preview card"
            value={cardId}
            onChange={(e) => {
              setCardId(e.target.value);
              setResult(null);
            }}
          >
            <option value="">{t("選擇卡牌", "Select a card")}</option>
            {d.me?.cards.map((c) => (
              <option value={c.cardId} key={c.cardId}>
                {c.name} · {c.rarity} · {t("數量", "Count")} {c.count}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          {t("假設材料數量", "Hypothetical material count")}
          <input
            className="block rounded border p-2"
            type="number"
            min={0}
            max={1000}
            aria-label="Preview materials"
            value={count}
            onChange={(e) => {
              setCount(Number(e.target.value));
              setResult(null);
            }}
          />
        </label>
        <Button disabled={!d.me || !cardId || busy}>
          {t("試算（不消耗）", "Preview (no consumption)")}
        </Button>
      </form>
      {error && <p role="alert">{error}</p>}
      {result && (
        <div className="panel space-y-2 p-4" role="status">
          <p>
            {t("目前持有", "Currently held")}: {result.owned} ·{" "}
            {t("假設剩餘", "Hypothetical remaining")}: {result.hypotheticalRemaining}
          </p>
          <p>
            {t("材料是否足夠", "Materials sufficient")}:{" "}
            {result.sufficient ? t("是", "Yes") : t("否", "No")}
          </p>
          <p>
            {t("稀有度", "Rarity")}: {result.rarity} · {t("成長等級", "Growth level")}:{" "}
            {t("待核定", "Unapproved")} · {t("卡牌版本", "Card version")}: {result.cardVersion}
          </p>
          <p>
            {t(
              "消耗卡 / KP：0 / 0；未執行、未核准。規則版本",
              "Cards / KP consumed: 0 / 0; unexecuted, unapproved. Rules version",
            )}{" "}
            {result.ruleVersion}
          </p>
        </div>
      )}
    </div>
  );
}
export function CollectionRankings({ summary = false }: { summary?: boolean } = {}) {
  return <PublicRankings summary={summary} />;
}
export function CollectionAdmin() {
  const local = useLocalTest(),
    t = useDiscoveryText();
  const [doc, setDoc] = useState<{ version: number; data: CollectionRules } | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const official = local.enabled && local.summary?.user.role === "official";
  const load = async () => {
    setDoc(null);
    try {
      setDoc(await localApi("/admin/collection/rules"));
      setMessage("");
    } catch (e) {
      setMessage(String(e));
    }
  };
  useEffect(() => {
    setDoc(null);
    setMessage("");
    if (official) void load();
  }, [official, local.summary?.user.id]);
  if (!official)
    return (
      <div className="p-6">
        <h1>{t("收藏規則管理", "Collection rule management")}</h1>
        <p>{t("需要本機 official 帳號。", "A Local Test official account is required.")}</p>
      </div>
    );
  const set = (next: CollectionRules) => doc && setDoc({ ...doc, data: next });
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-bold">
        {t("收藏規則與待核定提案", "Collection rules & unapproved proposal")}
      </h1>
      <CollectionNotice />
      {message && (
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await retryDiscoveryCommand("/admin/collection/rules");
              await load();
              await refreshCollection();
              await refreshCollectionMe();
            } catch (e) {
              setMessage(String(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          {t("重試待確認的規則保存", "Retry unconfirmed rule save")}
        </Button>
      )}
      <Button disabled={busy} onClick={() => void load()}>
        {t("重新載入規則", "Reload rules")}
      </Button>
      <p role="status">{message}</p>

      <ActivityEvidence />
      <CatalogueIntegrity />
      {doc && (
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await discoveryCommand("/admin/collection/rules", {
                expectedVersion: doc.version,
                data: doc.data,
              });
              await load();
              await refreshCollection();
              await refreshCollectionMe();
              setMessage(
                t(
                  "已保存新規則版本；提案仍待核定。",
                  "New rule version saved; proposal remains unapproved.",
                ),
              );
            } catch (e) {
              setMessage(String(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <fieldset disabled={busy} className="space-y-5">
            <p>
              {t("目前規則版本", "Current rules version")} {doc.version}
            </p>
            {doc.data.achievements.map((a, i) => (
              <fieldset className="panel space-y-3 p-4" key={a.id}>
                <legend>{a.id}</legend>
                {a.type === "series" && (
                  <label className="block">
                    {t("系列範圍", "Series scope")}
                    <select
                      value={a.poolId}
                      onChange={(e) =>
                        set({
                          ...doc.data,
                          achievements: doc.data.achievements.map((x, j) =>
                            i === j ? { ...x, poolId: e.target.value } : x,
                          ),
                        })
                      }
                    >
                      <option value="">{t("所有公開系列", "All public series")}</option>
                      {doc.data.visibility.map((v) => (
                        <option key={v.poolId} value={v.poolId}>
                          {v.poolId}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="block">
                  <input
                    type="checkbox"
                    checked={a.enabled}
                    onChange={(e) =>
                      set({
                        ...doc.data,
                        achievements: doc.data.achievements.map((x, j) =>
                          i === j ? { ...x, enabled: e.target.checked } : x,
                        ),
                      })
                    }
                  />{" "}
                  {t("啟用", "Enabled")}
                </label>
                {(["zh-TW", "en"] as const).map((lang) => (
                  <label className="block" key={lang}>
                    {t("成就名稱", "Achievement title")} · {lang}
                    <input
                      className="block w-full rounded border p-2"
                      maxLength={100}
                      required
                      aria-label={"Achievement " + a.id + " " + lang}
                      value={a.title[lang]}
                      onChange={(e) =>
                        set({
                          ...doc.data,
                          achievements: doc.data.achievements.map((x, j) =>
                            i === j ? { ...x, title: { ...x.title, [lang]: e.target.value } } : x,
                          ),
                        })
                      }
                    />
                  </label>
                ))}
                <label className="block">
                  {t("條件門檻（系列固定 100%）", "Threshold (series fixed at 100%)")}
                  <input
                    className="block rounded border p-2"
                    type="number"
                    min={1}
                    max={1000}
                    disabled={a.type === "series"}
                    value={a.threshold}
                    onChange={(e) =>
                      set({
                        ...doc.data,
                        achievements: doc.data.achievements.map((x, j) =>
                          i === j ? { ...x, threshold: Number(e.target.value) } : x,
                        ),
                      })
                    }
                  />
                </label>
              </fieldset>
            ))}
            <fieldset className="panel space-y-3 p-4">
              <legend>{t("隱藏公開款式", "Hide public designs")}</legend>
              <p>
                {t(
                  "隱藏等級會從進度分母、公開收藏、徽章及排行榜排除；不刪持卡或歷史。",
                  "Hidden grades are excluded from progress denominators, public collections, badges and ranks. Holdings and history remain intact.",
                )}
              </p>
              {doc.data.visibility.map((v, i) => (
                <label className="block" key={v.poolId}>
                  {v.poolId}
                  <input
                    className="block w-full rounded border p-2"
                    placeholder="O,N,R,SR,SSR,UR"
                    aria-label={"Hidden grades " + v.poolId}
                    value={v.hiddenGrades.join(",")}
                    onChange={(e) =>
                      set({
                        ...doc.data,
                        visibility: doc.data.visibility.map((x, j) =>
                          i === j
                            ? {
                                ...x,
                                hiddenGrades: e.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              }
                            : x,
                        ),
                      })
                    }
                  />
                </label>
              ))}
            </fieldset>
            <fieldset className="panel space-y-3 p-4">
              <legend>
                {t("成長／合成提案（未核定）", "Growth / synthesis proposal (unapproved)")}
              </legend>
              <label className="block">
                {t("升級效果", "Upgrade effect")}
                <select
                  className="block rounded border p-2"
                  value={doc.data.proposal.rarityEffect}
                  onChange={(e) =>
                    set({
                      ...doc.data,
                      proposal: { ...doc.data.proposal, rarityEffect: e.target.value },
                    })
                  }
                >
                  {["undecided", "cosmetic", "rights", "rarity-change"].map((v, i) => (
                    <option value={v} key={v}>
                      {t(
                        ["待核定", "外觀效果", "權益效果", "改变稀有度"][i]!,
                        ["Unapproved", "Cosmetic", "Rights", "Rarity change"][i]!,
                      )}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                {t("重複卡累積方式", "Duplicate accumulation")}
                <select
                  className="block rounded border p-2"
                  value={doc.data.proposal.duplicateMode}
                  onChange={(e) =>
                    set({
                      ...doc.data,
                      proposal: { ...doc.data.proposal, duplicateMode: e.target.value },
                    })
                  }
                >
                  {["undecided", "retain", "convert", "shared"].map((v, i) => (
                    <option value={v} key={v}>
                      {t(
                        ["待核定", "保留卡牌", "轉換材料", "共用材料"][i]!,
                        ["Unapproved", "Retain cards", "Convert materials", "Shared materials"][i]!,
                      )}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                {t("成長與合成共用材料", "Growth and synthesis share materials")}
                <select
                  value={
                    doc.data.proposal.sharedMaterials === null
                      ? ""
                      : String(doc.data.proposal.sharedMaterials)
                  }
                  onChange={(e) =>
                    set({
                      ...doc.data,
                      proposal: {
                        ...doc.data.proposal,
                        sharedMaterials: e.target.value === "" ? null : e.target.value === "true",
                      },
                    })
                  }
                >
                  <option value="">{t("待核定", "Unapproved")}</option>
                  <option value="true">{t("共用", "Shared")}</option>
                  <option value="false">{t("分開", "Separate")}</option>
                </select>
              </label>
              {(["recipeCount", "successPct", "pityCount", "minimumKeep"] as const).map((k, i) => (
                <label className="block" key={k}>
                  {t(
                    ["配方材料數", "成功率 %", "保底次數", "最低保留量"][i]!,
                    ["Recipe materials", "Success %", "Pity count", "Minimum retained"][i]!,
                  )}
                  <input
                    className="block rounded border p-2"
                    type="number"
                    min={0}
                    max={k === "successPct" ? 100 : 1000}
                    placeholder={t("空白 = 待核定", "Blank = unapproved")}
                    value={doc.data.proposal[k] ?? ""}
                    onChange={(e) =>
                      set({
                        ...doc.data,
                        proposal: {
                          ...doc.data.proposal,
                          [k]: e.target.value === "" ? null : Number(e.target.value),
                        },
                      })
                    }
                  />
                </label>
              ))}
              {(["zh-TW", "en"] as const).map((lang) => (
                <label className="block" key={lang}>
                  {t("提案說明", "Proposal notes")} · {lang}
                  <textarea
                    className="block w-full rounded border p-2"
                    maxLength={2000}
                    aria-label={"Proposal note " + lang}
                    value={doc.data.proposal.note[lang]}
                    onChange={(e) =>
                      set({
                        ...doc.data,
                        proposal: {
                          ...doc.data.proposal,
                          note: { ...doc.data.proposal.note, [lang]: e.target.value },
                        },
                      })
                    }
                  />
                </label>
              ))}
            </fieldset>
            <Button type="submit">
              {t("保存規則與未核定提案", "Save rules & unapproved proposal")}
            </Button>
          </fieldset>
        </form>
      )}
    </div>
  );
}

function ActivityEvidence() {
  const t = useDiscoveryText();
  const [fixtureId, setFixtureId] = useState("member-a"),
    [activityId, setActivityId] = useState("local-activity-preview"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="panel space-y-3 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await discoveryCommand("/admin/collection/participation", { fixtureId, activityId });
          setMessage(
            t(
              "已保存測試參與證據；未發放 KP 或卡牌。",
              "Synthetic participation evidence saved; no KP or card rewards issued.",
            ),
          );
        } catch (e) {
          setMessage(String(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="font-semibold">
        {t("測試活動參與證據", "Synthetic activity participation evidence")}
      </h2>
      <p>
        {t(
          "供驗證活動成就；相同帳號與活動僅記錄一次。正式活動頁與領獎於第三批製作。",
          "For achievement verification; each account/activity pair is recorded once. Real activity pages and claims follow in batch three.",
        )}
      </p>
      <label className="block">
        {t("測試帳號", "Synthetic account")}
        <select
          className="block rounded border p-2"
          value={fixtureId}
          onChange={(e) => setFixtureId(e.target.value)}
        >
          {["member-a", "member-b", "creator-a", "creator-b", "official-a", "official-b"].map(
            (id) => (
              <option key={id}>{id}</option>
            ),
          )}
        </select>
      </label>
      <label className="block">
        {t("本機活動證據 ID", "Local activity evidence ID")}
        <input
          className="block w-full rounded border p-2"
          pattern="local-activity-[a-z0-9-]{1,50}"
          required
          value={activityId}
          onChange={(e) => setActivityId(e.target.value)}
        />
      </label>
      <Button disabled={busy}>{t("記錄測試證據", "Record test evidence")}</Button>
      <p role="status">{message}</p>
    </form>
  );
}
