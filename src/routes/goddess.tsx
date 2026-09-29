import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useMode } from "@/components/layout/AppShell";
import { SubNav } from "@/components/layout/SubNav";
import { EmptyState } from "@/components/ui/empty-state";
import { SETTLE_DEMO_NOTE } from "@/data/goddess-backstage";

export const Route = createFileRoute("/goddess")({
  component: GoddessLayout,
});

const ITEMS = [
  { to: "/goddess", label: "總覽", exact: true },
  { to: "/goddess/dashboard", label: "儀表板" },
  { to: "/goddess/revenue", label: "收益與分潤" },
  { to: "/goddess/contracts", label: "數位合約" },
  { to: "/goddess/profile", label: "公開資料" },
];

function GoddessLayout() {
  const { mode, setMode, goddessEligible, setGoddessEligible } = useMode();

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* ── 身分與權限列 ── */}
      <div className="panel flex flex-wrap items-center gap-2 px-3 py-2.5 text-xs">
        <span className="demo-chip">Demo</span>
        <span className="text-muted-foreground">
          同一帳號身分：玩家
          {goddessEligible ? " ＋ 女神" : "（尚無女神資格）"}
          ｜目前模式：{mode === "goddess" ? "女神模式" : "玩家模式"}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {mode !== "goddess" && (
            <button
              onClick={() => setMode("goddess")}
              className="rounded-full border border-gold/40 px-3 py-1 font-bold text-gold hover:bg-gold/10"
            >
              切換為女神模式
            </button>
          )}
          <button
            onClick={() => setGoddessEligible(!goddessEligible)}
            className="rounded-full border border-border px-3 py-1 font-semibold text-muted-foreground hover:text-foreground"
          >
            {goddessEligible ? "模擬無女神資格" : "還原女神資格"}
          </button>
        </div>
      </div>

      {goddessEligible ? (
        <>
          <SubNav items={ITEMS} />
          <Outlet />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {SETTLE_DEMO_NOTE}
          </p>
        </>
      ) : (
        <EmptyState
          icon="⌁"
          title="無權限進入女神後台（Permission Denied・Demo）"
          description="此帳號目前只有玩家身分。通過合作審核後，同一帳號將增加女神身分，玩家卡冊、點數與帳號資料不變。"
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setGoddessEligible(true)}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                申請女神合作（Demo）
              </button>
              <Link
                to="/rules"
                className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                查看合作與分潤規則
              </Link>
            </div>
          }
        />
      )}
    </div>
  );
}
