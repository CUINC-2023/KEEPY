import {
  useLocalTest,
  localTestState,
  drawLocal,
  markLocalViewed,
  synthesizeLocal,
  previewLocal,
} from "./local-test-client";
import { useMemo, useSyncExternalStore } from "react";
import { useCollection } from "./collection-store";
import { poolAlbumProgress, type AlbumCard } from "@/data/player";
import { POOLS, gradeIndex, type Rarity } from "@/data/mock";
import { KEEPY_SAMPLE_POOL_ID } from "@/data/keepy-sample";
import {
  EMPTY_DEMO,
  applyDemoDraw,
  applyDemoPhysical,
  applyDemoSynthesis,
  demoAlbum,
  parseDemoPlayer,
  type DemoPlayerState,
} from "./demo-player-model";

const KEY = "keepy-player-demo-v1";
const listeners = new Set<() => void>();
let snapshot = EMPTY_DEMO;
let initialized = false;
let storageFailed = false;
function read() {
  try {
    storageFailed = false;
    return parseDemoPlayer(localStorage.getItem(KEY));
  } catch {
    storageFailed = true;
    return EMPTY_DEMO;
  }
}
function getSnapshot() {
  if (!initialized && typeof window !== "undefined") {
    snapshot = read();
    initialized = true;
  }
  return snapshot;
}
function onStorage(event: StorageEvent) {
  if (event.key === KEY || event.key === null) {
    snapshot = read();
    listeners.forEach((fn) => fn());
  }
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    if (!listeners.size) window.removeEventListener("storage", onStorage);
  };
}
function commit(next: DemoPlayerState) {
  if (next === getSnapshot()) return false;
  snapshot = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    storageFailed = false;
  } catch {
    storageFailed = true;
  }
  listeners.forEach((fn) => fn());
  return true;
}
const today = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Taipei" }).format(new Date());
export function useDemoPlayer() {
  const mock = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_DEMO);
  const local = useLocalTest();
  const state = local.enabled ? local.demo : mock;
  const album = useMemo(() => demoAlbum(state), [state]);
  const collection = useCollection();
  const progress = useMemo(
    () =>
      POOLS.map((p) => {
        const old = poolAlbumProgress(p.id, album);
        if (!local.enabled) return old;
        const row = collection.me?.progress.find((x) => x.poolId === p.id);
        const visible = collection.catalogue?.cards.filter((c) => c.poolId === p.id) ?? [];
        const acquired = new Set(
          local.summary?.assetEvents.filter((e) => e.delta > 0).map((e) => e.card_id) ?? [],
        );
        return {
          ...old,
          owned: row?.owned ?? 0,
          total: row?.total ?? 0,
          pct: row?.pct ?? 0,

          byGrade: old.byGrade
            .map((g) => ({
              ...g,
              total: visible.filter((c) => c.rarity === g.grade).length,
              owned: visible.filter((c) => c.rarity === g.grade && acquired.has(c.cardId)).length,
            }))
            .filter((g) => g.total > 0),
          byGoddess: old.byGoddess
            .map((g) => ({
              ...g,
              total: visible.filter(
                (c) => album.find((a) => a.id === c.cardId)?.goddessId === g.goddessId,
              ).length,
              owned: visible.filter(
                (c) =>
                  acquired.has(c.cardId) &&
                  album.find((a) => a.id === c.cardId)?.goddessId === g.goddessId,
              ).length,
            }))
            .filter((g) => g.total > 0),
        };
      }),
    [album, local.enabled, local.summary, collection.me, collection.catalogue],
  );
  return { state, album, progress, storageFailed };
}
export function drawDemo(poolId: string, mode: "single" | "ten", id: string) {
  if (localTestState().enabled) return drawLocal(poolId, mode, id);
  const before = getSnapshot();
  const next = applyDemoDraw(before, poolId, mode, id, today());
  return commit(next) ? next.lastDraw : null;
}
export function markDrawViewed(id: string) {
  if (localTestState().enabled) {
    const local = localTestState();
    if (local.summary)
      sessionStorage.setItem("keepy-local-viewed-" + local.summary.user.id + "-" + id, "yes");
    markLocalViewed(id);
    return;
  }
  const state = getSnapshot();
  if (state.lastDraw?.id === id && !state.lastDraw.viewed)
    commit({
      ...state,
      lastDraw: { ...state.lastDraw, viewed: true },
      drawHistory: state.drawHistory.map((draw) =>
        draw.id === id ? { ...draw, viewed: true } : draw,
      ),
    });
}
export function synthesizeDemo(
  poolId: string,
  grade: Rarity,
  picked: string[],
  item: boolean,
  id: string,
) {
  if (localTestState().enabled) return synthesizeLocal(poolId, grade, picked, item);
  const next = applyDemoSynthesis(getSnapshot(), poolId, grade, picked, item, id, today());
  return commit(next) ? next.lastSynthesis : null;
}
// This is an eligibility fixture, explicitly pending approval; not a fulfillment rule.
export function demoPhysicalEligible(card: AlbumCard) {
  return (
    card.owned &&
    card.poolId !== KEEPY_SAMPLE_POOL_ID &&
    gradeIndex(card.grade) >= gradeIndex("SSR")
  );
}
export function previewPhysical(cardId: string, quantity = 1) {
  if (localTestState().enabled) return previewLocal(cardId, quantity);
  const state = getSnapshot();
  if (state.physical.includes(cardId)) return state.physicalQuantities[cardId] === quantity;
  return commit(applyDemoPhysical(state, cardId, quantity));
}
export function resetDemoPlayer() {
  if (localTestState().enabled) return;
  // Only this preview namespace is reset. Existing album-visibility/content/settings are preserved.
  commit({ ...EMPTY_DEMO, counts: {} });
}
