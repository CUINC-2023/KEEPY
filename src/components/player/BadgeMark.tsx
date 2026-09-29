import { cn } from "@/lib/utils";

export function BadgeMark({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("grid aspect-square place-items-center rounded-full border border-gold/40 bg-muted/70 p-2 text-center shadow-inner", className)}>
      <div>
        <div className="mx-auto mb-1 h-5 w-5 rotate-45 rounded-sm border border-gold bg-gold/20" />
        <span className="block text-[10px] font-black leading-tight text-gold">{label}</span>
      </div>
    </div>
  );
}
