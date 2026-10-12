import {
  ALBUM,
  DEMO_PITY_COUNT_BEFORE,
  PRESET_SINGLE,
  PRESET_TEN,
  SYNTHESIS,
  type AlbumCard,
  type DrawResultItem,
} from "@/data/player";
import { POOLS, nextGrade, type Rarity } from "@/data/mock";
import { KEEPY_SAMPLE_POOL_ID } from "@/data/keepy-sample";

export type DemoCounts = Record<string, { count: number; obtainedAt?: string | undefined }>;
export interface DemoDraw {
  id: string;
  poolId: string;
  items: DrawResultItem[];
  before: number;
  after: number;
  viewed: boolean;
  createdAt: string;
}
export interface DemoSynthesis {
  id: string;
  poolId: string;
  grade: Rarity;
  materials: string[];
  kind: "success" | "fail" | "pity";
  cardId: string;
}
export interface DemoPlayerState {
  version: 1;
  counts: DemoCounts;
  pity: Record<string, number>;
  failures: Record<string, number>;
  lastDraw: DemoDraw | null;
  drawHistory: DemoDraw[];
  lastSynthesis: DemoSynthesis | null;
  physical: string[];
  physicalQuantities: Record<string, number>;
}
export const EMPTY_DEMO: DemoPlayerState = {
  version: 1,
  counts: {},
  pity: {},
  failures: {},
  lastDraw: null,
  drawHistory: [],
  lastSynthesis: null,
  physical: [],
  physicalQuantities: {},
};
export const DEMO_MATERIAL_COUNT = 3; // UI fixture only; the production cost needs approval.

export function demoAlbum(state: DemoPlayerState): AlbumCard[] {
  return ALBUM.map((card) => {
    const change = state.counts[card.id];
    if (!change) return card;
    const dupes = Math.max(0, change.count - 1);
    const { obtainedAt: originalDate, ...base } = card;
    const obtainedAt = change.count > 0 ? (change.obtainedAt ?? originalDate) : undefined;
    return {
      ...base,
      owned: change.count > 0,
      dupes,
      growthPct: Math.min(100, dupes * 10),
      isNew: change.count > 0 && !card.owned,
      ...(obtainedAt ? { obtainedAt } : {}),
    };
  });
}
export function cardCount(card: AlbumCard) {
  return card.owned ? card.dupes + 1 : 0;
}
export function canDemoDraw(poolId: string) {
  return (
    poolId !== KEEPY_SAMPLE_POOL_ID && POOLS.some((p) => p.id === poolId && p.status === "live")
  );
}

/** A scripted draw changes only the demo collection, never KP or a financial ledger. */
export function applyDemoDraw(
  state: DemoPlayerState,
  poolId: string,
  mode: "single" | "ten",
  id: string,
  date: string,
): DemoPlayerState {
  if (
    !canDemoDraw(poolId) ||
    state.drawHistory.some((draw) => draw.id === id) ||
    state.lastDraw?.id === id ||
    (state.lastDraw && !state.lastDraw.viewed)
  )
    return state;
  const poolCards = ALBUM.filter((c) => c.poolId === poolId);
  const preset = mode === "ten" ? PRESET_TEN : PRESET_SINGLE;
  const counts = { ...state.counts };
  const items: DrawResultItem[] = [];
  for (const fixture of preset) {
    const fixtureIndex = ALBUM.filter((c) => c.poolId === fixture.card.poolId).findIndex(
      (c) => c.id === fixture.card.id,
    );
    const base = poolCards[fixtureIndex % poolCards.length];
    if (!base) return state;
    const ownedBefore = counts[base.id]?.count ?? cardCount(base);
    const growthBefore = Math.min(100, Math.max(0, ownedBefore - 1) * 10);
    const growthAfter = Math.min(100, ownedBefore * 10);
    counts[base.id] = {
      count: ownedBefore + 1,
      obtainedAt: counts[base.id]?.obtainedAt ?? base.obtainedAt ?? date,
    };
    items.push({
      card: {
        ...base,
        owned: true,
        dupes: ownedBefore,
        growthPct: growthAfter,
        obtainedAt: counts[base.id]!.obtainedAt!,
      },
      isNew: ownedBefore === 0,
      ownedBefore,
      growthBefore,
      growthAfter,
      source: { ...fixture.source, paidKp: 0, creatorShareBase: 0 },
    });
  }
  const before = state.pity[poolId] ?? DEMO_PITY_COUNT_BEFORE;
  const after = before + items.length;
  const draw: DemoDraw = { id, poolId, items, before, after, viewed: false, createdAt: date };
  return {
    ...state,
    counts,
    pity: { ...state.pity, [poolId]: after },
    lastDraw: draw,
    drawHistory: [...state.drawHistory, draw],
  };
}

