import { useEffect, useSyncExternalStore } from "react";
import {
  localApi,
  localTestState,
  useLocalTest,
  localSessionGeneration,
  observeLocalSession,
} from "./local-test-client";
import { useSeasonClock } from "./season-time";
import { isCollectionProjection, type CollectionReadContract } from "./collection-contract.mjs";
export type Bilingual = { "zh-TW": string; en: string };
export interface CollectionCard {
  cardId: string;
  poolId: string;
  name: string;
  rarity: string;
  cardVersion: number;
  count?: number;
  growthLevel?: number | null;
}
export interface CollectionProgress {
  poolId: string;
  title: Bilingual;
  owned: number;
  total: number;
  pct: number;
  complete: boolean;
  ruleVersion: number;
}
export interface CollectionAward {
  earnedCondition?: { type: string; threshold: number };
  id: string;
  ruleId: string;
  ruleVersion: number;
  type: string;
  subject: string;
  title: Bilingual;
  recordedAt: string;
}
export interface CollectionProfile {
  notes?: import("./collection-notes.mjs").CollectionNote[];
  readingGuide?: import("./collection-reading-guide.mjs").ReadingGuide;
  collectionSearch?: import("./collection-workbench.mjs").WorkbenchPreference;
  readingLayout?: {
    schema: 1;
    mode: "full" | "compact";
    first: "timeline" | "awards" | "growth" | "play" | "curations";
  };
  curations?: {
    id: string;
    title: string;
    note: string;
    tags?: string[];
    cardIds: string[];
    showPublic: boolean;
  }[];
  journeyPaused?: boolean;
  growthPreview?: { player: boolean; platform: boolean };
  goalPoolIds?: string[];
  presentation?: {
    layout: "collector" | "albums" | "badges";
    bioEn: string;
    poolIds: string[];
    theme?:
      | "classic"
      | "quiet"
      | "contrast"
      | "linen"
      | "aurora"
      | "ink"
      | "dawn"
      | "cobalt"
      | "graphite";
    coverMode?: "plain" | "band";
    badgeLayout?: "list" | "grid";
    shelfLayout?: "grid" | "wide";
  };
  badgeIds?: string[];
  isPublic: boolean;
  displayName: string;
  bio: string;
  mainCardId: string | null;
  shelfIds: string[];
  showCards: boolean;
  showProgress: boolean;
  showBadges: boolean;
  showRanking: boolean;
}
export interface CollectionMe {
  readContract: CollectionReadContract;
  acquiredCards: CollectionCard[];
  visibilityKey: string;
  recent: { cardId: string; source: string; at: string }[];
  actorId: string;
  profile: { handle: string; version: number; data: CollectionProfile };
  progress: CollectionProgress[];
  cards: CollectionCard[];
  awards: CollectionAward[];
  rulesVersion: number;
}
export interface CollectionProposal {
  status: "pending";
  rarityEffect: string;
  duplicateMode: string;
  sharedMaterials: boolean | null;
  recipeCount: number | null;
  successPct: number | null;
  pityCount: number | null;
  minimumKeep: number | null;
  note: Bilingual;
}
export interface CollectionRules {
  schema: 1;
  visibility: { poolId: string; hiddenGrades: string[] }[];
  achievements: {
    id: string;
    type: string;
    enabled: boolean;
    threshold: number;
    poolId: string;
    title: Bilingual;
  }[];
  proposal: CollectionProposal;
}
export interface CollectionCatalogue {
  readContract: CollectionReadContract;
  visibilityKey: string;
  cards: CollectionCard[];
  pools: {
    poolId: string;
    title: Bilingual;
    visibleDesigns: number;
    releaseAt: string;
    withdrawAt: string;
  }[];
  version: number;
  proposal: CollectionProposal;
}
export interface PublicCollection {
  curations?: { title: string; note: string; cards: CollectionCard[] }[];
  growthPreview?: {
    player?: { status: "local-preview"; ruleVersion: string; level: number; xp: number };
    platform?: { status: "local-preview"; ruleVersion: string; stage: number };
  };
  theme:
    "classic" | "quiet" | "contrast" | "linen" | "aurora" | "ink" | "dawn" | "cobalt" | "graphite";
  coverMode: "plain" | "band";
  badgeLayout: "list" | "grid";
  shelfLayout: "grid" | "wide";
  readContract: CollectionReadContract;
  bioEn: string;
  layout: "collector" | "albums" | "badges";
  featured: CollectionProgress[];
  handle: string;
  synthetic: boolean;
  displayName: string;
  bio: string;
  mainCard: CollectionCard | null;
  shelf: CollectionCard[];
  progress: CollectionProgress[];
  awards: CollectionAward[];
}
const empty = {
  catalogue: null as CollectionCatalogue | null,
  me: null as CollectionMe | null,
  error: "",
  meError: "",
  loaded: false,
};
let state = empty,
  generation = 0;
