import { createFileRoute, Link } from "@tanstack/react-router";
import { useCopy, useLocale, type Locale } from "@/lib/keepy-i18n";

export const Route = createFileRoute("/faq")({ component: FaqPage });

type Entry = { id?: string; title: Record<Locale, string>; body: Record<Locale, string> };
const player: Entry[] = [
  { title: { "zh-TW": "KP 與 CUverse", en: "KP and CUverse" }, body: { "zh-TW": "KEEPY 與 CUverse 的帳號和點數互相獨立。NT$1＝2 KP 僅是規劃基準，尚非正式匯率或儲值承諾。", en: "KEEPY and CUverse accounts and points are separate. NT$1 = 2 KP is a planning baseline, not a live exchange rate or top-up offer." } },
  { title: { "zh-TW": "卡池抽卡與 KP", en: "Pools, draws and KP" }, body: { "zh-TW": "規格：先扣贈點、最後才扣付費點。優惠儲值按實際付費比例分攤，贈點不分潤。本原型不扣除任何真實 KP，也不保證抽卡機率。", en: "Planned order: bonus KP first, paid KP last. Promotional top-ups are allocated by actual paid proportion; bonus KP earns no revenue share. This mock does not charge KP or promise draw odds." } },
  { title: { "zh-TW": "十抽送一抽", en: "10+1 draws" }, body: { "zh-TW": "十抽送一抽＝付費 10 次，額外 1 次不另外收費。第 11 張是完整正式卡：計入同卡池保底抽數，可與同款同等級副本合成，符合實體資格與副本規則時可申請製作。該次付費 KP 為 0、不產生創作者分潤；若觸發保底，保底結果同樣不分潤。本原型僅為示意，保底、合成與實體履約尚未上線。", en: "10+1 means 10 paid draws plus 1 extra draw at no extra charge. The 11th card is a full card: it counts toward the pool's pity count, can be combined with same-card same-grade copies, and can be requested as a physical card when eligible. That draw uses 0 paid KP and earns no creator revenue share; a pity result also earns none. This is a mock only; pity, synthesis and physical fulfilment are not live." } },
  { id: "draw-pity", title: { "zh-TW": "抽卡保底（待核定）", en: "Draw pity (pending approval)" }, body: { "zh-TW": "抽卡保底與合成「連續失敗 10 次保底」是兩套獨立規則。抽卡保底只在同一卡池累計；每一抽計數 +1，十抽送一抽共 +11（含第 11 次）。到達門檻的那一抽保證至少目標等級；保底結果與第 11 次抽卡皆不計創作者分潤。門檻、目標等級、可抽卡、重置與卡池結束處理皆為正式規則待核定，後台範例值僅供 Demo 模擬，不是商品承諾。", en: "Draw pity is separate from the synthesis rule of pity after 10 consecutive failures. It counts only within one pool; every draw adds 1, so a 10+1 adds 11 (including the 11th). The draw reaching the threshold guarantees at least the target grade; pity results and the 11th draw earn no creator revenue share. Threshold, target grade, eligible cards, reset and pool-end handling are pending approval; admin sample values are demo simulations, not a product promise." } },
  { title: { "zh-TW": "收藏與合成", en: "Collection and synthesis" }, body: { "zh-TW": "卡冊、卡牌與合成結果皆為本機示意；保底、合成、活動及贈點取得的卡牌不計入分潤。", en: "Collection, cards and synthesis are local mock views. Pity, synthesis, events and bonus-point draws do not count toward revenue share." } },
  { title: { "zh-TW": "實體卡", en: "Physical cards" }, body: { "zh-TW": "規格：兌換扣除多餘副本並至少保留一張；玩家自行取消仍計入每月最多兩次的申請額度，十日間隔從原申請時間起算。此處不提供真實兌換或物流。", en: "Planned rule: redeem extra copies while keeping at least one; A player-cancelled request still counts as one of the two monthly requests, and the ten-day interval runs from the original request time. No real redemption or shipping is available." } },
];
const creator: Entry[] = [
  { title: { "zh-TW": "合作簽約", en: "Creator agreements" }, body: { "zh-TW": "合作模式僅示意；尚無真實合約或簽署。虛構卡面不是已授權的真人創作者。", en: "Collaboration modes are examples only. No real agreements or signing. The fictional sample characters are not licensed real creators." } },
  { title: { "zh-TW": "分潤與凍結收益", en: "Revenue share and frozen revenue" }, body: { "zh-TW": "只有一般付費抽卡抽中分潤卡才計收益；保底、合成、活動、贈點不計。規格中的收益凍結 14 日；本頁不計算或承諾實際金額。", en: "Only regular paid draws landing a revenue-share card count. Pity, synthesis, events and bonus KP do not. The planned freeze is 14 days; no actual earnings are calculated or promised here." } },
  { title: { "zh-TW": "提領", en: "Withdrawals" }, body: { "zh-TW": "提領僅供規格預覽，無真實可提領額、出款或已核定合約條件。", en: "Withdrawals are specification-only; there is no real withdrawable balance, payout or approved contract terms." } },
];
function FaqPage() {
  const { locale } = useLocale(); const t = useCopy();
  return <div className="mx-auto max-w-4xl space-y-6">
    <header className="space-y-2"><span className="demo-chip">Local Mock · Preview</span><h1 className="text-3xl font-black">KEEPY · {t("faq")}</h1><p className="text-sm text-muted-foreground">{t("noTransactions")}</p></header>
    {([["player", player], ["creator", creator]] as const).map(([key, entries]) => <section key={key} className="space-y-3"><h2 className="text-xl font-black">{t(key)}</h2><div className="grid gap-3 sm:grid-cols-2">{entries.map((item) => <article key={item.title["zh-TW"]} id={item.id} className="scroll-mt-20 panel min-w-0 p-5"><h3 className="font-bold">{item.title[locale]}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body[locale]}</p></article>)}</div></section>)}
    <div className="flex flex-wrap gap-4 text-sm font-bold text-primary"><Link to="/pools/$poolId" params={{ poolId: "p-keepy-sample" }}>← {t("pools")} · {t("preview")}</Link><Link to="/partner">{t("creator")} →</Link></div>
  </div>;
}