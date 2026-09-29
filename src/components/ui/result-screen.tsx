import type { ReactNode } from "react";

export function ResultScreen({
  open,
  title,
  onClose,
  children,
  tone = "violet",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  tone?: "violet" | "gold";
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-ink/85 p-4 backdrop-blur-md">
      <p
        className={`mb-1 text-xs font-black tracking-[0.4em] ${
          tone === "gold" ? "text-gold" : "text-primary"
        }`}
      >
        RESULT
      </p>
      <h2 className="text-2xl font-black tracking-wide">{title}</h2>
      <div className="shimmer-line mt-4 w-48" />
      <div className="mt-6 max-h-[60vh] overflow-y-auto">{children}</div>
      <button
        onClick={onClose}
        className="mt-8 rounded-xl border border-border bg-muted/60 px-8 py-2.5 text-sm font-bold transition-colors hover:bg-muted"
      >
        關閉
      </button>
    </div>
  );
}
