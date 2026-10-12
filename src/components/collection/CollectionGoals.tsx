import { useState } from "react";
import { Link, useBlocker } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { refreshCollectionMe, type CollectionMe } from "@/lib/collection-store";
import { discoveryCommand, retryDiscoveryCommand } from "@/lib/discovery-store";
export function CollectionGoals({ me }: { me: CollectionMe }) {
  const t = useDiscoveryText(),
    { locale } = useLocale();
  const saved = me.profile.data.goalPoolIds ?? [];
  const [ids, setIds] = useState(saved),
    [stage, setStage] = useState("all"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const dirty = JSON.stringify(saved) !== JSON.stringify(ids);
  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    disabled: !dirty,
    enableBeforeUnload: dirty,
    withResolver: true,
  });
  const goals = ids.flatMap((id) => me.progress.filter((p) => p.poolId === id));
  const rows = goals.filter(
    (p) =>
      stage === "all" ||
      (stage === "complete"
        ? p.complete
        : stage === "new"
          ? p.owned === 0
          : p.owned > 0 && !p.complete),
  );
  const move = (id: string, direction: number) => {
    const index = goals.findIndex((p) => p.poolId === id),
      other = goals[index + direction];
    if (!other) return;
    const next = [...ids],
      a = next.indexOf(id),
      b = next.indexOf(other.poolId);
    next[a] = other.poolId;
    next[b] = id;
    setIds(next);
  };
  const submit = async (retry = false) => {
    setBusy(true);
    setError("");
    try {
      if (retry) await retryDiscoveryCommand("/collection/profile");
      else
        await discoveryCommand("/collection/profile", {
          expectedVersion: me.profile.version,
          data: {
            ...me.profile.data,
            goalPoolIds: ids.filter((id) => me.progress.some((p) => p.poolId === id)),
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
    <section id="collection-goals" className="panel space-y-4 p-5" data-collection-goals>
      <h2 className="text-xl font-bold">{t("我的收藏目標", "My collection goals")}</h2>
      <p>
        {t(
          "由本人選擇目前公開的卡冊，目標保存在同一份本機SQLite公開設定中，但目標選擇本身保持私人。與未取得成就分開，不授予卡牌、KP或獎勵。不可見目標不顯示；保存只保留目前可公開選項。",
          "Choose currently public albums. Goals use the same local SQLite profile settings, but goal selection itself stays private. Goals are separate from unearned achievements and grant no cards, KP or rewards. Unavailable goals stay hidden; saving keeps only currently public options.",
        )}
      </p>
      <fieldset disabled={busy}>
        <legend>{t("選擇公開卡冊（最多12個）", "Choose public albums (up to 12)")}</legend>
        {me.progress.length ? (
          me.progress.map((p) => (
            <label className="block py-1" key={p.poolId}>
              <input
                aria-label={"Goal " + p.poolId}
                type="checkbox"
                checked={ids.includes(p.poolId)}
                disabled={!ids.includes(p.poolId) && ids.length >= 12}
                onChange={(e) =>
                  setIds(
                    e.target.checked ? [...ids, p.poolId] : ids.filter((id) => id !== p.poolId),
                  )
                }
              />{" "}
              {p.title[locale]}
            </label>
          ))
        ) : (
          <p>{t("目前沒有可設定目標的公開卡冊。", "No public albums are available as goals.")}</p>
        )}
      </fieldset>
      <p role="status" data-goal-save-state>
        {dirty ? t("目標尚未保存", "Unsaved goals") : t("已保存目標", "Saved goals")} · v
        {me.profile.version}
      </p>
      {goals.length > 0 && (
        <section
          id="collection-strategy"
          data-collection-strategy
          className="space-y-3 rounded-xl border p-4"
        >
          <h3 className="font-bold">
            {t("私人收藏策略比較", "Private collection strategy comparison")}
          </h3>
          <p>
            {t(
              "依本人自選優先順序比較目前公開款式；差額是公開分母減曾取得不同款式，不是抽取機率或保證結果。未保存選項只供本次比較。",
              "Compare current public designs in your chosen priority order. Remaining designs equal the public denominator minus acquired distinct designs, not draw odds or guaranteed results. Unsaved choices are for this comparison only.",
            )}
          </p>
          <ol className="space-y-2">
            {goals
              .filter((p) => p.total > 0 && p.owned >= 0 && p.owned <= p.total)
              .map((p) => (
                <li className="break-words" key={p.poolId}>
                  {p.title[locale]} · {p.owned}/{p.total} ·{" "}
                  {t("尚餘公開款式", "Remaining public designs")}: {p.total - p.owned} · v
                  {p.ruleVersion} ·{" "}
                  <Link
                    className="text-primary underline"
                    to="/pools/$poolId"
                    params={{ poolId: p.poolId }}
                  >
                    {p.complete
                      ? t("回顧公開故事", "Revisit public story")
                      : t("先閱讀系列目錄", "Read the series catalogue")}
                  </Link>
                </li>
              ))}
          </ol>
        </section>
      )}
      <div className="flex flex-wrap gap-3">
        <Button disabled={busy || !dirty} onClick={() => void submit()}>
          {t("保存目標", "Save goals")}
        </Button>
        <Button
          disabled={busy || !dirty}
          onClick={() => {
            setIds(saved);
            setError("");
          }}
        >
          {t("取消修改", "Cancel changes")}
        </Button>
        <Button disabled={busy || dirty} onClick={() => void refreshCollectionMe()}>
          {t("重讀保存目標", "Reload saved goals")}
        </Button>
      </div>
      {error && (
        <div role="alert">
          <p>{error}</p>
          <p>
            {t(
              "版本衝突請取消修改並重讀；回應丟失請以原key確認，勿新增請求。",
              "Cancel and reload to resolve a version conflict. Confirm a lost response with the original key; do not create a new request.",
            )}
          </p>
          <Button disabled={busy} onClick={() => void submit(true)}>
            {t("確認原操作", "Confirm original operation")}
          </Button>
        </div>
      )}
      <label>
        {t("依收藏階段分組", "Group by collection stage")}{" "}
        <select aria-label="Goal stage" value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="all">{t("全部本人目標", "All my goals")}</option>
          <option value="new">{t("尚未開始", "Not started")}</option>
          <option value="collecting">{t("收藏中", "Collecting")}</option>
          <option value="complete">{t("已完成回顧", "Completed recap")}</option>
        </select>
      </label>
      {!rows.length ? (
        <p>
          {t(
            goals.length
              ? "此收藏階段沒有可顯示的目標。"
              : "尚未選擇可顯示的收藏目標，先探索不同卡冊。",
            goals.length
              ? "No displayable goals in this collection stage."
              : "No displayable goal selected. Explore different albums first.",
          )}
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((p) => (
            <li className="space-y-2 rounded border p-3" key={p.poolId} data-goal-id={p.poolId}>
              <h3>{p.title[locale]}</h3>
              <p className="text-sm">
                {t("本人優先順序", "My priority")}:{" "}
                {goals.findIndex((g) => g.poolId === p.poolId) + 1}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={busy || goals[0]?.poolId === p.poolId}
                  aria-label={"Goal up " + p.poolId}
                  onClick={() => move(p.poolId, -1)}
                >
                  {t("提高優先", "Higher priority")}
                </Button>
                <Button
                  variant="outline"
                  disabled={busy || goals.at(-1)?.poolId === p.poolId}
                  aria-label={"Goal down " + p.poolId}
                  onClick={() => move(p.poolId, 1)}
                >
                  {t("降低優先", "Lower priority")}
                </Button>
              </div>
              <p>
                {p.owned}/{p.total} · {p.pct}%
              </p>
              <p>
                {p.complete
                  ? t(
                      "已取得本版公開不同款式；可回顧並自選展示，沒有额外獎勵。",
                      "All current public designs acquired. Revisit and choose your showcase; there is no additional reward.",
                    )
                  : t(
                      "尚有公開不同款式可探索，重複卡不增加完成度。",
                      "More distinct public designs remain to explore. Duplicates do not increase completion.",
                    )}
              </p>
              <Link to="/pools/$poolId" params={{ poolId: p.poolId }}>
                {p.complete ? t("回顧卡冊", "Revisit album") : t("接續收藏", "Continue collecting")}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <nav className="flex flex-wrap gap-4">
        <Link to="/explore">{t("探索不同卡冊", "Explore other albums")}</Link>
        <Link to="/app/achievements">{t("回顧已取得成就", "Revisit earned achievements")}</Link>
        <Link to="/app/settings/privacy">{t("選擇個人展示", "Choose your showcase")}</Link>
      </nav>
      <ConfirmDialog
        open={blocker.status === "blocked"}
        title={t("離開未保存目標？", "Leave unsaved goals?")}
        description={t(
          "取消會保留本頁修改；確認離開不會保存或取得獎勵。",
          "Cancel keeps your edits. Leaving does not save or grant a reward.",
        )}
        confirmLabel={t("放棄並離開", "Discard and leave")}
        onCancel={() => {
          if (blocker.status === "blocked") blocker.reset();
        }}
        onConfirm={() => {
          if (blocker.status === "blocked") blocker.proceed();
        }}
      />
    </section>
  );
}
