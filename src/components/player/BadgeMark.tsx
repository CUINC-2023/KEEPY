import { cn } from "@/lib/utils";

export function BadgeMark({
  label,
  className,
  variant = "first",
}: {
  label: string;
  className?: string;
  variant?: "first" | "series" | "activity";
}) {
  return (
    <div
      className={cn(
        "grid aspect-square place-items-center rounded-full border bg-muted/70 p-2 text-center shadow-inner",
        variant === "series"
          ? "border-primary/40 text-primary"
          : variant === "activity"
            ? "border-emerald-600/40 text-emerald-700 dark:text-emerald-300"
            : "border-gold/40 text-gold",
        className,
      )}
    >
      <div>
        <div
          aria-hidden="true"
          className={
            "mx-auto mb-1 h-5 w-5 border border-current bg-current/10 " +
            (variant === "activity"
              ? "rounded-full"
              : variant === "series"
                ? "rounded-sm border-double border-4"
                : "rotate-45 rounded-sm")
          }
        />
        <span className="block break-words text-xs font-black leading-tight">{label}</span>
      </div>
    </div>
  );
}
