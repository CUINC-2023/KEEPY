import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeMark } from "@/components/player/BadgeMark";
import { SectionTitle, TextStatus } from "@/components/public/PublicPage";
import { CardFrame } from "@/components/ui/card-frame";
import { CardDetailLink } from "@/components/card/CardDetailLink";
import { Progress } from "@/components/ui/progress";
import { ALL_POOL_PROGRESS, PLAYER, goddessOf } from "@/data/player";
import { COMPLETED_ACHIEVEMENTS, PLAYER_PUBLIC_PROFILE } from "@/data/player-profile";
import { DEFAULT_CARD_SHOWCASE_IDS, readCardShowcaseIds, showcaseCardById } from "@/data/showcase-cards";
import { PHYSICAL_COLLECTION } from "@/data/public-hub";
import { DEFAULT_SHOWCASE_IDS, readShowcaseIds, showcaseBadgeById } from "@/data/showcase-badges";
import { selfRanks } from "@/data/leaderboard";
import { DEFAULT_PUBLIC_PROFILE, readPublicProfile, type PublicProfileSettings } from "@/data/public-profile-settings";

/** 讀取公開頁三份本機設定（訪客頁與本人預覽共用） */
export function useCollectorPublicData() {
  const [settings, setSettings] = useState<PublicProfileSettings>(DEFAULT_PUBLIC_PROFILE);
  const [showcaseIds, setShowcaseIds] = useState<string[]>([...DEFAULT_SHOWCASE_IDS]);
  const [cardIds, setCardIds] = useState<string[]>([...DEFAULT_CARD_SHOWCASE_IDS]);
  useEffect(() => {
    setShowcaseIds(readShowcaseIds());
    setCardIds(readCardShowcaseIds());
    setSettings(readPublicProfile());
  }, []);
  return { settings, showcaseIds, cardIds };
}

/**
 * 公開收藏頁展示內容（單一來源）。
 * mode="visitor"：不渲染任何管理入口；mode="owner"：本人預覽，額外渲染管理連結。
 */
