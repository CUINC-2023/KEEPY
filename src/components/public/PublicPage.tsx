import type { ReactNode } from "react";
import { StatePlaceholder, StateSwitcher, useDemoState } from "@/components/ui/state-demo";

export function PublicPage({
  title,
  description,
  children,
  emptyTitle = "目前沒有可顯示的內容",
}: {
  title: string;
  description: string;
  children: ReactNode;
  emptyTitle?: string;
}) {
  const [state, setState] = useDemoState();
  return (
    <div className="mx-auto max-w-6xl space-y-6 overflow-x-clip">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black sm:text-3xl">{title}</h1>
          <span className="demo-chip">Local Mock</span>
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      </header>
      <StateSwitcher state={state} onChange={setState} />
      {state === "ok" ? children : <StatePlaceholder state={state} emptyTitle={emptyTitle} />}
    </div>
  );
}

export function SectionTitle({ title, note }: { title: string; note?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <h2 className="text-lg font-black sm:text-xl">{title}</h2>
      {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}

export function TextStatus({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "gold" | "live" }) {
  const style = tone === "live" ? "border-primary/40 bg-primary/10 text-primary" : tone === "gold" ? "border-gold/40 bg-gold/10 text-gold" : "border-border bg-muted text-muted-foreground";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${style}`}>{children}</span>;
}