import { useEffect, useState } from "react";
import { DEFAULT_CARD_SHOWCASE_IDS, readCardShowcaseIds } from "@/data/showcase-cards";
import { DEFAULT_SHOWCASE_IDS, readShowcaseIds } from "@/data/showcase-badges";
import {
  DEFAULT_PUBLIC_PROFILE,
  readPublicProfile,
  type PublicProfileSettings,
} from "@/data/public-profile-settings";

export function useCollectorPublicData() {
  const [settings, setSettings] = useState<PublicProfileSettings>(DEFAULT_PUBLIC_PROFILE);
  const [showcaseIds, setShowcaseIds] = useState<string[]>([...DEFAULT_SHOWCASE_IDS]);
  const [cardIds, setCardIds] = useState<string[]>([...DEFAULT_CARD_SHOWCASE_IDS]);
  useEffect(() => {
    setShowcaseIds(readShowcaseIds());
    setCardIds(readCardShowcaseIds());
    setSettings(readPublicProfile());
  }, []);
  return { settings, showcaseIds, cardIds };
}
