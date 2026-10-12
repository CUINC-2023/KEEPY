import { useDiscoveryText } from "@/lib/discovery-copy";
import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  useLocalTest,
  initializeLocalTest,
  disableLocalTest,
  refreshLocalTest,
  retryLocalCommands,
} from "@/lib/local-test-client";
export function LocalTestBanner() {
  const local = useLocalTest();
  const t = useDiscoveryText();
  useEffect(initializeLocalTest, []);
  if (!local.enabled) return null;
  return (
    <aside className="panel m-3 space-y-2 p-3" data-testid="synthetic-local-banner">
      <strong>
        syntheticLocalTest · SQLite · {local.summary?.user.id ?? "No session"} ·{" "}
        {local.summary?.user.role ?? ""} · {local.summary?.user.balance ?? 0} TEST KP
      </strong>
      <p className="text-xs text-muted-foreground">
        {t(
          "本機合成測試身分與 TEST KP；不使用真實個資或交易。內容發布、追蹤及既有收藏／交易流程使用 SQLite；其他未接線展示仍為 Mock。",
          "Synthetic test identity and TEST KP; no real personal data or transactions. Published content, follows and existing collection/transaction flows use SQLite. Other unwired displays remain Mock.",
        )}
      </p>
      {local.error && (
        <div role="alert">
          <p>
            {t(
              "測試 Session 或本機服務無法讀取；本人資料已清除。請確認服務後重試，或重新建立測試 Session。",
              "Test session or local service unavailable; private projections cleared. Check the service and retry, or create a test session again.",
            )}
          </p>
          <p className="text-xs break-words">{local.error}</p>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <Link to="/local-test">{t("測試身分", "Test fixtures")}</Link>
        <Link to="/explore">{t("公開探索", "Public exploration")}</Link>
        <Link to="/app/collection">{t("本人收藏", "Your collection")}</Link>
        {local.summary?.user.role === "creator" && (
          <Link to="/goddess/supply">{t("七步交付", "Seven-step delivery")}</Link>
        )}
        {local.summary?.user.role === "official" && (
          <Link to="/admin/supply">{t("指定版本審核", "Revision review")}</Link>
        )}
        <Link to="/app/draw/$poolId" params={{ poolId: "p-uniform" }}>
          {t("抽卡", "Draw")}
        </Link>
        <Link to="/app/history">{t("歷史", "History")}</Link>
        {local.summary?.user.role === "official" && (
          <Link to="/admin/operations">{t("合作管理", "Operations")}</Link>
        )}
        <button onClick={() => void refreshLocalTest()}>
          {t("讀取保存資料", "Refresh server data")}
        </button>
        <button onClick={() => void retryLocalCommands()}>
          {t("重試待確認操作", "Retry pending commands")}
        </button>
        <button onClick={disableLocalTest}>{t("返回 Local Mock", "Return to Local Mock")}</button>
      </div>
    </aside>
  );
}
