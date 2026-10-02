import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { poolById, goddessById } from "@/data/mock";
import { ADMIN_PERMISSION_NOTE, ADMIN_USER, poolMeta } from "@/data/admin";
import { StatCard } from "@/components/ui/stat-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { StateSwitcher, StatePlaceholder, useDemoState } from "@/components/ui/state-demo";

export const Route = createFileRoute("/admin/pools/$poolId/")({
  head: () => ({
    meta: [
      { title: "卡池營運 — KEEPY管理後台" },
      { name: "description", content: "單一卡池的營運資訊、草稿與發布狀態、預覽與發布確認骨架。（Demo）" },
      { property: "og:title", content: "卡池營運 — KEEPY管理後台" },
      { property: "og:description", content: "單一卡池的營運資訊、草稿與發布狀態、預覽與發布確認骨架。（Demo）" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPoolOverview,
});

function AdminPoolOverview() {
  const { poolId } = Route.useParams();
  const [state, setState] = useDemoState();
  const [confirm, setConfirm] = useState(false);
  const { push } = useToast();
  const pool = poolById(poolId)!;
  const meta = poolMeta(poolId);

  return (
    <div className="space-y-5">
      <StateSwitcher state={state} onChange={setState} />
      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="此卡池尚無設定" emptyDescription="先建立抽卡與合成設定草稿。" />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="卡牌數" value={pool.cardCount} sub="卡池內卡面總數" />
            <StatCard label="單抽／十連" value={`${pool.singlePricePoints}／${pool.tenPricePoints}`} sub="點數（Demo）" tone="violet" />
            <StatCard label="抽卡範圍" value="單一卡池" sub="V1 僅啟用 single_pool" />
            <StatCard label="設定版本" value={`${meta.drawSettingsVersion}／${meta.synthesisSettingsVersion}`} sub="抽卡／合成" tone="gold" />
          </section>

          <section className="panel space-y-2 p-5 text-sm leading-relaxed text-muted-foreground">
            <p className="font-black text-foreground">卡池資訊</p>
            <p>期間：<span className="tabular-nums">{pool.startAt} ～ {pool.endAt}</span></p>
            <p>參與女神：{pool.goddessIds.map((g) => goddessById(g)?.name ?? g).join("、")}</p>
            <p>保底：{pool.pityNote.join("　")}</p>

          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/admin/pools/$poolId/draw-settings"
              params={{ poolId }}
              className="panel p-5 transition-colors hover:bg-muted/40"
            >
              <p className="font-black">抽卡機率設定</p>
              <p className="mt-1 text-sm text-muted-foreground">十級機率、等級啟用、卡牌抽取範圍與同等級權重。</p>
            </Link>
            <Link
              to="/admin/pools/$poolId/synthesis-settings"
              params={{ poolId }}
              className="panel p-5 transition-colors hover:bg-muted/40"
            >
              <p className="font-black">合成條件設定</p>
              <p className="mt-1 text-sm text-muted-foreground">素材張數、同卡池同等級限制、基礎成功率與保底次數。</p>
            </Link>
          </section>

          <section className="panel space-y-3 p-5">
            <p className="text-xs text-muted-foreground">
              權限：{ADMIN_USER.permissions.join("、")}｜受限：{ADMIN_USER.restricted.join("、")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/pools/$poolId"
                params={{ poolId }}
                className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                預覽前台卡池頁
              </Link>
              <button
                onClick={() => push({ title: "已儲存草稿（Demo）", description: "草稿不會影響前台資料。" })}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                儲存草稿（Demo）
              </button>
              <button
                onClick={() => setConfirm(true)}
                className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-ink hover:bg-gold/90"
              >
                發布（Demo）
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">{ADMIN_PERMISSION_NOTE}</p>
          </section>
        </>
      )}

      <ConfirmDialog
        open={confirm}
        title="發布卡池設定（Demo）"
        description="此原型不會真的發布，也不會改動前台卡池或玩家紀錄。"
        confirmLabel="模擬發布"
        tone="gold"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          push({ title: "已模擬發布（Demo）", description: "前台資料未變更。", tone: "gold" });
        }}
      />
    </div>
  );
}
