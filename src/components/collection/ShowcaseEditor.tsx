import { Button } from "@/components/ui/button";
import { useDiscoveryText } from "@/lib/discovery-copy";
import type { CollectionProfile, CollectionProgress } from "@/lib/collection-store";

export function ShowcaseEditor({
  draft,
  change,
  pools,
}: {
  draft: CollectionProfile;
  change: (v: CollectionProfile) => void;
  pools: CollectionProgress[];
}) {
  const t = useDiscoveryText(),
    value = draft.presentation ?? { layout: "collector" as const, bioEn: "", poolIds: [] };
  const order = (ids: string[], label: string, onChange: (ids: string[]) => void) => (
    <ol className="space-y-2">
      {ids.map((id, i) => (
        <li key={id} className="flex flex-wrap gap-2">
          <span>
            {label} {i + 1}
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={i === 0}
            onClick={() => {
              const next = [...ids];
              const prior = next[i - 1];
              if (prior === undefined) return;
              next[i - 1] = id;
              next[i] = prior;
              onChange(next);
            }}
          >
            {t("上移", "Move up")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={i === ids.length - 1}
            onClick={() => {
              const next = [...ids];
              const after = next[i + 1];
              if (after === undefined) return;
              next[i + 1] = id;
              next[i] = after;
              onChange(next);
            }}
          >
            {t("下移", "Move down")}
          </Button>
        </li>
      ))}
    </ol>
  );
  return (
    <section className="space-y-3" data-showcase-editor>
      <h2 className="text-xl font-bold">{t("展示版型與順序", "Showcase layout and order")}</h2>
      <fieldset className="space-y-2">
        <legend>
          {t("受控配置預設（不改公開選擇）", "Controlled presets (public choices stay unchanged)")}
        </legend>
        <div className="flex flex-wrap gap-3">
          {(
            [
              {
                id: "collector",
                label: t("收藏家原主題", "Original collector"),
                layout: "collector",
                theme: "classic",
                shelfLayout: "grid",
              },
              {
                id: "albums",
                label: t("卡冊暖光閱讀", "Warm album reading"),
                layout: "albums",
                theme: "linen",
                shelfLayout: "wide",
              },
              {
                id: "badges",
                label: t("典藏簡潔展示", "Quiet archive display"),
                layout: "badges",
                theme: "quiet",
                shelfLayout: "grid",
              },
              {
                id: "prism-albums",
                label: t("折光卡冊導覽", "Prism album tour"),
                layout: "albums",
                theme: "cobalt",
                shelfLayout: "wide",
              },
              {
                id: "paper-badges",
                label: t("紙頁徽章典藏", "Paper badge archive"),
                layout: "badges",
                theme: "sepia",
                shelfLayout: "grid",
              },
            ] as const
          ).map((p) => (
            <Button
              key={p.id}
              type="button"
              variant="outline"
              data-showcase-preset={p.id}
              onClick={() =>
                change({
                  ...draft,
                  presentation: {
                    ...value,
                    layout: p.layout,
                    theme: p.theme,
                    shelfLayout: p.shelfLayout,
                  },
                })
              }
            >
              {p.label}
            </Button>
          ))}
        </div>
      </fieldset>
      <label className="block">
        {t("主題版型", "Theme layout")}{" "}
        <select
          aria-label="Showcase layout"
          value={value.layout}
          onChange={(e) =>
            change({
              ...draft,
              presentation: { ...value, layout: e.target.value as typeof value.layout },
            })
          }
        >
          <option value="collector">{t("收藏家", "Collector")}</option>
          <option value="albums">{t("卡冊", "Albums")}</option>
          <option value="badges">{t("成就", "Achievements")}</option>
        </select>
      </label>
      <label className="block">
        {t("英文介紹", "English bio")}
        <textarea
          aria-label="English collection bio"
          className="w-full rounded border p-2"
          maxLength={500}
          value={value.bioEn}
          onChange={(e) => change({ ...draft, presentation: { ...value, bioEn: e.target.value } })}
        />
      </label>
      <label className="block">
        {t("展示風格", "Display style")}{" "}
        <select
          aria-label="Showcase style"
          value={value.theme ?? "classic"}
          onChange={(e) =>
            change({
              ...draft,
              presentation: {
                ...value,
                theme: e.target.value as NonNullable<
                  NonNullable<CollectionProfile["presentation"]>["theme"]
                >,
              },
            })
          }
        >
          <option value="classic">{t("原主題", "Original theme")}</option>
          <option value="quiet">{t("簡潔", "Quiet")}</option>
          <option value="contrast">{t("醒目邊框", "Strong borders")}</option>
          <option value="linen">{t("紙感暖光", "Warm paper")}</option>
          <option value="aurora">{t("柔和彩光", "Soft aurora")}</option>
          <option value="ink">{t("墨色線框", "Ink lines")}</option>
          <option value="cobalt">{t("鈷藍色帶", "Cobalt bands")}</option>
          <option value="graphite">{t("石墨線框", "Graphite outlines")}</option>
          <option value="moss">{t("苔綠書架", "Moss shelves")}</option>
          <option value="sepia">{t("褐彩典藏", "Sepia archive")}</option>
          <option value="dawn">{t("晨光層次", "Dawn layers")}</option>
        </select>
      </label>
      <label className="block">
        {t("卡架排列", "Shelf arrangement")}{" "}
        <select
          aria-label="Showcase shelf layout"
          value={value.shelfLayout ?? "grid"}
          onChange={(e) =>
            change({
              ...draft,
              presentation: { ...value, shelfLayout: e.target.value as "grid" | "wide" },
            })
          }
        >
          <option value="grid">{t("緊湊卡架", "Compact shelf")}</option>
          <option value="wide">{t("寬幅卡架", "Wide shelf")}</option>
        </select>
      </label>
      <fieldset>
        <legend>{t("封面與徽章配置", "Cover and badge arrangements")}</legend>
        <label>
          {t("封面", "Cover")}
          <select
            aria-label="Showcase cover"
            value={value.coverMode ?? "plain"}
            onChange={(e) =>
              change({
                ...draft,
                presentation: { ...value, coverMode: e.target.value === "band" ? "band" : "plain" },
              })
            }
          >
            <option value="plain">{t("原版", "Original")}</option>
            <option value="band">{t("品牌色帶", "Brand band")}</option>
          </select>
        </label>
        <label>
          {t("徽章排列", "Badge arrangement")}
          <select
            aria-label="Showcase badges"
            value={value.badgeLayout ?? "list"}
            onChange={(e) =>
              change({
                ...draft,
                presentation: {
                  ...value,
                  badgeLayout: e.target.value === "grid" ? "grid" : "list",
                },
              })
            }
          >
            <option value="list">{t("清單", "List")}</option>
            <option value="grid">{t("格列", "Grid")}</option>
          </select>
        </label>
      </fieldset>
      <fieldset>
        <legend>
          {t(
            "精選公開卡冊（依勾選順序，需開啟進度展示）",
            "Featured public albums (selection order; requires progress display)",
          )}
        </legend>
        {pools.map((p) => (
          <label key={p.poolId} className="block">
            <input
              type="checkbox"
              checked={value.poolIds.includes(p.poolId)}
              disabled={!value.poolIds.includes(p.poolId) && value.poolIds.length >= 12}
              onChange={(e) =>
                change({
                  ...draft,
                  presentation: {
                    ...value,
                    poolIds: e.target.checked
                      ? [...value.poolIds, p.poolId]
                      : value.poolIds.filter((id) => id !== p.poolId),
                  },
                })
              }
            />{" "}
            {p.title["zh-TW"]} / {p.title.en}
          </label>
        ))}
      </fieldset>
      {order(value.poolIds, t("精選卡冊", "Featured album"), (poolIds) =>
        change({ ...draft, presentation: { ...value, poolIds } }),
      )}
      {order(draft.shelfIds, t("收藏櫃卡牌", "Shelf card"), (shelfIds) =>
        change({ ...draft, shelfIds }),
      )}
      {draft.badgeIds &&
        order(draft.badgeIds, t("已選徽章", "Selected badge"), (badgeIds) =>
          change({ ...draft, badgeIds }),
        )}
      <p>
        {t(
          "順序與介紹使用同一份本機公開設定保存；預覽不授予公開權限。",
          "Order and bio use the same local public settings. Preview grants no public permissions.",
        )}
      </p>
    </section>
  );
}
