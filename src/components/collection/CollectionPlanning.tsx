import { useState, useEffect } from "react";
import { Link, useBlocker } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCollection, refreshCollectionMe, type CollectionMe } from "@/lib/collection-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { PLANNING_SECTIONS } from "@/lib/collection-planning.mjs";
import { practiceRoundCount } from "@/lib/play-practice.mjs";
import { isPlayProjection } from "@/lib/play-contract.mjs";
import { localApi, localSessionGeneration, useLocalTest } from "@/lib/local-test-client";
import {
  discoveryCommand,
  retryDiscoveryCommand,
  hasPendingDiscovery,
} from "@/lib/discovery-store";
import type { PlayPrivate } from "./PlayRecords";
export function CollectionPlanning() {
  const d = useCollection(),
    t = useDiscoveryText();
  return (
    <main className="space-y-4 p-4 md:p-8">
      <h1 className="text-2xl font-bold">
        {t("私人收藏規劃板", "Private collection planning board")}
      </h1>
      <Link className="underline text-primary" to="/app/collection">
        {t("返回本人收藏", "Back to your collection")}
      </Link>
      {d.meError || d.error ? (
        <div role="alert">
          <p>
            {t(
              "本機來源失敗，舊私人規劃已清空。",
              "Local sources failed; previous private planning cleared.",
            )}
          </p>
          <Button onClick={() => void refreshCollectionMe()}>
            {t("重讀本人規劃", "Reload your planning")}
          </Button>
        </div>
      ) : d.me && d.catalogueValid ? (
        <Board
          key={d.me.actorId + ":" + d.me.profile.version + ":" + d.me.visibilityKey}
          me={d.me}
        />
      ) : (
        <p>
          {t(
            "請在本機確認本人測試身分；Staging只前端預覽。",
            "Confirm your own local test identity; Staging is a front-end preview.",
          )}
        </p>
      )}
    </main>
  );
}
function Board({ me }: { me: CollectionMe }) {
  const t = useDiscoveryText(),
    { locale } = useLocale(),
    local = useLocalTest(),
    saved = me.profile.data.planningOrder ?? PLANNING_SECTIONS,
    [order, setOrder] = useState(saved),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [play, setPlay] = useState<PlayPrivate | null>(null),
    [playError, setPlayError] = useState(false),
    [retry, setRetry] = useState(0),
    dirty = JSON.stringify(order) !== JSON.stringify(saved),
    member = local.summary?.user.role === "member",
    pending = hasPendingDiscovery("/collection/profile"),
    blocker = useBlocker({
      shouldBlockFn: () => dirty,
      disabled: !dirty,
      enableBeforeUnload: dirty,
      withResolver: true,
    });
  useEffect(() => {
    const c = new AbortController(),
      epoch = localSessionGeneration();
    setPlay(null);
    setPlayError(false);
    if (member)
      void localApi<PlayPrivate>("/play/me", undefined, "GET", undefined, c.signal)
        .then((v) => {
          if (c.signal.aborted || epoch !== localSessionGeneration()) return;
          if (
            !isPlayProjection(v) ||
            v.actorId !== me.actorId ||
            v.visibilityKey !== me.visibilityKey
          )
            throw Error("Private planning projection mismatch");
          setPlay(v);
        })
        .catch(() => {
          if (!c.signal.aborted && epoch === localSessionGeneration()) setPlayError(true);
        });
    return () => c.abort();
  }, [me.actorId, me.visibilityKey, member, retry]);
  const name = (id: string) =>
    ({
      goals: t("收藏目標", "Collection goals"),
      journey: t("收藏與遊玩旅程", "Collection and play journeys"),
      practice: t("練習清單", "Practice list"),
      guide: t("閱讀導覽", "Reading guide"),
    })[id] ?? id;
  async function save(replay = false) {
    if (busy) return;
    setBusy(true);
    try {
      if (replay) await retryDiscoveryCommand("/collection/profile");
      else
        await discoveryCommand("/collection/profile", {
          expectedVersion: me.profile.version,
          data: { ...me.profile.data, planningOrder: order },
        });
      await refreshCollectionMe();
    } catch {
      setError(
        t(
          "保存結果未確認／版本衝突，請重讀或確認原key，不覆寫。",
          "Save unconfirmed / version conflict. Read back or confirm the original key without overwriting.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section data-private-planning className="space-y-4">
      <p>
        {t(
          "私人優先順序與現有來源摘要，不新增目標或收藏狀態。收藏進度來自已取得公開不同款式；練習與閱讀標記分開，不發獎。",
          "Private priority and summaries of existing sources, without new goal or collection state. Collection progress comes from acquired distinct public designs. Practice and read marks remain separate, with no rewards.",
        )}
      </p>
      <p role="status">
        {dirty
          ? t("未保存規劃順序", "Unsaved planning order")
          : t("已保存規劃順序", "Saved planning order")}{" "}
        · v{me.profile.version}
      </p>
      {order.map((id, index) => (
        <section key={id} className="panel space-y-3 p-4" data-planning-section={id}>
          <h2 className="text-xl font-bold">{name(id)}</h2>
          <Button
            variant="outline"
            disabled={busy || index === 0}
            aria-label={"Planning up " + id}
            onClick={() => {
              const next = [...order];
              [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];
              setOrder(next);
            }}
          >
            {t("優先上移", "Move priority up")}
          </Button>
          {id === "goals" ? (
            <>
              {(me.profile.data.goalPoolIds ?? []).length ? (
                <ul>
                  {(me.profile.data.goalPoolIds ?? [])
                    .flatMap((poolId) => me.progress.filter((p) => p.poolId === poolId))
                    .map((p) => (
                      <li key={p.poolId}>
                        {p.title[locale]} · {p.owned}/{p.total} · {p.pct}%{" "}
                        <Link
                          className="underline"
                          to="/app/album/$poolId"
                          params={{ poolId: p.poolId }}
                        >
                          {t("接續本人卡冊", "Continue your album")}
                        </Link>
                      </li>
                    ))}
                </ul>
              ) : (
                <p>{t("尚未選擇有效私人目標。", "No valid private goals selected.")}</p>
              )}
              <Link className="underline text-primary" to="/app/collection" hash="collection-goals">
                {t("編輯原收藏目標", "Edit existing collection goals")}
              </Link>
            </>
          ) : id === "guide" ? (
            <>
              {me.profile.data.readingGuide ? (
                <p>
                  {t("私人已讀標記", "Private read marks")}: {me.profile.data.readingGuide.step}/3
                </p>
              ) : (
                <p>{t("沒有有效閱讀導覽。", "No valid reading guide.")}</p>
              )}
              <Link
                className="underline text-primary"
                to="/app/collection"
                hash="collection-reading-guide"
              >
                {t("接續原閱讀導覽", "Continue existing reading guide")}
              </Link>
            </>
          ) : (
            <>
              {!member ? (
                <p>
                  {t(
                    "此測試角色沒有私人玩法投影；不授予權限。",
                    "This test role has no private play projection; no permission is granted.",
                  )}
                </p>
              ) : playError ? (
                <div role="alert">
                  <p>
                    {t(
                      "玩法來源失敗，舊摘要已清空；不是沒有資料。",
                      "Play sources failed; old summaries cleared, not an empty-data result.",
                    )}
                  </p>
                  <Button onClick={() => setRetry((n) => n + 1)}>
                    {t("重讀玩法摘要", "Reload play summary")}
                  </Button>
                </div>
              ) : !play ? (
                <p role="status">{t("讀取私人玩法來源…", "Loading private play sources…")}</p>
              ) : id === "journey" ? (
                <p>
                  {play.settings.data.journey
                    ? play.settings.data.journey.invalidated
                      ? t("來源失效，進度遮蔽。", "Sources unavailable; progress concealed.")
                      : `${play.settings.data.journey.completed}/${play.settings.data.journey.modes.length} · ${play.settings.data.journey.ruleVersion}`
                    : t(
                        "尚未選擇遊玩闖關；可接續原收藏旅程。",
                        "No play route selected; continue the existing collection journey.",
                      )}
                </p>
              ) : (
                <p>
                  {play.settings.data.practice
                    ? play.settings.data.practice.invalidated
                      ? t(
                          "練習來源失效，進度遮蔽。",
                          "Practice sources unavailable; progress concealed.",
                        )
                      : `${play.settings.data.practice.completed}/${practiceRoundCount(play.settings.data.practice.items)} · ${play.settings.data.practice.paused ? t("已暫停", "Paused") : play.settings.data.practice.ruleVersion}`
                    : t("尚未選擇私人練習清單。", "No private practice list selected.")}
                </p>
              )}
              <Link
                className="underline text-primary"
                to="/app/play"
                hash={id === "practice" ? "practice-plan" : "play-records"}
              >
                {t("接續本人遊玩／練習", "Continue your play / practice")}
              </Link>
            </>
          )}
        </section>
      ))}
      <div className="flex flex-wrap gap-3">
        <Button disabled={busy || !dirty || pending} onClick={() => void save()}>
          {t("保存私人規劃順序", "Save private planning order")}
        </Button>
        <Button variant="outline" disabled={busy || !dirty} onClick={() => setOrder(saved)}>
          {t("取消規劃修改", "Cancel planning changes")}
        </Button>
      </div>
      {error && <p role="alert">{error}</p>}
      {(pending || error) && (
        <Button disabled={busy} variant="outline" onClick={() => void save(true)}>
          {t("確認規劃原操作", "Confirm original planning operation")}
        </Button>
      )}
      <ConfirmDialog
        open={blocker.status === "blocked"}
        title={t("離開未保存規劃？", "Leave unsaved planning?")}
        description={t(
          "未保存順序會捨棄；取消繼續編輯，已保存來源保持。",
          "Unsaved order will be discarded; cancel to keep editing. Saved sources remain.",
        )}
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </section>
  );
}
