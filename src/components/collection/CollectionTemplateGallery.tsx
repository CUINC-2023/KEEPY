import { useState } from "react";
import { COLLECTION_THEMES } from "@/lib/collection-samples.mjs";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { Progress } from "@/components/ui/progress";
import { BadgeMark } from "@/components/player/BadgeMark";
import { CreatorContentTemplate } from "@/components/content/CreatorContentTemplate";
export function CollectionTemplateGallery() {
  const t = useDiscoveryText(),
    { locale } = useLocale(),
    [scenario, setScenario] = useState("partial");
  const count = scenario === "full" ? 3 : scenario === "partial" ? 1 : 0;
  return (
    <section className="space-y-5" data-collection-templates>
      <h1 className="text-2xl font-bold">
        {t("收藏故事與展示範本", "Collection story and showcase templates")}
      </h1>
      <p>
        {t(
          "獨立示意企劃與測試情境，不是本人收藏、已取得徽章、正式上架或真實合作。選擇情境不保存、不授予任何資產。",
          "Independent fictional concepts and test scenarios, not your collection, earned badges, a real release or collaboration. Selecting a scenario does not save or grant assets.",
        )}
      </p>
      <label>
        {t("預覽情境", "Preview scenario")}{" "}
        <select
          aria-label="Template scenario"
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
        >
          <option value="full">{t("完整收藏", "Full collection")}</option>
          <option value="partial">{t("部分收藏", "Partial collection")}</option>
          <option value="empty">{t("空收藏", "Empty collection")}</option>
        </select>
      </label>
      <div className="grid gap-4 lg:grid-cols-3">
        {COLLECTION_THEMES.map((x) => (
          <article className="panel min-w-0 space-y-3 p-4" key={x.id}>
            <div
              aria-hidden="true"
              className={
                "grid aspect-[3/2] place-items-center rounded-xl border p-5 text-center text-lg font-black " +
                (x.coverTone === "garden"
                  ? "bg-gradient-to-br from-emerald-500/20 to-background"
                  : x.coverTone === "tide"
                    ? "bg-gradient-to-b from-sky-500/20 via-background to-amber-500/20"
                    : "bg-gradient-to-tr from-primary/20 via-background to-gold/20")
              }
            >
              <span>{x.title[locale]}</span>
            </div>
            <h2 className="text-xl font-bold">{x.title[locale]}</h2>
            <p className="break-words leading-relaxed">{x.story[locale]}</p>
            <CreatorContentTemplate seriesId={x.id} />
            <h3 className="font-bold">{t("收藏導覽範本", "Collection guide template")}</h3>
            <p>{x.guide[locale]}</p>
            <h3 className="font-bold">{t("個人介紹範本", "Profile bio template")}</h3>
            <p>{x.bio[locale]}</p>
            <p>
              {t("情境公開款式", "Scenario public designs")}: {count}/3
            </p>
            <Progress value={(count / 3) * 100} />
            <div className="flex gap-2">
              {Array.from({ length: count }, (_, i) => (
                <div
                  className="grid aspect-[2/3] w-16 place-items-center rounded border bg-muted text-center text-xs"
                  key={i}
                >
                  {t("文字示意款式", "Sample text design")} {i + 1}
                </div>
              ))}
            </div>
            {x.cardStories && count > 0 && (
              <section className="space-y-2" data-template-card-stories>
                <h3 className="font-bold">
                  {t("情境中已展示版型的故事", "Stories of layouts shown in this scenario")}
                </h3>
                <ol className="space-y-2">
                  {x.cardStories.slice(0, count).map((story, i) => (
                    <li key={i} className="rounded border p-3">
                      {i + 1}. {story[locale]}
                    </li>
                  ))}
                </ol>
              </section>
            )}
            <h3>
              {t(
                "徽章視覺範本（非已取得成就）",
                "Badge visual template (not an earned achievement)",
              )}
            </h3>
            <div className="w-24">
              <BadgeMark label={x.badge[locale]} />
            </div>
            <p className="text-xs text-muted-foreground">{x.source[locale]}</p>
            <p className="break-all text-xs">
              {x.id} · v{x.version}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
