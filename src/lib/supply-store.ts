import type { ReviewFeedback } from "./supply-feedback.mjs";
import { useEffect, useState, useCallback, useRef } from "react";
import { localApi, localTestState, useLocalTest } from "./local-test-client";
import {
  discoveryCommand,
  retryDiscoveryCommand,
  refreshDiscovery,
  hasPendingDiscovery,
} from "./discovery-store";
import type { Bilingual } from "./collection-store";
export type SampleUse = "pending" | "sample-confirmed" | "not-requested";
export interface SupplyMaterial {
  id: string;
  ref: "season-hero" | "text-only";
  version: number;
  source: string;
  evidence: string;
  uses: Record<"website" | "social" | "print", SampleUse>;
  startAt: string;
  endAt: string;
  alt: Bilingual;
  cardId: string;
}
export type EditorialBlock =
  | { type: "heading"; text: Bilingual }
  | { type: "paragraph"; text: Bilingual }
  | { type: "image"; materialId: string; caption: Bilingual };
export interface Editorial {
  creatorIntro: Bilingual;
  questions: Bilingual[];
  articles: {
    id: string;
    category: string;
    title: Bilingual;
    summary: Bilingual;
    blocks: EditorialBlock[];
  }[];
}
export interface SupplyValue {
  editorial?: Editorial;
  partnerId: string;
  creatorId: string;
  poolId: string;
  articleIds: string[];
  copy: Record<"title" | "summary" | "story" | "goal" | "endPolicy" | "teaser", Bilingual>;
  application: Bilingual;
  cardNotes: Bilingual;
  promotion: Bilingual;
  retrospective: Bilingual;
  releaseAt: string;
  withdrawAt: string;
  materials: SupplyMaterial[];
}
export interface SupplyPackage {
  version: number;
  data: {
    id: string;
    ownerId: string;
    partnerId: string;
    creatorId: string;
    poolId: string;
    draftRevision: number;
    submittedRevision: number | null;
    approvedRevision: number | null;
    publishedRevision: number | null;
    published: boolean;
    status: string;
    revisions: { revision: number; value: SupplyValue; at: string }[];
    reviews: {
      revision: number;
      decision: string;
      reason: string;
      at: string;
      feedback?: ReviewFeedback[];
    }[];
    publications: { revision: number; action: string; at: string }[];
    issues: string[];
    schedule: {
      checkedAt: string;
      submittedAt: string | null;
      nextBoundary: string | null;
      draftPeriod: string;
      publicPeriod: string | null;
      needsReview: boolean;
      visible: boolean;
    };
    remuneration: { id: string; version: number; status: string; terms: Record<string, unknown> }[];
  };
}
export interface SupplyList {
  actorId: string;
  packages: SupplyPackage[];
  discoveryVersion?: number;
  context: {
    creatorId: string;
    partners: { id: string; name: string }[];
    pools: { id: string; name: string }[];
    articles: { id: string; poolIds: string[] }[];
  } | null;
}
export function useSupply(official = false) {
  const local = useLocalTest(),
    actor = local.summary?.user.id,
    allowed = local.enabled && local.summary?.user.role === (official ? "official" : "creator");
  const [data, setData] = useState<SupplyList | null>(null),
    [error, setError] = useState(""),
    [loaded, setLoaded] = useState(false);
  const generation = useRef(0);
  const load = useCallback(async () => {
    const run = ++generation.current;
    const id = localTestState().summary?.user.id;
    setError("");
    setData(null);
    setLoaded(false);
    if (!allowed) {
      setData(null);
      return;
    }
    try {
      const result = await localApi<SupplyList>(official ? "/admin/supply" : "/supply/me");
      if (
        run === generation.current &&
        id === localTestState().summary?.user.id &&
        result.actorId === id
      ) {
        setData(result);
        setLoaded(true);
      }
    } catch (e) {
      if (run === generation.current && id === localTestState().summary?.user.id) {
        setData(null);
        setLoaded(true);
        setError(String(e));
      }
    }
  }, [allowed, official]);
  useEffect(() => {
    setData(null);
    setLoaded(false);
    setError("");
    generation.current += 1;
    if (allowed) void load();
    return () => {
      generation.current++;
    };
  }, [actor, allowed, load]);
  return {
    data: data?.actorId === actor && allowed ? data : null,
    error,
    loaded,
    load,
    allowed,
    actor,
  };
}
export async function supplySend(official: boolean, body: unknown) {
  await discoveryCommand(official ? "/admin/supply/commands" : "/supply/commands", body);
  await refreshDiscovery(true);
}
export async function supplyRetry(official: boolean) {
  await retryDiscoveryCommand(official ? "/admin/supply/commands" : "/supply/commands");
  await refreshDiscovery();
}
const blank = () => ({ "zh-TW": "", en: "" });
export function emptySupply(context: NonNullable<SupplyList["context"]>): SupplyValue {
  return {
    partnerId: context.partners[0]?.id ?? "",
    creatorId: context.creatorId,
    poolId: context.pools[0]?.id ?? "",
    articleIds: [],
    copy: {
      title: blank(),
      summary: blank(),
      story: blank(),
      goal: blank(),
      endPolicy: blank(),
      teaser: blank(),
    },
    application: blank(),
    cardNotes: blank(),
    promotion: blank(),
    retrospective: blank(),
    releaseAt: "",
    withdrawAt: "",
    materials: [],
  };
}

export function supplyHasPending(official = false) {
  return hasPendingDiscovery(official ? "/admin/supply/commands" : "/supply/commands");
}
