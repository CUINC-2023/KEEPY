import type { Rarity } from "@/data/mock";
import { cn } from "@/lib/utils";

const GRADE_STYLE: Record<Rarity, string> = {
  C: "text-rarity-c border-rarity-c/40",
  U: "text-rarity-u border-rarity-u/40",
  R: "text-rarity-r border-rarity-r/40",
  RR: "text-rarity-rr border-rarity-rr/45",
  RRR: "text-rarity-rrr border-rarity-rrr/45",
  SR: "text-rarity-sr border-rarity-sr/50",
  SSR: "text-rarity-ssr border-rarity-ssr/60",
  HR: "text-rarity-hr border-rarity-hr/60",
  UR: "text-rarity-ur border-rarity-ur/60",
  O: "border-rarity-o/70",
};

/** 卡牌等級徽章：C、U、R、RR、RRR、SR、SSR、HR、UR、O */
export function RarityBadge({
  rarity,
  className,
}: {
  rarity: Rarity;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border bg-ink/50 px-1.5 py-0.5 text-[11px] font-black tracking-[0.12em] backdrop-blur-sm",
        GRADE_STYLE[rarity],
        rarity === "O" && "text-gold-gradient",
        className
      )}
    >
      {rarity}
    </span>
  );
}
