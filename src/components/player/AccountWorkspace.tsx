import { Link } from "@tanstack/react-router";
import { useLocalTest } from "@/lib/local-test-client";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { ContentState } from "@/components/content/ContentState";

/** Identity comes exclusively from the current fixture session, never a selector. */
export function AccountWorkspace() {
  const local = useLocalTest(),
    t = useDiscoveryText();
  const actor = local.summary?.user;
  return (
    <section className="panel space-y-3 p-4" data-account-workspace>
      <h1 className="text-xl font-bold">{t("本機帳號工作區", "Local account workspace")}</h1>
      <p className="text-sm text-muted-foreground">
        {t(
          "Fixture 測試身分，非真人登入。帳號資料保存在本機 SQLite；語系、主題與動畫偏好只在此裝置。",
          "Fixture identity, not real sign-in. Account data lives in local SQLite; language, theme and animation preferences stay on this device.",
        )}
      </p>
      {actor ? (
        <p role="status" className="break-words">
          {actor.id} · {actor.role} ·{" "}
          {t("服務已確認目前身分", "Identity confirmed by the local service")}
        </p>
      ) : (
        <ContentState kind={local.error ? "error" : "empty"}>
          {local.error ||
            t(
              "尚無有效本機身分，請至測試入口選擇 fixture。",
              "No active local identity. Choose a fixture at the test entrance.",
            )}
        </ContentState>
      )}
      <nav
        aria-label={t("帳號工作區入口", "Account workspace entrances")}
        className="flex flex-wrap gap-3 text-sm underline"
      >
        <Link to="/local-test">{t("身分與服務檢查", "Identity & service checks")}</Link>
        {actor?.role === "member" && (
          <>
            <Link to="/app/collection">{t("本人收藏", "My collection")}</Link>
            <Link to="/app/planning">{t("本人規劃", "My planning")}</Link>
          </>
        )}
        {actor?.role === "creator" && (
          <Link to="/goddess/supply">{t("本人內容包", "My content packages")}</Link>
        )}
        {actor?.role === "official" && (
          <Link to="/admin/supply">{t("指定版本審核", "Saved-version review")}</Link>
        )}
      </nav>
      <p className="text-xs text-muted-foreground">
        {t(
          "入口不授予權限；換帳號或 session 失效後，私人投影會清除。Staging 前端預覽不提供本機 API。",
          "Navigation grants no permissions. Private projections clear on identity change or session expiry. Staging frontend preview does not host the local API.",
        )}
      </p>
    </section>
  );
}
