import {
  useLocalTest,
  localTestState,
  saveLocalOperations,
  publishLocalSettings,
  type LocalSettings,
} from "./local-test-client";
import { useSyncExternalStore } from "react";
import { EMPTY_OPS, parseOperations, type OpsState, snapshotPool } from "./operations-model";
const KEY = "keepy-operations-demo-v1";
let state = EMPTY_OPS,
  loaded = false,
  failed = false;
const listeners = new Set<() => void>();
function read() {
  if (!loaded && typeof window !== "undefined") {
    try {
      state = parseOperations(localStorage.getItem(KEY));
    } catch {
      failed = true;
    }
    loaded = true;
  }
  return state;
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  const storage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) {
      loaded = false;
      read();
      listeners.forEach((f) => f());
    }
  };
  window.addEventListener("storage", storage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", storage);
  };
}
export function useOperations() {
  const value = useSyncExternalStore(subscribe, read, () => EMPTY_OPS);
  const local = useLocalTest();
  return { state: local.enabled ? local.operations : value, storageFailed: failed };
}
export function updateOperations(fn: (s: OpsState) => OpsState) {
  if (localTestState().enabled) return saveLocalOperations(fn);
  const prior = read(),
    next = fn(prior);
  if (next === prior) return false;
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    failed = false;
  } catch {
    failed = true;
  }
  listeners.forEach((f) => f());
  return true;
}
export function operationId() {
  return crypto.randomUUID();
}
export function operationTime() {
  return new Date().toISOString();
}
export function recordPoolRuleChange(poolId: string, rules: unknown) {
  if (localTestState().enabled) return publishLocalSettings(poolId, rules as LocalSettings);
  return updateOperations((s) =>
    snapshotPool(s, poolId, JSON.stringify(rules), operationId(), operationTime(), false),
  );
}
