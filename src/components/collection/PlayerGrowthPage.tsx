import { Link } from "@tanstack/react-router";
import { useCollection, refreshCollection, refreshCollectionMe } from "@/lib/collection-store";
import { previewPlayerLevel } from "@/lib/player-level-preview.mjs";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { Button } from "@/components/ui/button";
import { PlayerLevelPreview } from "./PlayerLevelPreview";
import { PlatformLevelPreview } from "./PlatformLevelPreview";
import { CollectionRecap } from "./CollectionRecap";

export function PlayerGrowthPage() {
  const d = useCollection(),
    t = useDiscoveryText();
  const value = d.me && d.catalogue && previewPlayerLevel(d.me, d.catalogue);
  return (
    <main className="space-y-6 p-4 md:p-8" data-player-growth>
      <h1 className="text-2xl font-bold">
        {t("玩家成長 · 本機預覽", "Player growth · local preview")}
      </h1>
      <Link className="text-primary underline" to="/app/collection">
        {t("返回本人收藏", "Back to your collection")}
      </Link>
      <p>
        {t(
          "這是收藏進度候選規則，與卡牌成長分開。沒有正式升級時間、獎勵或解鎖紀錄。",
          "These are candidate collection progress rules, separate from card growth. No official upgrade dates, rewards or unlock records exist.",
        )}
      </p>
      <Button
        variant="outline"
        onClick={() => {
          void refreshCollection();
          void refreshCollectionMe();
        }}
      >
        {t("依目前來源重算候選預覽", "Recompute candidate preview from current sources")}
      </Button>
      {d.error || d.meError ? (
        <div role="alert" className="panel space-y-3 p-4">
          <p>
            {t(
              "無法讀取成長來源；沒有顯示舊資料。",
              "Growth sources could not be loaded; stale data is hidden.",
            )}
          </p>
          <Button
            onClick={() => {
              void refreshCollection();
              void refreshCollectionMe();
            }}
          >
            {t("重新讀取來源", "Reload sources")}
          </Button>
        </div>
      ) : !d.loaded ? (
        <p role="status">{t("讀取公開目錄中…", "Loading the public catalogue…")}</p>
      ) : !value || !d.me || !d.catalogue ? (
        <p>
          {t(
            "請在本機測試選擇本人帳號；成長資料保持私人。",
            "Select your Local Test account; growth data stays private.",
          )}
        </p>
      ) : (
        <>
          <PlatformLevelPreview key={"platform-" + d.me.actorId} me={d.me} />
          <PlayerLevelPreview key={"growth-" + d.me.actorId} me={d.me} catalogue={d.catalogue} />
          <aside data-growth-recalculation-reasons className="panel space-y-3 p-4">
            <h2>{t("候選變動與補算說明", "Candidate changes and recalculation")}</h2>
            <p>
              {t(
                "新合法不同款式會增加候選來源；重複卡不增加。卡冊公開分母、隱藏／撤下、素材定義或候選版本改變可能使結果下降或不同。這是目前來源重算，不代表正式升級、獎勵或歷史XP改寫。",
                "New eligible distinct designs add candidate sources; duplicates do not. Changes to public denominators, hiding/withdrawal, definitions or candidate versions may lower or alter the result. This is current-source recomputation, not an official upgrade, reward or rewritten historical XP.",
              )}
            </p>
            <Link className="text-primary underline" to="/app/collection" hash="collection-history">
              {t("核對本人合法事件來源", "Check your eligible event sources")}
            </Link>
          </aside>
          <CollectionRecap key={"growth-recap-" + d.me.actorId} me={d.me} />
          <section className="panel space-y-3 p-5" data-growth-next>
            <h2 className="text-xl font-bold">
              {t("候選A目前進度與下一階段", "Candidate A progress and next stage")}
            </h2>
            <progress
              className="h-3 w-full"
              value={value.xp === value.cap ? 100 : value.xp % value.step}
              max={value.step}
              aria-label={t("下一階段預覽進度", "Next preview stage progress")}
            />
            <p>
              {value.nextXP === null
                ? t("已達候選預覽上限。", "Candidate preview cap reached.")
                : t("距離下一預覽階段", "Until the next preview stage") +
                  ": " +
                  value.nextXP +
                  " XP"}
            </p>
            <p className="text-sm">
              {t(
                "重算依據：本人來源、目前公開目錄及候選規則版本；下架或遮蔽後可能降低預覽值。",
                "Recalculation uses your sources, the current public catalogue and candidate rule version. Withdrawal or visibility changes may reduce the preview.",
              )}
            </p>
          </section>
          <section className="panel space-y-3 p-5">
            <h2 className="text-xl font-bold">
              {t("由目前來源推導的階段回顧", "Stage recap derived from current sources")}
            </h2>
            <p className="text-sm">
              {t(
                "不是歷史升級事件；未記錄實際到達日期。",
                "These are not historical upgrade events; actual arrival dates were not recorded.",
              )}
            </p>
            <ol className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: value.level }, (_, i) => (
                <li className="rounded-lg border p-3" key={i}>
                  {t("預覽階段", "Preview stage")} {i + 1} · {i * value.step} XP
                </li>
              ))}
            </ol>
          </section>
          <Link to="/explore" className="text-primary underline">
            {t("探索目前公開卡冊故事", "Explore current public album stories")}
          </Link>
        </>
      )}
    </main>
  );
}
