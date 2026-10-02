import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ADMIN_USER } from "@/data/admin";
import { REJECT_REASONS, RESUBMIT_ITEMS, isLikelyUrl, statusTone } from "@/data/partner";
import { SPLIT_POLICY_NOTE } from "@/data/mock";
import { usePartner } from "@/lib/partner-store";
import { StatusTag } from "@/components/ui/status-tag";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { StateSwitcher, StatePlaceholder, useDemoState } from "@/components/ui/state-demo";

export const Route = createFileRoute("/admin/goddesses/applications/$id")({
  head: () => ({
    meta: [
      { title: "申請詳情 — KEEPY管理後台" },
      {
        name: "description",
        content: "申請資料、公開社群、創作類型、素材狀態、規則確認與審核操作紀錄。（Demo）",
      },
      { property: "og:title", content: "申請詳情 — KEEPY管理後台" },
      { property: "og:description", content: "開始審核、要求補件、核准與未通過皆為 Demo 操作。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApplicationDetail,
});

type Act = "start" | "resubmit" | "approve" | "reject" | "contract" | null;

const inputCls =
  "w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm outline-none focus:border-primary/60";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel space-y-2 p-5">
      <h2 className="font-black">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-border/50 py-1.5 text-sm last:border-0">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0">{value}</span>
    </div>
  );
}

function ApplicationDetail() {
  const { id } = Route.useParams();
  const [state, setState] = useDemoState();
  const [act, setAct] = useState<Act>(null);
  const [reasonCat, setReasonCat] = useState(REJECT_REASONS[0]!);
  const [note, setNote] = useState("");
  const { push } = useToast();
  const { byId, review } = usePartner();
  const app = byId(id);

  if (!app) {
    return (
      <EmptyState
        icon="◇"
        title="找不到此申請案件"
        description="申請編號可能已變更或不存在。"
        action={
          <Link
            to="/admin/goddesses/applications"
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            回到申請列表
          </Link>
        }
      />
    );
  }

  const badLinks = app.socials.filter((s) => !isLikelyUrl(s.url));
  const needNote = act === "resubmit" || act === "reject";
  const noPermission = state === "denied";

  const doAct = () => {
    if (!act) return;
    if (act === "start") {
      review(app.id, "審核中", { by: ADMIN_USER.name, action: "開始審核", note: note || "指派負責人並檢視資料" });
    } else if (act === "resubmit") {
      review(app.id, "待補件", { by: ADMIN_USER.name, action: "要求補件", note }, { resubmitNote: note, resubmitDue: "Demo／待定" });
    } else if (act === "approve") {
      review(app.id, "待合約確認", { by: ADMIN_USER.name, action: "核准", note: note || "進入合約確認（Demo），尚未開通女神身分" });
    } else if (act === "reject") {
      review(app.id, "未通過", { by: ADMIN_USER.name, action: "未通過", note: `${reasonCat}${note ? `｜${note}` : ""}` }, { rejectReason: reasonCat });
    } else if (act === "contract") {
      review(app.id, "女神身分已開通", { by: ADMIN_USER.name, action: "合約確認（Demo）", note: "建立合作女神檔案並開通女神角色（Demo）" });
    }
    setAct(null);
    setNote("");
    push({ title: "已更新申請狀態（Demo）", description: "僅改變本地 Mock，不會建立真實合作。" });
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <Link to="/admin/goddesses/applications" className="text-xs font-semibold text-primary hover:underline">
          ← 申請管理
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-wide">{app.stageName}</h1>
          <span className="font-mono text-xs text-muted-foreground">{app.id}</span>
          <StatusTag tone={statusTone(app.status)} label={app.status} />
          <span className="demo-chip">Demo</span>
        </div>
        <p className="text-sm text-muted-foreground">
          送出 {app.submittedAt}｜更新 {app.updatedAt}｜負責人 {app.owner}｜完整度 {app.completeness}%
        </p>
      </header>

      <StateSwitcher state={state} onChange={setState} />
      {state !== "ok" ? (
        <StatePlaceholder
          state={state}
          emptyTitle="此申請尚無資料"
          emptyDescription="申請人可能仍在草稿階段。"
        />
      ) : (
        <>
          {/* 警示 */}
          <div className="space-y-2">
            {app.duplicateOf && (
              <div className="panel border-destructive/40 p-3 text-xs font-semibold text-destructive">
                重複申請提示：偵測到與 {app.duplicateOf} 可能為同一申請人，合併規則待定。
              </div>
            )}
            {app.completeness < 70 && (
              <div className="panel p-3 text-xs font-semibold text-gold">
                資料不完整警示：完整度 {app.completeness}%，建議先要求補件。
              </div>
            )}
            {badLinks.length > 0 && (
              <div className="panel p-3 text-xs font-semibold text-gold">
                社群連結格式檢查：{badLinks.map((b) => b.platform).join("、")} 的連結非 http(s) 格式。
              </div>
            )}
            {!app.ruleAckAll && (
              <div className="panel p-3 text-xs font-semibold text-gold">
                申請人尚未確認全部合作規則項目。
              </div>
            )}
          </div>

          <Section title="申請資料">
            <Row label="藝名" value={app.stageName} />
            <Row label="公開名稱" value={app.displayName} />
            <Row label="所在地區" value={app.region} />
            <Row label="主要語言" value={app.languages.join("、")} />
            <Row label="簡介" value={<span className="leading-relaxed text-muted-foreground">{app.intro}</span>} />
          </Section>

          <Section title="公開社群">
            {app.socials.map((s) => (
              <Row
                key={s.platform}
                label={s.platform}
                value={
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="break-all text-muted-foreground">{s.url}</span>
                    <StatusTag tone={isLikelyUrl(s.url) ? "info" : "danger"} label={isLikelyUrl(s.url) ? "格式正常" : "格式待確認"} />
                    <span className="text-xs text-muted-foreground">粉絲 {s.followers}</span>
                  </span>
                }
              />
            ))}
          </Section>

          <Section title="創作類型與合作意願">
            <Row label="內容類型" value={app.contentTypes.join("、")} />
            <Row label="風格標籤" value={app.styleTags.join("、")} />
            <Row label="拍攝／活動" value={app.shootWilling} />
            <Row label="卡牌主題" value={app.cardThemes.join("、") || "—"} />
            <Row label="過往合作" value={<span className="text-muted-foreground">{app.pastCoop}</span>} />
          </Section>

          <Section title="素材狀態">
            {app.materials.map((m) => (
              <Row
                key={m.label}
                label={m.label}
                value={
                  <StatusTag
                    tone={m.status === "已備齊" ? "live" : m.status === "審核中" ? "info" : "pending"}
                    label={m.status}
                  />
                }
              />
            ))}
            <p className="pt-2 text-[11px] text-muted-foreground">
              素材為 Mock，不含真實檔案；授權範圍於正式合約確認。
            </p>
          </Section>

          <Section title="規則確認與分潤">
            <Row
              label="規則確認"
              value={<StatusTag tone={app.ruleAckAll ? "live" : "pending"} label={app.ruleAckAll ? "全部已確認" : "尚未全部確認"} />}
            />
            <p className="pt-2 text-sm leading-relaxed text-muted-foreground">
              {SPLIT_POLICY_NOTE}；此介面不提供分潤比例設定。僅付費抽卡的實際消費產生分潤，
              合成、成長、商城道具與贈送點數抽卡皆不計入。
            </p>
          </Section>

          <Section title="審核紀錄">
            <ul className="space-y-2 text-sm">
              {app.logs.map((l, i) => (
                <li key={i} className="flex flex-wrap gap-2 border-b border-border/50 pb-2 last:border-0">
                  <span className="tabular-nums text-muted-foreground">{l.at}</span>
                  <span className="font-semibold">{l.by}</span>
                  <span className="text-primary">{l.action}</span>
                  {l.note && <span className="text-muted-foreground">{l.note}</span>}
                </li>
              ))}
            </ul>
          </Section>

          {/* 審核操作 */}
          <section className="panel space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-black">審核操作</h2>
              <span className="demo-chip">Demo</span>
            </div>
            {noPermission ? (
              <p className="text-sm text-muted-foreground">權限不足，無法執行審核操作。</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setAct("start")}
                    disabled={app.status !== "已送出"}
                    className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                  >
                    開始審核
                  </button>
                  <button
                    onClick={() => setAct("resubmit")}
                    disabled={!["已送出", "審核中"].includes(app.status)}
                    className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                  >
                    要求補件
                  </button>
                  <button
                    onClick={() => setAct("approve")}
                    disabled={!["審核中", "待補件", "已核准"].includes(app.status)}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
                  >
                    核准
                  </button>
                  <button
                    onClick={() => setAct("reject")}
                    disabled={!["已送出", "審核中", "待補件"].includes(app.status)}
                    className="rounded-xl border border-destructive/50 px-4 py-2 text-sm font-bold text-destructive hover:bg-destructive/10 disabled:opacity-40"
                  >
                    未通過
                  </button>
                  <button
                    onClick={() => setAct("contract")}
                    disabled={app.status !== "待合約確認"}
                    className="rounded-xl border border-gold/50 px-4 py-2 text-sm font-bold text-gold hover:bg-gold/10 disabled:opacity-40"
                  >
                    合約 Demo 確認並開通女神身分
                  </button>
                </div>

                {act === "reject" && (
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold">未通過原因分類（必填）</span>
                    <select className={inputCls} value={reasonCat} onChange={(e) => setReasonCat(e.target.value)}>
                      {REJECT_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {needNote && (
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold">
                      {act === "resubmit" ? "補件說明（必填）" : "補充說明"}
                      {act === "resubmit" && <span className="ml-1 text-gold">*</span>}
                    </span>
                    <textarea
                      className={`${inputCls} min-h-20`}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={
                        act === "resubmit" ? RESUBMIT_ITEMS.join("；") : "以中性描述說明，避免主觀評語。"
                      }
                    />
                  </label>
                )}

                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  核准後會先進入「待合約確認」，完成 Demo 合約確認才會產生合作女神檔案並開通女神角色。
                  所有操作只改本地 Mock，不寄出通知、不建立真實合作、不設定任何分潤比例。
                </p>
              </>
            )}
          </section>
        </>
      )}

      <ConfirmDialog
        open={act !== null}
        title={
          act === "approve"
            ? "核准此申請（Demo）"
            : act === "reject"
              ? "標記為未通過（Demo）"
              : act === "resubmit"
                ? "要求補件（Demo）"
                : act === "contract"
                  ? "合約確認並開通女神身分（Demo）"
                  : "開始審核（Demo）"
        }
        description={
          act === "approve"
            ? "影響摘要：狀態將變為「待合約確認」；尚不會開通女神身分、不指派卡池、不建立分潤設定。"
            : act === "contract"
              ? "影響摘要：建立合作女神檔案並開通女神角色；玩家卡冊、點數與帳號資料不變。原型不進行真實電子簽署。"
              : act === "reject"
                ? "狀態將變為「未通過」，申請人可調整資料後再次申請。"
                : act === "resubmit"
                  ? "狀態將變為「待補件」，補件說明會顯示給申請人（Demo，不寄出通知）。"
                  : "狀態將變為「審核中」並記錄操作紀錄。"
        }
        confirmLabel={needNote && act === "resubmit" && !note.trim() ? "請先填寫說明" : "模擬執行"}
        tone={act === "reject" ? "danger" : act === "contract" ? "gold" : "violet"}
        onCancel={() => {
          setAct(null);
          setNote("");
        }}
        onConfirm={() => {
          if (act === "resubmit" && !note.trim()) {
            push({ title: "請填寫補件說明", description: "要求補件必須提供原因。" });
            return;
          }
          doAct();
        }}
      />
    </div>
  );
}
