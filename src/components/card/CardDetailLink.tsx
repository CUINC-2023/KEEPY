import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { publicCardIdByName } from "@/data/card-detail";

/**
 * Phase 6D-1B：既有卡牌入口 → /cards/:cardId
 * 僅在卡名可對應到既有共用卡牌資料時才顯示連結（無對應維持原狀）。
 */
export function CardDetailLink({
  name,
  grade,
  className,
  label = "查看卡牌詳情 →",
}: {
  name: string;
  /** 同時比對等級，避免同名但不同等級的卡牌誤連 */
  grade?: string;
  className?: string;
  label?: string;
}) {
  const id = publicCardIdByName(name, grade);
  if (!id) return null;
  return (
    <Link
      to="/cards/$cardId"
      params={{ cardId: id }}
      aria-label={`查看${name}詳情`}
      className={cn(
        "mt-1 inline-block text-[11px] font-bold text-primary hover:underline focus-visible:underline",
        className
      )}
    >
      {label}
    </Link>
  );
}
