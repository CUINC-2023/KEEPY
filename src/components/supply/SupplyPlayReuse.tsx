import { useState } from "react";
import { PLAY_CONTENT_PACKS } from "@/lib/play-packs.mjs";
import { reusePlayOutline } from "@/lib/supply-play-template.mjs";
import type { SupplyValue } from "@/lib/supply-store";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
export function SupplyPlayReuse({
  value,
  disabled,
  onChange,
}: {
  value: SupplyValue;
  disabled: boolean;
  onChange: (v: SupplyValue) => void;
}) {
  const { locale } = useLocale(),
    t = useDiscoveryText(),
    [selected, setSelected] = useState(""),
    [confirm, setConfirm] = useState(false);
  const pack = PLAY_CONTENT_PACKS.find((p) => p.id === selected);
  return (
    <section className="panel space-y-3 p-4" data-supply-play-reuse>
      <h2>{t("題組內容草稿範本", "Question-content draft templates")}</h2>
      <p>
        {t(
          "新增獨立雙語文章草稿，保留來源與答案供審查；沿原文章編輯、指定版本核准及發布流程。不自動啟用玩家題庫，也不變更原素材用途。",
          "Adds an independent bilingual article draft with sources and answers for review, using existing article editing, exact-version approval and publication. Does not activate the player question bank or alter material uses.",
        )}
      </p>
      <select
        aria-label="Supply play outline"
        className="min-h-11 max-w-full rounded border bg-background p-2"
        value={selected}
        disabled={disabled}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="">{t("選擇示意題綱", "Choose a sample outline")}</option>
        {PLAY_CONTENT_PACKS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title[locale]} · v{p.version}
          </option>
        ))}
      </select>
      {pack && (
        <details data-play-outline-preview>
          <summary>{t("預覽六題與來源", "Preview six questions and sources")}</summary>
          <ol className="space-y-3">
            {pack.questions.map((q) => (
              <li key={q.id}>
                <h3>{q.prompt[locale]}</h3>
                {q.material.ref === "geometry-circles" && <p>{"○ ".repeat(q.material.count)}</p>}
                <p>{q.options.map((o) => o.id + ": " + o.label[locale]).join(" · ")}</p>
                <p>
                  {t("答案", "Answer")} {q.answer} · {q.explanation[locale]}
                </p>
                <p>
                  {pack.source[locale]} · {q.sourceRef.templateId} v{q.sourceRef.version} ·{" "}
                  {q.sourceRef.chapter}
                </p>
              </li>
            ))}
          </ol>
        </details>
      )}
      <Button
        disabled={disabled || !pack || !value.editorial || value.editorial.articles.length >= 8}
        onClick={() => setConfirm(true)}
      >
        {t("預覽加入題綱文章", "Preview adding an outline article")}
      </Button>
      <ConfirmDialog
        open={confirm && !disabled}
        title={t("加入未保存題綱文章？", "Add an unsaved outline article?")}
        description={t(
          "新增獨立ID與雙語正文，沒有保存／送審／發布或授權。仍須檢查來源、必要翻譯、期間與用途；修改後重新審核，原公開快照保持。",
          "Adds an independent ID and bilingual body without saving, submitting, publishing or licensing. Sources, translations, periods and uses still need checks; edits require review while the public snapshot is retained.",
        )}
        confirmLabel={t("加入題綱草稿", "Add outline draft")}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          if (pack)
            onChange(reusePlayOutline(value, pack.id, "local-play-outline-" + crypto.randomUUID()));
          setConfirm(false);
        }}
      />
    </section>
  );
}
