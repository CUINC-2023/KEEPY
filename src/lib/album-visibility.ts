import { useSyncExternalStore } from "react";
import { GRADES, POOLS, type Rarity } from "@/data/mock";

export type MissingCardDisplay = "grayscale" | "silhouette";
type Overrides = Record<string, Partial<Record<Rarity, MissingCardDisplay>>>;
export type AlbumVisibilityOverrides = Overrides;
const KEY = "keepy-album-visibility-v1";
const listeners = new Set<() => void>();
let snapshot: Overrides = {};
let initialized = false;

function read(): Overrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const data = parsed as { version?: unknown; pools?: unknown };
    if (data.version !== 1 || !data.pools || typeof data.pools !== "object" || Array.isArray(data.pools)) return {};
    const pools = data.pools as Record<string, unknown>;
    const clean: Overrides = {};
    for (const pool of POOLS) {
      const record = pools[pool.id];
      if (!record || typeof record !== "object" || Array.isArray(record)) continue;
      const values = record as Record<string, unknown>;
      const grades: Partial<Record<Rarity, MissingCardDisplay>> = {};
      for (const grade of GRADES) {
        if (values[grade] === "grayscale" || values[grade] === "silhouette") grades[grade] = values[grade];
      }
      if (Object.keys(grades).length) clean[pool.id] = grades;
    }
    return clean;
  } catch { return {}; }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener("storage", onStorage);
  };
}
function onStorage(event: StorageEvent) {
  if (event.key !== KEY && event.key !== null) return;
  snapshot = read();
  initialized = true;
  listeners.forEach((listener) => listener());
}
function getSnapshot() {
  if (!initialized && typeof window !== "undefined") { snapshot = read(); initialized = true; }
  return snapshot;
}
// SSR cannot read this browser's Local Mock preference. Fail closed until hydration:
// never send a hidden card image URL in server HTML before localStorage is checked.
const serverSnapshot: Overrides = Object.fromEntries(
  POOLS.map((pool) => [pool.id, Object.fromEntries(GRADES.map((grade) => [grade, "silhouette"]))])
) as Overrides;

export function useAlbumVisibility() {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
}

export function missingCardDisplay(overrides: Overrides, poolId: string, grade: Rarity): MissingCardDisplay {
  return overrides[poolId]?.[grade] ?? "grayscale";
}

export function saveAlbumVisibility(poolId: string, values: Partial<Record<Rarity, MissingCardDisplay>>) {
  if (!POOLS.some((pool) => pool.id === poolId)) return false;
  const next = { ...getSnapshot(), [poolId]: values };
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ version: 1, pools: next }));
    snapshot = next;
    listeners.forEach((listener) => listener());
    return true;
  } catch { return false; }
}

export function resetAlbumVisibility(poolId: string) {
  const next = { ...getSnapshot() };
  delete next[poolId];
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ version: 1, pools: next }));
    snapshot = next;
    listeners.forEach((listener) => listener());
    return true;
  } catch { return false; }
}