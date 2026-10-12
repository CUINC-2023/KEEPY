import type { DemoSynthesis } from "./demo-player-model";
export interface LocalRevenue {
  basis: string;
  rows: {
    id: string;
    partnerId: string;
    contractId: string;
    contractVersion: number;
    remuneration: string;
    testSourceCards: number;
    paidConceptCards: number;
    excludedEleventh: number;
    eligibleConceptCards: number;
    actualWithdrawable: number;
  }[];
  excludedSynthesis: number;
  actualWithdrawable: number;
}
interface LocalAdminSummary {
  accounts: number;
  testBalance: number;
  ledgerTotal: number;
  cards: number;
  assetTotal: number;
  draws: number;
  syntheses: number;
  previews: number;
  audit: number;
}
import type { ContentOverrides } from "./content-store";
import type { buildDrawSettings } from "@/data/admin";
export type LocalSettings = Pick<
  ReturnType<typeof buildDrawSettings>,
  "grades" | "cards" | "evenWeight"
>;
interface LocalPool {
  id: string;
  version: number;
  editorSettings?: LocalSettings;
}
const emptyContent: ContentOverrides = {
  version: 1,
  faq: {},
  announcements: {},
  activities: {},
  home: {},
  pools: {},
  wishes: {},
  leaderboard: {},
};
import { useSyncExternalStore } from "react";
import { ALBUM } from "@/data/player";
import { EMPTY_DEMO, type DemoPlayerState, type DemoDraw } from "./demo-player-model";
import { EMPTY_OPS, type OpsState } from "./operations-model";
interface Summary {
  user: { id: string; role: string; balance: number };
  holdings: { card_id: string; count: number }[];
  pity: { pool_id: string; count: number }[];
  draws: {
    id: string;
    requestKey: string;
    poolId: string;
    before: number;
    after: number;
    createdAt: string;
    cost: number;
    items: { id: string; ownedBefore?: number }[];
  }[];
  syntheses: (DemoSynthesis & { createdAt: string })[];
  failures: { pool_id: string; grade: string; count: number }[];
  physical: { id: string; cardId: string; quantity: number }[];
  assetEvents: { id: string; card_id: string; delta: number; source: string; at: string }[];
  ledger: { id: string; amount: number; source: string; at: string }[];
}
const empty = {
  enabled: false,
  loading: false,
  error: "",
  summary: null as Summary | null,
  demo: EMPTY_DEMO,
  operations: EMPTY_OPS,
  revenue: null as LocalRevenue | null,
  adminSummary: null as LocalAdminSummary | null,
  operationsVersion: 0,
  content: emptyContent,
  contentVersion: 0,
  pools: [] as LocalPool[],
};
let state = empty;
const listeners = new Set<() => void>();
function publish(next: typeof empty) {
  state = next;
  listeners.forEach((fn) => fn());
}
export function useLocalTest() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => state,
    () => empty,
  );
}
export function localTestState() {
  return state;
}
export async function localApi<T>(
  path: string,
  body?: unknown,
  method = "POST",
  key?: string,
  signal?: AbortSignal,
): Promise<T> {
  const sessionGeneration = refreshSerial;
  const expectedActor = path === "/me" || path === "/session" ? null : state.summary?.user.id;
  const response = await fetch("/api/local-test" + path, {
    ...(signal ? { signal } : {}),
    credentials: "same-origin",
    headers: {
      ...(expectedActor ? { "X-KEEPY-Expected-Actor": expectedActor } : {}),
      ...(body === undefined
        ? {}
        : { "Content-Type": "application/json", ...(key ? { "Idempotency-Key": key } : {}) }),
    },
    ...(body === undefined
      ? {}
      : {
          method,
          body: JSON.stringify(body),
        }),
  });
  const value = await response.json().catch(() => {
    const error = Object.assign(new Error("Local Test API unavailable / 本機 API 不可用"), {
      status: response.status,
    });
    if (response.status === 401 && sessionGeneration === refreshSerial)
      clearLocalSession(error.message);
    throw error;
  });
  if (response.status === 401 && sessionGeneration === refreshSerial)
    clearLocalSession("401 · Local Test session expired / 測試 Session 已失效");
  if (
    response.status === 409 &&
    value.code === "actor-changed" &&
    sessionGeneration === refreshSerial
  )
    clearLocalSession("409 · Session changed; reload your identity / 身分已變更，請重新讀取");
  if (!response.ok)
    throw Object.assign(
      new Error(String(response.status) + " · " + (value.message ?? "Local Test unavailable")),
      { status: response.status },
    );
  return value as T;
}
function adapt(summary: Summary): DemoPlayerState {
  const counts = Object.fromEntries(
    ALBUM.map((card) => [
      card.id,
      {
        count: summary.holdings.find((h) => h.card_id === card.id)?.count ?? 0,
        obtainedAt:
          (summary.assetEvents ?? [])
            .filter((e) => e.card_id === card.id && e.delta > 0)
            .map((e) => e.at)
            .sort()[0]
            ?.slice(0, 10) ?? "",
      },
    ]),
  );
  const prior: Record<string, number> = {};
  const history: DemoDraw[] = [...summary.draws].reverse().map((draw) => ({
    ...draw,
    viewed:
      sessionStorage.getItem("keepy-local-viewed-" + summary.user.id + "-" + draw.id) === "yes" ||
      (sessionStorage.getItem("keepy-local-pending-" + summary.user.id) !== draw.id &&
        JSON.parse(sessionStorage.getItem("keepy-local-normal-request-v1") ?? "null")?.key !==
          draw.requestKey),
    items: draw.items.map((item) => {
      const card = ALBUM.find((c) => c.id === item.id);
      if (!card) throw new Error("Unknown server card");
      const count = item.ownedBefore ?? prior[item.id] ?? 0;
      prior[item.id] = count + 1;
      return {
        card,
        isNew: count === 0,
        ownedBefore: count,
        growthBefore: Math.min(100, Math.max(0, count - 1) * 10),
        growthAfter: Math.min(100, count * 10),
        source: {
          kind: "paid" as const,
          paidKp: draw.cost / draw.items.length,
          creatorShareBase: 0,
          countsTowardPity: true,
          pityTriggered: false,
        },
      };
    }),
  }));
  return {
    ...EMPTY_DEMO,
    counts,
    pity: Object.fromEntries(summary.pity.map((p) => [p.pool_id, p.count])),
    drawHistory: history,
    lastDraw: history.at(-1) ?? null,
    lastSynthesis: summary.syntheses?.[0] ?? null,
    failures: Object.fromEntries(
      (summary.failures ?? []).map((r) => [r.pool_id + ":" + r.grade, r.count]),
    ),
    physical: (summary.physical ?? []).map((p) => p.cardId),
    physicalQuantities: Object.fromEntries(
      (summary.physical ?? []).map((p) => [p.cardId, p.quantity]),
    ),
  };
}
let refreshSerial = 0;
export async function refreshLocalTest() {
  const serial = ++refreshSerial;
  if (!state.enabled) return;
  publish({ ...state, loading: true, error: "" });
  try {
    const summary = await localApi<Summary>("/me");
    if (serial !== refreshSerial) return;
    if (state.summary && state.summary.user.id !== summary.user.id)
      publish({ ...empty, enabled: state.enabled, loading: true });
    const content = await localApi<{ version: number; data: ContentOverrides }>("/content");
    const pools = await localApi<LocalPool[]>("/pools");
    let operations: OpsState = EMPTY_OPS,
      operationsVersion = 0;
    if (["creator", "official"].includes(summary.user.role)) {
      const doc = await localApi<{ data: OpsState; version: number }>("/cooperation");
      operations = { ...EMPTY_OPS, ...doc.data };
      operationsVersion = doc.version;
    }
    const revenue = ["creator", "official"].includes(summary.user.role)
      ? await localApi<LocalRevenue>("/revenue")
      : null;
    const adminSummary =
      summary.user.role === "official" ? await localApi<LocalAdminSummary>("/admin/summary") : null;
    if (serial === refreshSerial)
      publish({
        ...state,
        loading: false,
        summary,
        content: content.data,
        contentVersion: content.version,
        pools,
        demo: adapt(summary),
        operations,
        operationsVersion,
        revenue,
        adminSummary,
      });
  } catch (error) {
    if (serial === refreshSerial)
      publish({
        ...state,
        loading: false,
        error: String(error),
        summary: null,
        revenue: null,
        adminSummary: null,
        demo: EMPTY_DEMO,
        operations: EMPTY_OPS,
        content: emptyContent,
        contentVersion: 0,
        pools: [],
      });
  }
}
/** Clear shared private projections without falling back to browser Mock or deleting pending keys. */
export function clearLocalSession(error = "") {
  refreshSerial++;
  publish({ ...empty, enabled: state.enabled, error });
}
export async function enableLocalTest() {
  refreshSerial++;
  sessionStorage.setItem("keepy-local-normal-v1", "syntheticLocalTest");
  publish({ ...empty, enabled: true });
  await refreshLocalTest();
}
export function initializeLocalTest() {
  if (sessionStorage.getItem("keepy-local-normal-v1") === "syntheticLocalTest" && !state.enabled)
    void enableLocalTest();
}
export function disableLocalTest() {
  refreshSerial++;
  sessionStorage.removeItem("keepy-local-normal-v1");
  publish(empty);
}
export async function drawLocal(poolId: string, mode: "single" | "ten", id: string) {
  if (!state.summary) throw new Error("Select a syntheticLocalTest fixture first");
  const actor = state.summary.user.id;
  const input = { poolId, mode: mode === "ten" ? "10plus1" : "single" };
  const old = JSON.parse(sessionStorage.getItem("keepy-local-normal-request-v1") ?? "null");
  if (old && old.actor === actor && JSON.stringify(old.input) !== JSON.stringify(input))
    throw new Error("Retry the pending pool/mode before starting another draw");
  const key = old?.actor === actor ? old.key : id;
  sessionStorage.setItem("keepy-local-normal-request-v1", JSON.stringify({ actor, input, key }));
  const result = await localApi<{ id: string }>("/draws", input, "POST", key);
  sessionStorage.setItem("keepy-local-pending-" + actor, result.id);
  await refreshLocalTest();
  const draw = state.demo.drawHistory.find((d) => d.id === result.id);
  if (!draw) throw new Error("Saved draw not loaded; retry same request");
  sessionStorage.removeItem("keepy-local-normal-request-v1");
  return draw;
}
export async function saveLocalOperations(fn: (s: OpsState) => OpsState) {
  if (state.summary?.user.role === "creator") {
    const next = fn(state.operations);
    if (next === state.operations) return false;
    const changed = next.contracts.filter(
      (c) =>
        JSON.stringify(c) !== JSON.stringify(state.operations.contracts.find((o) => o.id === c.id)),
    );
    const added = next.requests.filter(
      (r) => !state.operations.requests.some((o) => o.id === r.id),
    );
    if (changed.length === 1 && added.length === 0) {
      const c = changed[0]!;
      await commandLocal("/cooperation/commands", {
        expectedVersion: state.operationsVersion,
        kind: "consent",
        contractId: c.id,
        status: c.status,
        reason: c.returnReason,
      });
    } else if (added.length === 1 && changed.length === 0) {
      const r = added[0]!;
      await commandLocal("/cooperation/commands", {
        expectedVersion: state.operationsVersion,
        kind: "review",
        partnerId: r.partnerId,
        note: r.note,
      });
    } else throw new Error("Only own consent and review commands are accepted");
    return true;
  }
  if (state.summary?.user.role !== "official")
    throw new Error("Current Local Test official role required");
  const next = fn(state.operations);
  if (next === state.operations) return false;
  await localApi(
    "/admin/cooperation",
    { expectedVersion: state.operationsVersion, data: next },
    "PUT",
  );
  await refreshLocalTest();
  return true;
}

