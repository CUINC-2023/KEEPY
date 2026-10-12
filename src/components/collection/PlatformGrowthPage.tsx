import { Link } from "@tanstack/react-router";
import { useCollection, refreshCollection, refreshCollectionMe } from "@/lib/collection-store";
import {
  useParticipation,
  refreshParticipation,
  refreshParticipationMe,
} from "@/lib/participation-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { Button } from "@/components/ui/button";
import { PlatformLevelPreview } from "./PlatformLevelPreview";
export function PlatformGrowthPage() {
  const c = useCollection(),
    d = useParticipation(),
    t = useDiscoveryText();
  return (
    <main data-platform-growth className="space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-bold">
        {t("平台參與成長 · 本機預覽", "Platform participation growth · local preview")}
      </h1>
      <nav className="flex flex-wrap gap-4">
        <Link to="/app/collection" className="text-primary underline">
          {t("返回本人收藏", "Back to your collection")}
        </Link>
        <Link to="/app/levels" className="text-primary underline">
          {t("玩家收藏等級", "Player collection level")}
        </Link>
        <Link to="/app/settings/privacy" className="text-primary underline">
          {t("檢查本人公開設定", "Review your public settings")}
        </Link>
      </nav>
      <p>
        {t(
          "預設私人；平台參與與收藏等級分別呈現。這是規則核定前的本機預覽，不代表平台管理資格。",
          "Private by default; platform participation and collection levels are shown separately. This is a local preview before rule approval, not platform management eligibility.",
        )}
      </p>
      {c.error || c.meError || d.error || d.meError ? (
        <div className="panel space-y-3 p-4" role="alert">
          <p>
            {t(
              "來源服務失敗，私人摘要已清空。",
              "Source services failed; private summaries are cleared.",
            )}
          </p>
          <Button
            onClick={() => {
              void refreshCollection();
              void refreshCollectionMe();
              void refreshParticipation();
              void refreshParticipationMe();
            }}
          >
            {t("重新讀取來源", "Reload sources")}
          </Button>
        </div>
      ) : !c.me ? (
        <p>{t("請先在本機測試選擇本人帳號。", "Select your account in Local Test first.")}</p>
      ) : (
        <>
          <PlatformLevelPreview key={c.me.actorId} me={c.me} />
          <section className="panel space-y-3 p-5">
            <h2 className="text-xl font-bold">
              {t("有效來源與階段提案", "Valid sources and proposed stages")}
            </h2>
            <p>
              {t(
                "階段0–4代表目前有效完成種類數，各種最多一次。不是正式經驗值；既有任務停止或公開來源失效時重算。",
                "Stages 0–4 represent currently valid completed task types, at most once per type. This is not official XP; recalculated when a task is disabled or a public source becomes invalid.",
              )}
            </p>
            <Link to="/app/tasks" className="text-primary underline">
              {t("閱讀既有四項任務", "Read the four existing tasks")}
            </Link>
          </section>
        </>
      )}
    </main>
  );
}
