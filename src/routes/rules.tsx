import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GRADES, POOLS } from "@/data/mock";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { usePlayerCopy } from "@/lib/player-copy";

export const Route = createFileRoute("/rules")({
  head: () => ({
    meta: [
      { title: "Rules / 遊戲規則 — KEEPY" },
      {
        name: "description",
        content: "KEEPY bilingual demo rules. Production thresholds and costs await approval.",
      },
    ],
  }),
  component: RulesPage,
});
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel p-5 sm:p-6">
      <h2 className="text-lg font-black tracking-wide">{title}</h2>
      <div className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
function Bullet({ children }: { children: ReactNode }) {
  return (
    <p className="flex gap-2">
      <span className="shrink-0 text-gold">◆</span>
      <span>{children}</span>
    </p>
  );
}
function RulesPage() {
  const t = usePlayerCopy();
  const live = POOLS.find((p) => p.status === "live");
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <h1 className="text-2xl font-black">{t("遊戲規則摘要", "Rules preview")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(
            "以下為本機原型的規則示意，正式版以核定公告為準。",
            "Rules below describe the local prototype. Approved announcements will define production rules.",
          )}
        </p>
      </header>
      <Section title={t("卡牌等級", "Card grades")}>
        <Bullet>
          {t(
            "由低至高共 10 級；等級表示卡牌階級，不代表創作者合作條件。",
            "Ten grades, lowest to highest. Grades describe cards, not creator partnership terms.",
          )}
        </Bullet>
        <div className="flex flex-wrap gap-2">
          {GRADES.map((g) => (
            <RarityBadge key={g} rarity={g} />
          ))}
        </div>
      </Section>
      <Section title={t("示意抽卡與保底", "Demo draws & pity")}>
        <Bullet>
          {t(
            "卡池公開等級機率，示意數值總和為 100%。本機結果為固定資料，不使用真實亂數或扣點。",
            "Pool probability fixtures total 100%. Local results are scripted, with no real randomness or KP charge.",
          )}
        </Bullet>
        <Bullet>
          {t(
            "十抽送一抽取得 11 張；第 11 張與其他卡牌有相同收藏、合成與資格申請身分，11 次均計入同卡池保底計數。",
            "10 + 1 returns 11 cards. The 11th card has equal collection, synthesis and eligibility status; all 11 count toward the same pool's pity counter.",
          )}
        </Bullet>
        <Bullet>
          {t(
            "正式保底機制、門檻、適用等級與卡池結束後處理方式待核定。此版只展示計數。",
            "Production pity thresholds, eligible grades and pool-close handling await approval. This version displays the counter only.",
          )}
        </Bullet>
        {live && (
          <Link
            to="/pools/$poolId"
            params={{ poolId: live.id }}
            className="inline-block font-bold text-primary underline"
          >
            {t("查看卡池詳情", "View pool details")} →
          </Link>
        )}
      </Section>
      <Section title={t("重複卡與成長", "Duplicates & growth")}>
        <Bullet>
          {t(
            "同創作者、同等級、同一卡牌的重複卡每張增加 10% 成長值，累積 10 張／100% 可升一級；升級後成長重新累積。",
            "Each duplicate of the same creator, grade and card adds 10% growth. Ten duplicates reach 100% for a one-grade upgrade; growth then resets.",
          )}
        </Bullet>
        <Bullet>
          {t(
            "本機示意卡冊的持有數與成長顯示會跟隨抽卡及合成素材異動；指定卡成長頁仍為獨立介面示意。O 為最高級。",
            "The demo collection's quantities and growth display follow draws and material consumption. The card-growth page remains a separate interface demonstration. O is the highest grade.",
          )}
        </Bullet>
        <Bullet>{t("卡牌成長不產生分潤。", "Card growth generates no creator revenue.")}</Bullet>
      </Section>
      <Section title={t("合成工坊", "Synthesis")}>
        <Bullet>
          {t(
            "只接受同卡池、同等級素材。成功取得該卡池上一級卡，失敗取得該卡池同級卡；素材不退回，O 不可再合成。",
            "Materials must share a pool and grade. Success yields that pool's next grade; failure yields the same grade. Materials are consumed. O cannot be synthesized upward.",
          )}
        </Bullet>
        <Bullet>
          {t(
            "本機示意消耗 3 張、基礎成功率 35%、道具加成 12%、第 10 次失敗路徑觸發保底，均為驗收用數值；正式消耗、機率、道具疊加及保底規則待核定。",
            "Fixtures use 3 materials, 35% base chance, a 12% item bonus and pity on the tenth failure path. Production costs, rates, item stacking and pity rules await approval.",
          )}
        </Bullet>
        <Bullet>
          {t(
            "為驗收流程，勾選道具固定示範成功、未勾選示範失敗。合成不產生分潤。",
            "For flow review, selecting the item scripts success and no item scripts failure. Synthesis generates no revenue.",
          )}
        </Bullet>
        <Link to="/app/synthesis" className="inline-block font-bold text-primary underline">
          {t("前往合成示意", "Open synthesis preview")} →
        </Link>
      </Section>
      <Section title={t("商城道具", "Shop items")}>
        <Bullet>
          {t(
            "道具僅增加合成成功率，不影響抽卡機率、卡牌等級或保底次數。道具購買不產生創作者分潤；商城付款仍為 Demo。",
            "Items only increase synthesis success chance, without changing draw probabilities, card grade or pity count. Item purchases generate no creator revenue. Shop payment is still demo only.",
          )}
        </Bullet>
      </Section>
      <Section title={t("實體卡申請預覽", "Physical card request preview")}>
        <Bullet>
          {t(
            "本機以已取得 SSR 以上示範資格；正式資格、消耗、費用、Edition 與流水號待核定。",
            "Owning SSR-or-higher demonstrates local eligibility. Production eligibility, costs, fees, editions and serial allocation await approval.",
          )}
        </Bullet>
        <Bullet>
          {t(
            "預覽只保存本機完成紀錄，不消耗卡牌或名額，不收地址、不建立訂單、不付款、不安排寄送。海外配送另行安排。",
            "Preview saves a local completion record, with no card or stock consumption, address collection, order, payment or shipping. International delivery will be arranged separately.",
          )}
        </Bullet>
      </Section>
      <Section title={t("合作分潤與版本邊界", "Creator revenue & release boundaries")}>
        <Bullet>
          {t(
            "分潤只來自實際付費抽卡；免費抽卡、合成、成長、商城道具與其他遊戲行為均不產生分潤。實際比例依合作合約，計算基礎仍待核定。",
            "Only actual paid draws can generate creator revenue. Free draws, synthesis, growth, shop items and other game actions generate none. Rates follow partnership agreements; calculation bases await approval.",
          )}
        </Bullet>
        <Bullet>
          {t(
            "收益規劃以新台幣結算，不發平台點數。本版不接真實付款、提領、有效電子簽約或實體寄送；本機操作不建立正式會員、持卡或交易帳本。",
            "Revenue is planned in TWD rather than platform points. This version has no real payment, withdrawal, binding electronic signature or physical delivery, and creates no production account, ownership or financial ledger.",
          )}
        </Bullet>
      </Section>
      <p className="text-xs text-muted-foreground">
        {t(
          "本頁為介面原型內容，不構成正式服務條款。",
          "Prototype content only; not production terms of service.",
        )}
      </p>
    </div>
  );
}