const listeners = new Set<() => void>();
function emit(next: typeof empty) {
  state = next;
  listeners.forEach((fn) => fn());
}
let request: Promise<void> | null = null;
export function refreshCollection() {
  if (request) return request;
  request = localApi<CollectionCatalogue>("/collection/catalogue")
    .then((catalogue) => {
      if (!isCollectionProjection(catalogue, "catalogue"))
        throw new Error("Collection read contract mismatch / 收藏讀取契約不相容");
      emit({ ...state, catalogue, loaded: true, error: "" });
    })
    .catch((e) => emit({ ...state, catalogue: null, loaded: true, error: String(e) }))
    .finally(() => {
      request = null;
    });
  return request;
}
let privateRead: {
  actor: string;
  epoch: number;
  controller: AbortController;
  promise: Promise<void>;
} | null = null;
function finishPrivateRead(controller: AbortController) {
  if (privateRead?.controller === controller) privateRead = null;
}
export function refreshCollectionMe(force = true): Promise<void> {
  const actor = localTestState().summary?.user.id;
  const epoch = localSessionGeneration();
  if (!force && privateRead && privateRead.actor === actor && privateRead.epoch === epoch)
    return privateRead.promise;
  privateRead?.controller.abort();
  privateRead = null;
  const id = ++generation,
    controller = new AbortController();
  emit({ ...state, me: state.me?.actorId === actor ? state.me : null, meError: "" });
  if (!actor || !localTestState().enabled) return Promise.resolve();
  const promise = (async () => {
    try {
      const me = await localApi<CollectionMe>(
        "/collection/me",
        undefined,
        "GET",
        undefined,
        controller.signal,
      );
      if (!isCollectionProjection(me, "owner"))
        throw new Error("Collection read contract mismatch / 收藏讀取契約不相容");
      if (
        id === generation &&
        !controller.signal.aborted &&
        epoch === localSessionGeneration() &&
        localTestState().enabled &&
        localTestState().summary?.user.id === me.actorId
      )
        emit({ ...state, me });
    } catch (e) {
      if (id === generation && !controller.signal.aborted && epoch === localSessionGeneration())
        emit({ ...state, me: null, meError: String(e) });
    } finally {
      finishPrivateRead(controller);
    }
  })();
  privateRead = { actor, epoch, controller, promise };
  return promise;
}
let identity = "";
const stopIdentity = observeLocalSession(() => {
  const local = localTestState();
  const next = JSON.stringify([local.enabled, local.summary?.user.id, localSessionGeneration()]);
  if (next === identity) return;
  identity = next;
  privateRead?.controller.abort();
  privateRead = null;
  ++generation;
  emit({ ...state, me: null, meError: "" });
});
if (import.meta.hot) import.meta.hot.dispose(stopIdentity);
export function useCollection() {
  const local = useLocalTest();
  const snapshot = useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => state,
    () => empty,
  );
  useEffect(() => {
    void refreshCollection();
    const update = () => {
      void refreshCollection();
      void refreshCollectionMe(false);
    };
    const timer = window.setInterval(update, 30000);
    window.addEventListener("focus", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
    };
  }, []);
  const actor = local.summary?.user.id,
    epoch = localSessionGeneration(),
    holdings = local.summary?.holdings;
  useEffect(() => {
    void refreshCollectionMe(false);
  }, [actor, local.enabled, holdings, epoch]);
  const boundaries =
    snapshot.catalogue?.pools
      .flatMap((p) => [p.releaseAt, p.withdrawAt])
      .filter(Boolean)
      .map(Date.parse)
      .filter((n) => Number.isFinite(n) && n > Date.now()) ?? [];
  const now = useSeasonClock(boundaries.length ? Math.min(...boundaries) : null);
  const expired =
    now !== null &&
    snapshot.catalogue?.pools.some((p) => !!p.withdrawAt && Date.parse(p.withdrawAt) <= now);
  useEffect(() => {
    if (expired) {
      void refreshCollection();
      void refreshCollectionMe();
    }
  }, [expired]);
  const consistent = !expired && snapshot.me?.visibilityKey === snapshot.catalogue?.visibilityKey;
  return {
    ...snapshot,
    catalogueValid: !expired,
    me: local.enabled && consistent && snapshot.me?.actorId === actor ? snapshot.me : null,
  };
}
