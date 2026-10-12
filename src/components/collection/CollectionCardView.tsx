import { useState, useRef } from "react";
import { CardFrame } from "@/components/ui/card-frame";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ALBUM } from "@/data/player";
import { goddessById, cardsByPool } from "@/data/mock";
import { useDiscoveryText } from "@/lib/discovery-copy";
import type { CollectionCard } from "@/lib/collection-store";

/** Callers supply only the current authorized collection projection, never missing-card definitions. */
export function CollectionCardView({ card }: { card: CollectionCard }) {
  const launcher = useRef<HTMLDivElement>(null);
  const t = useDiscoveryText(),
    [open, setOpen] = useState(false),
    [back, setBack] = useState(false),
    [zoom, setZoom] = useState(1),
    [background, setBackground] = useState<"studio" | "plain">("studio");
  const definition = ALBUM.find((a) => a.id === card.cardId && a.poolId === card.poolId);
  if (!definition)
    return (
      <p className="panel p-4">
        {card.name} · {t("示意文字卡面", "Sample text card")}
      </p>
    );
  const frame = (interactive: boolean) => (
    <CardFrame
      goddess={goddessById(definition.goddessId)}
      grade={definition.grade}
      cardName={definition.name}
      art={cardsByPool(card.poolId).find((x) => x.id === card.cardId)?.art}
      onClick={
        interactive
          ? () => {
              setBack(false);
              setBackground("studio");
              setZoom(1);
              setOpen(true);
            }
          : undefined
      }
    />
  );
  return (
    <>
      <div data-collection-card ref={launcher}>
        {frame(true)}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            launcher.current?.querySelector("button")?.focus();
          }}
          className="max-h-[90dvh] max-w-sm overflow-y-auto motion-reduce:animate-none"
          data-collection-card-dialog
        >
          <DialogTitle>{card.name}</DialogTitle>
          <DialogDescription>
            {t(
              "目前可展示的合法卡面；背面只顯示相同公開款式資訊。",
              "Currently displayable card face. The back contains only the same public design information.",
            )}
          </DialogDescription>
          <div
            className="max-h-[55dvh] overflow-auto rounded-xl touch-pan-x touch-pan-y"
            data-card-detail-viewport
          >
            <div
              style={{ width: `${zoom * 100}%` }}
              className={
                background === "studio"
                  ? "rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/15 via-background to-gold/10 p-3"
                  : "rounded-2xl border border-border bg-muted p-3"
              }
              data-card-background={background}
            >
              {back ? (
                <div className="card-frame grid place-items-center p-6 text-center" data-card-back>
                  <div>
                    <p>KEEPY</p>
                    <p>{card.name}</p>
                    <p>
                      {card.rarity} · v{card.cardVersion}
                    </p>
                  </div>
                </div>
              ) : (
                frame(false)
              )}
            </div>
          </div>
          {!back && (
            <label className="space-y-2">
              {t("細節放大（僅本次閱覽）", "Detail zoom (this viewing only)")} · {zoom.toFixed(1)}×
              <input
                className="block w-full min-h-11"
                aria-label="Card detail zoom"
                type="range"
                min="1"
                max="2"
                step="0.25"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </label>
          )}
          <p className="text-sm text-muted-foreground">
            {t("目前合法版本", "Current authorized version")}: v{card.cardVersion} · {card.rarity}.{" "}
            {t(
              "沒有其他已授權版本資料，不提供推測比較。放大後可滑動閱讀；不保存閱覽偏好。",
              "No other authorized version is available for comparison. Pan to read zoomed details; viewing preferences are not saved.",
            )}
          </p>
          <fieldset className="flex flex-wrap gap-2">
            <legend className="mb-2 text-xs text-muted-foreground">
              {t("展示背景（僅本次閱覽）", "Display background (this viewing only)")}
            </legend>
            <Button
              className="min-h-11"
              variant="outline"
              aria-pressed={background === "studio"}
              onClick={() => setBackground("studio")}
            >
              {t("柔光背景", "Soft light")}
            </Button>
            <Button
              className="min-h-11"
              variant="outline"
              aria-pressed={background === "plain"}
              onClick={() => setBackground("plain")}
            >
              {t("素色背景", "Plain background")}
            </Button>
          </fieldset>
          <Button className="min-h-11" onClick={() => setBack((v) => !v)} aria-pressed={back}>
            {back ? t("查看正面", "View front") : t("翻至背面", "View back")}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
