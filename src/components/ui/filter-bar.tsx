import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FilterBar({
  filters,
  active,
  onChange,
  right,
}: {
  filters: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
  right?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              active === f.key
                ? "border-primary/50 bg-primary/15 text-foreground"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
}
