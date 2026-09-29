import { useEffect, useRef } from "react";
import { CardFrame } from "@/components/ui/card-frame";
import { Button } from "@/components/ui/button";
import { goddessOf, type DrawResultItem } from "@/data/player";
import { isHighGrade } from "@/data/mock";

export function DrawCardDialog({ items, index, onChange, onClose }: { items: DrawResultItem[]; index: number; onChange: (index: number) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const item = items[index];
  useEffect(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    close.current?.focus();
    return () => previousFocus.current?.focus();
  }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key === "ArrowLeft" && index > 0) onChange(index - 1);
      if (event.key === "ArrowRight" && index < items.length - 1) onChange(index + 1);
      if (event.key === "Tab") {
        const focusable = Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
        const first = focusable[0]; const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first && last) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last && first) { event.preventDefault(); first.focus(); }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onChange, onClose]);
  if (!item) return null;
  return <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-ink/95 p-3" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-label={`抽卡結果第 ${index + 1} 張：${item.card.name}`} className="w-full max-w-sm space-y-3 py-4">
      <div className="flex items-center justify-between gap-2 text-primary-foreground"><p className="text-sm font-bold">{index + 1} / {items.length} · {item.isNew ? "NEW 新卡" : "重複卡"} {isHighGrade(item.card.grade) && "✦ 高階卡"}</p><Button ref={close} size="sm" variant="outline" onClick={onClose}>關閉</Button></div>
      <div className="mx-auto w-full max-w-[min(70vw,290px)]"><CardFrame goddess={goddessOf(item.card)} grade={item.card.grade} cardName={item.card.name} /></div>
      <p className="text-center text-sm font-bold text-primary-foreground">{item.card.name} · {item.card.grade}</p>
      <div className="flex justify-between gap-2"><Button variant="outline" disabled={index === 0} onClick={() => onChange(index - 1)}>← 上一張</Button><Button variant="outline" disabled={index === items.length - 1} onClick={() => onChange(index + 1)}>下一張 →</Button></div>
    </div>
  </div>;
}