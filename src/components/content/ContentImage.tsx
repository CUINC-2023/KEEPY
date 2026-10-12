import { useState } from "react";
import seasonArtwork from "@/assets/peekfuture-season-hero.jpg";
import { useDiscoveryText } from "@/lib/discovery-copy";
// Only current, allowed alternatives; never recover a card or older image.
export function ContentImage({ alt }: { alt: string }) {
  const [failed, setFailed] = useState(false),
    t = useDiscoveryText();
  return failed ? (
    <p
      data-content-image-error
      role="status"
      className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground"
    >
      {t(
        "示意圖片暫時無法載入；可繼續閱讀文字。",
        "The sample image could not load; you can continue reading the text.",
      )}
    </p>
  ) : (
    <img
      loading="lazy"
      decoding="async"
      className="h-auto w-full rounded-xl"
      src={seasonArtwork}
      alt={alt}
      onError={() => setFailed(true)}
    />
  );
}
