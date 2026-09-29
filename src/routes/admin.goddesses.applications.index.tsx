import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { APPLICATION_STATUSES, CONTENT_TYPES, statusTone } from "@/data/partner";
import { usePartner } from "@/lib/partner-store";
import { DataTable } from "@/components/ui/data-table";
import { StatusTag } from "@/components/ui/status-tag";
import { EmptyState } from "@/components/ui/empty-state";
import { StateSwitcher, StatePlaceholder, useDemoState } from "@/components/ui/state-demo";

export const Route = createFileRoute("/admin/goddesses/applications/")({
  head: () => ({
    meta: [
      { title: "合作申請管理 — CU 女神卡管理後台" },
      {
        name: "description",
        content: "依狀態、送出日期、內容類型、負責人與關鍵字篩選合作女神申請案件。（Demo）",
      },
      { property: "og:title", content: "合作申請管理 — CU 女神卡管理後台" },
      { property: "og:description", content: "申請編號、藝名、社群摘要、完整度與審核狀態一覽。（Demo）" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminApplications,
});

const inputCls =
  "w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs outline-none focus:border-primary/60";

function AdminApplications() {
  const [state, setState] = useDemoState();
  const { applications } = usePartner();
  const [status, setStatus] = useState("all");
  const [content, setContent] = useState("all");
  const [owner, setOwner] = useState("all");
  const [since, setSince] = useState("");
  const [q, setQ] = useState("");

  const owners = Array.from(new Set(applications.map((a) => a.owner)));

  const rows = applications.filter((a) => {
    if (status !== "all" && a.status !== status) return false;
    if (content !== "all" && !a.contentTypes.includes(content)) return false;
    if (owner !== "all" && a.owner !== owner) return false;
    if (since && a.submittedAt.slice(0, 10) < since) return false;
    if (q.trim()) {
      const key = `${a.id}${a.stageName}${a.displayName}${a.contentTypes.join("")}`.toLowerCase();
      if (!key.includes(q.trim().toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-wide">合作申請管理</h1>
          <span className="demo-chip">Demo</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          共 {applications.length} 筆申請；所有審核操作僅改變本地 Mock 狀態，不寄出通知、不建立真實合作。
        </p>
      </header>

      <StateSwitcher state={state} onChange={setState} />
      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="沒有符合條件的申請" emptyDescription="調整篩選條件再試。" />
      ) : (
        <>
          <section className="panel grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <label className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground">狀態</span>
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">全部</option>
                {APPLICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground">送出日期（起）</span>
              <input type="date" className={inputCls} value={since} onChange={(e) => setSince(e.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground">內容類型</span>
              <select className={inputCls} value={content} onChange={(e) => setContent(e.target.value)}>
                <option value="all">全部</option>
                {CONTENT_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground">負責人</span>
              <select className={inputCls} value={owner} onChange={(e) => setOwner(e.target.value)}>
                <option value="all">全部</option>
                {owners.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground">關鍵字</span>
              <input
                className={inputCls}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="申請編號、藝名…"
              />
            </label>
          </section>

          <DataTable
            columns={[
              { key: "id", label: "申請編號" },
              { key: "name", label: "藝名" },
              { key: "socials", label: "社群摘要" },
              { key: "content", label: "內容類型" },
              { key: "complete", label: "完整度", className: "text-right" },
              { key: "status", label: "狀態" },
              { key: "owner", label: "負責人" },
              { key: "time", label: "送出／更新" },
            ]}
            rows={rows.map((a) => ({
              id: (
                <Link
                  to="/admin/goddesses/applications/$id"
                  params={{ id: a.id }}
                  className="font-mono text-xs font-bold text-primary hover:underline"
                >
                  {a.id}
                </Link>
              ),
              name: (
                <span className="font-semibold">
                  {a.stageName}
                  {a.duplicateOf && (
                    <span className="ml-1.5 align-middle">
                      <StatusTag tone="danger" label="疑似重複" />
                    </span>
                  )}
                </span>
              ),
              socials: (
                <span className="text-xs text-muted-foreground">
                  {a.socials.map((s) => s.platform).join("、")}（{a.socials.length}）
                </span>
              ),
              content: <span className="text-xs text-muted-foreground">{a.contentTypes.join("、")}</span>,
              complete: (
                <span
                  className={`tabular-nums font-semibold ${a.completeness < 70 ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {a.completeness}%
                </span>
              ),
              status: <StatusTag tone={statusTone(a.status)} label={a.status} />,
              owner: <span className="text-xs text-muted-foreground">{a.owner}</span>,
              time: (
                <span className="block text-[11px] tabular-nums text-muted-foreground">
                  {a.submittedAt}
                  <br />
                  {a.updatedAt}
                </span>
              ),
            }))}
            empty={<EmptyState icon="◇" title="沒有符合條件的申請" description="調整篩選條件再試。" />}
          />
        </>
      )}
    </div>
  );
}
