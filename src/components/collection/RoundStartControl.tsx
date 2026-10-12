import { useState } from "react";
import { hasPendingDiscovery } from "@/lib/discovery-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
export function RoundStartControl({
  active,
  label,
  onStart,
}: {
  active: boolean;
  label: string;
  onStart: () => void;
}) {
  const t = useDiscoveryText(),
    [confirm, setConfirm] = useState(false),
    [notice, setNotice] = useState("");
  const start = () => {
    if (hasPendingDiscovery("/play/commands")) {
      setNotice(
        t(
          "請先確認原遊玩操作，保留目前結果後再重玩。",
          "Confirm the original play operation before replaying; the current result is retained.",
        ),
      );
      return;
    }
    setNotice("");
    onStart();
  };
  return (
    <>
      <Button
        onClick={() => {
          if (hasPendingDiscovery("/play/commands")) start();
          else if (active) setConfirm(true);
          else start();
        }}
      >
        {label}
      </Button>
      {notice && <p role="alert">{notice}</p>}
      <ConfirmDialog
        open={confirm}
        title={t("重新開始此局？", "Restart this round?")}
        description={t(
          "捨棄這局尚未保存的進度；已保存紀錄不變，可取消繼續。",
          "Discard this round's unsaved progress. Saved records remain; cancel to continue.",
        )}
        confirmLabel={t("重新開始", "Restart round")}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          start();
        }}
      />
    </>
  );
}
