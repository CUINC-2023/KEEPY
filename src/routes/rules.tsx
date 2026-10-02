import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GRADES,
  POOLS,
  SHOP_ITEMS,
  SPLIT_POLICY_NOTE,
  SPLIT_SOURCE_NOTE,
} from "@/data/mock";
import { RarityBadge } from "@/components/ui/rarity-badge";

export const Route = createFileRoute("/rules")({
  head: () => ({
    meta: [
      { title: "遊戲規則摘要 — KEEPY" },
      {
        name: "description",
        content:
          "卡牌等級、抽卡機率與保底、重複卡成長 10%、隨機卡牌合成成功與失敗結果、合成保底與商城道具說明。",
      },
      { property: "og:title", content: "遊戲規則摘要 — KEEPY" },
      {
        property: "og:description",
        content:
          "卡牌等級、抽卡機率與保底、重複卡成長 10%、隨機卡牌合成成功與失敗結果、合成保底與商城道具說明。",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RulesPage,
});

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-5 sm:p-6">
      <h2 className="text-lg font-black tracking-wide">{title}</h2>
      <div className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2">
      <span className="shrink-0 text-gold">◆</span>
      <span>{children}</span>
    </p>
  );
}

function RulesPage() {
  const live = POOLS.find((p) => p.status === "live");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-wide">遊戲規則摘要</h1>
          <span className="demo-chip">Demo</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          以下為原型階段的規則說明，正式版以官方公告為準。
        </p>
      </header>

      <Section title="卡牌等級">
        <p>卡牌等級由低至高共 10 級：</p>
        <div className="flex flex-wrap gap-1.5">
          {GRADES.map((g) => (
            <RarityBadge key={g} rarity={g} />
          ))}
        </div>
        <Bullet>等級只表示卡牌階級，與女神本人的合作條件無關。</Bullet>
      </Section>

      <Section title="抽卡與保底">
        <Bullet>
          每個卡池公開各等級機率，機率總和為 100%，可於卡池詳情頁查看。
        </Bullet>
        <Bullet>
          抽卡保底機制、門檻、適用等級與卡池結束後處理方式皆為 Demo 規則／待定，正式規則核定後另行公告。
        </Bullet>
        {live && (
          <p className="pt-1">
            目前進行中卡池「{live.name}」的完整機率與保底：
            <Link
              to="/pools/$poolId"
              params={{ poolId: live.id }}
              className="ml-1 font-semibold text-primary hover:underline"
            >
              查看卡池詳情 →
            </Link>
          </p>
        )}
      </Section>

      <Section title="重複卡與卡牌成長">
        <Bullet>
          同女神、同等級、同卡牌的重複卡，每張累積 <strong className="text-foreground">10% 成長值</strong>。
        </Bullet>
        <Bullet>
          累積 <strong className="text-foreground">10 張／100%</strong> 可直接讓該張卡牌升一級。
        </Bullet>
        <Bullet>成長值達 100% 升級後歸零，重新累積。</Bullet>
        <Bullet>卡牌成長不產生任何合作女神分潤。</Bullet>
      </Section>

      <Section title="隨機卡牌合成">
        <Bullet>
          合成<strong className="text-foreground">成功</strong>：取得該卡池<strong className="text-foreground">隨機上一級</strong>卡牌。
        </Bullet>
        <Bullet>
          合成<strong className="text-foreground">失敗</strong>：取得<strong className="text-foreground">隨機同級</strong>卡牌，素材不歸還。
        </Bullet>
        <Bullet>
          一般合成<strong className="text-foreground">連續失敗 10 次</strong>，第 10 次觸發<strong className="text-foreground">保底升級</strong>。
        </Bullet>
        <Bullet>合成不產生任何合作女神分潤。</Bullet>
      </Section>

      <Section title="商城道具">
        <Bullet>商城道具<strong className="text-foreground">僅增加合成成功率</strong>，不影響抽卡機率、不提升等級、不改變保底次數。</Bullet>
        <div className="mt-2 space-y-2">
          {SHOP_ITEMS.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2.5 text-sm">
              <span className="font-semibold text-foreground">{i.name}</span>
              <span className="text-xs text-muted-foreground">{i.effect}</span>
              <span className="shrink-0 font-black tabular-nums text-gold">
                {i.pricePoints} 點
              </span>
            </div>
          ))}
        </div>
        <Bullet>購買道具屬於商城消費，不產生合作女神分潤。</Bullet>
      </Section>

      <Section title="合作女神分潤">
        <Bullet>{SPLIT_SOURCE_NOTE}</Bullet>
        <Bullet>{SPLIT_POLICY_NOTE}，平台不公告未核定的固定比例數字。</Bullet>
        <Bullet>合作女神的分潤以新台幣結算，不會發放平台點數。</Bullet>
        <Bullet>原型階段不提供真實提領或真實付款，所有金額皆為 Mock。</Bullet>
      </Section>

      <p className="text-xs text-muted-foreground">
        <span className="demo-chip mr-1.5">Demo</span>
        本頁為介面原型內容，不構成正式服務條款。
      </p>
    </div>
  );
}