export function CollectorProfileView({ mode }: { mode: "visitor" | "owner" }) {
  const owner = mode === "owner";
  const { settings, showcaseIds, cardIds } = useCollectorPublicData();
  const ranks = selfRanks(settings.displayName || DEFAULT_PUBLIC_PROFILE.displayName, settings.isPublic, settings.showRanking);
  const isPublic = settings.isPublic;
  const showcaseBadges = showcaseIds.map((id) => showcaseBadgeById(id)).filter((i): i is NonNullable<typeof i> => Boolean(i));
  const showcaseCards = cardIds.map((id) => showcaseCardById(id)).filter((c): c is NonNullable<typeof c> => Boolean(c));
  const recentAchievements = COMPLETED_ACHIEVEMENTS.filter((item) => item.completedAt).slice().sort((a, b) => (a.completedAt ?? "").localeCompare(b.completedAt ?? "")).slice(0, 3);
  const season = ALL_POOL_PROGRESS.find((item) => item.poolId === PLAYER_PUBLIC_PROFILE.seasonPoolId);
  const publicPhysical = PHYSICAL_COLLECTION.filter((item) => item.state === "兌換紀錄");

  return (
    <>
      {!isPublic ? (
        <section className="panel grid min-h-72 place-items-center p-8 text-center">
          <div>
            <TextStatus>未公開</TextStatus>
            <h2 className="mt-4 text-2xl font-black">此收藏頁未公開</h2>
            
          </div>
        </section>
      ) : (
        <div className="space-y-8">
          <section className="overflow-hidden rounded-md border border-border bg-card">
            <div className="relative min-h-52 bg-gradient-to-br from-primary/35 via-card to-gold/20 p-6 sm:min-h-64 sm:p-8">
              <TextStatus tone="gold">公開收藏頁 · Local Mock</TextStatus>
              <p className="mt-12 max-w-xl text-xl font-black leading-relaxed sm:text-3xl">{PLAYER_PUBLIC_PROFILE.coverTitle}</p>
              <p className="mt-3 text-xs text-muted-foreground">封面視覺替代文字：星光與柔金色交織的收藏主題背景</p>
            </div>
            <div className="grid gap-5 p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-end sm:p-8">
              <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-gold/60 bg-primary/20 text-2xl font-black text-gold" role="img" aria-label={`${settings.displayName}的頭像`}>{settings.displayName.slice(0, 1)}</div>
              <div className="min-w-0">
                <h1 className="text-2xl font-black">{settings.displayName}</h1>
                <p className="mt-1 text-sm font-bold text-gold">Lv.{PLAYER.level} · 星軌收藏家</p>
                {settings.bio ? (
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{settings.bio}</p>
                ) : null}
              </div>
              {settings.showCollectionStats ? (
                <div className="sm:text-right">
                  <p className="text-[11px] text-muted-foreground">總收藏積分</p>
                  <p className="text-3xl font-black text-gold">{PLAYER_PUBLIC_PROFILE.collectionScore.toLocaleString()}</p>
                </div>
              ) : null}
            </div>
          </section>

          {settings.showCollectionStats ? (
            <section className="grid grid-cols-3 gap-3">
              <div className="panel p-4 text-center"><p className="text-xl font-black">{PLAYER_PUBLIC_PROFILE.completedAlbums}</p><p className="mt-1 text-[11px] text-muted-foreground">完成卡冊</p></div>
              <div className="panel p-4 text-center"><p className="text-xl font-black">{PLAYER.totalCards}</p><p className="mt-1 text-[11px] text-muted-foreground">總卡牌數</p></div>
              <div className="panel p-4 text-center"><p className="text-xl font-black">{PLAYER.uniqueCards}</p><p className="mt-1 text-[11px] text-muted-foreground">不重複卡數</p></div>
            </section>
          ) : null}

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SectionTitle title="展示卡" note={`${showcaseCards.length} 張公開展示`} />
              {owner ? (
                <Link
                  to="/app/settings/privacy"
                  hash="showcase-cards"
                  className="text-xs font-semibold text-gold underline-offset-4 hover:underline"
                  aria-label="管理展示卡（本人預覽 Demo 快捷入口）"
                >
                  管理展示卡 →
                </Link>
              ) : null}
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="展示卡清單">
              {showcaseCards.map((card) => (
                <li key={card.id} className="min-w-0">
                  <figure aria-label={`${card.name}，${card.grade} 等級展示卡`}>
                    <CardFrame goddess={goddessOf(card)} grade={card.grade} cardName={card.name} />
                    <figcaption className="mt-2 truncate text-[11px] font-bold">{card.name}</figcaption>
                  </figure>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">{card.grade} · {goddessOf(card).name}</span>
                  <CardDetailLink name={card.name} grade={card.grade} />
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SectionTitle title="展示徽章" note={`${showcaseBadges.length} 枚公開展示`} />
              {owner ? (
                <Link
                  to="/app/achievements"
                  className="text-xs font-semibold text-gold underline-offset-4 hover:underline"
                  aria-label="管理展示徽章（本人預覽 Demo 快捷入口）"
                >
                  管理展示徽章 →
                </Link>
              ) : null}
            </div>
            {showcaseBadges.length === 0 ? (
              <div className="panel p-6 text-center">
                <p className="text-sm font-black">這位收藏家尚未展示徽章</p>
                <p className="mt-1 text-[11px] text-muted-foreground">目前沒有公開展示的徽章。</p>
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="展示徽章清單">
                {showcaseBadges.map((item) => (
                  <li key={item.id} className="panel flex flex-col items-center gap-2 p-4 text-center">
                    <BadgeMark label={item.badge} className="h-16 w-16" />
                    <p className="text-xs font-black">{item.badge}</p>
                    <p className="text-[11px] text-muted-foreground">來源成就：{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">完成於 {item.completedAt}（Demo）</p>
                    <TextStatus tone="gold">{item.rarity}</TextStatus>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {settings.showCollectionStats || settings.showRanking ? (
            <section className="grid gap-4 lg:grid-cols-2">
              {settings.showCollectionStats ? (
                <div className="panel p-5">
                  <SectionTitle title="當季收藏進度" note="與玩家卡冊一致" />
                  {season ? <Progress className="mt-5" value={season.owned} max={season.total} showLabel label={`${season.poolName} ${season.owned}/${season.total}`} tone="gold" /> : null}
                  <p className="mt-3 text-[11px] text-muted-foreground">卡冊完整總數為完成率分母。</p>
                </div>
              ) : null}
              {settings.showRanking ? (
                <div className="panel p-5">
                  <SectionTitle title="公開排行" note="不顯示消費金額" />
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-md bg-muted/60 p-4"><p className="text-[11px] text-muted-foreground">總榜</p><p className="mt-1 text-2xl font-black text-gold">{ranks.total ? `第 ${ranks.total} 名` : "未列入"}</p></div>
                    <div className="rounded-md bg-muted/60 p-4"><p className="text-[11px] text-muted-foreground">{ranks.poolName}榜</p><p className="mt-1 text-2xl font-black text-gold">{ranks.pool ? `第 ${ranks.pool} 名` : "未列入"}</p></div>
                  </div>
                  <p className="mt-3 text-[11px] text-muted-foreground">名次與 <Link to="/leaderboards" className="text-primary hover:underline">排行榜</Link> 同一份 Demo 示範名單計算；排行計算規則 Demo／待定。</p>
                </div>
              ) : null}
            </section>
          ) : null}

          {settings.showRecentAchievements ? (
            <section className="space-y-3">
              <SectionTitle title="近期取得成就" />
              <div className="grid gap-3 sm:grid-cols-3">
                {recentAchievements.map((item) => <article key={item.id} className="panel p-4"><div className="flex items-center gap-3"><BadgeMark label={item.badge} className="h-16 w-16 shrink-0" /><div className="min-w-0"><TextStatus tone="gold">已完成</TextStatus><h3 className="mt-2 font-black">{item.title}</h3><p className="mt-1 text-[11px] text-muted-foreground">完成於 {item.completedAt}</p></div></div></article>)}
              </div>
            </section>
          ) : null}

          {settings.showPhysicalCollection ? (
            <section className="space-y-3">
              <SectionTitle title="公開實體典藏紀錄" note="V1 資格／紀錄 Mock" />
              <div className="grid gap-3 sm:grid-cols-2">
                {publicPhysical.map((item) => <article key={item.id} className="panel p-5"><div className="flex flex-wrap items-center justify-between gap-2"><TextStatus>{item.state}</TextStatus><span className="text-xs font-bold text-gold">{item.edition}</span></div><h3 className="mt-3 font-black">{item.title}</h3><p className="mt-2 text-xs text-muted-foreground">公開流水號 {item.serial}</p><p className="mt-3 text-[10px] text-muted-foreground">僅顯示公開典藏紀錄，不含收件或配送資料。</p></article>)}
              </div>
            </section>
          ) : null}

          <p className="border-t border-border pt-5 text-[11px] leading-relaxed text-muted-foreground">本公開頁不顯示點數、消費金額、完整抽卡紀錄、收件資料、地址或其他敏感資訊。所有內容皆為 Local Mock。</p>
        </div>
      )}
    </>
  );
}
