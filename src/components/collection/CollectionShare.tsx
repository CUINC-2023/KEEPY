import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useDiscoveryText } from "@/lib/discovery-copy";

/** Render only after the current server public projection has succeeded. */
export function CollectionShare({ handle }: { handle: string }) {
  const t = useDiscoveryText(),
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