/** Three demo units can include multiple copies of a card. Validate before consuming any. */
export function applyDemoSynthesis(
  state: DemoPlayerState,
  poolId: string,
  grade: Rarity,
  materials: string[],
  useItem: boolean,
  id: string,
  date: string,
): DemoPlayerState {
  if (
    poolId === KEEPY_SAMPLE_POOL_ID ||
    grade === "O" ||
    materials.length !== DEMO_MATERIAL_COUNT ||
    state.lastSynthesis?.id === id
  )
    return state;
  const album = demoAlbum(state);
  const needed = new Map<string, number>();
  for (const cardId of materials) needed.set(cardId, (needed.get(cardId) ?? 0) + 1);
  for (const [cardId, count] of needed) {
    const card = album.find((c) => c.id === cardId);
    if (!card || card.poolId !== poolId || card.grade !== grade || cardCount(card) < count)
      return state;
  }
  const key = poolId + ":" + grade;
  const failures = state.failures[key] ?? SYNTHESIS.failStreak;
  const kind = failures + 1 >= SYNTHESIS.pityAt ? "pity" : useItem ? "success" : "fail";
  const outputGrade = kind === "fail" ? grade : nextGrade(grade);
  const candidates = album.filter((c) => c.poolId === poolId && c.grade === outputGrade);
  const output = candidates.find((c) => !c.owned) ?? candidates[0];
  if (!output) return state;
  const counts = { ...state.counts };
  for (const [cardId, count] of needed) {
    const card = album.find((c) => c.id === cardId)!;
    counts[cardId] = { count: cardCount(card) - count, obtainedAt: card.obtainedAt };
  }
  counts[output.id] = {
    count: (counts[output.id]?.count ?? cardCount(output)) + 1,
    obtainedAt: counts[output.id]?.obtainedAt ?? output.obtainedAt ?? date,
  };
  return {
    ...state,
    counts,
    failures: { ...state.failures, [key]: kind === "fail" ? failures + 1 : 0 },
    lastSynthesis: { id, poolId, grade, materials: [...materials], kind, cardId: output.id },
  };
}

/** Stored data is a disposable demo snapshot. Bad/old data falls back without touching existing settings. */
function parseStoredDraw(input: unknown): DemoDraw | null {
  let lastDraw: DemoDraw | null = null;
  // Reconstruct faces and labels from the catalogue, never trust stored card definitions.
  if (input && typeof input === "object") {
    const draw = input as Record<string, unknown>;
    if (
      typeof draw["id"] === "string" &&
      draw["id"].length > 0 &&
      draw["id"].length <= 200 &&
      typeof draw["poolId"] === "string" &&
      canDemoDraw(draw["poolId"]) &&
      Array.isArray(draw["items"]) &&
      [1, 11].includes(draw["items"].length) &&
      typeof draw["before"] === "number" &&
      Number.isSafeInteger(draw["before"]) &&
      draw["before"] >= 0 &&
      draw["before"] <= 100000
    ) {
      const items: DrawResultItem[] = [];
      for (const input of draw["items"]) {
        if (!input || typeof input !== "object") break;
        const row = input as Record<string, unknown>;
        const storedCard = row["card"] as { id?: unknown } | undefined;
        const card = ALBUM.find((c) => c.id === storedCard?.id && c.poolId === draw["poolId"]);
        if (
          !card ||
          typeof row["ownedBefore"] !== "number" ||
          !Number.isSafeInteger(row["ownedBefore"]) ||
          row["ownedBefore"] < 0 ||
          row["ownedBefore"] > 100000
        )
          break;
        const ownedBefore = row["ownedBefore"];
        items.push({
          card,
          ownedBefore,
          isNew: ownedBefore === 0,
          growthBefore: Math.min(100, Math.max(0, ownedBefore - 1) * 10),
          growthAfter: Math.min(100, ownedBefore * 10),
          source: {
            kind: items.length === 10 ? "bonus" : "paid",
            paidKp: 0,
            creatorShareBase: 0,
            countsTowardPity: true,
            pityTriggered: false,
          },
        });
      }
      if (items.length === draw["items"].length)
        lastDraw = {
          id: draw["id"],
          createdAt:
            typeof draw["createdAt"] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(draw["createdAt"])
              ? draw["createdAt"]
              : "",
          poolId: draw["poolId"],
          before: draw["before"],
          after: draw["before"] + items.length,
          viewed: draw["viewed"] === true,
          items,
        };
    }
  }
  return lastDraw;
}

