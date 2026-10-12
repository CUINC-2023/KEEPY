import { useCollection } from "@/lib/collection-store";
import { useLocalTest } from "@/lib/local-test-client";
import { useDiscovery } from "@/lib/content-store";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { usePlayerUiText } from "@/lib/player-ui-text";
import { useDemoPlayer } from "@/lib/demo-player-store";
import { POOL_STATUS_LABEL, coverCardDisplay } from "./pool-cover-shared";
import { cardById, GRADE_GRADIENT, type Pool } from "@/data/mock";
import { StatusTag } from "@/components/ui/status-tag";
import { cn } from "@/lib/utils";
import { KEEPY_SAMPLE_POOL_ID, KEEPY_SAMPLE_CARDS } from "@/data/keepy-sample";
import { useAlbumVisibility } from "@/lib/album-visibility";
import { resolveCardDetail } from "@/data/card-detail";

export function PoolStatusTag({ status }: { status: Pool["status"] }) {
  const tx = usePlayerUiText();
  return (
    <StatusTag
      tone={status === "live" ? "live" : status === "upcoming" ? "gold" : "resting"}
      label={tx(POOL_STATUS_LABEL[status])}
    />
  );
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
  const tx = usePlayerUiText();
  const discovery = useDiscovery();
  const collection = useCollection(),
    local = useLocalTest();
  const { locale } = useLocale();
  const title =
    discovery.items.find((i) => i.kind === "series" && i.referenceId === pool.id)?.copy.title[
      locale
    ] ?? pool.name;
  const visibility = useAlbumVisibility();
  const { album } = useDemoPlayer();
  const specimen = pool.id === KEEPY_SAMPLE_POOL_ID;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        GRADE_GRADIENT[pool.coverGrade],
        tall ? "aspect-[16/9] sm:aspect-[21/8]" : "aspect-[16/9]",
        pool.status === "ended" && "opacity-60 saturate-50",
        className,
      )}
    >
      {specimen && (
        <div className="absolute inset-0 flex items-center justify-end overflow-hidden opacity-70">
          {KEEPY_SAMPLE_CARDS.map((sample) => {
            const card = cardById(sample.id);
            const owned = resolveCardDetail(sample.id, album)?.owned ?? false;
            // No card definition means no verified grade: fail closed rather than borrow the cover grade.
            const serverHidden = !collection.catalogue?.cards.some((c) => c.cardId === sample.id);
            const display = serverHidden ? "silhouette" : coverCardDisplay(card, owned, visibility);
            return (
              <div key={sample.id} className="grid h-full w-1/3 place-items-center overflow-hidden">
                {display === "silhouette" ? (
                  <span className="px-1 text-center text-xs font-bold text-gold/80">
                    {tx("卡面已隱藏 · Local Mock")}
                  </span>
                ) : (
                  <img
                    src={card?.art ?? sample.art}
                    alt=""
                    className={cn(
                      "h-full w-full object-cover object-center",
                      display === "grayscale" && "grayscale",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_20%_0%,transparent,oklch(0.1_0.03_292/85%))]" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {pool.id === KEEPY_SAMPLE_POOL_ID ? (
            <StatusTag tone="gold" label={tx("範例／非正式上架")} />
          ) : (
            <PoolStatusTag status={pool.status} />
          )}
          <span className="text-[11px] font-semibold tracking-[0.25em] text-gold/80">
            {pool.subtitle.toUpperCase()}
          </span>
        </div>
        <h3 className="mt-1.5 text-2xl font-black tracking-wide sm:text-3xl">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground tabular-nums">
          {pool.startAt} — {pool.endAt}
        </p>
      </div>
    </div>
  );
}
