import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { usePlayerCopy } from "@/lib/player-copy";
import { useDemoPlayer, resetDemoPlayer } from "@/lib/demo-player-store";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
export function DemoFlowNote() {
  const t = usePlayerCopy();
  const { storageFailed } = useDemoPlayer();
  const [confirm, setConfirm] = useState(false);
  return (
    <aside className="panel space-y-2 p-4 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="demo-chip">Local Mock</span>
        <p className="flex-1 font-bold">
          {t(
            "示意抽卡 → 卡冊解鎖 → 放大翻面 → 合成 → 實體卡申請預覽",
            "Demo draw → unlock collection → inspect & flip → synthesize → physical preview",
          )}
        </p>
        <Button variant="outline" size="sm" onClick={() => setConfirm(true)}>
          {t("重設流程示意", "Reset demo flow")}
        </Button>
      </div>
      <p className="text-muted-foreground">
        {t(
          "流程只更新此瀏覽器的示意收藏，不扣 KP、不產生分潤或正式持卡帳本。保底門檻、合成消耗及實體卡資格待核定。",
          "This browser-only collection preview does not charge KP, generate revenue or create an ownership ledger. Pity thresholds, synthesis cost and physical eligibility await approval.",
        )}
      </p>
      {storageFailed && (
        <p role="status" className="text-gold">
          {t(
            "瀏覽器儲存不可用，本次操作僅暫存在記憶體，重載後可能遺失。",
            "Browser storage is unavailable. Changes are in memory and may be lost on reload.",
          )}
        </p>
      )}
      <nav
        className="flex flex-wrap gap-3 font-bold text-primary"
        aria-label={t("示意流程入口", "Demo flow shortcuts")}
      >
        <Link to="/app/draw/$poolId" params={{ poolId: "p-uniform" }}>
          {t("示意抽卡", "Demo draw")}
        </Link>
        <Link to="/app/album">{t("我的卡冊", "Collection")}</Link>
        <Link to="/app/synthesis">{t("合成", "Synthesis")}</Link>
        <Link to="/physical-collection">{t("實體卡預覽", "Physical preview")}</Link>
      </nav>
      <ConfirmDialog
        open={confirm}
        title={t("重設此瀏覽器的流程示意？", "Reset this browser's demo flow?")}
        description={t(
          "清除本次示意取得、合成及申請預覽，還原初始 Mock 卡冊。",
          "Clear demo draws, synthesis and physical previews, then restore the starting collection.",
        )}
        confirmLabel={t("重設", "Reset")}
        cancelLabel={t("取消", "Cancel")}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          resetDemoPlayer();
          setConfirm(false);
        }}
      />
    </aside>
  );
}