export function markLocalViewed(id: string) {
  if (
    state.summary &&
    sessionStorage.getItem("keepy-local-pending-" + state.summary.user.id) === id
  )
    sessionStorage.removeItem("keepy-local-pending-" + state.summary.user.id);
  const demo = {
    ...state.demo,
    lastDraw:
      state.demo.lastDraw?.id === id
        ? { ...state.demo.lastDraw, viewed: true }
        : state.demo.lastDraw,
    drawHistory: state.demo.drawHistory.map((d) => (d.id === id ? { ...d, viewed: true } : d)),
  };
  publish({ ...state, demo });
}

async function commandLocal(path: string, body: unknown, method = "POST") {
  const actor = state.summary?.user.id;
  if (!actor) throw new Error("Synthetic session required");
  const slot = "keepy-local-command-" + actor + path;
  const saved = JSON.parse(sessionStorage.getItem(slot) ?? "null");
  if (saved && JSON.stringify(saved.body) !== JSON.stringify(body))
    throw new Error("Retry unchanged pending command before submitting a different edit");
  const request = saved ?? { body, key: crypto.randomUUID() };
  sessionStorage.setItem(slot, JSON.stringify(request));
  let result: unknown;
  try {
    result = await localApi(path, request.body, method, request.key);
  } catch (error) {
    if (
      error instanceof Error &&
      "status" in error &&
      typeof error.status === "number" &&
      error.status >= 400 &&
      error.status < 500
    ) {
      sessionStorage.removeItem(slot);
      await refreshLocalTest();
    }
    throw error;
  }
  await refreshLocalTest();
  if (state.error) throw new Error(state.error);
  sessionStorage.removeItem(slot);
  return result;
}
export async function saveLocalContent(data: ContentOverrides) {
  if (state.summary?.user.role !== "official") throw new Error("Current official grant required");
  await commandLocal("/admin/content", { expectedVersion: state.contentVersion, data }, "PUT");
  return true;
}
export async function publishLocalSettings(poolId: string, settings: LocalSettings) {
  const pool = state.pools.find((p) => p.id === poolId);
  if (!pool) throw new Error("Server pool required");
  await commandLocal("/admin/pools/" + poolId + "/settings", {
    expectedVersion: pool.version,
    settings,
  });
  return true;
}

