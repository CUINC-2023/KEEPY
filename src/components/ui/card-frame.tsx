import { cn } from "@/lib/utils";
import { GRADE_GRADIENT, isHighGrade, type Goddess, type Rarity } from "@/data/mock";
import { RarityBadge } from "@/components/ui/rarity-badge";

/** 抽象人物剪影（暫用），4 種變化 */
export function GoddessSilhouette({
  variant,
  className,
}: {
  variant: Goddess["silhouette"];
  className?: string;
}) {
  const paths: Record<Goddess["silhouette"], string> = {
    a: "M60 100 C60 74 78 60 100 60 C122 60 140 74 140 100 L150 200 L50 200 Z M100 60 C93 60 88 50 100 44 C112 50 107 60 100 60 Z",
    b: "M62 100 C66 78 84 62 100 62 C116 62 134 78 138 100 L144 200 L56 200 Z M100 34 C108 34 114 40 114 46 C114 53 108 58 100 58 C92 58 86 53 86 46 C86 40 92 34 100 34 Z",
    c: "M64 104 C70 80 86 66 100 66 C114 66 130 80 136 104 L146 200 L54 200 Z M76 52 Q100 30 124 52 Q112 44 100 48 Q88 44 76 52 Z",
    d: "M58 98 C64 76 82 64 100 64 C118 64 136 76 142 98 L152 200 L48 200 Z M100 40 C106 40 110 45 110 50 C110 55 106 58 100 58 C94 58 90 55 90 50 C90 45 94 40 100 40 Z",
  };
  return (
    <svg
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid slice"
      className={cn("h-full w-full", className)}
      aria-hidden
    >
      <g fill="oklch(0.08 0.03 292 / 55%)">
        <circle cx="100" cy="120" r="86" fill="oklch(0.95 0.03 300 / 8%)" />
        <path d={paths[variant]} />
      </g>
    </svg>
  );
}

/** 2:3 統一比例卡牌 */
export function CardFrame({
  goddess,
  grade,
  cardName,
  level,
  locked = false,
  onClick,
  className,
  art,
  missingDisplay,
}: {
  goddess: Goddess;
  grade?: Rarity | undefined;
  cardName?: string | undefined;
  level?: number | undefined;
  locked?: boolean | undefined;
  onClick?: (() => void) | undefined;
  className?: string;
  art?: string | undefined;
  missingDisplay?: "grayscale" | "silhouette" | undefined;
}) {
  const g: Rarity = grade ?? goddess.grade;
  const hidden = locked && missingDisplay === "silhouette";
  const Element = onClick ? "button" : "div";
  return (
    <Element
      {...(onClick ? { onClick, type: "button" as const } : {})}
      className={cn(
        "card-frame block w-full text-left",
        onClick && "hover-lift",
        GRADE_GRADIENT[g],
        isHighGrade(g) && "card-frame-gold-edge",
        className
      )}
    >
      {/* 卡面：舊卡保留剪影，示意卡使用各自獨立圖片 */}
      <div className={cn("absolute inset-0", locked && !hidden && "grayscale", locked && "opacity-60")}>
        {hidden ? <GoddessSilhouette variant={goddess.silhouette} /> : art ? <img src={art} alt="" className="h-full w-full object-cover object-center" /> : <GoddessSilhouette variant={goddess.silhouette} />}
      </div>
      {/* 底部漸層遮罩 */}
      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-ink/85 to-transparent" />

      {/* 頂部資訊 */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
        <RarityBadge rarity={g} />
        {art && <span className="rounded bg-ink/80 px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">範例／非正式上架</span>}
        {level !== undefined && (
          <span className="rounded-md bg-ink/60 px-1.5 py-0.5 text-[11px] font-bold text-foreground backdrop-blur-sm">
            Lv.{level}
          </span>
        )}
      </div>

      {locked && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="rounded-full bg-ink/70 px-3 py-1 text-xs font-bold text-muted-foreground backdrop-blur-sm">
            未持有
          </span>
        </div>
      )}

      {/* 底部名稱 */}
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="text-[10px] font-semibold tracking-widest text-gold/80">
          {art ? "KEEPY · 虛構卡面" : goddess.element}
        </p>
        <p className="truncate text-base font-black leading-tight text-foreground drop-shadow">
          {locked ? "？？？" : art ? "星光收藏" : goddess.name}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {locked ? "未取得的卡牌" : (cardName ?? goddess.title)}
        </p>
      </div>
    </Element>
  );
}
