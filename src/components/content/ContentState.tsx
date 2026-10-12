import type { ReactNode } from "react";
export function ContentState({
  kind,
  children,
}: {
  kind: "loading" | "empty" | "error";
  children: ReactNode;
}) {
  return (
    <div
      data-content-state={kind}
      role={kind === "error" ? "alert" : "status"}
      aria-busy={kind === "loading"}
      className={
        "panel min-w-0 space-y-3 break-words p-4 " +
        (kind === "error" ? "border-destructive/40" : "")
      }
    >
      {kind === "loading" && (
        <div
          aria-hidden="true"
          className="h-2 w-20 animate-pulse rounded bg-primary/30 motion-reduce:animate-none"
        />
      )}
      {children}
    </div>
  );
}
