import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GRADE_GRADIENT } from "@/data/mock";
import {
  GODDESS_PROFILE_DRAFT,
  PROFILE_MATERIALS,
  goddessSelf,
} from "@/data/goddess-backstage";
import { StatusTag } from "@/components/ui/status-tag";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { StateSwitcher, StatePlaceholder, useDemoState } from "@/components/ui/state-demo";

export const Route = createFileRoute("/goddess/profile")({
  head: () => ({
    meta: [
      { title: "公開資料與素材 — KEEPY" },
      { name: "description", content: "女神公開資料、社群連結、形象圖與卡牌素材狀態，全部為 Mock。" },
      { property: "og:title", content: "公開資料與素材 — KEEPY" },
      { property: "og:description", content: "女神公開資料、社群連結、形象圖與卡牌素材狀態，全部為 Mock。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GoddessProfilePage,
});

function GoddessProfilePage() {
  const [state, setState] = useDemoState();
  const self = goddessSelf();
  const [name, setName] = useState(GODDESS_PROFILE_DRAFT.displayName);
  const [title, setTitle] = useState(GODDESS_PROFILE_DRAFT.title);
  const [intro, setIntro] = useState(GODDESS_PROFILE_DRAFT.intro);
  const [links, setLinks] = useState(GODDESS_PROFILE_DRAFT.links.map((l) => l.url));
  const [confirm, setConfirm] = useState(false);
  const { push } = useToast();

  const dirty =
    name !== GODDESS_PROFILE_DRAFT.displayName ||
    title !== GODDESS_PROFILE_DRAFT.title ||
    intro !== GODDESS_PROFILE_DRAFT.intro ||
    links.some((l, i) => l !== GODDESS_PROFILE_DRAFT.links[i]!.url);

  return (
    <div className="space-y-5">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black tracking-wide">公開資料與素材</h1>
            <span className="demo-chip">Demo</span>
            {dirty && <StatusTag tone="pending" label="有未儲存變更" />}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            送審與上架流程皆為 Mock，不會變更前台女神公開頁。
          </p>
        </div>
        <Link
          to="/goddesses/$goddessId"
          params={{ goddessId: self.id }}
          className="shrink-0 rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          預覽公開頁
        </Link>
      </header>

      <StateSwitcher state={state} onChange={setState} />
      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="尚無公開資料" emptyDescription="完成合作審核後即可編輯公開資料與素材。" />
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="panel p-4">
              <div className={`card-frame w-full ${GRADE_GRADIENT[self.grade]}`}>
                <div className="absolute inset-0 bg-ink/25" />
                <div className="absolute bottom-2 left-2 flex items-center gap-2">
                  <span className="text-sm font-black drop-shadow">{name}</span>
                  <RarityBadge rarity={self.grade} />
                </div>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                主視覺形象圖（漸層暫用圖）。上傳與裁切為 Demo。
              </p>
              <button
                onClick={() => push({ title: "已開啟上傳視窗（Demo）", description: "原型不會真的上傳檔案。" })}
                className="mt-2 w-full rounded-xl border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                更換形象圖（Demo）
              </button>
            </div>

            <div className="panel space-y-3 p-5">
              <label className="block text-xs text-muted-foreground">
                公開名稱
                <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground" />
              </label>
              <label className="block text-xs text-muted-foreground">
                稱號
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground" />
              </label>
              <label className="block text-xs text-muted-foreground">
                自我介紹
                <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm leading-relaxed text-foreground" />
              </label>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">社群連結（Mock）</p>
                {GODDESS_PROFILE_DRAFT.links.map((l, i) => (
                  <div key={l.label} className="grid grid-cols-[92px_minmax(0,1fr)] items-center gap-2">
                    <span className="text-xs text-muted-foreground">{l.label}</span>
                    <input
                      value={links[i]}
                      onChange={(e) =>
                        setLinks((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))
                      }
                      className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => setConfirm(true)}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                >
                  送審變更（Demo）
                </button>
                <button
                  onClick={() => {
                    setName(GODDESS_PROFILE_DRAFT.displayName);
                    setTitle(GODDESS_PROFILE_DRAFT.title);
                    setIntro(GODDESS_PROFILE_DRAFT.intro);
                    setLinks(GODDESS_PROFILE_DRAFT.links.map((l) => l.url));
                  }}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  還原
                </button>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-black tracking-wide">形象圖與卡牌素材狀態</h2>
            <DataTable
              columns={[
                { key: "name", label: "素材" },
                { key: "spec", label: "規格" },
                { key: "updated", label: "更新時間" },
                { key: "status", label: "狀態", className: "text-right" },
              ]}
              rows={PROFILE_MATERIALS.map((m) => ({
                name: <span className="font-medium">{m.name}</span>,
                spec: <span className="text-muted-foreground">{m.spec}</span>,
                updated: <span className="tabular-nums text-muted-foreground">{m.updatedAt}</span>,
                status: (
                  <StatusTag
                    tone={m.status === "已通過" ? "live" : m.status === "審核中" ? "pending" : "danger"}
                    label={m.status}
                  />
                ),
              }))}
            />
          </section>
        </>
      )}

      <ConfirmDialog
        open={confirm}
        title="送審公開資料變更（Demo）"
        description="原型不會真的送審或變更前台公開頁，僅示範流程與狀態。"
        confirmLabel="送出（Demo）"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          push({ title: "已送審（Demo）", description: "變更不會套用到前台。", tone: "gold" });
        }}
      />
    </div>
  );
}
