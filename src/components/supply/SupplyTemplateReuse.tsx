import { useState } from "react";
import { COLLECTION_THEMES, CREATOR_CONTENT_TEMPLATES } from "@/lib/collection-samples.mjs";
import { reuseSupplyTemplate } from "@/lib/supply-template.mjs";
import type { SupplyValue } from "@/lib/supply-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CreatorContentTemplate } from "@/components/content/CreatorContentTemplate";
export function SupplyTemplateReuse({
  value,
  disabled,
  onChange,
}: {
  value: SupplyValue;
  disabled: boolean;
  onChange: (value: SupplyValue) => void;
}) {
  const t = useDiscoveryText(),
    { locale } = useLocale();
  const [id, setId] = useState(""),
    [confirming, setConfirming] = useState(false),
    [includeCreator, setIncludeCreator] = useState(false);
  const theme = COLLECTION_THEMES.find((v) => v.id === id);
  return (
    <section data-supply-template-reuse className="panel space-y-4 p-4">
      <h2 className="text-xl font-bold">
        {t("重用虛構雙語故事範本", "Reuse fictional bilingual story templates")}
      </h2>
      <p>
        {t(
          "只替換未保存草稿的主故事與收藏目標。保留內容ID、合作關聯、日期、素材證據与用途；範本不等於正式授權、卡池或核准版本。",
          "Replaces only the unsaved draft story and collection goal. Content IDs, partner relations, dates, material evidence and uses stay intact. A template is not a formal licence, pool or approved revision.",
        )}
      </p>
      <label className="block">
        {t("故事範本", "Story template")}
        <select
          aria-label="Supply story template"
          className="block min-h-11 max-w-full rounded border bg-background p-2"
          disabled={disabled}
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setIncludeCreator(false);
          }}
        >
          <option value="">{t("選擇範本再預覽", "Choose a template to preview")}</option>
          {COLLECTION_THEMES.map((v) => (
            <option key={v.id} value={v.id}>
              {v.title[locale]}
            </option>
          ))}
        </select>
      </label>
      {theme && (
        <div className="space-y-3 rounded-lg border p-4" data-story-template-preview>
          <p className="whitespace-pre-wrap break-words">{theme.story[locale]}</p>
          <p>{theme.guide[locale]}</p>
          <CreatorContentTemplate seriesId={theme.id} />
          <p className="text-sm text-muted-foreground">
            {theme.source[locale]} · {theme.id} · v{theme.version}
          </p>
        </div>
      )}
      {value.editorial && CREATOR_CONTENT_TEMPLATES.some((v) => v.seriesId === id) && (
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            aria-label="Reuse creator outline"
            disabled={disabled}
            checked={includeCreator}
            onChange={(e) => setIncludeCreator(e.target.checked)}
          />
          {t(
            "同時替換虛構作品介紹與四題訪談題綱；不填真人回答，保留文章與素材。",
            "Also replace the fictional work introduction and four interview questions; no real answers, articles and materials remain intact.",
          )}
        </label>
      )}
      <Button disabled={disabled || !theme} onClick={() => setConfirming(true)}>
        {t("套用到目前未保存草稿", "Apply to the current unsaved draft")}
      </Button>
      <ConfirmDialog
        open={confirming && !disabled}
        title={t("替換雙語故事與目標？", "Replace the bilingual story and goal?")}
        description={t(
          includeCreator
            ? "替換故事、目標、虛構作品介紹及四題題綱；保留原文章、關聯、素材與日期。只修改草稿，保存後仍須指定版本審核。"
            : "只修改此頁故事與目標草稿，不保存、不送審、不發布。套用後仍需正常保存、指定版本審核；舊公開快照保持。",
          includeCreator
            ? "Replace story, goal, fictional introduction and four questions; preserve articles, relations, materials and dates. Draft-only, with normal saving and exact-version review still required."
            : "Only edits the page story and goal draft; no save, submission or publication. Normal saving and exact-version review are still required; the old public snapshot stays intact.",
        )}
        confirmLabel={t("確認套用文字", "Confirm text reuse")}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          if (theme && !disabled) onChange(reuseSupplyTemplate(value, theme.id, includeCreator));
          setConfirming(false);
        }}
      />
    </section>
  );
}
