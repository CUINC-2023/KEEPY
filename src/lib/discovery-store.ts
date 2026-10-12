import { useLocation } from "@tanstack/react-router";
import { useSeasonClock } from "./season-time";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  localApi,
  useLocalTest,
  localTestState,
  localSessionGeneration,
  observeLocalSession,
} from "./local-test-client";

export type DiscoveryKind = "home" | "series" | "creator" | "article";
export const discoveryFields = [
  "title",
  "summary",
  "body",
  "story",
  "period",
  "goal",
  "endPolicy",
  "teaser",
  "social",
] as const;
export type DiscoveryCopy = Record<
  (typeof discoveryFields)[number],
  { "zh-TW": string; en: string }
>;
export interface DiscoveryValue {
  kind: DiscoveryKind;
  referenceId: string;
  copy: DiscoveryCopy;
  category: string;
  creatorIds: string[];
  poolIds: string[];
  order: number;
  featured: boolean;
  releaseAt: string;
  withdrawAt: string;
}
export interface PublicMaterial {
  ref: "season-hero" | "text-only";
  version: number;
  alt: { "zh-TW": string; en: string };
}
export interface DiscoveryItem extends DiscoveryValue {
  blocks?: (
    | { type: "heading"; text: { "zh-TW": string; en: string } }
    | { type: "paragraph"; text: { "zh-TW": string; en: string } }
    | { type: "image"; caption: { "zh-TW": string; en: string }; material: PublicMaterial }
  )[];
  questions?: { "zh-TW": string; en: string }[];
  promotion?: { "zh-TW": string; en: string };
  retrospective?: { "zh-TW": string; en: string };
  sourcePackId?: string;
  sourceRevision?: number;
  materials?: {
    ref: "season-hero" | "text-only";
    version: number;
    alt: { "zh-TW": string; en: string };
  }[];
  id: string;
  revision: number;
  publishedAt: string;
}
export interface DiscoveryDocument {
  version: number;
  data: {
    schema: number;
    items: {
      id: string;
      status: string;
      supplyPackId?: string;
      draft: DiscoveryValue;
      published: DiscoveryItem | null;
    }[];
  };
}
interface DiscoveryMe {
  actorId: string;
  synthetic: boolean;
  follows: string[];
  progress: { poolId: string; distinctOwned: number }[];
}
const initial = {
  items: [] as DiscoveryItem[],
  loaded: false,
  loading: false,
  error: "",
  me: null as DiscoveryMe | null,
  meError: "",
  reading: null as ReadingMe | null,
  readingError: "",
  readingLoaded: false,
  readingLoading: false,
};
let state = initial;
const listeners = new Set<() => void>();
let publicRequest: Promise<void> | null = null;
let publicController: AbortController | null = null;
let personalRequest: Promise<void> | null = null;
let personalController: AbortController | null = null;
let personalIdentity = "";
let personalGeneration = 0;
// One observer per shared source; subscribers join reads rather than each polling.
function observeRefresh(update: () => void) {
  let count = 0;
  let timer: number | undefined;
  return () => {
    if (++count === 1) {
      timer = window.setInterval(update, 30000);
      window.addEventListener("focus", update);
    }
    return () => {
      if (--count === 0) {
        window.clearInterval(timer);
        window.removeEventListener("focus", update);
      }
    };
  };
}
const observePublic = observeRefresh(() => {
  void refreshDiscovery();
});
const observeReading = observeRefresh(() => {
  void refreshReading();
});
let publicGeneration = 0;
let publicRoute = "";
function emit(next: typeof initial) {
  state = next;
  listeners.forEach((fn) => fn());
}
export function refreshDiscovery(force = false) {
  if (publicRequest && !force) return publicRequest;
  const generation = ++publicGeneration;
  publicController?.abort();
  publicController = new AbortController();
  emit({ ...state, items: [], loading: true, error: "" });
  publicRequest = localApi<{ items: DiscoveryItem[] }>(
    "/discovery",
    undefined,
    "GET",
    undefined,
    publicController.signal,
  )
    .then((data) => {
      if (generation === publicGeneration)
        emit({ ...state, items: data.items, loaded: true, loading: false, error: "" });
    })
    .catch((e) => {
      if (generation === publicGeneration)
        emit({ ...state, items: [], loaded: true, loading: false, error: String(e) });
    })
    .finally(() => {
      if (generation === publicGeneration) publicRequest = null;
    });
  return publicRequest;
}
export function refreshDiscoveryMe(force = false): Promise<void> {
  const local = localTestState(),
    actor = local.summary?.user.id,
    epoch = localSessionGeneration();
  const identity = JSON.stringify([actor, epoch, local.enabled]);
  if (personalRequest && personalIdentity === identity && !force) return personalRequest;
  const generation = ++personalGeneration;
  personalController?.abort();
  personalController = new AbortController();
  personalIdentity = identity;
  emit({ ...state, me: state.me?.actorId === actor ? state.me : null, meError: "" });
  if (!local.enabled || !actor) {
    personalRequest = null;
    return Promise.resolve();
  }
  personalRequest = localApi<DiscoveryMe>(
    "/discovery/me",
    undefined,
    "GET",
    undefined,
    personalController.signal,
  )
    .then((me) => {
      if (
        generation === personalGeneration &&
        epoch === localSessionGeneration() &&
        localTestState().enabled &&
        localTestState().summary?.user.id === me.actorId
      )
        emit({ ...state, me, meError: "" });
    })
    .catch((e) => {
      if (generation === personalGeneration && epoch === localSessionGeneration())
        emit({ ...state, me: null, meError: String(e) });
    })
    .finally(() => {
      if (generation === personalGeneration) personalRequest = null;
    });
  return personalRequest;
}
export function useDiscovery() {
  const route = useLocation({ select: (l) => l.pathname + l.searchStr });
  const local = useLocalTest();
  const [validatedRoute, setValidatedRoute] = useState("");
  const snapshot = useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => state,
    () => initial,
  );
  const boundaries = snapshot.items
    .flatMap((i) => [i.releaseAt, i.withdrawAt])
    .filter(Boolean)
    .map(Date.parse)
    .filter((n) => Number.isFinite(n) && n > Date.now());
  const now = useSeasonClock(boundaries.length ? Math.min(...boundaries) : null);
  const items =
    now === null
      ? snapshot.items
      : snapshot.items.filter(
          (i) =>
            (!i.releaseAt || Date.parse(i.releaseAt) <= now) &&
            (!i.withdrawAt || now < Date.parse(i.withdrawAt)),
        );
  useEffect(() => {
    let live = true;
    const changed = publicRoute !== route;
    if (changed) {
      publicRoute = route;
      setValidatedRoute("");
    }
    // Nested subscribers join the route read; they must not clear their own parent projection.
    const request = changed ? refreshDiscovery(true) : (publicRequest ?? Promise.resolve());
    void request.then(() => {
      if (live) setValidatedRoute(route);
    });
    const stop = observePublic();
    return () => {
      live = false;
      stop();
    };
  }, [route]);
  const userId = local.summary?.user.id;
  const enabled = local.enabled;
  const holdings = local.summary?.holdings;
  const epoch = localSessionGeneration();
  useEffect(() => {
    void refreshDiscoveryMe();
  }, [enabled, userId, holdings, epoch]);
  return {
    ...snapshot,
    items: validatedRoute === route && !snapshot.loading && !snapshot.error ? items : [],
    loaded: validatedRoute === route && !snapshot.loading && snapshot.loaded,
    me: enabled && snapshot.me?.actorId === userId ? snapshot.me : null,
  };
}
export async function retryDiscoveryCommand(path: string) {
  const command = pending.get((localTestState().summary?.user.id ?? "") + path);
  if (!command) throw new Error("No pending command / 沒有待重試操作");
  return discoveryCommand(path, command.body);
}
const pending = new Map<string, { body: unknown; key: string; flight?: Promise<unknown> }>();
export async function discoveryCommand<T>(path: string, body: unknown) {
  const actor = localTestState().summary?.user.id ?? "";
  const id = actor + path;
  let command = pending.get(id);
  if (command && JSON.stringify(command.body) !== JSON.stringify(body))
    throw new Error("Retry the pending command before editing / 請先重試尚未確認的操作");
  if (!command) {
    command = { body: structuredClone(body), key: crypto.randomUUID() };
    pending.set(id, command);
    if (path === READING_COMMAND) emit({ ...state });
  }
  if (command.flight) return command.flight as Promise<T>;
  const active = command;
  const flight = (async () => {
    try {
      const result = await localApi<T>(path, active.body, "POST", active.key);
      if (pending.get(id) === active) pending.delete(id);
      if (path === READING_COMMAND) emit({ ...state });
      return result;
    } catch (e) {
      if ((e as { status?: number }).status && (e as { status: number }).status < 500) {
        if (pending.get(id) === active) pending.delete(id);
        if (path === READING_COMMAND) emit({ ...state });
      }
      throw e;
    } finally {
      delete active.flight;
    }
  })();
  active.flight = flight;
  return flight;
}
export async function followDiscovery(creatorId: string, following: boolean) {
  await discoveryCommand("/discovery/follow", { creatorId, following });
  await refreshDiscoveryMe(true);
}
export async function trackDiscovery(kind: "visit" | "content-to-pool", subject: string) {
  if (!localTestState().enabled || !localTestState().summary) return;
  await discoveryCommand("/discovery/events", { kind, subject });
}

