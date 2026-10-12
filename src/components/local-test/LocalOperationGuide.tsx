import { Link } from "@tanstack/react-router";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocalTest } from "@/lib/local-test-client";

export function LocalOperationGuide() {
  const t = useDiscoveryText(),
    local = useLocalTest();
  const role = local.summary?.user.role;
  return (
    <section className="panel space-y-5 p-4" data-local-guide>
      <h2 className="text-xl font-bold">{t("本機操作引導", "Local operation guide")}</h2>
      <p className="text-sm">
        {t(
          "維持本機，暫不接真人會員。先選擇上方測試身分並建立 Session；導覽只開啟頁面，不授予權限。",
          "Local only; real membership remains disabled. Select a fixture above and create a session. Navigation opens pages; it never grants permissions.",
        )}
      </p>
      <p role="status">
        {t("目前測試身分", "Current test identity")}:{" "}
        {local.summary
          ? `${local.summary.user.id} · ${role}`
          : t(
              "尚無有效 Session；仍可瀏覽公開內容。",
              "No valid session; public browsing is still available.",
            )}
      </p>
      <nav
        aria-label={t("四類本機入口", "Four local entrances")}
        className="grid gap-3 sm:grid-cols-2"
      >
        <div className="rounded-lg border p-3">
          <Link className="underline" to="/explore">
            {t("公開瀏覽", "Public browsing")}
          </Link>
          <p className="text-sm">
            {t(
              "不需測試身分。探索當前公開內容，再查看系列與創作者。",
              "No fixture required. Explore current public content, then series and creators.",
            )}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <Link className="underline" to="/app/collection">
            {t("玩家收藏", "Player collection")}
          </Link>
          <p className="text-sm">
            {t(
              "使用 member-a／member-b；讀取本人收藏與展示設定。",
              "Use member-a/member-b to read your collection and display settings.",
            )}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <Link className="underline" to="/goddess/supply">
            {t("創作者供給", "Creator delivery")}
          </Link>
          <p className="text-sm">
            {t(
              "使用 creator-a／creator-b；只管理本人內容包。",
              "Use creator-a/creator-b; only manage your own packages.",
            )}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <Link className="underline" to="/admin/supply">
            {t("官方審核", "Official review")}
          </Link>
          <p className="text-sm">
            {t(
              "使用 official-a／official-b；審核已保存的指定版本。已撤銷角色仍會被服務端阻擋。",
              "Use official-a/official-b to review a specific saved revision. Revoked roles remain blocked by the server.",
            )}
          </p>
        </div>
      </nav>
      <details open>
        <summary className="cursor-pointer font-semibold">
          {t("三條正常操作流程", "Three normal workflows")}
        </summary>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div>
            <h3 className="font-bold">{t("玩家", "Player")}</h3>
            <ol className="list-inside list-decimal space-y-2 text-sm">
              <li>
                <Link className="underline" to="/explore">
                  {t("探索公開內容", "Explore public content")}
                </Link>
              </li>
              <li>
                <Link className="underline" to="/pools/$poolId" params={{ poolId: "p-uniform" }}>
                  {t("查看制服序章系列", "View Uniform Prologue")}
                </Link>
              </li>
              <li>
                <Link className="underline" to="/app/collection">
                  {t("本人收藏", "Your collection")}
                </Link>{" "}
                ·{" "}
                <Link className="underline" to="/app/tasks">
                  {t("查看任務", "View tasks")}
                </Link>
              </li>
            </ol>
          </div>
          <div>
            <h3 className="font-bold">{t("創作者", "Creator")}</h3>
            <ol className="list-inside list-decimal space-y-2 text-sm">
              <li>
                <Link className="underline" to="/goddess/supply">
                  {t("選本人內容包並編輯", "Select and edit your package")}
                </Link>
              </li>
              <li>
                {t(
                  "逐步查看具體缺項；確認双語、來源與示意用途。",
                  "Check missing fields, both languages, source and sample uses.",
                )}
              </li>
              <li>
                {t(
                  "保存新草稿版本，再送審已保存版本。",
                  "Save a draft revision, then submit that saved revision.",
                )}
              </li>
              <li>
                {t(
                  "在版本歷史讀退回理由；修改、保存並重新送審。",
                  "Read the return reason in version history; edit, save and resubmit.",
                )}
              </li>
            </ol>
          </div>
          <div>
            <h3 className="font-bold">{t("官方", "Official")}</h3>
            <ol className="list-inside list-decimal space-y-2 text-sm">
              <li>
                <Link className="underline" to="/admin/supply">
                  {t(
                    "選已保存內容包，核對版本與缺項",
                    "Select a saved package; check revision and missing fields",
                  )}
                </Link>
              </li>
              <li>
                {t(
                  "檢查正文與素材；退回須填理由，核准綁定指定版本。",
                  "Review text and materials; provide a return reason or approve a specific revision.",
                )}
              </li>
              <li>
                {t(
                  "發布核准版本；修改後須重新審核。",
                  "Publish the approved revision; changed content requires re-review.",
                )}
              </li>
              <li>
                {t(
                  "需要時下架，再到公開探索確認遮蔽。",
                  "Withdraw when needed, then confirm it is hidden in public exploration.",
                )}
              </li>
            </ol>
          </div>
        </div>
      </details>
      <details>
        <summary className="cursor-pointer font-semibold">
          {t("保存、版本與錯誤處理", "Saving, revisions and recovery")}
        </summary>
        <div className="mt-3 space-y-2 text-sm">
          <p>
            {t(
              "未保存＝僅此頁編輯；已保存＝SQLite 草稿版本；待審／核准不等於公開。只有官方發布且仍在內容與素材有效期間內的版本可公開。",
              "Unsaved means edits on this page only; saved means a SQLite draft revision. Submitted/approved does not mean public. Public content must be officially published and within content/material validity periods.",
            )}
          </p>
          <p>
            {t(
              "版本衝突：保留或複製本人編輯，再重新載入已保存版本，比較後再保存。離頁／重新載入會沿用放棄確認。",
              "On a version conflict, retain or copy your own edits, reload the saved revision and compare before saving. Leaving/reloading uses the existing discard confirmation.",
            )}
          </p>
          <p>
            {t(
              "回應丟失：留在同一本人 Session，使用原頁的「重試內容包待確認操作」確認原 key 與原輸入；不要建立新請求或換帳號重送。一般重新載入只讀取資料，不確認待處理命令。",
              "If a response is lost, remain in the same account and use Retry unconfirmed package operation on the original page with the original key/input. Do not create a new request or retry as another account. Reloading data alone does not confirm a pending command.",
            )}
          </p>
          <p>
            {t(
              "Session 失效需重新建立測試 Session。API 不可用需先啟動服務再重試；服務錯誤不代表没有收藏或內容。無追蹤可先查看公開創作者；無搜尋結果可調整條件。未公開、到期或下架內容不會為示範自動延長。",
              "For an expired session, create a test session again. For unavailable APIs, start the service and retry; a service error does not mean an empty collection/content. Browse public creators when not following anyone, or change search filters for no results. Unpublished, expired or withdrawn content is never extended for a demo.",
            )}
          </p>
          <p>
            {t(
              "網站、社群與印製用途分開；本機示意可用不等於正式素材授權。",
              "Website, social and print uses are separate; local sample confirmation is not formal material authorization.",
            )}
          </p>
        </div>
      </details>
      <details>
        <summary className="cursor-pointer font-semibold">
          {t("本機保存與重新開啟", "Local storage and restarting")}
        </summary>
        <div className="mt-3 space-y-2 text-sm">
          <p>
            {t(
              "SQLite 保存測試持卡／TEST KP 歷史、內容包與審核發布版本、追蹤、收藏展示及參與紀錄。未接線的 Mock、語系與佈景保存在瀏覽器；未保存編輯只在頁面。它們不會自動匯入 SQLite。",
              "SQLite stores test holdings/TEST KP history, packages and review/publication revisions, follows, collection display and participation records. Unwired Mock data, locale and theme stay in the browser; unsaved edits stay on the page. They are not automatically imported into SQLite.",
            )}
          </p>
          <p>
            {t(
              "服務停止不會刪除 SQLite。於專案目錄重新啟動；確認 KEEPY_LOCAL_DB未指向隔離 QA 檔。不要同時啟動兩組占用相同連接埠的服務。",
              "Stopping the service does not delete SQLite. Restart from the project directory and ensure KEEPY_LOCAL_DB is not pointing to an isolated QA file. Do not run two services on the same ports.",
            )}
          </p>
          <pre className="overflow-x-auto rounded bg-muted p-3">
            {"cd D:\\Codex\\KEEPY\nnpm run local:test"}
          </pre>
          <p>
            {t(
              "既有備份命令會產生新備份檔；只能在不同路徑還原，不覆寫原庫。唯讀盤點的 --out 必須是新的 JSON 路徑；它不是匯入或正式授權。",
              "The existing backup command creates a new backup file; restore only to a different path, never over the original database. Read-only inventory requires a new JSON --out path; it is not an import or production approval.",
            )}
          </p>
          <pre className="overflow-x-auto rounded bg-muted p-3">
            {
              'npm run local:test:backup\n$keepyReport = ".local-test/inventory-" + (Get-Date -Format yyyyMMdd-HHmmssfff) + ".json"\nnode local-test/migration-inventory.mjs --db .local-test/keepy.sqlite --out $keepyReport'
            }
          </pre>
        </div>
      </details>
      <details data-manual-checklist>
        <summary className="cursor-pointer font-semibold">
          {t("人工驗收清單（尚未驗收）", "Manual acceptance checklist (pending)")}
        </summary>
        <p className="my-3 text-sm">
          {t(
            "以下只供本次人工核對，勾選不保存、不代表自動測試或版本驗收通過。寫入測試請使用隔離資料庫；勿在使用者原庫送審、發布、下架或操作資產。",
            "Use these for this manual review only. Checks are not saved and do not mark automated tests or version acceptance as passed. Use an isolated database for write tests; never submit, publish, withdraw or alter assets in the original user database.",
          )}
        </p>
        {[
          [
            "公開：探索、文章、系列連結一致；無結果與到期提示正確。",
            "Public: exploration, article and series links agree; no-result and expiry messages are correct.",
          ],
          [
            "玩家：本人收藏／任務回讀；換帳號不顯示前一人資料。",
            "Player: collection/tasks reload; account switching hides the previous user's data.",
          ],
          [
            "創作者：缺項、未保存確認、保存、送審與退回重審。",
            "Creator: missing fields, unsaved confirmation, save, submit and return/re-review.",
          ],
          [
            "官方：指定版核准、發布／下架；越權與缺项阻擋。",
            "Official: exact-revision approval, publish/withdraw; role and missing-field checks block invalid actions.",
          ],
        ].map(([zh, en], i) => (
          <label key={i} className="my-2 flex items-start gap-2">
            <input type="checkbox" className="mt-1" />
            <span className="text-sm">{t(zh!, en!)}</span>
          </label>
        ))}
      </details>
    </section>
  );
}