export function parseDemoPlayer(raw: string | null): DemoPlayerState {
  if (!raw) return EMPTY_DEMO;
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) return EMPTY_DEMO;
    const value = data as Record<string, unknown>;
    if (value["version"] !== 1) return EMPTY_DEMO;
    const counts: DemoCounts = {};
    if (value["counts"] && typeof value["counts"] === "object" && !Array.isArray(value["counts"])) {
      for (const [id, entry] of Object.entries(value["counts"])) {
        if (
          !ALBUM.some((c) => c.id === id && c.poolId !== KEEPY_SAMPLE_POOL_ID) ||
          !entry ||
          typeof entry !== "object"
        )
          continue;
        const row = entry as Record<string, unknown>;
        if (
          typeof row["count"] !== "number" ||
          !Number.isSafeInteger(row["count"]) ||
          row["count"] < 0 ||
          row["count"] > 100000
        )
          continue;
        counts[id] = {
          count: row["count"],
          ...(typeof row["obtainedAt"] === "string" && row["obtainedAt"].length <= 40
            ? { obtainedAt: row["obtainedAt"] }
            : {}),
        };
      }
    }
    const cleanNumbers = (input: unknown) => {
      const out: Record<string, number> = {};
      if (!input || typeof input !== "object" || Array.isArray(input)) return out;
      for (const [key, count] of Object.entries(input)) {
        if (
          POOLS.some(
            (p) => p.id !== KEEPY_SAMPLE_POOL_ID && (key === p.id || key.startsWith(p.id + ":")),
          ) &&
          typeof count === "number" &&
          Number.isSafeInteger(count) &&
          count >= 0 &&
          count <= 100000
        )
          out[key] = count;
      }
      return out;
    };
    const lastDraw = parseStoredDraw(value["lastDraw"]);
    const drawHistory: DemoDraw[] = [];
    const ids = new Set<string>();
    for (const input of Array.isArray(value["drawHistory"]) ? value["drawHistory"] : []) {
      const draw = parseStoredDraw(input);
      if (draw && !ids.has(draw.id)) {
        ids.add(draw.id);
        drawHistory.push(draw);
      }
    }
    // Existing v1 snapshots retain their pending result and migrate its one known record.
    if (lastDraw && !ids.has(lastDraw.id)) drawHistory.push(lastDraw);
    const physical = Array.isArray(value["physical"])
      ? value["physical"]
          .filter(
            (id): id is string =>
              typeof id === "string" &&
              ALBUM.some((c) => c.id === id && c.poolId !== KEEPY_SAMPLE_POOL_ID),
          )
          .slice(0, ALBUM.length)
      : [];
    const physicalQuantities: Record<string, number> = {};
    for (const id of physical) {
      const input = value["physicalQuantities"];
      const qty =
        input && typeof input === "object" ? (input as Record<string, unknown>)[id] : undefined;
      physicalQuantities[id] =
        typeof qty === "number" && Number.isSafeInteger(qty) && qty > 0 && qty <= 100000 ? qty : 1;
    }
    return {
      version: 1,
      counts,
      pity: cleanNumbers(value["pity"]),
      failures: cleanNumbers(value["failures"]),
      lastDraw,
      drawHistory,
      lastSynthesis: null,
      physical: [...new Set(physical)],
      physicalQuantities,
    };
  } catch {
    return EMPTY_DEMO;
  }
}

/** Browser-only quantity fixture; never consumes cards or creates an order. */
export function applyDemoPhysical(
  state: DemoPlayerState,
  cardId: string,
  quantity: number,
): DemoPlayerState {
  const card = demoAlbum(state).find((c) => c.id === cardId);
  const grades = ["SSR", "HR", "UR", "O"];
  if (
    !card ||
    card.poolId === KEEPY_SAMPLE_POOL_ID ||
    !card.owned ||
    !grades.includes(card.grade) ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > cardCount(card) ||
    state.physical.includes(cardId)
  )
    return state;
  return {
    ...state,
    physical: [...state.physical, cardId],
    physicalQuantities: { ...state.physicalQuantities, [cardId]: quantity },
  };
}
