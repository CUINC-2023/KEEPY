import { useState } from "react";
import { COLLECTION_THEMES } from "@/lib/collection-samples.mjs";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { Progress } from "@/components/ui/progress";
import { BadgeMark } from "@/components/player/BadgeMark";
import { CreatorContentTemplate } from "@/components/content/CreatorContentTemplate";
import { ContentPagination } from "@/components/content/ContentPagination";
function Composition({
  pattern,
  variant = 0,
}: {
  pattern: "round" | "steps" | "waves" | "triangles" | "bars" | "dots";
  variant?: number;
}) {
  return (
    <svg
      viewBox="0 0 100 80"
      aria-hidden="true"
      className="h-20 w-28 max-w-full text-primary"
      data-template-composition={pattern}
    >
      {pattern === "triangles" ? (
        <g fill="currentColor" fillOpacity=".3" stroke="currentColor">
          {[0, 1, 2].slice(0, variant + 1).map((i) => (
            <path key={i} d={`M ${10 + i * 27} 60 l 12 -35 l 12 35 Z`} />
          ))}
        </g>
      ) : pattern === "bars" ? (
        <g fill="currentColor">
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={10 + i * 30}
              y={20 + ((i + variant) % 3) * 10}
              width="18"
              height={40 - ((i + variant) % 3) * 10}
              opacity={0.3 + i * 0.2}
            />
          ))}
        </g>
      ) : pattern === "dots" ? (
        <g fill="currentColor">
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={20 + i * 30}
              cy={variant === 1 ? 20 + i * 20 : 40}
              r={variant === 2 ? 5 + i * 4 : 8}
            />
          ))}
        </g>
      ) : pattern === "round" ? (
        variant === 1 ? (
          <g fill="currentColor" fillOpacity=".25" stroke="currentColor">
            <circle cx="40" cy="40" r="25" />
            <circle cx="65" cy="40" r="25" />
          </g>
        ) : (
          <circle
            cx="50"
            cy={variant === 0 ? 30 : 40}
            r="25"
            fill={variant === 2 ? "none" : "currentColor"}
            fillOpacity=".25"
            stroke="currentColor"
            strokeWidth="3"
          />
        )
      ) : pattern === "steps" ? (
        <g fill="currentColor" fillOpacity=".3" stroke="currentColor">
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={12 + i * 25}
              y={variant === 1 ? 20 + (i === 1 ? 25 : 0) : 55 - i * 15}
              width="24"
              height={variant === 2 ? 8 : 20 + i * 10}
            />
          ))}
        </g>
      ) : (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M 5 ${15 + i * (variant === 2 ? 23 : 18)} Q 30 ${5 + i * 18} 50 ${20 + i * 18} T 95 ${variant === 1 ? 35 : 15 + i * 18}`}
            />
          ))}
        </g>
      )}
    </svg>
  );
}
export function CollectionTemplateGallery() {
  const t = useDiscoveryText(),
    { locale } = useLocale(),
    [scenario, setScenario] = useState("partial"),
    [page, setPage] = useState(1),
    [query, setQuery] = useState("");
  const rows = COLLECTION_THEMES.filter((x) =>
      x.title[locale].toLocaleLowerCase().includes(query.toLocaleLowerCase()),
    ),
    pages = Math.max(1, Math.ceil(rows.length / 6)),
    currentPage = Math.min(page, pages);
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
      <label className="block">
        {t("查找示意範本", "Find sample templates")}
        <input
          aria-label="Find sample templates"
          maxLength={100}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          className="mt-1 min-h-11 w-full rounded border bg-background p-2"
        />
      </label>
      <ContentPagination page={currentPage} pages={pages} onChange={setPage} />
      {!rows.length && (
        <p role="status">{t("沒有符合條件的示意範本。", "No sample templates match.")}</p>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        {rows.slice((currentPage - 1) * 6, currentPage * 6).map((x) => (
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
              {x.composition && <Composition pattern={x.composition} />}
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
                  {x.composition && <Composition pattern={x.composition} variant={i} />}
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
