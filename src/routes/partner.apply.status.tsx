import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  APPLICATION_STATUSES,
  REAPPLY_NOTE,
  RESUBMIT_ITEMS,
  applicationById,
  statusTone,
  type ApplicationStatus,
} from "@/data/partner";
import { usePartner } from "@/lib/partner-store";
import { useMode } from "@/components/layout/AppShell";
import { StatusTag } from "@/components/ui/status-tag";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { StateSwitcher, StatePlaceholder, useDemoState } from "@/components/ui/state-demo";

export const Route = createFileRoute("/partner/apply/status")({
  head: () => ({
    meta: [
      { title: "申請進度 — KEEPY" },
      {
        name: "description",
        content: "查看合作申請的審核時間軸、補件說明、核准結果與女神身分開通狀態。（Demo）",
      },
      { property: "og:title", content: "申請進度 — KEEPY" },
      { property: "og:description", content: "從送出到女神身分開通的完整進度追蹤。（Demo）" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApplyStatus,
});

const TIMELINE: { key: string; label: string; statuses: ApplicationStatus[] }[] = [
  { key: "submit", label: "送出申請", statuses: ["已送出", "審核中", "待補件", "已核准", "未通過", "待合約確認", "女神身分已開通"] },
  { key: "review", label: "官方審核", statuses: ["審核中", "待補件", "已核准", "未通過", "待合約確認", "女神身分已開通"] },
  { key: "resubmit", label: "補件（必要時）", statuses: ["待補件"] },
  { key: "approve", label: "核准", statuses: ["已核准", "待合約確認", "女神身分已開通"] },
  { key: "contract", label: "合約確認（Demo）", statuses: ["女神身分已開通"] },
  { key: "unlock", label: "女神身分開通", statuses: ["女神身分已開通"] },
];

function ApplyStatus() {
  const [state, setState] = useDemoState();
  const [confirm, setConfirm] = useState(false);
  const { myStatus, setMyStatus, myApplicationId, confirmContract, contractConfirmed } = usePartner();
  const { setMode, setGoddessEligible } = useMode();
  const { push } = useToast();
  const app = applicationById(myApplicationId);

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-wide">申請進度</h1>
          <span className="demo-chip">Demo</span>
          <StatusTag tone={statusTone(myStatus)} label={myStatus} />
        </div>
        <p className="text-sm text-muted-foreground">
          申請編號 {myApplicationId}
          {app ? `｜送出時間 ${app.submittedAt}｜負責人 ${app.owner}` : ""}
        </p>
      </header>

      {/* Demo 狀態切換：便於檢視各階段畫面 */}
      <div className="panel flex flex-wrap items-center gap-2 px-3 py-2.5">
        <span className="demo-chip">Demo</span>
        <span className="text-[11px] text-muted-foreground">切換申請狀態以檢視畫面</span>
        <div className="flex flex-wrap gap-1.5">
          {APPLICATION_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setMyStatus(s)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                myStatus === s
                  ? "border-primary/50 bg-primary/15 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <StateSwitcher state={state} onChange={setState} />
      {state !== "ok" ? (
        <StatePlaceholder
          state={state}
          emptyTitle="尚無申請紀錄"
          emptyDescription="填寫並送出合作申請後，這裡會顯示審核進度。"
        />
      ) : (
        <>
          {/* 時間軸 */}
          <section className="panel p-5">
            <h2 className="font-black">流程時間軸</h2>
            <ol className="mt-4 space-y-4">
              {TIMELINE.map((t) => {
                const done = t.statuses.includes(myStatus);
                const skipped = t.key === "resubmit" && !done;
                const inProgress =
                  !done && t.key === "contract" && myStatus === "待合約確認";
                return (
                  <li key={t.key} className="flex gap-3">
                    <span
                      className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-black ${
                        done
                          ? "bg-primary text-primary-foreground"
                          : inProgress
                            ? "border border-gold/60 bg-gold/15 text-gold"
                            : "border border-border text-muted-foreground"
                      }`}
                    >
                      {done ? "✓" : inProgress ? "…" : "・"}
                    </span>
                    <div>
                      <p className={`text-sm font-bold ${done ? "" : "text-muted-foreground"}`}>
                        {t.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {done
                          ? "已完成（Demo）"
                          : inProgress
                            ? "待確認（進行中）"
                            : skipped
                              ? "本次未需補件"
                              : "尚未進行"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {myStatus === "草稿" && (
            <section className="panel p-5">
              <h2 className="font-black">申請尚未送出</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">草稿已自動儲存（Demo），可回到申請表繼續填寫。</p>
              <Link
                to="/partner/apply"
                className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                繼續填寫申請
              </Link>
            </section>
          )}

          {myStatus === "待補件" && (
            <section className="panel space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-black">官方補件說明</h2>
                <StatusTag tone="pending" label="待補件" />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {app?.resubmitNote ??
                  "請補充可公開驗證的社群連結與代表作（Mock）。本流程不會要求身分證或任何真實證件。"}
              </p>
              <p className="text-sm text-muted-foreground">
                補件期限：{app?.resubmitDue ?? "Demo／待定"}
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {RESUBMIT_ITEMS.map((r) => (
                  <li key={r}>・{r}</li>
                ))}
              </ul>
              <Link
                to="/partner/apply"
                className="inline-block rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                更新資料（Demo）
              </Link>
            </section>
          )}

          {myStatus === "未通過" && (
            <section className="panel space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-black">審核結果：未通過</h2>
                <StatusTag tone="danger" label="未通過" />
              </div>
              <p className="text-sm text-muted-foreground">
                原因分類：公開社群資料不足，無法確認經營狀況（Demo 分類，非個人評價）。
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">{REAPPLY_NOTE}</p>
              <Link
                to="/partner/apply"
                className="inline-block rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                調整資料後再次申請
              </Link>
            </section>
          )}

          {(myStatus === "已核准" || myStatus === "待合約確認") && (
            <section className="panel hairline-gold space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-black">合約確認（Demo）</h2>
                <StatusTag tone="gold" label={myStatus} />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                審核已核准。完成 Demo 合約確認後，同一帳號才會新增女神身分；在此之前女神後台仍為無權限狀態。
                實際分潤比例依合作合約，介面不顯示未核定比例；原型不進行真實電子簽署。
              </p>
              <button
                onClick={() => setConfirm(true)}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                進行合約確認（Demo）
              </button>
            </section>
          )}

          {myStatus === "女神身分已開通" && (
            <section className="panel hairline-gold space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-black">女神身分已開通</h2>
                <StatusTag tone="live" label="合作中" />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                同一帳號已新增女神身分，玩家卡冊、點數與帳號資料完全不變，可隨時在上方切換玩家／女神模式。
                {contractConfirmed ? "（本次由 Demo 合約確認完成）" : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/goddess/dashboard"
                  onClick={() => {
                    setGoddessEligible(true);
                    setMode("goddess");
                  }}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                >
                  前往女神後台
                </Link>
                <Link
                  to="/app"
                  onClick={() => setMode("player")}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  回到玩家中心
                </Link>
              </div>
            </section>
          )}

          {app && (
            <section className="panel p-5">
              <h2 className="font-black">審核紀錄</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {app.logs.map((l, i) => (
                  <li key={i} className="flex flex-wrap gap-2 border-b border-border/50 pb-2 last:border-0">
                    <span className="tabular-nums text-muted-foreground">{l.at}</span>
                    <span className="font-semibold">{l.by}</span>
                    <span className="text-primary">{l.action}</span>
                    {l.note && <span className="text-muted-foreground">{l.note}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirm}
        title="合約確認（Demo）"
        description="確認後同帳號將新增女神身分，並可進入女神後台。原型不進行真實電子簽署，也不產生法律效力或任何款項。"
        confirmLabel="模擬確認合約"
        tone="gold"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          confirmContract();
          setGoddessEligible(true);
          push({
            title: "女神身分已開通（Demo）",
            description: "可於 Header 切換為女神模式。",
            tone: "gold",
          });
        }}
      />
    </div>
  );
}
