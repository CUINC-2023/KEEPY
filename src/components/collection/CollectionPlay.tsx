import { Link } from "@tanstack/react-router";
import { useCollection, refreshCollection, refreshCollectionMe } from "@/lib/collection-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { Button } from "@/components/ui/button";
import { MemoryPlay } from "./MemoryPlay";
export function CollectionPlay() {
  const d = useCollection(),
    t = useDiscoveryText(),
    { locale } = useLocale();
  const legal =
    d.catalogueValid && d.me && d.me.visibilityKey === d.catalogue?.visibilityKey ? d.me : null;
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
          <section className="grid gap-3 sm:grid-cols-3" data-play-entrances>
            <MemoryPlay
              key={
                legal.actorId +
                legal.visibilityKey +
                legal.cards.map((c) => c.cardId + ":" + c.cardVersion).join(",")
              }
              cards={legal.cards}
            />
            {[
              ["knowledge", "卡冊知識", "Album knowledge"],
              ["observation", "收藏觀察", "Collection observation"],
            ].map(([id, zh, en]) => (
              <article key={id} id={"play-" + id} className="panel space-y-2 p-4">
                <h2 className="font-bold">{t(zh!, en!)}</h2>
                <p>
                  {t(
                    "本批待接入正常玩法，不是假完成操作。",
                    "Normal gameplay is being connected in this batch; no simulated completion action.",
                  )}
                </p>
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
