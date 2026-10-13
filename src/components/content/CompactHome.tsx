import { Link } from "@tanstack/react-router";
import { useContent, useDiscovery } from "@/lib/content-store";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { usePlayerUiText } from "@/lib/player-ui-text";
import { seasonCountdown, useSeasonClock } from "@/lib/season-time";
import { SEASON } from "@/data/public-hub";
import seasonHero from "@/assets/peekfuture-season-hero.jpg";
import { Button } from "@/components/ui/button";
import { ProgressiveDetails } from "@/components/ui/progressive-details";
import { DiscoveryHome, DiscoveryStatus } from "./DiscoveryContent";
import { ReturnEntrances } from "./PublicExplore";
import { useEffect, useRef, useState } from "react";

export function CompactHome() {
  const content = useContent(),
    discovery = useDiscovery(),
    { locale } = useLocale();
  const ui = content.homeUi,
    tx = usePlayerUiText(),
    now = useSeasonClock();
  const home = discovery.items.find((item) => item.kind === "home");
  const [heroFailed, setHeroFailed] = useState(false);
  const heroRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // A failed SSR image can finish before React attaches its error listener.
    const image = heroRef.current;
    if (image?.complete && image.naturalWidth === 0) setHeroFailed(true);
  }, []);
  const entryLinks = [
    { to: "/app/collection-index", label: ui.collectionIndex },
    { to: "/app/play", label: ui.play },
    { to: "/leaderboards", label: ui.rankings },
    { to: "/activities", label: ui.activities },
  ] as const;
  return (
    <div className="mx-auto max-w-6xl space-y-5" data-home-compact>
      <section className="relative overflow-hidden rounded-xl border border-border">
        {!heroFailed && (
          <img
            ref={heroRef}
            src={seasonHero}
            alt={ui.mock}
            width={1600}
            height={900}
            fetchPriority="high"
            onError={() => setHeroFailed(true)}
            className="absolute inset-0 h-full w-full object-cover object-[62%_center]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/20" />
        <div className="relative max-w-2xl space-y-3 p-5 text-primary-foreground sm:p-8">
          <p className="text-xs font-semibold text-gold">KEEPY · {ui.status}</p>
          {heroFailed && (
            <p role="status" data-home-image-error className="text-xs text-primary-foreground">
              {ui.imageUnavailable}
            </p>
          )}
          <h1 className="text-3xl font-black leading-tight sm:text-5xl">{tx(SEASON.title)}</h1>
          <p className="line-clamp-2 break-words text-sm text-primary-foreground/85">
            {(home?.copy.summary[locale] ?? ui.summary).length > 180
              ? (home?.copy.summary[locale] ?? ui.summary).slice(0, 180) + "…"
              : (home?.copy.summary[locale] ?? ui.summary)}
          </p>
          <div className="flex flex-wrap gap-2" data-home-primary>
            <Button asChild className="min-h-11">
              <Link to="/explore">{ui.explore}</Link>
            </Button>
            <Button asChild variant="secondary" className="min-h-11">
              <Link to="/app/collection">{ui.collection}</Link>
            </Button>
          </div>
          <p className="text-xs text-primary-foreground/85">{ui.limit}</p>
        </div>
      </section>
      <nav aria-label={ui.explore} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {entryLinks.map((entry) => (
          <Link
            key={entry.to}
            to={entry.to}
            className="panel flex min-h-11 items-center justify-center p-3 text-center text-sm font-semibold hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            {entry.label}
          </Link>
        ))}
      </nav>
      <ProgressiveDetails summary={ui.more}>
        {home?.copy.summary[locale] && <p>{home.copy.summary[locale]}</p>}
        <p>{tx(content.heroDescription)}</p>
        <p>{ui.mock}</p>
        <p>{ui.games}</p>
        <p>{ui.rankingNote}</p>
        <Link to="/local-test" className="inline-block text-primary underline">
          Local Test
        </Link>
      </ProgressiveDetails>
      <ReturnEntrances />
      <DiscoveryStatus />
      <div className="grid gap-3 sm:grid-cols-2" data-home-sections>
        {content.homeSections
          .filter((section) => section.visible)
          .map((section) => (
            <section
              key={section.key}
              data-home-section={section.key}
              className="panel min-w-0 space-y-2 p-4"
            >
              {section.key === "stories" ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-bold">{ui.stories}</h2>
                    <Link to="/journal" className="text-sm text-primary underline">
                      {ui.index}
                    </Link>
                  </div>
                  <DiscoveryHome compact sectionKey="stories" />
                </>
              ) : section.key === "pools" ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-bold">{ui.pools}</h2>
                    <Link to="/pools" className="text-sm text-primary underline">
                      {ui.index}
                    </Link>
                  </div>
                  <DiscoveryHome compact sectionKey="pools" />
                </>
              ) : section.key === "season-wish" ? (
                <>
                  <h2 className="font-bold">{ui.future}</h2>
                  <p className="text-xs text-muted-foreground">
                    {tx(seasonCountdown(SEASON.opensAtISO, now))}
                  </p>
                  <Link to="/seasons/next" className="inline-block text-sm text-primary underline">
                    {ui.index}
                  </Link>
                  <DiscoveryHome compact sectionKey="season-wish" />
                </>
              ) : section.key === "cards" ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-bold">{ui.cards}</h2>
                    <Link to="/goddesses" className="text-sm text-primary underline">
                      {ui.index}
                    </Link>
                  </div>
                  <DiscoveryHome compact sectionKey="cards" />
                </>
              ) : (
                <>
                  <h2 className="font-bold">
                    {section.key === "notices"
                      ? ui.notices
                      : section.key === "activities"
                        ? ui.activities
                        : section.key === "physical"
                          ? ui.physical
                          : ui.recruitment}
                  </h2>
                  <Link
                    to={
                      section.key === "notices"
                        ? "/announcements"
                        : section.key === "activities"
                          ? "/activities"
                          : section.key === "physical"
                            ? "/physical-collection"
                            : "/recruitment"
                    }
                    className="inline-block text-sm text-primary underline"
                  >
                    {ui.index}
                  </Link>
                </>
              )}
            </section>
          ))}
      </div>
    </div>
  );
}
