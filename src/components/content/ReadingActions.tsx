import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocalTest, localTestState } from "@/lib/local-test-client";
import {
  useReadingList,
  changeReading,
  retryReading,
  refreshReading,
  hasPendingDiscovery,
  READING_COMMAND,
} from "@/lib/discovery-store";
export function ReadingActions({
  articleId,
  saved,
  version,
}: {
  articleId: string;
  saved: boolean;
  version: number;
}) {
  const local = useLocalTest(),
    actor = local.summary?.user.id,
    t = useDiscoveryText(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [tick, setTick] = useState(0);
  useEffect(() => {
    setBusy(false);
    setError("");
  }, [actor]);
  const pending = hasPendingDiscovery(READING_COMMAND);
  const perform = async (retry = false) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await (retry ? retryReading() : changeReading(articleId, !saved, version));
    } catch (e) {
      if (localTestState().summary?.user.id === actor) setError(String(e));
    } finally {
      if (localTestState().summary?.user.id === actor) {
        setBusy(false);
        setTick(tick + 1);
      }
    }
  };
  return (
    <div className="space-y-2" data-reading-action>
      <Button disabled={busy || pending} aria-pressed={saved} onClick={() => void perform()}>
        {t(
          saved ? "移除稍後閱讀" : "加入稍後閱讀",
          saved ? "Remove from read later" : "Save for later",
        )}
      </Button>
      {pending && (
        <div role="alert">
          <p>
            {t(
              "原操作尚未確認；重試原 key 確認結果，不另送新操作。",
              "Original operation is unconfirmed. Retry its original key to confirm the result.",
            )}
          </p>
          <Button disabled={busy} onClick={() => void perform(true)}>
            {t("確認原閱讀操作", "Confirm original reading operation")}
          </Button>
        </div>
      )}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <p>
            {t(
              "版本衝突時先重新讀取，再確認目前狀態；服務失敗不代表清單為空。",
              "After a version conflict, reload and check the current state. Service failure does not mean an empty list.",
            )}
          </p>
          <Button disabled={busy} onClick={() => void refreshReading()}>
            {t("重新讀取閱讀清單", "Reload reading list")}
          </Button>
        </div>
      )}
    </div>
  );
}
export function ReadingButton({ articleId }: { articleId: string }) {
  const r = useReadingList(),
    t = useDiscoveryText();
  if (!r.allowed)
    return (
      <p>
        {t(
          "稍後閱讀需要有效本機玩家測試身分。",
          "Read later requires a valid local player test identity.",
        )}{" "}
        <Link to="/local-test" className="text-primary underline">
          {t("選擇測試身分", "Select a test identity")}
        </Link>
      </p>
    );
  if (r.error)
    return (
      <div role="alert">
        {t("本人閱讀清單無法讀取。", "Your reading list is unavailable.")}
        <Button onClick={() => void refreshReading()}>
          {t("重新讀取閱讀清單", "Reload reading list")}
        </Button>
      </div>
    );
  if (!r.reading) return <p role="status">{t("讀取閱讀清單中…", "Loading reading list…")}</p>;
  return (
    <ReadingActions
      articleId={articleId}
      saved={r.reading.items.some((i) => i.articleId === articleId)}
      version={r.reading.version}
    />
  );
}

export function ReadingRecovery() {
  const r = useReadingList(),
    local = useLocalTest(),
    actor = local.summary?.user.id,
    t = useDiscoveryText(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    setBusy(false);
    setError("");
  }, [actor]);
  if (!r.allowed || !hasPendingDiscovery(READING_COMMAND)) return null;
  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await retryReading();
    } catch (e) {
      if (localTestState().summary?.user.id === actor) setError(String(e));
    } finally {
      if (localTestState().summary?.user.id === actor) setBusy(false);
    }
  };
  return (
    <div data-reading-recovery role="alert" className="panel space-y-2 p-4">
      <p>
        {t(
          "有尚未確認的原閱讀操作；即使清單已空仍可用原 key 確認。",
          "A reading operation is unconfirmed. Its original key can be confirmed even when the list is empty.",
        )}
      </p>
      <Button disabled={busy} onClick={() => void confirm()}>
        {t("確認原閱讀操作", "Confirm original reading operation")}
      </Button>
      {error && <p>{error}</p>}
    </div>
  );
}