export function hasPendingDiscovery(path: string) {
  return pending.has((localTestState().summary?.user.id ?? "") + path);
}

export interface ReadingMe {
  actorId: string;
  synthetic: boolean;
  version: number;
  groups: { id: string; name: string }[];
  items: {
    articleId: string;
    savedAt: string;
    available: boolean;
    state: "read" | "unread";
    groupId: string;
  }[];
}
let readingGeneration = 0;
let readingRequest: Promise<void> | null = null;
let readingController: AbortController | null = null;
let readingRequestIdentity = "";
let readingRoute = "";
export function refreshReading(force = false): Promise<void> {
  const local = localTestState(),
    actor = local.summary?.user.id,
    epoch = localSessionGeneration();
  const identity = JSON.stringify([actor, epoch, local.enabled]);
  if (readingRequest && readingRequestIdentity === identity && !force) return readingRequest;
  const generation = ++readingGeneration;
  readingController?.abort();
  readingController = new AbortController();
  readingRequestIdentity = identity;
  emit({
    ...state,
    reading: null,
    readingError: "",
    readingLoaded: false,
    readingLoading: !!actor,
  });
  if (!local.enabled || local.summary?.user.role !== "member") {
    emit({ ...state, readingLoading: false });
    readingRequest = null;
    return Promise.resolve();
  }
  readingRequest = localApi<ReadingMe>(
    "/discovery/reading/me",
    undefined,
    "GET",
    undefined,
    readingController.signal,
  )
    .then((reading) => {
      if (
        generation === readingGeneration &&
        epoch === localSessionGeneration() &&
        localTestState().enabled &&
        localTestState().summary?.user.id === reading.actorId
      )
        emit({ ...state, reading, readingLoaded: true, readingLoading: false, readingError: "" });
    })
    .catch((e) => {
      if (generation === readingGeneration && epoch === localSessionGeneration())
        emit({
          ...state,
          reading: null,
          readingLoaded: true,
          readingLoading: false,
          readingError: String(e),
        });
    })
    .finally(() => {
      if (generation === readingGeneration) readingRequest = null;
    });
  return readingRequest;
}
export function useReadingList(observe = true) {
  const local = useLocalTest(),
    route = useLocation({ select: (l) => l.pathname + l.searchStr });
  const snapshot = useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => state,
    () => initial,
  );
  const user = local.summary?.user,
    allowed = local.enabled && user?.role === "member";
  useEffect(() => {
    if (!observe) return;
    const changed = readingRoute !== route;
    readingRoute = route;
    void refreshReading(changed);
    return observeReading();
  }, [local.enabled, user?.id, user?.role, route, observe]);
  return {
    reading: allowed && snapshot.reading?.actorId === user?.id ? snapshot.reading : null,
    loaded: allowed && snapshot.readingLoaded,
    loading: allowed && snapshot.readingLoading,
    error: allowed ? snapshot.readingError : "",
    allowed,
  };
}
export const READING_COMMAND = "/discovery/reading/commands";
export async function changeReading(articleId: string, saved: boolean, expectedVersion: number) {
  await discoveryCommand(READING_COMMAND, { articleId, saved, expectedVersion });
  await refreshReading(true);
}
export async function retryReading() {
  await retryDiscoveryCommand(READING_COMMAND);
  await refreshReading(true);
}

// Clear the actual private projection even when no reading page is mounted.
let readingIdentity = "";
const stopReadingIdentity = observeLocalSession(() => {
  const local = localTestState();
  const identity = JSON.stringify([
    local.enabled,
    local.summary?.user.id,
    local.summary?.user.role,
    localSessionGeneration(),
  ]);
  if (identity === readingIdentity) return;
  readingIdentity = identity;
  readingGeneration++;
  personalGeneration++;
  readingController?.abort();
  personalController?.abort();
  readingRequest = null;
  personalRequest = null;
  emit({
    ...state,
    me: null,
    meError: "",
    reading: null,
    readingError: "",
    readingLoaded: false,
    readingLoading: false,
  });
});
if (import.meta.hot) import.meta.hot.dispose(stopReadingIdentity);

export async function organizeReading(input: Record<string, unknown>) {
  await discoveryCommand(READING_COMMAND, input);
  await refreshReading(true);
}
