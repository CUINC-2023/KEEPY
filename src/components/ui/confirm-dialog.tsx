import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./dialog";
import { usePlayerCopy } from "@/lib/player-copy";
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "violet",
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "violet" | "gold" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  const t = usePlayerCopy();
  const cls =
    tone === "gold"
      ? "bg-gold text-ink hover:bg-gold/90"
      : tone === "danger"
        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
        : "bg-primary text-primary-foreground hover:bg-primary/90";
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onCancel();
      }}
    >
      <DialogContent className="panel panel-glow z-[90] max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl p-6">
        <DialogTitle className="font-black">{title}</DialogTitle>
        <DialogDescription>
          {description ?? t("此操作為本機介面示意。", "This is a local interface preview.")}
        </DialogDescription>
        {children && <div>{children}</div>}
        <p className="text-xs text-muted-foreground">
          <span className="demo-chip">Demo</span>{" "}
          {t("本機測試操作，不執行正式交易。", "Local test operation; no production transaction.")}
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            onClick={onCancel}
            className="min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
          >
            {cancelLabel ?? t("取消", "Cancel")}
          </button>
          <button
            onClick={onConfirm}
            className={"min-h-11 rounded-xl px-4 py-2 text-sm font-bold " + cls}
          >
            {confirmLabel ?? t("確認", "Confirm")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
