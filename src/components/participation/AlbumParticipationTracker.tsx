import { useEffect, useState } from "react";
import { useLocalTest } from "@/lib/local-test-client";
import { sendParticipation, retryParticipation } from "@/lib/participation-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { Button } from "@/components/ui/button";
export function AlbumParticipationTracker() {
  const local = useLocalTest(),
    t = useDiscoveryText(),
    [error, setError] = useState(false);
  const actor = local.summary?.user.id;
  useEffect(() => {
    let live = true;
    setError(false);
    if (local.enabled && actor)
      void sendParticipation({ action: "album-view" }).catch(() => {
        if (live) setError(true);
      });
    return () => {
      live = false;
    };
  }, [actor, local.enabled]);
  return error ? (
    <div role="status">
      <p>{t("卡冊查看任務暫時未能保存。", "Album-view task could not be saved.")}</p>
      <Button
        variant="outline"
        onClick={async () => {
          try {
            await retryParticipation();
            setError(false);
          } catch {
            setError(true);
          }
        }}
      >
        {t("重試任務紀錄", "Retry task record")}
      </Button>
    </div>
  ) : null;
}
