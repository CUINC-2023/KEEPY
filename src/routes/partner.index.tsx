import { createFileRoute, Link } from "@tanstack/react-router";
import {
  PARTNER_FLOW,
  PARTNER_INCENTIVES,
  PARTNER_SPLIT_NOTES,
  PARTNER_TBD,
} from "@/data/partner";
import { StateSwitcher, StatePlaceholder, useDemoState } from "@/components/ui/state-demo";

export const Route = createFileRoute("/partner/")({
  head: () => ({
    meta: [
      { title: "女神合作說明 — CU 女神卡" },
      {
        name: "description",
        content:
          "合作女神以卡牌 IP 曝光與付費抽卡新台幣分潤為核心；了解合作流程、分潤來源與申請方式。（Demo）",
      },
      { property: "og:title", content: "女神合作說明 — CU 女神卡" },
      {
        property: "og:description",
        content: "卡牌 IP 曝光與付費抽卡分潤，合作流程從申請到女神身分開通一次看懂。（Demo）",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PartnerIntro,
});

function PartnerIntro() {
  const [state, setState] = useDemoState();

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-wide sm:text-3xl">成為合作女神</h1>
          <span className="demo-chip">Demo</span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          以卡牌形式累積 IP 曝光，並在玩家以現金或付費點數完成抽卡並抽到你的卡牌時，
          依合作合約取得新台幣分潤。
        </p>
      </header>

      <StateSwitcher state={state} onChange={setState} />
      {state !== "ok" ? (
        <StatePlaceholder
          state={state}
          emptyTitle="合作說明尚未提供"
          emptyDescription="合作內容整理中，稍後再回來看看。"
        />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            {PARTNER_INCENTIVES.map((i) => (
              <div key={i.title} className="panel p-4">
                <h2 className="font-black">{i.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{i.desc}</p>
              </div>
            ))}
          </section>

          <section className="panel hairline-gold space-y-2 p-5">
            <h2 className="font-black">分潤來源與計算</h2>
            <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              {PARTNER_SPLIT_NOTES.map((n) => (
                <li key={n} className="flex gap-2">
                  <span className="text-gold">◆</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel p-5">
            <h2 className="font-black">合作流程</h2>
            <ol className="mt-3 space-y-3">
              {PARTNER_FLOW.map((f, i) => (
                <li key={f.step} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-black text-primary ring-1 ring-primary/30">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold">{f.step}</p>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="panel p-5">
            <h2 className="font-black">尚未核定項目（Demo／待定）</h2>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {PARTNER_TBD.map((t) => (
                <li key={t}>・{t}</li>
              ))}
            </ul>
          </section>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/partner/apply"
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              填寫合作申請（Demo）
            </Link>
            <Link
              to="/partner/apply/status"
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              查看申請進度
            </Link>
            <Link
              to="/rules"
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              查看完整遊戲規則
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
