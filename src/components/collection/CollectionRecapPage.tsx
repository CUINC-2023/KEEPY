import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useCollection, refreshCollectionMe } from "@/lib/collection-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { CollectionRecap } from "./CollectionRecap";
export function CollectionRecapPage() {
  const d = useCollection(),
    t = useDiscoveryText();
  const me = d.me && d.catalogueValid && !d.error && !d.meError ? d.me : null;
  return (
    <main className="space-y-5 p-4 md:p-8" data-private-recap-page>
      <h1 className="text-2xl font-bold">
        {t("本人收藏與遊玩回顧", "Your collection and play recap")}
      </h1>
      <nav className="flex flex-wrap gap-4" aria-label={t("回顧下一步", "Recap next steps")}>
        <Link className="text-primary underline" to="/app/collection">
          {t("本人收藏", "Your collection")}
        </Link>
        <Link className="text-primary underline" to="/app/notes">
          {t("私人筆記", "Private notes")}
        </Link>
        <Link className="text-primary underline" to="/app/planning">
          {t("私人規劃", "Private planning")}
        </Link>
      </nav>
      {d.error || d.meError ? (
        <div role="alert">
          <p>
            {t(
              "本機回顧來源失敗，舊私人投影已清空。",
              "Local recap sources failed; old private projections cleared.",
            )}
          </p>
          <Button onClick={() => void refreshCollectionMe()}>
            {t("重讀本人回顧", "Reload your recap")}
          </Button>
        </div>
      ) : me ? (
        <div key={me.actorId + ":" + me.visibilityKey}>
          <CollectionRecap me={me} />
          <section className="panel space-y-3 p-5" data-recap-current-curations>
            <h2 className="text-xl font-bold">
              {t("目前策展配置", "Current curation configuration")}
            </h2>
            <p>
              {t(
                "這是目前保存配置；沒有歷史配置快照，不推算期間策展新增或完成時間。僅顯示目前合法持有的內容，預設私人。",
                "This is the currently saved configuration. Historical configuration snapshots are unavailable, so period changes or completion dates are not inferred. Only currently eligible held content is shown, private by default.",
              )}
            </p>
            {me.profile.data.curations?.length ? (
              <ul className="space-y-3">
                {me.profile.data.curations.map((g) => (
                  <li key={g.id} className="break-words">
                    <h3 className="font-semibold">{g.title}</h3>
                    <p className="whitespace-pre-wrap">{g.note}</p>
                    <ul>
                      {g.cardIds
                        .flatMap((id) => me.cards.filter((c) => c.cardId === id))
                        .map((c) => (
                          <li key={c.cardId}>{c.name}</li>
                        ))}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t("尚無本人策展配置。", "No curation configuration saved.")}</p>
            )}
            <Link className="text-primary underline" to="/app/curations">
              {t("編輯原私人策展", "Edit your existing private curations")}
            </Link>
          </section>
        </div>
      ) : (
        <p>
          {t(
            "請在本機確認本人測試身分；Staging僅前端預覽，並非雲端回顧。",
            "Confirm your test identity locally. Staging is a front-end preview, not a cloud recap.",
          )}
        </p>
      )}
    </main>
  );
}
