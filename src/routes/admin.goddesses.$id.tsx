import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SUSPEND_DEMO_NOTE, partnerGoddessById } from "@/data/partner";
import { SPLIT_POLICY_NOTE } from "@/data/mock";
import { StatusTag } from "@/components/ui/status-tag";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { StateSwitcher, StatePlaceholder, useDemoState } from "@/components/ui/state-demo";

export const Route = createFileRoute("/admin/goddesses/$id")({
  head: () => ({
    meta: [
      { title: "合作女神詳情 — CU 女神卡管理後台" },
      {
        name: "description",
        content: "合作女神的合作狀態、參與卡池、卡牌數、合約版本與 Demo 狀態操作。",
      },
      { property: "og:title", content: "合作女神詳情 — CU 女神卡管理後台" },
      { property: "og:description", content: "合作狀態與卡池指派一覽，暫停與結束僅為 Demo 狀態。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminGoddessDetail,
});

function AdminGoddessDetail() {
  const { id } = Route.useParams();
  const [state, setState] = useDemoState();
  const [action, setAction] = useState<"suspend" | "end" | "resume" | null>(null);
  const { push } = useToast();
  const g = partnerGoddessById(id);

  if (!g) {
    return (
      <EmptyState
        icon="◇"
        title="找不到此女神資料"
        description="資料可能已變更或不存在。"
        action={
          <Link
            to="/admin/goddesses"
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            回到女神名單
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <Link to="/admin/goddesses" className="text-xs font-semibold text-primary hover:underline">
          ← 女神名單
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-wide">{g.name}</h1>
          <span className="text-sm text-muted-foreground">{g.title}</span>
          <StatusTag
            tone={g.status === "合作中" ? "live" : g.status === "待合約" ? "gold" : g.status === "暫停合作" ? "pending" : "resting"}
            label={g.status}
          />
          <span className="demo-chip">Demo</span>
        </div>
        <p className="text-sm text-muted-foreground">
          合作起始 {g.since}｜負責人 {g.owner}｜公開頁{g.publicPage ? "已上線" : "未上線"}
        </p>
      </header>

      <StateSwitcher state={state} onChange={setState} />
      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="尚無合作資料" emptyDescription="合作建立後才會顯示卡池與卡牌資訊。" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <StatCard label="女神後台" value={g.backstage} />
            <StatCard label="參與卡池" value={String(g.pools.length)} sub={g.pools.join("、") || "尚未指派"} />
            <StatCard label="卡牌數" value={String(g.cardCount)} tone="violet" />
            <StatCard label="合約版本" value={g.contractVersion} tone="gold" />
          </div>

          <section className="panel space-y-2 p-5 text-sm text-muted-foreground">
            <h2 className="font-black text-foreground">分潤說明</h2>
            <p>{SPLIT_POLICY_NOTE}；本介面不提供分潤比例設定，也不顯示未核定比例。</p>
            <p>僅玩家以現金或付費點數完成抽卡的實際消費會產生分潤；分潤一律以新台幣計算。</p>
          </section>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/goddesses/$goddessId"
              params={{ goddessId: "g-yoru" }}
              className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              查看公開頁（Demo）
            </Link>
            {g.status === "暫停合作" ? (
              <button
                onClick={() => setAction("resume")}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                恢復合作（Demo）
              </button>
            ) : (
              <button
                onClick={() => setAction("suspend")}
                className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                暫停合作（Demo）
              </button>
            )}
            <button
              onClick={() => setAction("end")}
              className="rounded-xl border border-destructive/50 px-4 py-2 text-sm font-bold text-destructive hover:bg-destructive/10"
            >
              結束合作（Demo）
            </button>
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">{SUSPEND_DEMO_NOTE}</p>
        </>
      )}

      <ConfirmDialog
        open={action !== null}
        title={
          action === "end" ? "結束合作（Demo）" : action === "resume" ? "恢復合作（Demo）" : "暫停合作（Demo）"
        }
        description={`${g.name}。此操作僅改變本地 Mock 狀態，不會刪除女神資料、卡牌或玩家既有卡冊，也不影響既有分潤紀錄。`}
        confirmLabel="模擬執行"
        tone={action === "end" ? "danger" : "violet"}
        onCancel={() => setAction(null)}
        onConfirm={() => {
          setAction(null);
          push({ title: "已模擬變更合作狀態（Demo）", description: "原型不會真的改動資料。" });
        }}
      />
    </div>
  );
}
