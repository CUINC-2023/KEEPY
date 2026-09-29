import { cardById, GRADE_GRADIENT, type CardDef, type Pool } from "@/data/mock";
import { StatusTag } from "@/components/ui/status-tag";
import { cn } from "@/lib/utils";
import { KEEPY_SAMPLE_POOL_ID, KEEPY_SAMPLE_CARDS } from "@/data/keepy-sample";
import { missingCardDisplay, useAlbumVisibility, type AlbumVisibilityOverrides } from "@/lib/album-visibility";
import { resolveCardDetail } from "@/data/card-detail";

export const POOL_STATUS_LABEL: Record<Pool["status"], string> = {
  live: "進行中",
  upcoming: "即將開始",
  ended: "已結束",
};

export function PoolStatusTag({ status }: { status: Pool["status"] }) {
  return (
    <StatusTag
      tone={status === "live" ? "live" : status === "upcoming" ? "gold" : "resting"}
      label={POOL_STATUS_LABEL[status]}
    />
  );
}

/** Each cover slot follows its own card's grade; unknown cards never expose artwork. */
export function coverCardDisplay(card: CardDef | undefined, owned: boolean, visibility: AlbumVisibilityOverrides) {
  if (!card) return "silhouette";
  if (owned) return "color";
  return missingCardDisplay(visibility, card.poolId, card.grade);
}

/** 卡池主圖（漸層暫用圖） */
export function PoolCover({
  pool,
  className,
  tall = false,
}: {
  pool: Pool;
  className?: string;
  tall?: boolean;
}) {
  const visibility = useAlbumVisibility();
  const specimen = pool.id === KEEPY_SAMPLE_POOL_ID;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        GRADE_GRADIENT[pool.coverGrade],
        tall ? "aspect-[16/9] sm:aspect-[21/8]" : "aspect-[16/9]",
        pool.status === "ended" && "opacity-60 saturate-50",
        className
      )}
    >
      {specimen && <div className="absolute inset-0 flex items-center justify-end overflow-hidden opacity-70">
        {KEEPY_SAMPLE_CARDS.map((sample) => {
          const card = cardById(sample.id);
          const owned = resolveCardDetail(sample.id)?.owned ?? false;
          // No card definition means no verified grade: fail closed rather than borrow the cover grade.
          const display = coverCardDisplay(card, owned, visibility);
          return <div key={sample.id} className="grid h-full w-1/3 place-items-center overflow-hidden">
            {display === "silhouette" ? <span className="px-1 text-center text-xs font-bold text-gold/80">卡面已隱藏 · Local Mock</span>
              : <img src={card?.art ?? sample.art} alt="" className={cn("h-full w-full object-cover object-center", display === "grayscale" && "grayscale")} />}
          </div>;
        })}
      </div>}
      <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_20%_0%,transparent,oklch(0.1_0.03_292/85%))]" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {pool.id === KEEPY_SAMPLE_POOL_ID ? <StatusTag tone="gold" label="範例／非正式上架" /> : <PoolStatusTag status={pool.status} />}
          <span className="text-[11px] font-semibold tracking-[0.25em] text-gold/80">
            {pool.subtitle.toUpperCase()}
          </span>
        </div>
        <h3 className="mt-1.5 text-2xl font-black tracking-wide sm:text-3xl">
          {pool.name}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground tabular-nums">
          {pool.startAt} — {pool.endAt}
        </p>
      </div>
    </div>
  );
}
