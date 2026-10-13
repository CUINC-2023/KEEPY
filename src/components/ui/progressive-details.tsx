import { useRef, type ReactNode } from "react";

/** Secondary information remains reachable by touch and keyboard without hover. */
export function ProgressiveDetails({
  summary,
  children,
  className = "",
}: {
  summary: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const summaryRef = useRef<HTMLElement>(null);
  return (
    <details
      data-progressive-details
      className={`min-w-0 rounded-xl border border-border ${className}`}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !event.currentTarget.open) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.open = false;
        summaryRef.current?.focus();
      }}
    >
      <summary
        ref={summaryRef}
        className="min-h-11 cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        {summary}
      </summary>
      <div className="space-y-3 break-words px-3 pb-3 text-sm leading-relaxed">{children}</div>
    </details>
  );
}
