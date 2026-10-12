import { CREATOR_CONTENT_TEMPLATES } from "@/lib/collection-samples.mjs";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { useDiscoveryText } from "@/lib/discovery-copy";
export function CreatorContentTemplate({ seriesId }: { seriesId: string }) {
  const pack = CREATOR_CONTENT_TEMPLATES.find((p) => p.seriesId === seriesId),
    { locale } = useLocale(),
    t = useDiscoveryText();
  if (!pack) return null;
  return (
    <section data-creator-content-template className="space-y-3 rounded-xl border p-4">
      <h3 className="font-bold">
        {t(
          "作品與創作過程範本 · 虛構未執行",
          "Work and process template · fictional, not performed",
        )}
      </h3>
      <p className="break-words">{pack.workIntro[locale]}</p>
      <ol className="space-y-2">
        {pack.process.map((p, n) => (
          <li key={n}>
            {n + 1}. {p[locale]}
          </li>
        ))}
      </ol>
      <details>
        <summary>
          {t("四題訪談題綱（未確認回答）", "Four interview prompts (answers unconfirmed)")}
        </summary>
        <ol className="space-y-2">
          {pack.questions.map((q, n) => (
            <li key={n}>
              {n + 1}. {q[locale]}
            </li>
          ))}
        </ol>
      </details>
      <p>
        {t(
          "真人回答、合作对象及拍攝日期：未確認，保持空白。",
          "Real answers, collaborators and shoot dates: unconfirmed and left blank.",
        )}
      </p>
      <p className="text-xs text-muted-foreground">
        {t("獨立示意系列關聯", "Independent sample series relation")}: {pack.seriesId} · v
        {pack.version} · {pack.source[locale]}
      </p>
      <p className="text-sm">
        {t(
          "僅供草稿參考，不會自動寫入文章、關聯真人或繞過素材與指定版審核。",
          "Draft reference only; never automatically writes articles, links real people or bypasses material and exact-version review.",
        )}
      </p>
    </section>
  );
}
