import { Link } from "@tanstack/react-router";
import type { CollectionMe } from "@/lib/collection-store";
import { useDiscoveryText } from "@/lib/discovery-copy";

export function CollectionJourney({ me }: { me: CollectionMe }) {
  const t = useDiscoveryText();
  const designs = new Set(me.acquiredCards.map((c) => c.cardId)).size;
  const completed = new Set(me.progress.filter((p) => p.complete).map((p) => p.poolId)).size;
  const goals = (me.profile.data.goalPoolIds ?? []).flatMap((id) =>
    me.progress.filter((p) => p.poolId === id && p.total > 0),
  );
  const next = goals.find((p) => !p.complete);
  return (
    <section data-collection-journey className="panel space-y-4 p-5">
      <h2 className="text-xl font-bold">
        {t("你的下一段收藏旅程", "Your next collection journey")}
      </h2>
      <section data-journey-hub className="space-y-3 rounded-xl border p-4">
        <h3 className="font-bold">{t("私人旅程工作台", "Private journey workspace")}</h3>
        <p>
          {t(
            "沿已保存的本人目標與優先順序，串起選擇、策略、無獎挑戰和完成回顧；不新增收藏或獎勵來源。",
            "Connects selection, strategy, no-reward challenges and completion recaps using your saved goals and priority order. No new collection or reward source.",
          )}
        </p>
        <p>
          {t("已選目前合法卡冊", "Selected eligible albums")}: {goals.length} ·{" "}
          {t("目前完成", "Currently complete")}: {goals.filter((p) => p.complete).length}
        </p>
        <nav
          aria-label={t("私人旅程功能", "Private journey tools")}
          className="flex flex-wrap gap-3"
        >
          {[
            ["collection-goals", t("選擇私人旅程", "Choose private journey")],
            ["collection-strategy", t("比較私人策略", "Compare private strategy")],
            ["collection-challenges", t("閱讀無獎挑戰", "Read no-reward challenges")],
            ["collection-theme-journey", t("章節與完成回顧", "Chapters and completion recap")],
            ["collection-recap", t("本人期間回顧", "Your period recap")],
          ].map(([hash, label]) => (
            <Link
              key={hash}
              className="text-primary underline"
              to="/app/collection"
              hash={
                hash === "collection-strategy" && !goals.length
                  ? "collection-goals"
                  : (hash ?? "collection-goals")
              }
            >
              {label}
            </Link>
          ))}
        </nav>
        {next ? (
          <Link
            className="text-primary underline"
            to="/app/album/$poolId"
            params={{ poolId: next.poolId }}
          >
            {t("繼續目前優先卡冊", "Continue the current priority album")}
          </Link>
        ) : (
          <p>
            {goals.length
              ? t(
                  "目前已選公開卡冊皆完成，可回顧或調整下一個私人目標。",
                  "All selected public albums are currently complete. Revisit or choose your next private goal.",
                )
              : t(
                  "尚無目前有效的已保存目標，先選擇公開卡冊。",
                  "No currently eligible saved goals; choose public albums first.",
                )}
          </p>
        )}
      </section>
      <nav
        aria-label={t("收藏旅程步驟", "Collection journey steps")}
        className="grid gap-3 sm:grid-cols-2"
      >
        <Link className="rounded-xl border p-3 text-primary underline" to="/explore">
          {t("1 · 探索目前公開故事", "1 · Explore current public stories")}
        </Link>
        <Link
          className="rounded-xl border p-3 text-primary underline"
          to="/app/collection"
          hash="collection-goals"
        >
          {t("2 · 選擇私人收藏目標", "2 · Choose private collection goals")}
        </Link>
        <Link
          className="rounded-xl border p-3 text-primary underline"
          to="/app/collection"
          hash="collection-albums"
        >
          {t("3 · 閱讀本人卡冊進度", "3 · Read your album progress")}
        </Link>
        <Link className="rounded-xl border p-3 text-primary underline" to="/app/achievements">
          {t("4 · 回顧已取得成就", "4 · Revisit earned achievements")}
        </Link>
        <Link className="rounded-xl border p-3 text-primary underline" to="/app/settings/privacy">
          {t("5 · 自選公開展示", "5 · Choose your public showcase")}
        </Link>
        <Link
          className="rounded-xl border p-3 text-primary underline"
          to="/app/collection"
          hash="collection-recap"
        >
          {t("6 · 回顧期間與合法來源", "6 · Revisit the period and eligible sources")}
        </Link>
      </nav>
      <aside
        className="space-y-2 rounded-xl border border-primary/30 p-4"
        data-collection-challenge-preview
        id="collection-challenges"
      >
        <h3 className="font-bold">
          {t("無獎收藏挑戰預覽", "Collection challenge preview without rewards")}
        </h3>
        <p>
          {t("曾取得的公開不同款式", "Acquired distinct public designs")}: {designs} ·{" "}
          {t("目前完成的公開卡冊", "Currently completed public albums")}: {completed}
        </p>
        <p className="text-sm text-muted-foreground">
          {t(
            "以服務端本人合法取得紀錄與目前公開分母回顧；同款與同卡冊只計一次，不新建挑戰紀錄或發放資產。挑戰條件仍是本機預覽，與未取得成就分開。",
            "Revisit your server acquisition records against the current public catalogue. Each design and album counts once. No challenge records or assets are issued. Challenge conditions remain a local preview, separate from unearned achievements.",
          )}
        </p>
        <dl data-no-reward-challenges className="grid gap-3 sm:grid-cols-3">
          {[
            {
              id: "distinct",
              title: t("公開款式閱讀起點", "Public design starting point"),
              current: designs,
              target: 1,
            },
            {
              id: "album",
              title: t("目前卡冊完成回顧", "Current album completion recap"),
              current: completed,
              target: 1,
            },
            {
              id: "archive",
              title: t("已取得成就典藏回顧", "Earned archive recap"),
              current: new Set(me.awards.map((a) => a.id)).size,
              target: 1,
            },
          ].map((c) => (
            <div key={c.id} className="rounded border p-3">
              <dt className="font-bold">{c.title}</dt>
              <dd>
                {Math.min(c.current, c.target)}/{c.target} ·{" "}
                {c.current >= c.target
                  ? t("目前條件符合", "Currently meets the preview")
                  : t("目前條件未符合", "Preview condition not yet met")}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-muted-foreground">
          {t(
            "challenge-preview-v1：候選閱讀挑戰，不是新成就。只讀目前合法去重來源；公開範圍變更會重算，沒有歷史完成宣告、獎勵或新事件寫入。",
            "challenge-preview-v1: candidate reading challenges, not new achievements. Read-only current eligible deduplicated sources, recalculated when visibility changes. No historical completion claims, rewards or new event writes.",
          )}
        </p>
      </aside>
    </section>
  );
}
