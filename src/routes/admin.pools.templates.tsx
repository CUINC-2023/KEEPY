import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

const TEMPLATE_KEY_MAP: Record<string, "permanent" | "limited" | "collaboration" | "rerun"> = {
  "tpl-permanent": "permanent",
  "tpl-limited": "limited",
  "tpl-collab": "collaboration",
  "tpl-rerun": "rerun",
};
import {
  CREATE_POOL_STEPS,
  POOL_TEMPLATES,
  TEMPLATE_COPY_NOTE,
  type PoolTemplate,
} from "@/data/admin";
import { StatusTag } from "@/components/ui/status-tag";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { StatePlaceholder, StateSwitcher, useDemoState } from "@/components/ui/state-demo";

export const Route = createFileRoute("/admin/pools/templates")({
  head: () => ({
    meta: [
      { title: "卡池建立範本 — KEEPY管理後台" },
      { name: "description", content: "常駐、期間限定、合作企劃與復刻四種卡池建立範本，預覽欄位並以 Demo 草稿建立。" },
      { property: "og:title", content: "卡池建立範本 — KEEPY管理後台" },
      { property: "og:description", content: "四種卡池建立範本與七步建立流程（Demo）。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PoolTemplatesPage,
});

function PoolTemplatesPage() {
  const [state, setState] = useDemoState();
  const [active, setActive] = useState<PoolTemplate>(POOL_TEMPLATES[0]!);
  const [confirm, setConfirm] = useState(false);
  const { push } = useToast();
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-wide">卡池建立範本</h1>
          <span className="demo-chip">Demo</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{TEMPLATE_COPY_NOTE}</p>
      </header>

      <StateSwitcher state={state} onChange={setState} />

      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="尚無可用範本" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {POOL_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t)}
                className={`panel p-4 text-left transition-colors ${
                  active.id === t.id ? "ring-1 ring-primary" : "hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black">{t.name}</p>
                  <StatusTag tone="info" label={t.kindLabel} />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t.summary}</p>
              </button>
            ))}
          </div>

          <section className="panel p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-black tracking-widest text-muted-foreground">
                欄位預覽：{active.name}
              </h2>
              <StatusTag tone="pending" label="草稿（未發布）" />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {active.defaults.map((d) => (
                <div key={d.label} className="rounded-xl bg-muted/40 p-3">
                  <p className="text-[11px] text-muted-foreground">{d.label}</p>
                  <p className="mt-0.5 text-sm font-bold">{d.value}</p>
                </div>
              ))}
            </div>
            <ul className="mt-3 space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
              {active.tbd.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="text-gold">◆</span>
                  {t}
                </li>
              ))}
            </ul>
          </section>

          <section className="panel p-4 sm:p-5">
            <h2 className="text-sm font-black tracking-widest text-muted-foreground">建立流程（7 步）</h2>
            <ol className="mt-3 space-y-2">
              {CREATE_POOL_STEPS.map((s, i) => (
                <li key={s.key} className="flex gap-3 rounded-xl bg-muted/30 p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-black text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{s.label}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setConfirm(true)}
                className="rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground"
              >
                以此範本建立（Demo）
              </button>
              <Link to="/admin/pools" className="text-xs font-bold text-muted-foreground hover:text-foreground">
                回到卡池管理
              </Link>
              <span className="text-[11px] text-muted-foreground">
                機率總和需等於 100%，且啟用且機率大於 0 的等級至少要有 1 張可抽卡牌。
              </span>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              合成規則（已核定）：僅能使用同一卡池、同等級卡牌；連續失敗 10 次保底；合成不產生女神分潤。合成素材張數依各卡池合成設定，尚未核定時顯示 Demo／待定。
            </p>
          </section>
        </>
      )}

      <ConfirmDialog
        open={confirm}
        title={`以「${active.name}」開始建立（Demo）`}
        description={`${TEMPLATE_COPY_NOTE} 將前往七步建立精靈並帶入此範本的結構與示例欄位，所有示例數值皆為 Demo，可自行修改；完成後僅產生未發布草稿。`}
        confirmLabel="前往建立精靈"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          push({
            title: `已帶入「${active.name}」範本`,
            description: "僅複製結構與預設欄位，未發布、不影響前台。",
            tone: "gold",
          });
          navigate({
            to: "/admin/pools/new",
            search: { template: TEMPLATE_KEY_MAP[active.id] ?? "permanent", copy: undefined },
          });
        }}
      />
    </div>
  );
}
