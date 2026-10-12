import { Link } from "@tanstack/react-router";
import type { CollectionMe, CollectionCard } from "@/lib/collection-store";
import type { ReactNode } from "react";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { CollectionNextStep } from "./CollectionNextStep";
import { AcquisitionTimeline } from "./AcquisitionTimeline";
import { HomeReadingLayout } from "./HomeReadingLayout";
import { CollectionReadingGuide } from "./CollectionReadingGuide";
import { PlayRecords } from "./PlayRecords";
import { useLocalTest } from "@/lib/local-test-client";
export function CollectionHome({
  me,
  renderCard,
  growth,
}: {
  me: CollectionMe;
  renderCard: (cards: CollectionCard[]) => ReactNode;
  growth: ReactNode;
}) {
  const t = useDiscoveryText(),
    { locale } = useLocale(),
    p = me.profile.data;
  const main = me.cards.find((c) => c.cardId === p.mainCardId);
  const local = useLocalTest();
  return (
    <section data-collection-home className="panel min-w-0 space-y-4 p-5">
      <h2 className="text-2xl font-bold break-words">{p.displayName}</h2>
      <CollectionNextStep me={me} />
      <Link className="text-primary underline" to="/app/planning">
        {t("本人私人收藏規劃板", "Your private collection planning board")}
      </Link>
      <Link className="text-primary underline" to="/app/notes">
        {t("本人私人收藏筆記", "Your private collection notes")}
      </Link>
      <CollectionReadingGuide />
      <Link className="text-primary underline" to="/app/play">
        {t("收藏遊玩中心（無消耗／無獎勵）", "Collection play centre (no costs or rewards)")}
      </Link>
      <Link className="text-primary underline" to="/app/curations">
        {t("編排本人私人收藏策展", "Arrange your private collection curations")}
      </Link>
      <nav
        data-home-history-entrances
        className="flex flex-wrap gap-3"
        aria-label={t("本人期間回顧與來源", "Your period recap and sources")}
      >
        <Link to="/app/recap" className="text-primary underline">
          {t("回顧本人期間收藏", "Revisit your period collection")}
        </Link>
        <Link to="/app/collection" hash="collection-history" className="text-primary underline">
          {t("核對本人合法取得來源", "Review your eligible acquisition sources")}
        </Link>
      </nav>
      <nav
        data-private-recap-entrances
        aria-label={t("本人收藏回顧入口", "Your collection recap entrances")}
        className="grid gap-3 sm:grid-cols-3"
      >
        <Link className="rounded-xl border p-3 text-primary underline" to="/app/levels">
          {t("玩家成長 · 候選比較", "Player growth · candidate comparison")}
        </Link>
        <Link
          className="rounded-xl border p-3 text-primary underline"
          to="/app/participation-level"
        >
          {t("平台參與 · 獨立預覽", "Platform participation · separate preview")}
        </Link>
        <Link className="rounded-xl border p-3 text-primary underline" to="/app/rankings">
          {t("本人排行入口與資格", "Your ranking entrances and eligibility")}
        </Link>
      </nav>
      <p className="text-xs text-muted-foreground">
        {t(
          "本人回顧與公開展示分開；空帳戶仍可探索公開故事，等級不授予獎勵、資產或角色。",
          "Private recaps are separate from public display. Empty accounts can still explore public stories; levels grant no rewards, assets or roles.",
        )}
      </p>
      <p className="whitespace-pre-wrap break-words">
        {p.bio || t("尚未填寫介紹。", "No introduction saved.")}
      </p>
      <p>
        {t("收藏頁狀態：", "Collection page: ")}
        {p.isPublic ? t("公開", "Public") : t("私人", "Private")}
      </p>
      <p>
        {t("主展示卡：", "Main display card: ")}
        {main?.name ?? t("尚未設定目前可展示的卡牌。", "No currently displayable card selected.")}
      </p>
      {main && <div className="max-w-xs">{renderCard([main])}</div>}
      <p>
        {t("公開卡冊", "Public albums")} {me.progress.length} · {t("已完成", "Completed")}{" "}
        {me.progress.filter((p) => p.complete).length}
      </p>
      <HomeReadingLayout
        key={me.actorId + ":" + me.profile.version}
        me={me}
        timeline={<AcquisitionTimeline key={me.actorId} me={me} />}
        growth={growth}
        play={
          local.summary?.user.role === "member" ? (
            <>
              <PlayRecords
                key={
                  "home-play:" +
                  me.actorId +
                  me.visibilityKey +
                  me.cards.map((c) => c.cardId).join(",")
                }
                actor={me.actorId}
                visibilityKey={me.visibilityKey}
              />
              <Link className="underline" to="/app/play">
                {t("接續本人無獎遊玩", "Continue your no-reward play")}
              </Link>
            </>
          ) : (
            <p>
              {t(
                "私人遊玩摘要需要會員測試身分。",
                "Private play summaries require a member test identity.",
              )}
            </p>
          )
        }
        curations={
          <section data-home-curation-summary className="space-y-3">
            <h3 className="font-bold">{t("本人策展展區", "Your curation sections")}</h3>
            {p.curations?.length ? (
              <ul>
                {p.curations.map((g) => (
                  <li key={g.id}>
                    {g.title} · {g.cardIds.length} ·{" "}
                    {g.showPublic && p.isPublic && p.showCards
                      ? t(
                          "允許公开，仍按目前合法來源投影",
                          "Public permitted, subject to current eligible sources",
                        )
                      : t(
                          "私人／尚未允许整體公開",
                          "Private / overall public permission not granted",
                        )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t("尚無本人策展展區。", "No personal curation sections.")}</p>
            )}
            <Link className="underline" to="/app/curations">
              {t("編排本人展覽", "Arrange your exhibition")}
            </Link>
          </section>
        }
        awards={
          <>
            <h3 className="font-bold">{t("已取得成就精選", "Earned achievements")}</h3>
            {me.awards.length ? (
              <ul>
                {me.awards.slice(0, 3).map((a) => (
                  <li key={a.id}>{a.title[locale]}</li>
                ))}
              </ul>
            ) : (
              <p>{t("尚無已取得成就。", "No earned achievements.")}</p>
            )}
          </>
        }
      />
      <div className="flex flex-wrap gap-4">
        <Link className="text-primary underline" to="/app/settings/privacy">
          {t("編輯個人展示", "Edit your showcase")}
        </Link>
        <Link className="text-primary underline" to="/app/achievements">
          {t("已取得成就", "Earned achievements")}
        </Link>
        {p.isPublic && (
          <Link
            className="text-primary underline"
            to="/collectors/$collectorId"
            params={{ collectorId: me.profile.handle }}
          >
            {t("查看公開頁", "View public page")}
          </Link>
        )}
      </div>
    </section>
  );
}
