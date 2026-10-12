import { useRef, useState } from "react";
import type { Bilingual } from "@/lib/collection-store";
import type { SupplyMaterial } from "@/lib/supply-store";
import type { SupplyCheckItem } from "@/lib/supply-checklist.mjs";
import type { Editorial, EditorialBlock } from "@/lib/supply-store";
import { blankArticle, moveItem, ARTICLE_CATEGORIES } from "@/lib/editorial-draft.mjs";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
const categoryLabels: Record<string, [string, string]> = {
  design: ["設計故事", "Design"],
  guide: ["收藏指南", "Guide"],
  interview: ["訪談", "Interview"],
  "behind-scenes": ["花絮", "Behind the scenes"],
};
const outlinePrompts: Record<string, string[]> = {
  design: [
    "構圖／Composition",
    "視線與姿態／Gaze and pose",
    "光線與色彩／Light and colour",
    "下一步閱讀／Next reading",
  ],
  guide: [
    "不同款式／Distinct designs",
    "重複卡／Duplicates",
    "曾取得與持有／Acquired and held",
    "公開進度／Public progress",
  ],
  interview: [
    "創作起點／Creative starting point",
    "主題選擇／Theme choices",
    "製作方法／Process",
    "下一季方向／Next season",
  ],
  "behind-scenes": [
    "企劃與來源／Plan and sources",
    "拍攝流程／Shoot process",
    "卡面製作／Card design",
    "回顧／Review",
  ],
};
const blank = (): Bilingual => ({ "zh-TW": "", en: "" });
function Pair({
  label,
  field,
  value,
  change,
  hint,
}: {
  hint?: string | undefined;
  label: string;
  field: string;
  value: Bilingual;
  change?: ((v: Bilingual) => void) | undefined;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="font-semibold">{label}</legend>
      {(["zh-TW", "en"] as const).map((l) => (
        <label key={l} className="block">
          {l}
          <textarea
            placeholder={hint}
            aria-label={label + " " + l}
            data-editorial-field={field}
            data-locale={l}
            readOnly={!change}
            maxLength={12000}
            className="block min-h-24 w-full rounded border bg-background p-2"
            value={value[l]}
            onChange={(e) => change?.({ ...value, [l]: e.target.value })}
          />
        </label>
      ))}
    </fieldset>
  );
}
export function EditorialEditor({
  value,
  materialIds,
  materials = [],
  materialIssues = [],
  onChange,
  locateMaterial,
}: {
  value?: Editorial | undefined;
  materialIds: string[];
  materials?: SupplyMaterial[];
  materialIssues?: SupplyCheckItem[];
  onChange?: ((v: Editorial) => void) | undefined;
  locateMaterial?: ((id: string) => void) | undefined;
}) {
  const t = useDiscoveryText(),
    keys = useRef(new WeakMap<object, string>()),
    root = useRef<HTMLElement>(null),
    [removal, setRemoval] = useState<{ kind: "article" | "block"; target: object } | null>(null);
  const key = (object: object) => {
    let id = keys.current.get(object);
    if (!id) {
      id = crypto.randomUUID();
      keys.current.set(object, id);
    }
    return id;
  };
  const keep = <T extends object>(previous: object, next: T) => {
    keys.current.set(next, key(previous));
    return next;
  };
  if (!value)
    return (
      <div>
        <p>
          {t(
            "舊内容包維持原 copy；加入正文後，所有新欄位一併審核。",
            "Legacy packages keep their copy; added editorial fields are reviewed together.",
          )}
        </p>
        {onChange && (
          <Button
            onClick={() =>
              onChange({
                creatorIntro: blank(),
                questions: Array.from({ length: 4 }, blank),
                articles: [],
              })
            }
          >
            {t("加入雙語正文與訪談題綱", "Add bilingual articles and interview outline")}
          </Button>
        )}
      </div>
    );
  const article = (i: number, update: Partial<Editorial["articles"][number]>) =>
    onChange?.({
      ...value,
      articles: value.articles.map((a, n) => (n === i ? keep(a, { ...a, ...update }) : a)),
    });
  const block = (i: number, j: number, next: EditorialBlock) =>
    article(i, { blocks: value.articles[i]!.blocks.map((b, n) => (n === j ? keep(b, next) : b)) });
  const focusAfter = (action: () => void) => {
    const active = document.activeElement as HTMLElement;
    action();
    requestAnimationFrame(() => {
      if (active?.isConnected && !active.matches(":disabled")) active.focus();
      else root.current?.focus();
    });
  };
  const remove = () => {
    if (!onChange || !removal) return;
    const target = removal.target;
    onChange({
      ...value,
      articles: value.articles
        .filter((a) => removal.kind !== "article" || a !== target)
        .map((a) =>
          removal.kind === "block"
            ? keep(a, { ...a, blocks: a.blocks.filter((b) => b !== target) })
            : a,
        ),
    });
    setRemoval(null);
    requestAnimationFrame(() => root.current?.focus());
  };
  return (
    <section ref={root} tabIndex={-1} data-editorial-editor className="space-y-5 break-words">
      <ConfirmDialog
        open={removal !== null}
        title={t("移除目前草稿內容？", "Remove content from this draft?")}
        description={t(
          "只影響尚未保存的編輯；已保存及發布快照不變。取消或Escape保留內容。",
          "Only current unsaved edits change; saved and published snapshots remain intact. Cancel or Escape keeps content.",
        )}
        confirmLabel={t("移除草稿內容", "Remove draft content")}
        cancelLabel={t("繼續編輯", "Keep editing")}
        tone="danger"
        onCancel={() => setRemoval(null)}
        onConfirm={remove}
      />
      <h2 className="text-xl font-bold">
        {t(
          "正文、創作者介紹與題綱（隨版本審核）",
          "Articles, creator introduction and outline (reviewed with this revision)",
        )}
      </h2>
      <Pair
        field="creatorIntro"
        label={t("創作者介紹", "Creator introduction")}
        value={value.creatorIntro}
        change={onChange ? (v) => onChange({ ...value, creatorIntro: v }) : undefined}
      />
      <p>
        {t(
          "四題訪談題綱；真人回答尚未提供，不填造假答案。",
          "Four interview prompts; real answers have not been supplied.",
        )}
      </p>
      {value.questions.map((q, i) => (
        <Pair
          key={i}
          field={"question-" + (i + 1)}
          label={t("訪談題綱 ", "Interview prompt ") + (i + 1)}
          value={q}
          change={
            onChange
              ? (v) =>
                  onChange({
                    ...value,
                    questions: value.questions.map((q, n) => (n === i ? v : q)),
                  })
              : undefined
          }
        />
      ))}
      {value.articles.map((a, i) => (
        <section
          key={key(a)}
          data-editorial-article-id={a.id}
          data-editor-key={key(a)}
          className="space-y-4 rounded border p-3"
        >
          <h3>
            {t("文章 ", "Article ") + (i + 1)} · {a.category}
          </h3>
          <label className="block">
            {t("獨立示意文章 ID", "Independent sample article ID")}
            <input
              aria-label={"Editorial article ID " + i}
              data-editorial-field="id"
              value={a.id}
              readOnly={!onChange}
              className="block w-full border bg-background p-2"
              maxLength={96}
              onChange={(e) => article(i, { id: e.target.value })}
            />
          </label>
          <label>
            {t("文章分類", "Article category")}
            <select
              data-editorial-field="category"
              aria-label={"Editorial category " + i}
              disabled={!onChange}
              value={a.category}
              className="block border bg-background p-2"
              onChange={(e) => article(i, { category: e.target.value })}
            >
              {ARTICLE_CATEGORIES.map((k: string) => (
                <option key={k} value={k}>
                  {t(categoryLabels[k]?.[0] ?? k, categoryLabels[k]?.[1] ?? k)}
                </option>
              ))}
            </select>
          </label>
          <Pair
            field="title"
            label={t("文章標題 ", "Article title ") + (i + 1)}
            value={a.title}
            change={onChange ? (v) => article(i, { title: v }) : undefined}
          />
          <Pair
            field="summary"
            label={t("文章摘要 ", "Article summary ") + (i + 1)}
            value={a.summary}
            change={onChange ? (v) => article(i, { summary: v }) : undefined}
          />
          {a.blocks.map((b, j) => (
            <div
              key={key(b)}
              data-editorial-block-index={j}
              data-editor-key={key(b)}
              className="space-y-2 rounded border p-3"
            >
              <h4>
                {t("區塊 ", "Block ") + (j + 1)} ·{" "}
                {t(
                  b.type === "heading" ? "標題" : b.type === "paragraph" ? "段落" : "圖片",
                  b.type,
                )}
              </h4>
              {b.type === "image" ? (
                <>
                  <label>
                    {t("本人素材參照", "Own material reference")}
                    <select
                      aria-label={"Editorial material " + i + " " + j}
                      data-editorial-field="material"
                      disabled={!onChange}
                      value={b.materialId}
                      className="block w-full border bg-background p-2"
                      onChange={(e) => block(i, j, { ...b, materialId: e.target.value })}
                    >
                      <option value="">{t("選擇本人素材", "Select own material")}</option>
                      {materialIds.map((id) => (
                        <option key={id}>{id}</option>
                      ))}
                    </select>
                  </label>
                  <div data-editor-material-check className="panel space-y-1 p-3">
                    {(() => {
                      const m = materials.find((m) => m.id === b.materialId);
                      return m ? (
                        <>
                          <p>
                            {m.id} · v{m.version} · {m.ref}
                          </p>
                          <p>
                            {t(
                              "網站用途（僅本機示意，非正式授權）",
                              "Website use (local sample, not formal rights)",
                            )}
                            : {m.uses.website}
                          </p>
                          <p>
                            {m.startAt || "—"} → {m.endAt || "—"}
                          </p>
                          <p>
                            {t("替代文字", "Alternative text")}: {m.alt["zh-TW"] || "—"} /{" "}
                            {m.alt.en || "—"}
                          </p>
                          {materialIssues
                            .filter((x) => x.materialId === m.id)
                            .map((x, n) => (
                              <p key={n}>
                                {t("素材缺項", "Material missing")}: {x.field} {x.locale}
                              </p>
                            ))}
                        </>
                      ) : (
                        <p role="alert">
                          {t(
                            "本人素材參照缺失；不能保存或公開圖片。",
                            "Own material reference missing; image cannot be saved or published.",
                          )}
                        </p>
                      );
                    })()}
                  </div>
                  <Pair
                    field="caption"
                    label={t("圖片說明 ", "Image caption ") + (i + 1) + "." + (j + 1)}
                    value={b.caption}
                    change={onChange ? (v) => block(i, j, { ...b, caption: v }) : undefined}
                  />
                  <p>
                    {t(
                      "alt、來源、網站用途與期間沿本人素材版本；未知參照無法保存／公開。",
                      "Alt, source, website use and period use your material revision; unknown references cannot be saved or published.",
                    )}
                  </p>
                  {locateMaterial && (
                    <Button variant="outline" onClick={() => locateMaterial(b.materialId)}>
                      {t("檢查原素材缺項", "Check original material fields")}
                    </Button>
                  )}
                </>
              ) : (
                <Pair
                  hint={
                    b.type === "heading"
                      ? outlinePrompts[a.category]?.[Math.floor(j / 2)]
                      : undefined
                  }
                  field="text"
                  label={t("正文區塊 ", "Body block ") + (i + 1) + "." + (j + 1)}
                  value={b.text}
                  change={onChange ? (v) => block(i, j, { ...b, text: v }) : undefined}
                />
              )}
              {onChange && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    data-move-block="up"
                    disabled={j === 0}
                    variant="outline"
                    onClick={() =>
                      focusAfter(() => article(i, { blocks: moveItem(a.blocks, j, -1) }))
                    }
                  >
                    {t("區塊上移", "Move block up")}
                  </Button>
                  <Button
                    data-move-block="down"
                    disabled={j === a.blocks.length - 1}
                    variant="outline"
                    onClick={() =>
                      focusAfter(() => article(i, { blocks: moveItem(a.blocks, j, 1) }))
                    }
                  >
                    {t("區塊下移", "Move block down")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setRemoval({ kind: "block", target: b })}
                  >
                    {t("移除此區塊", "Remove block")}
                  </Button>
                </div>
              )}
            </div>
          ))}
          {onChange && (
            <div className="flex flex-wrap gap-2">
              {(["heading", "paragraph", "image"] as const).map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  disabled={a.blocks.length >= 40}
                  onClick={() =>
                    article(i, {
                      blocks: [
                        ...a.blocks,
                        type === "image"
                          ? { type, materialId: "", caption: blank() }
                          : { type, text: blank() },
                      ],
                    })
                  }
                >
                  {t("新增", "Add")}{" "}
                  {t(type === "heading" ? "標題" : type === "paragraph" ? "段落" : "圖片", type)}
                </Button>
              ))}
              <Button
                data-move-article="up"
                disabled={i === 0}
                onClick={() =>
                  focusAfter(() =>
                    onChange({ ...value, articles: moveItem(value.articles, i, -1) }),
                  )
                }
              >
                {t("文章上移", "Move article up")}
              </Button>
              <Button
                data-move-article="down"
                disabled={i === value.articles.length - 1}
                onClick={() =>
                  focusAfter(() => onChange({ ...value, articles: moveItem(value.articles, i, 1) }))
                }
              >
                {t("文章下移", "Move article down")}
              </Button>
              <Button variant="outline" onClick={() => setRemoval({ kind: "article", target: a })}>
                {t("移除此文章", "Remove article")}
              </Button>
            </div>
          )}
        </section>
      ))}
      {onChange && value.articles.length < 8 && (
        <div className="panel space-y-2 p-3" data-article-outlines>
          <p>
            {t(
              "新增空白題綱：先填雙語標題／摘要，再寫四組標題與段落。設計寫構圖選擇，指南寫閱讀步驟，訪談只列問題，花絮寫已確認的製作過程。不替換現有文章，不補真人回答或授權。",
              "New blank outlines: add bilingual title/summary and four heading/paragraph pairs. Design covers composition; guides cover reading steps; interviews contain questions only; behind-the-scenes covers confirmed production. Existing articles stay intact. No answers or rights are supplied.",
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {ARTICLE_CATEGORIES.map((category: string) => (
              <Button
                key={category}
                data-outline={category}
                onClick={() =>
                  onChange({
                    ...value,
                    articles: [
                      ...value.articles,
                      blankArticle(category, "local-article-" + crypto.randomUUID()),
                    ],
                  })
                }
              >
                {t("空白題綱 ", "Blank outline ") +
                  t(
                    categoryLabels[category]?.[0] ?? category,
                    categoryLabels[category]?.[1] ?? category,
                  )}
              </Button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
