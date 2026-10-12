import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import type { SupplyCheck, SupplyCheckItem } from "@/lib/supply-checklist.mjs";
const titles = [
  ["申請", "Application"],
  ["素材與權利確認", "Materials and rights"],
  ["系列企劃", "Series planning"],
  ["卡面製作", "Card production"],
  ["上架檢查", "Publication checks"],
  ["宣傳", "Promotion"],
  ["回顧", "Retrospective"],
];
const fields: Record<string, [string, string]> = {
  creatorIntro: ["創作者介紹", "Creator introduction"],
  articles: ["至少一篇獨立正文", "At least one independent article"],
  body: ["正文段落", "Body paragraph"],
  "question-1": ["訪談題綱 1", "Interview prompt 1"],
  "question-2": ["訪談題綱 2", "Interview prompt 2"],
  "question-3": ["訪談題綱 3", "Interview prompt 3"],
  "question-4": ["訪談題綱 4", "Interview prompt 4"],
  partnerId: ["合作對象", "Partner"],
  creatorId: ["創作者關聯", "Creator relation"],
  poolId: ["系列關聯", "Series relation"],
  "creator-role": ["目前有效創作者資格", "Current creator role"],
  cooperation: ["目前有效合作關聯", "Current active cooperation"],
  contract: ["既有同意與展示證據", "Existing consent and display evidence"],
  application: ["申請說明", "Application note"],
  materials: ["至少一份示意素材", "At least one sample material"],
  reference: ["允許的本機素材參照", "Allowlisted local reference"],
  version: ["有效素材版本", "Valid material version"],
  source: ["素材來源", "Material source"],
  evidence: ["來源證據／權利說明", "Source evidence / rights note"],
  alt: ["替代文字", "Alternative text"],
  website: ["網站展示示意用途確認", "Sample website display confirmation"],
  social: ["社群宣傳用途", "Social promotion use"],
  print: ["印製用途", "Printing use"],
  startAt: ["素材開始日期（帶時區 ISO）", "Material start (timezone ISO)"],
  endAt: ["素材結束日期（帶時區 ISO）", "Material end (timezone ISO)"],
  "material-order": ["素材開始必須早於結束", "Material start must precede end"],
  coverage: ["素材使用期間涵蓋發布期間", "Material use must cover publication period"],
  title: ["標題", "Title"],
  summary: ["摘要", "Summary"],
  story: ["故事", "Story"],
  goal: ["收藏目標", "Collection goal"],
  endPolicy: ["結束後說明", "After-series policy"],
  cardNotes: ["卡面製作與檢查說明", "Card production and check note"],
  releaseAt: ["發布開始日期（帶時區 ISO）", "Publication start (timezone ISO)"],
  withdrawAt: ["撤下日期（帶時區 ISO）", "Withdrawal (timezone ISO)"],
  "publication-order": ["發布開始必須早於撤下", "Publication start must precede withdrawal"],
  promotion: ["宣傳配套", "Promotion plan"],
  retrospective: ["回顧資料", "Retrospective data"],
};
export function SupplyChecklistView({
  checks,
  dirty,
  locate,
}: {
  checks: SupplyCheck[];
  dirty: boolean;
  locate?: (step: number, item: SupplyCheckItem) => void;
}) {
  const t = useDiscoveryText(),
    { locale } = useLocale(),
    lang = locale === "en" ? 1 : 0;
  const item = (x: SupplyCheckItem) =>
    [x.materialId, fields[x.field]?.[lang] ?? x.field, x.locale].filter(Boolean).join(" · ");
  return (
    <section data-supply-checklist className="panel space-y-4 p-5">
      <h2 className="font-bold">
        {t("七步完成狀態與缺項", "Seven-step readiness and missing fields")}
      </h2>
      <p className="text-sm text-muted-foreground">
        {dirty
          ? t(
              "目前含未保存修改；保存後由服務端重新檢查。",
              "Includes unsaved changes; the server checks again after saving.",
            )
          : t(
              "這是內容備齊狀態；送審、核准與發布仍依服務端指定版本。",
              "This tracks content readiness; submission, approval and publication use the specified server revision.",
            )}
      </p>
      <ol className="grid gap-3 md:grid-cols-2">
        {checks.map((c, i) => (
          <li
            key={c.step}
            data-check-step={c.step}
            data-complete={c.complete}
            className="min-w-0 rounded-xl border p-4"
          >
            <h3 className="font-semibold">
              {c.step}. {titles[i]?.[lang]}
            </h3>
            <p className="text-sm font-semibold">
              {c.complete
                ? t("資料已備齊", "Content ready")
                : c.requiredForSubmission
                  ? t("尚未完成", "Incomplete")
                  : t("等待回顧資料", "Awaiting retrospective data")}
            </p>
            {!c.complete && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {c.missing.map((m, j) => (
                  <li className="break-words" key={j}>
                    {locate ? (
                      <button
                        className="text-primary underline text-left"
                        data-locate-missing
                        onClick={() => locate(c.step, m)}
                      >
                        {item(m)}
                      </button>
                    ) : (
                      item(m)
                    )}
                  </li>
                ))}
              </ul>
            )}
            {!!c.pending.length && (
              <p className="mt-2 break-words text-xs text-muted-foreground">
                {t(
                  "用途仍待核定，不代表已授權：",
                  "Uses remain pending, without granted authorization: ",
                )}
                {c.pending.map(item).join("；")}
              </p>
            )}
            {!c.requiredForSubmission && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t(
                  "沒有真實資料可留白，不阻擋送審；不得填造假成效。",
                  "May remain blank without real data; does not block submission. Do not invent performance.",
                )}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
