import { Link } from "@tanstack/react-router";
import { nextCollectionStep } from "@/lib/collection-next-step.mjs";
import type { CollectionMe } from "@/lib/collection-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
export function CollectionNextStep({ me }: { me: CollectionMe }) {
  const t = useDiscoveryText(),
    next = nextCollectionStep(me);
  const reason =
    next.reason === "no-public-albums"
      ? t(
          "目前沒有有效公開卡冊，先查看官方公開內容與預告。",
          "No valid public albums currently; explore official public content and previews.",
        )
      : next.reason === "first-collection"
        ? t(
            "目前尚無有效公开取得款式，可先閱讀系列故事與收藏指南。",
            "No valid public acquired designs yet; start with series stories and collection guides.",
          )
        : next.reason === "selected-incomplete"
          ? t(
              "你選擇的私人目標還有未完成公開卡冊，沿本人優先順序接續。",
              "Your private goals include unfinished public albums; continue in your own priority order.",
            )
          : next.reason === "public-incomplete"
            ? t(
                "本人來源仍有未完成的公开卡冊，返回卡冊查看不同款式進度。",
                "Your sources include unfinished public albums; revisit distinct-design progress.",
              )
            : t(
                "目前有效公開卡冊已完成，可回顧已取得內容並自選展示；沒有新增獎勵。",
                "Current valid public albums are complete; revisit acquired content and choose a showcase. No new rewards.",
              );
  return (
    <aside data-collection-next-step className="space-y-3 rounded-xl border border-primary/30 p-4">
      <h3 className="font-bold">
        {t("依目前本人來源，接續下一步", "Continue from your current sources")}
      </h3>
      <p>{reason}</p>
      {next.kind === "explore" ? (
        <Link to="/explore" className="text-primary underline">
          {t("探索公開內容", "Explore public content")}
        </Link>
      ) : next.kind === "showcase" ? (
        <Link to="/app/settings/privacy" className="text-primary underline">
          {t("自選展示並預覽公開範圍", "Choose a showcase and preview public scope")}
        </Link>
      ) : (
        <Link
          to="/app/collection"
          hash={next.kind === "goals" ? "collection-goals" : "collection-albums"}
          className="text-primary underline"
        >
          {next.kind === "goals"
            ? t("繼續本人收藏目標", "Continue your collection goals")
            : t("查看本人卡冊", "View your albums")}
        </Link>
      )}
    </aside>
  );
}
