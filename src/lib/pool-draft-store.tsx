// 本地 Mock 草稿儲存（Demo）：僅使用瀏覽器 localStorage，沒有任何伺服器儲存。
import { useCallback, useEffect, useState } from "react";
import type { WizardDraft } from "@/data/pool-wizard";
import { POOLS } from "@/data/mock";

const DRAFT_KEY = "cu-pool-wizard-draft";
const LIST_KEY = "cu-pool-draft-list";

export interface DraftPoolRow {
  slug: string;
  name: string;
  kind: string;
  startAt: string;
  endAt: string;
  cardCount: number;
  goddessCount: number;
  createdAt: string;
  templateKey: string;
  copiedFrom?: string | undefined;
}

const read = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Demo：忽略儲存失敗 */
  }
};

export const loadWizardDraft = () => read<WizardDraft | null>(DRAFT_KEY, null);
export const saveWizardDraft = (d: WizardDraft) => write(DRAFT_KEY, d);
export const clearWizardDraft = () => {
  if (typeof window !== "undefined") window.localStorage.removeItem(DRAFT_KEY);
};

export const loadDraftPools = () => read<DraftPoolRow[]>(LIST_KEY, []);
export const addDraftPool = (row: DraftPoolRow) => {
  const rows = loadDraftPools().filter((r) => r.slug !== row.slug);
  write(LIST_KEY, [row, ...rows]);
};
export const clearDraftPools = () => {
  if (typeof window !== "undefined") window.localStorage.removeItem(LIST_KEY);
};

/** 既有六個卡池的 poolId 永不可被草稿覆蓋或刪除 */
export const usedSlugs = (drafts: DraftPoolRow[]) => [
  ...POOLS.map((p) => p.id),
  ...drafts.map((d) => d.slug),
];

/** 讀取本地 Demo 草稿卡池清單（僅在 client 端載入，避免 SSR 不一致） */
export function useDraftPools() {
  const [rows, setRows] = useState<DraftPoolRow[]>([]);
  const refresh = useCallback(() => setRows(loadDraftPools()), []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { rows, refresh };
}

export const removeDraftPool = (slug: string) => {
  const rows = loadDraftPools().filter((r) => r.slug !== slug);
  write(LIST_KEY, rows);
};
