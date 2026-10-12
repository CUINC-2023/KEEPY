import { cn } from "@/lib/utils";

type Tone = "live" | "pending" | "resting" | "info" | "gold" | "danger";

const TONE_STYLE: Record<Tone, string> = {
  live: "bg-emerald-400/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/40",
  pending: "bg-amber-400/10 text-amber-800 dark:text-amber-300 border-amber-500/40",
  resting: "bg-sky-400/10 text-sky-700 dark:text-sky-300 border-sky-500/40",
  info: "bg-primary/10 text-primary border-primary/30",
  gold: "bg-gold/10 text-gold border-gold/40",
  danger: "bg-destructive/10 text-destructive border-destructive/40",
};

const LABEL: Record<Tone, string> = {
  live: "營業中",
  pending: "審核中",
  resting: "休息中",
  info: "資訊",
  gold: "精選",
  danger: "注意",
};

export function StatusTag({
  tone = "info",
  label,
  className,
}: {
  tone?: Tone;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold leading-relaxed",
        TONE_STYLE[tone],
        className,
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {label ?? LABEL[tone]}
    </span>
  );
}
