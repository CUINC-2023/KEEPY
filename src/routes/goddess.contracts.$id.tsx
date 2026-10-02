import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SPLIT_POLICY_NOTE } from "@/data/mock";
import { SETTLE_DEMO_NOTE, contractById } from "@/data/goddess-backstage";
import { StatusTag } from "@/components/ui/status-tag";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { StateSwitcher, StatePlaceholder, useDemoState } from "@/components/ui/state-demo";

export const Route = createFileRoute("/goddess/contracts/$id")({
  head: () => ({
    meta: [
      { title: "合約詳情 — KEEPY" },
      { name: "description", content: "合約版本、有效期間、條款內容與簽署狀態。簽署與下載皆為 Demo。" },
      { property: "og:title", content: "合約詳情 — KEEPY" },
      { property: "og:description", content: "合約版本、有效期間、條款內容與簽署狀態。簽署與下載皆為 Demo。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContractDetail,
});

function ContractDetail() {
  const { id } = Route.useParams();
  const [state, setState] = useDemoState();
  const [confirm, setConfirm] = useState(false);
  const { push } = useToast();
  const contract = contractById(id);

  if (!contract) {
    return (
      <EmptyState
        icon="◇"
        title="找不到此合約"
        description="合約可能已改版或不存在。"
        action={
          <Link to="/goddess/contracts" className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
            回到合約列表
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <Link to="/goddess/contracts" className="text-xs font-semibold text-primary hover:underline">
          ← 數位合約
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-wide">{contract.title}</h1>
          <span className="font-mono text-xs text-muted-foreground">{contract.version}</span>
          <StatusTag
            tone={contract.status === "已簽署" ? "live" : contract.status === "待簽署" ? "pending" : "resting"}
            label={contract.status}
          />
          <span className="demo-chip">Demo</span>
        </div>
        <p className="text-sm tabular-nums text-muted-foreground">
          有效期間 {contract.effectiveFrom} ～ {contract.effectiveTo}
          {contract.signedAt ? `｜簽署日 ${contract.signedAt}` : ""}｜適用卡池：{contract.scope.join("、")}
        </p>
      </header>

      <StateSwitcher state={state} onChange={setState} />
      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="合約內容尚未提供" emptyDescription="條款內容將於合作審核完成後提供。" />
      ) : (
        <>
          <section className="panel divide-y divide-border/60 p-0">
            {contract.sections.map((s) => (
              <div key={s.heading} className="p-5">
                <h2 className="font-black">{s.heading}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </section>

          <section className="panel hairline-gold p-4 text-sm text-muted-foreground">
            <strong className="text-foreground">{SPLIT_POLICY_NOTE}</strong>
            ；本頁不顯示任何未核定的固定比例。分潤一律以新台幣顯示，不發放平台點數。
          </section>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setConfirm(true)}
              disabled={contract.status !== "待簽署"}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              簽署合約（Demo）
            </button>
            <button
              onClick={() => push({ title: "已產生合約檔（Demo）", description: "原型不提供真實下載或法律效力文件。" })}
              className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              下載合約（Demo）
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">{SETTLE_DEMO_NOTE}</p>
        </>
      )}

      <ConfirmDialog
        open={confirm}
        title="簽署合約（Demo）"
        description={`${contract.title} ${contract.version}。原型不進行真實電子簽署，也不產生法律效力。`}
        confirmLabel="模擬簽署"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          push({ title: "已模擬簽署（Demo）", description: "狀態不會真的改變，僅示範流程。", tone: "gold" });
        }}
      />
    </div>
  );
}
