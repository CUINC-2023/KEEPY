import { usePlayerUiText } from "@/lib/player-ui-text";
import { useEffect, useRef, useState } from "react";
import { CardFrame } from "@/components/ui/card-frame";
import { Button } from "@/components/ui/button";
import { goddessOf, type DrawResultItem } from "@/data/player";
import { isHighGrade } from "@/data/mock";

export function DrawCardDialog({
  items,
  index,
  onChange,
  onClose,
}: {
  items: DrawResultItem[];
  index: number;
  onChange: (index: number) => void;
  onClose: () => void;
}) {
  const tx = usePlayerUiText();
  const [flipped, setFlipped] = useState(false);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    setFlipped(false);
    setZoom(1);
  }, [index]);
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const item = items[index];
  useEffect(() => {
    previousFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    close.current?.focus();
    return () => previousFocus.current?.focus();
  }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "ArrowLeft" && index > 0) onChange(index - 1);
      if (event.key === "ArrowRight" && index < items.length - 1) onChange(index + 1);
      if (event.key === "Tab") {
        const focusable = Array.from(
          dialog.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [],
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first && last) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last && first) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onChange, onClose]);
  if (!item) return null;
  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-ink/95 p-3"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={tx(`抽卡結果第 ${index + 1} 張：${item.card.name}`)}
        className="w-full max-w-sm space-y-3 py-4"
      >
        <div className="flex items-center justify-between gap-2 text-primary-foreground">
          <p className="text-sm font-bold">
            {index + 1} / {items.length} · {item.isNew ? tx("NEW 新卡") : tx("重複卡")}{" "}
            {isHighGrade(item.card.grade) && tx("✦ 高階卡")}
          </p>
          <Button ref={close} size="sm" variant="outline" onClick={onClose}>
            {tx("關閉")}
          </Button>
        </div>
        <div className="mx-auto w-full max-w-[min(70vw,290px)] overflow-hidden rounded-xl">
          {flipped ? (
            <div className="card-frame flex aspect-[2/3] flex-col justify-between border border-gold/50 bg-card p-5 text-card-foreground">
              <div>
                <p className="font-black text-gold">
                  KEEPY · {tx("KEEPY · 卡牌背面").replace("KEEPY · ", "")}
                </p>
                <p className="mt-4 font-bold">{item.card.name}</p>
              </div>
              <dl className="space-y-3 text-xs">
                <div>
                  <dt>{tx("卡池")}</dt>
                  <dd className="font-bold">{item.card.poolName}</dd>
                </div>
                <div>
                  <dt>{tx("等級")}</dt>
                  <dd className="font-bold">{item.card.grade}</dd>
                </div>
                <div>
                  <dt>{tx("持有")}</dt>
                  <dd className="font-bold">{item.ownedBefore + 1}</dd>
                </div>
              </dl>
              <p className="text-xs text-muted-foreground">
                Local Mock · {tx("卡冊示意，不代表真實資產、交易或正式發行。")}
              </p>
            </div>
          ) : (
            <div style={{ transform: "scale(" + zoom + ")" }}>
              <CardFrame
                goddess={goddessOf(item.card)}
                grade={item.card.grade}
                cardName={item.card.name}
              />
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant="outline"
            aria-pressed={flipped}
            onClick={() => setFlipped((value) => !value)}
          >
            {tx(flipped ? "查看正面" : "翻至背面")}
          </Button>
          {[1, 1.35, 1.8].map((value) => (
            <Button
              key={value}
              variant={zoom === value ? "secondary" : "outline"}
              aria-label={tx("縮放示意") + " ×" + value}
              aria-pressed={zoom === value}
              disabled={flipped}
              onClick={() => setZoom(value)}
            >
              ×{value}
            </Button>
          ))}
        </div>
        <p className="text-center text-sm font-bold text-primary-foreground">
          {item.card.name} · {item.card.grade}
        </p>
        <div className="flex justify-between gap-2">
          <Button variant="outline" disabled={index === 0} onClick={() => onChange(index - 1)}>
            {tx("← 上一張")}
          </Button>
          <Button
            variant="outline"
            disabled={index === items.length - 1}
            onClick={() => onChange(index + 1)}
          >
            {tx("下一張 →")}
          </Button>
        </div>
      </div>
    </div>
  );
}
