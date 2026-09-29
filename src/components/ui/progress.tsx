import { cn } from "@/lib/utils";

export function Progress({
  value,
  max = 100,
  tone = "violet",
  className,
  showLabel,
  label,
}: {
  value: number;
  max?: number;
  tone?: "violet" | "gold";
  className?: string;
  showLabel?: boolean;
  label?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{label}</span>
          {showLabel && <span className="tabular-nums">{pct}%</span>}
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            tone === "gold"
              ? "bg-gradient-to-r from-gold-soft to-gold"
              : "bg-gradient-to-r from-primary/70 to-primary"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
