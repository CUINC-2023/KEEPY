import { useEffect, useMemo } from "react";
import { articleAnchors } from "@/lib/article-anchors.mjs";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { useDiscoveryText } from "@/lib/discovery-copy";
import type { DiscoveryItem } from "@/lib/content-store";
import { ContentImage } from "./ContentImage";
export function StructuredArticle({
  item,
  privatePreview = false,
}: {
  item: DiscoveryItem;
  privatePreview?: boolean;
}) {
  const { locale } = useLocale(),
    t = useDiscoveryText();
  const blocks = useMemo(() => articleAnchors(item.id, item.blocks), [item.id, item.blocks]);
  const headings = blocks.filter((b) => b.type === "heading");
  useEffect(() => {
    const locate = () => {
      if (!location.hash) return;
      let anchor;
      try {
        anchor = decodeURIComponent(location.hash.slice(1));
      } catch {
        return;
      }
      // Only current public blocks are valid targets. Never recover removed content from a cache.
      if (!blocks.some((b) => b.anchor === anchor)) return;
      const element = document.getElementById(anchor);
      element?.focus({ preventScroll: true });
      element?.scrollIntoView({ block: "start" });
    };
    locate();
    window.addEventListener("hashchange", locate);
    return () => window.removeEventListener("hashchange", locate);
  }, [blocks, locale]);
  return (
    <div className="mx-auto max-w-3xl space-y-6" data-structured-article>
      {headings.length > 1 && (
        <nav
          aria-label={t("文章目錄", "Article contents")}
          className="rounded-lg border p-4"
          data-article-toc
        >
          <h2 className="mb-2 font-bold">{t("文章目錄", "Article contents")}</h2>
          <ol className="space-y-2">
            {headings.map(
              (b) =>
                b.type === "heading" && (
                  <li key={b.anchor}>
                    <a
                      className="break-words text-primary underline"
                      href={privatePreview ? undefined : "#" + b.anchor}
                      role={privatePreview ? "button" : undefined}
                      tabIndex={privatePreview ? 0 : undefined}
                      onKeyDown={(e) => {
                        if (privatePreview && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          const el = document.getElementById(b.anchor);
                          el?.focus({ preventScroll: true });
                          el?.scrollIntoView({ block: "start" });
                        }
                      }}
                      onClick={() => {
                        const el = document.getElementById(b.anchor);
                        el?.focus({ preventScroll: true });
                        if (privatePreview) el?.scrollIntoView({ block: "start" });
                      }}
                    >
                      {b.text[locale]}
                    </a>
                  </li>
                ),
            )}
          </ol>
        </nav>
      )}
      {blocks.map((b) =>
        b.type === "heading" ? (
          <h2
            key={b.anchor}
            id={b.anchor}
            tabIndex={-1}
            className="scroll-mt-24 break-words text-xl font-bold focus-visible:outline focus-visible:outline-primary"
          >
            {b.text[locale]}
          </h2>
        ) : b.type === "paragraph" ? (
          <p
            key={b.anchor}
            id={b.anchor}
            tabIndex={-1}
            className="scroll-mt-24 whitespace-pre-wrap break-words text-base leading-8 focus-visible:outline focus-visible:outline-primary"
          >
            {b.text[locale]}
          </p>
        ) : (
          <figure
            key={b.anchor}
            id={b.anchor}
            tabIndex={-1}
            className="scroll-mt-24 space-y-2 focus-visible:outline focus-visible:outline-primary"
          >
            {b.material.ref === "season-hero" ? (
              <ContentImage alt={b.material.alt[locale]} />
            ) : (
              <p>{b.material.alt[locale]}</p>
            )}
            <figcaption className="break-words text-sm leading-6 text-muted-foreground">
              {b.caption[locale]}
            </figcaption>
          </figure>
        ),
      )}
    </div>
  );
}
