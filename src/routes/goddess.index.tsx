import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GODDESSES,
  SPLIT_POLICY_NOTE,
  SPLIT_SOURCE_NOTE,
  GRADE_GRADIENT,
} from "@/data/mock";
import {
  COOP,
  NON_ELIGIBLE_ACTIONS,
  REVENUE_CURRENCY_NOTE,
  goddessSelf,
  sumShare,
} from "@/data/goddess-backstage";
import { StatCard } from "@/components/ui/stat-card";
import { StatusTag } from "@/components/ui/status-tag";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { useMode } from "@/components/layout/AppShell";

export const Route = createFileRoute("/goddess/")({
  head: () => ({
    meta: [
      { title: "女神後台總覽 — CU 女神卡" },
      { name: "description", content: "合作女神後台總覽：合作狀態、分潤來源與新台幣收益摘要。（Demo）" },
      { property: "og:title", content: "女神後台總覽 — CU 女神卡" },
      { property: "og:description", content: "合作女神後台總覽：合作狀態、分潤來源與新台幣收益摘要。（Demo）" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GoddessOverview,
});

function GoddessOverview() {
  const { setMode } = useMode();
  const self = goddessSelf();

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-black tracking-wide">女神後台</h1>
            <span className="demo-chip">Demo</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {REVENUE_CURRENCY_NOTE}所有金額皆為 Mock 示意。
          </p>
        </div>
        <button
          onClick={() => setMode("player")}
          className="shrink-0 rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          ← 切回玩家模式
        </button>
      </header>

      <section className="panel flex flex-wrap items-center gap-4 p-5">
        <div className={`card-frame w-16 shrink-0 ${GRADE_GRADIENT[self.grade]}`}>
          <div className="absolute inset-0 bg-ink/30" />
          <span className="absolute bottom-1.5 left-1.5 text-base font-black drop-shadow">
            {self.name[0]}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black">{self.name}</p>
            <RarityBadge rarity={self.grade} />
            <StatusTag tone="live" label={COOP.status} />
          </div>
          <p className="truncate text-xs text-muted-foreground">{self.title}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            合作起始 {COOP.since}｜合約 {COOP.contractVersion}｜{SPLIT_POLICY_NOTE}
          </p>
        </div>
        <Link
          to="/goddess/dashboard"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          進入儀表板
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="可結算分潤" value={`NT$ ${sumShare("可結算").toLocaleString()}`} sub="Demo" tone="gold" />
        <StatCard label="待結算分潤" value={`NT$ ${sumShare("待結算").toLocaleString()}`} sub="結算期尚未截止" tone="violet" />
        <StatCard label="累積已結算" value={`NT$ ${sumShare("已結算").toLocaleString()}`} sub="歷史紀錄合計" />
        <StatCard label="有效付費抽卡" value={COOP.paidDrawCount.toLocaleString()} sub="分潤唯一來源" />
      </section>

      <section className="panel hairline-gold p-5">
        <h2 className="font-black">分潤規則</h2>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p className="flex gap-2"><span className="text-gold">◆</span>{SPLIT_SOURCE_NOTE}</p>
          <p className="flex gap-2">
            <span className="text-gold">◆</span>
            <span>
              <strong className="text-foreground">{SPLIT_POLICY_NOTE}</strong>
              ；平台不於介面顯示任何未核定的固定比例。
            </span>
          </p>
          <p className="flex gap-2"><span className="text-gold">◆</span>{REVENUE_CURRENCY_NOTE}</p>
          <p className="flex gap-2"><span className="text-gold">◆</span>原型階段不提供真實提領或真實付款流程，僅顯示結算狀態。</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {NON_ELIGIBLE_ACTIONS.map((a) => (
            <span key={a} className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
              {a}：不產生分潤
            </span>
          ))}
        </div>
        <Link to="/rules" className="mt-4 inline-block text-xs font-semibold text-primary hover:underline">
          查看完整規則 →
        </Link>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-black tracking-wide">平台合作女神</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GODDESSES.slice(0, 4).map((g) => (
            <div key={g.id} className="panel flex items-center gap-4 p-4">
              <div className={`card-frame w-14 shrink-0 ${GRADE_GRADIENT[g.grade]}`}>
                <div className="absolute inset-0 bg-ink/30" />
                <span className="absolute bottom-1.5 left-1.5 text-sm font-black drop-shadow">{g.name[0]}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-black">{g.name}</p>
                  <RarityBadge rarity={g.grade} />
                </div>
                <p className="truncate text-xs text-muted-foreground">{g.title}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <StatusTag tone={g.status === "live" ? "live" : g.status === "pending" ? "pending" : "resting"} />
                  <span className="text-[11px] text-muted-foreground">{SPLIT_POLICY_NOTE}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
