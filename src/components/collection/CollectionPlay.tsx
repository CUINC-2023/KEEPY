import { Link } from "@tanstack/react-router";
import { useLocalTest } from "@/lib/local-test-client";
import { useCollection, refreshCollection, refreshCollectionMe } from "@/lib/collection-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { Button } from "@/components/ui/button";
import { MemoryPlay } from "./MemoryPlay";
import { KnowledgePlay } from "./KnowledgePlay";
import { PlayRecords } from "./PlayRecords";
export function CollectionPlay() {
  const d = useCollection(),
    t = useDiscoveryText(),
    { locale } = useLocale();
  const local = useLocalTest();
  const legal =
    local.summary?.user.role === "member" &&
    d.catalogueValid &&
    d.me &&
    d.me.visibilityKey === d.catalogue?.visibilityKey
      ? d.me
      : null;
  return (
    <main className="space-y-5 p-4 md:p-8" data-collection-play>
      <h1 className="text-2xl font-bold">{t("收藏遊玩中心", "Collection play centre")}</h1>
      <p>
        {t(
          "本機私人玩法：不扣點、不消耗卡牌、不發獎勵，不計正式XP或排行榜。只使用本人目前合法持有且公開可見的款式。",
          "Private local play: no points or cards consumed, no rewards, no official XP or rankings. Uses only your currently held, publicly visible designs.",
        )}
      </p>
      <nav
        className="flex flex-wrap gap-3"
        aria-label={t("收藏遊玩接續入口", "Continue your collection play")}
      >
        <Link
          className="underline text-primary"
          to="/app/collection"
          hash="collection-theme-journey"
        >
          {t("私人收藏旅程", "Private collection journey")}
        </Link>
        <Link
          className="underline text-primary"
          to="/app/collection"
          hash="collection-multi-stage-challenge"
        >
          {t("無獎收藏挑戰", "No-reward collection challenges")}
        </Link>
        <Link className="underline text-primary" to="/app/curations">
          {t("本人策展", "Your curations")}
        </Link>
        <Link className="underline text-primary" to="/app/collection" hash="collection-recap">
          {t("本人期間回顧", "Your period recap")}
        </Link>
      </nav>
      {d.error || d.meError ? (
        <div role="alert">
          <p>
            {t(
              "本機來源無法讀取，舊私人內容已清空；Staging僅前端預覽，沒有本機API。",
              "Local sources unavailable; previous private content is cleared. Staging is a front-end preview without the local API.",
            )}
          </p>
          <Button
            onClick={() => {
              void refreshCollection();
              void refreshCollectionMe();
            }}
          >
            {t("重讀來源", "Reload sources")}
          </Button>
        </div>
      ) : !legal ? (
        <p>
          {t(
            "請在本機Local Test選擇本人測試身分；線上預覽不能登入或保存本機資料。",
            "Choose your own Local Test identity locally; the online preview cannot sign in or save local records.",
          )}
        </p>
      ) : (
        <>
          <section className="panel space-y-3 p-4" data-play-source>
            <h2 className="text-xl font-bold">
              {t("目前適用素材", "Currently eligible material")}
            </h2>
            <p>
              {t("合法持有的不同款式", "Distinct eligible held designs")}: {legal.cards.length}
            </p>
            {legal.cards.length ? (
              <ul>
                {d.catalogue?.pools
                  .filter((p) => legal.cards.some((c) => c.poolId === p.poolId))
                  .map((p) => (
                    <li key={p.poolId}>
                      <Link
                        className="underline"
                        to="/app/album/$poolId"
                        params={{ poolId: p.poolId }}
                      >
                        {p.title[locale]}
                      </Link>
                    </li>
                  ))}
              </ul>
            ) : (
              <p>
                {t(
                  "目前沒有可用持卡；可先閱讀公開故事，不能用缺卡或測試假持卡補題。",
                  "No eligible held cards. Read public stories first; missing cards and invented holdings do not supply questions.",
                )}
              </p>
            )}
            <Link className="underline" to="/explore">
              {t("探索公開內容", "Explore public content")}
            </Link>
          </section>
          <section className="grid min-w-0 gap-5 xl:grid-cols-2" data-play-entrances>
            {d.catalogue && (
              <KnowledgePlay
                key={
                  "knowledge:" +
                  legal.actorId +
                  legal.visibilityKey +
                  legal.cards.map((c) => c.cardId).join(",")
                }
                me={legal}
                catalogue={d.catalogue}
              />
            )}
            <MemoryPlay
              key={
                "memory:" +
                legal.actorId +
                legal.visibilityKey +
                legal.cards.map((c) => c.cardId + ":" + c.cardVersion).join(",")
              }
              cards={legal.cards}
              actor={legal.actorId}
              visibilityKey={legal.visibilityKey}
            />
            {d.catalogue && (
              <KnowledgePlay
                key={
                  "observation:" +
                  legal.actorId +
                  legal.visibilityKey +
                  legal.cards.map((c) => c.cardId + ":" + c.cardVersion).join(",")
                }
                mode="observation"
                me={legal}
                catalogue={d.catalogue}
              />
            )}
          </section>
          <PlayRecords
            key={
              "records:" +
              legal.actorId +
              legal.visibilityKey +
              legal.cards.map((c) => c.cardId).join(",")
            }
            actor={legal.actorId}
            visibilityKey={legal.visibilityKey}
          />
        </>
      )}
    </main>
  );
}
