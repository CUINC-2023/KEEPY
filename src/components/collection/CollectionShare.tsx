import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import type { PublicCollection } from "@/lib/collection-store";

/** Render only after the current server public projection has succeeded. */
export function CollectionShare({ data }: { data: PublicCollection }) {
  const handle = data.handle;
  const t = useDiscoveryText(),
    { locale } = useLocale(),
    [layout, setLayout] = useState<"compact" | "wide">("compact"),
    path = "/collectors/" + encodeURIComponent(handle);
  const [url, setUrl] = useState(path),
    [state, setState] = useState<"copied" | "manual" | null>(null);
  useEffect(() => {
    setUrl(new URL(path, window.location.origin).href);
    setState(null);
  }, [path]);
  return (
    <section className="panel space-y-3 p-4" data-collection-share>
      <h2 className="font-bold">
        {t("分享目前公開收藏頁", "Share the current public collection")}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t(
          "連結只含公開頁識別，不包含私人篩選、帳號或閱讀位置；訪客仍以目前公開設定讀取。",
          "The link contains only the public page handle, without private filters, accounts or reading positions. Visitors always read the current public settings.",
        )}
      </p>
      <label>
        {t("分享摘要版型", "Sharing summary layout")}{" "}
        <select
          aria-label="Public share layout"
          value={layout}
          onChange={(e) => setLayout(e.target.value === "wide" ? "wide" : "compact")}
        >
          <option value="compact">{t("精簡", "Compact")}</option>
          <option value="wide">{t("橫向", "Wide")}</option>
        </select>
      </label>
      <article
        data-public-share-card={layout}
        className={
          "rounded-xl border bg-muted/20 p-4 break-words " +
          (layout === "wide" ? "grid gap-3 sm:grid-cols-[1fr_2fr]" : "max-w-md space-y-3")
        }
      >
        <div
          className="rounded border p-3 text-sm"
          role="img"
          aria-label={t(
            "文字分享摘要；不預載任何卡面",
            "Text sharing summary; no card faces are preloaded",
          )}
        >
          {data.mainCard?.name ?? t("未公開主展示卡", "No public main card")}
        </div>
        <div className="min-w-0 space-y-2">
          <h3 className="font-bold">{data.displayName.slice(0, 80)}</h3>
          <p className="whitespace-pre-wrap">
            {(locale === "en" && data.bioEn ? data.bioEn : data.bio).slice(0, 180)}
          </p>
          <p>
            {t("已允許公開卡冊", "Permitted public albums")}: {data.progress.length} ·{" "}
            {t("已展示徽章", "Displayed badges")}: {data.awards.length}
          </p>
          <p className="text-xs text-muted-foreground">
            {t(
              "摘要僅來自目前匿名公開投影；沒有私人筆記、玩法、目標或持卡明細。撤回後此摘要失效，不產生永久圖片。",
              "Summary uses the current anonymous public projection only, with no private notes, play, goals or holding details. Withdrawal invalidates it; no permanent image is generated.",
            )}
          </p>
        </div>
      </article>
      <input
        aria-label="Public collection link"
        readOnly
        className="w-full rounded border bg-background p-3 text-sm"
        value={url}
        onFocus={(e) => e.target.select()}
      />
      <Button
        variant="outline"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setState("copied");
          } catch {
            setState("manual");
          }
        }}
      >
        {t("複製公開連結", "Copy public link")}
      </Button>
      {state && (
        <p role="status">
          {state === "copied"
            ? t("已複製公開連結", "Public link copied")
            : t(
                "無法使用剪貼簿；請選取上方連結手動複製。",
                "Clipboard unavailable; select the link above to copy it manually.",
              )}
        </p>
      )}
    </section>
  );
}
