import { useEffect, useState } from "react";
import { useBlocker } from "@tanstack/react-router";
import { hasPendingDiscovery } from "@/lib/discovery-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PLAY_MODES } from "@/lib/collection-play.mjs";
export function PlayRoundGuard({ actor }: { actor: string }) {
  const t = useDiscoveryText(),
    [active, setActive] = useState<string[]>([]);
  useEffect(() => {
    const listener = (event: Event) => {
      const data = (event as CustomEvent).detail;
      if (
        data?.actor !== actor ||
        ![...PLAY_MODES, "practice-draft"].includes(data.mode) ||
        typeof data.active !== "boolean"
      )
        return;
      setActive((old) =>
        data.active ? [...new Set([...old, data.mode])] : old.filter((m) => m !== data.mode),
      );
    };
    window.addEventListener("keepy-play-round-state", listener);
    return () => window.removeEventListener("keepy-play-round-state", listener);
  }, [actor]);
  const blocker = useBlocker({
    shouldBlockFn: () => active.length > 0 || hasPendingDiscovery("/play/commands"),
    withResolver: true,
    enableBeforeUnload: active.length > 0,
  });
  return (
    <ConfirmDialog
      open={blocker.status === "blocked"}
      title={t("離開目前遊玩？", "Leave current play?")}
      description={t(
        "進行中的本機進度與未保存練習清單將捨棄；已保存紀錄保持。未確認操作的原key保留，返回本人後可確認，不建立新重送。取消可繼續此局。",
        "In-progress local rounds and unsaved practice lists will be discarded; saved records remain. An unconfirmed operation retains its original key for confirmation on returning to your account, without a new request. Cancel to continue the round.",
      )}
      confirmLabel={t("離開遊玩頁", "Leave play page")}
      cancelLabel={t("繼續此局", "Continue this round")}
      onConfirm={() => blocker.proceed?.()}
      onCancel={() => blocker.reset?.()}
    />
  );
}
