import { useEffect, useSyncExternalStore } from "react";
import {
  localApi,
  localTestState,
  useLocalTest,
  localSessionGeneration,
  observeLocalSession,
} from "./local-test-client";
import { discoveryCommand, retryDiscoveryCommand } from "./discovery-store";
import type { Bilingual } from "./collection-store";
export interface RoundValue {
  kind: "theme" | "creator";
  title: Bilingual;
  summary: Bilingual;
  startAt: string;
  endAt: string;
  limit: number;
  options: { id: string; title: Bilingual }[];
  resultsPublished: boolean;
  result: Bilingual;
}
export interface ActivityValue {
  title: Bilingual;
  summary: Bilingual;
  startAt: string;
  endAt: string;
  claimUntil: string;
  eligibility: "account" | "member";
  condition: string;
  instructions: Bilingual;
  rewardKind: "none" | "pending";
  result: Bilingual;
}
export interface Entry<T> {
  id: string;
  status: string;
  draft: T;
  published: (T & { ruleVersion: number }) | null;
}
export interface TaskRule {
  id: string;
  title: Bilingual;
  enabled: boolean;
}
export interface ParticipationDocument {
  schema: 1;
  rounds: Entry<RoundValue>[];
  activities: Entry<ActivityValue>[];
  tasks: TaskRule[];
}
export interface Recommendation {
  id: string;
  round_id: string;
  version: number;
  name: string;
  url: string;
  reason: string;
  status: string;
  reviewNote: string;
}
export interface ParticipationAdmin {
  version: number;
  data: ParticipationDocument;
  recommendations: Recommendation[];
}
export interface ParticipationPublic {
  version: number;
  rounds: (RoundValue & {
    id: string;
    ruleVersion: number;
    state: string;
    counts: { optionId: string; count: number }[];
    recommendations: { name: string; url: string }[];
  })[];
  activities: (ActivityValue & { id: string; ruleVersion: number; state: string })[];
  tasks: TaskRule[];
}
export interface ParticipationMe {
  actorId: string;
  activityEligibility: {
    activityId: string;
    eligible: boolean;
    conditionMet: boolean;
    claimOpen: boolean;
  }[];
  votes: { round_id: string; option_id: string }[];
  recommendations: Recommendation[];
  tasks: (TaskRule & { completedAt: string; ruleVersion: number; rewardGranted: false })[];
  claims: { activityId: string; recordedAt: string; rewardGranted: false; ruleVersion: number }[];
}
const empty = {
  data: null as ParticipationPublic | null,
  me: null as ParticipationMe | null,
  error: "",
  meError: "",
  loaded: false,
};
let state = empty,
  generation = 0;
const listeners = new Set<() => void>();
let publicRequest: Promise<void> | null = null;
function emit(next: typeof empty) {
  state = next;
  listeners.forEach((fn) => fn());
}
export function refreshParticipation() {
  if (publicRequest) return publicRequest;
  publicRequest = localApi<ParticipationPublic>("/participation")
    .then((data) => emit({ ...state, data, error: "", loaded: true }))
    .catch((e) => emit({ ...state, data: null, error: String(e), loaded: true }))
    .finally(() => {
      publicRequest = null;
    });
  return publicRequest;
}
export async function refreshParticipationMe() {
  const n = ++generation,
    epoch = localSessionGeneration(),
    actor = localTestState().summary?.user.id;
  emit({ ...state, me: state.me?.actorId === actor ? state.me : null, meError: "" });
  if (!actor || !localTestState().enabled) return;
  try {
    const me = await localApi<ParticipationMe>("/participation/me");
    if (
      n === generation &&
      epoch === localSessionGeneration() &&
      localTestState().enabled &&
      localTestState().summary?.user.id === me.actorId
    )
      emit({ ...state, me });
  } catch (e) {
    if (n === generation && epoch === localSessionGeneration())
      emit({ ...state, me: null, meError: String(e) });
  }
}
let sessionEpoch = localSessionGeneration();
const stopSession = observeLocalSession(() => {
  const next = localSessionGeneration();
  if (next === sessionEpoch) return;
  sessionEpoch = next;
  generation++;
  emit({ ...state, me: null, meError: "" });
});
if (import.meta.hot) import.meta.hot.dispose(stopSession);
export function useParticipation() {
  const local = useLocalTest();
  const snap = useSyncExternalStore(
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
    const refresh = () => {
      void refreshParticipation();
      void refreshParticipationMe();
    };
    refresh();
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  const actor = local.summary?.user.id,
    epoch = localSessionGeneration(),
    holdings = local.summary?.holdings;
  useEffect(() => {
    void refreshParticipationMe();
  }, [actor, local.enabled, holdings, epoch]);
  return { ...snap, me: local.enabled && snap.me?.actorId === actor ? snap.me : null };
}
export async function sendParticipation(body: unknown) {
  const result = await discoveryCommand("/participation/commands", body);
  await refreshParticipationMe();
  await refreshParticipation();
  return result;
}
export async function retryParticipation() {
  const result = await retryDiscoveryCommand("/participation/commands");
  await refreshParticipationMe();
  await refreshParticipation();
  return result;
}