export async function retryLocalCommands() {
  const actor = state.summary?.user.id;
  if (!actor) return;
  try {
    const prefix = "keepy-local-command-" + actor;
    const slots = Object.keys(sessionStorage).filter((k) => k.startsWith(prefix));
    for (const slot of slots) {
      const path = slot.slice(prefix.length);
      if (
        !/^\/(cooperation\/commands|syntheses|physical-previews|admin\/content|admin\/pools\/[a-z0-9-]+\/settings)$/.test(
          path,
        )
      )
        continue;
      const request = JSON.parse(sessionStorage.getItem(slot) ?? "null");
      if (!request || typeof request.key !== "string") continue;
      try {
        await localApi(path, request.body, path === "/admin/content" ? "PUT" : "POST", request.key);
        sessionStorage.removeItem(slot);
      } catch (error) {
        if (
          error instanceof Error &&
          "status" in error &&
          typeof error.status === "number" &&
          error.status >= 400 &&
          error.status < 500
        )
          sessionStorage.removeItem(slot);
        throw error;
      }
    }
    await refreshLocalTest();
  } catch (error) {
    publish({ ...state, error: String(error) });
  }
}

export async function synthesizeLocal(
  poolId: string,
  grade: string,
  materials: string[],
  useItem: boolean,
) {
  await commandLocal("/syntheses", { poolId, grade, materials, useItem });
  return state.demo.lastSynthesis;
}
export async function previewLocal(cardId: string, quantity: number) {
  await commandLocal("/physical-previews", { cardId, quantity });
  return true;
}

export function localSessionGeneration() {
  return refreshSerial;
}

/** Observe the existing session state; does not create another identity source. */
export function observeLocalSession(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
