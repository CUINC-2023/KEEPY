import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useCollection, type CollectionMe } from "@/lib/collection-store";
import { localSessionGeneration } from "@/lib/local-test-client";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { parseRankingView, RANKING_BOARDS, type RankingView } from "@/lib/ranking-view.mjs";
export function PersonalRankingCenter() {
  const d = useCollection(),
    t = useDiscoveryText();
  return (
    <main className="space-y-6 p-4 md:p-8" data-personal-ranking-center>
      <h1 className="text-2xl font-bold">{t("本人排行中心", "Your ranking center")}</h1>
      <Link to="/app/collection" className="text-primary underline">
        {t("返回本人收藏", "Back to your collection")}
      </Link>
      {d.error || d.meError ? (
        <p role="alert">
          {t(
            "來源讀取失敗，私人偏好未展示。",
            "Source loading failed; private preferences are hidden.",
          )}
        </p>
      ) : !d.me ? (
        <p>{t("請先於本機測試選擇本人帳號。", "Select your account in Local Test first.")}</p>
      ) : (
        <Center key={d.me.actorId + ":" + localSessionGeneration()} me={d.me} />
      )}
    </main>
  );
}
function Center({ me }: { me: CollectionMe }) {
  const t = useDiscoveryText(),
    key = "keepy-ranking-view-v1:" + me.actorId;
  const [view, setView] = useState<RankingView>(() => {
    try {
      return (
        parseRankingView(sessionStorage.getItem(key) ?? "null") ?? {
          schema: 1,
          boards: [],
          last: null,
        }
      );
    } catch {
      return { schema: 1, boards: [], last: null };
    }
  });
  const [error, setError] = useState("");
  function save(next: RankingView) {
    setView(next);
    try {
      sessionStorage.setItem(key, JSON.stringify(next));
      setError("");
    } catch {
      setError(
        t(
          "本分頁偏好無法保存，重新開啟後不保證恢復。",
          "Tab preferences could not be saved; reopening may not restore them.",
        ),
      );
    }
  }
  const labels = {
    total: t("總榜", "Total"),
    season: t("賽季榜（本機預覽）", "Seasons (local preview)"),
    album: t("卡冊榜", "Albums"),
  };
  return (
    <section className="panel space-y-4 p-5" data-private-ranking-view>
      <p>
        {t(
          "追蹤與最後入口僅保存此瀏覽器分頁，依本人帳戶區隔；不跨裝置、不公開、不改排行資格。",
          "Following and last entrance are saved only in this browser tab, isolated by account. No cross-device sync or public sharing; ranking eligibility is unchanged.",
        )}
      </p>
      <p>
        {t(
          "正式榜排除本機身分；本機預覽也必須啟用公開頁與排行同意。",
          "Formal rankings exclude local identities. Local previews also require a public page and ranking consent.",
        )}{" "}
        {me.profile.data.isPublic && me.profile.data.showRanking
          ? t("已選擇公開排行。", "Public ranking is selected.")
          : t("目前未選擇公開排行。", "Public ranking is not selected.")}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {RANKING_BOARDS.map((board) => (
          <div key={board} className="space-y-3 rounded-xl border p-4">
            <label className="flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                aria-label={"Follow ranking " + board}
                checked={view.boards.includes(board)}
                onChange={(e) =>
                  save({
                    ...view,
                    boards: e.target.checked
                      ? [...view.boards, board]
                      : view.boards.filter((b) => b !== board),
                  })
                }
              />
              {labels[board]}
            </label>
            <Link
              to="/leaderboards"
              hash={"ranking-" + board}
              onClick={() => save({ ...view, last: board })}
              className="text-primary underline"
            >
              {t("前往", "Open")} {labels[board]}
            </Link>
          </div>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
      <p data-ranking-preference-summary>
        {view.boards.length
          ? t("本分頁已追蹤榜單", "Boards followed in this tab") +
            ": " +
            view.boards.map((b) => labels[b as keyof typeof labels]).join(" · ")
          : t("尚未選擇追蹤榜單。", "No boards followed yet.")}
      </p>
      {view.last && (
        <Link to="/leaderboards" hash={"ranking-" + view.last} className="text-primary underline">
          {t("返回最後榜單入口", "Return to the last board entrance")}
        </Link>
      )}
      <p className="text-sm text-muted-foreground">
        {t(
          "尚無可信的前期名次對照，不顯示升降或虛構變化。公開資格與來源更新由各榜目前服務端投影說明。",
          "No reliable previous-position comparison exists; no invented rises, falls or changes are shown. Each board explains eligibility and current server sources.",
        )}
      </p>
    </section>
  );
}
