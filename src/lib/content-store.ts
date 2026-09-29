import { useEffect, useSyncExternalStore } from "react";
import { POOLS } from "@/data/mock";
import {
  ACTIVITIES,
  ANNOUNCEMENT_DETAILS,
  SEASON,
  WISH_CANDIDATES,
  WISH_DETAILS,
  activityById,
  type ActivityStatus,
} from "@/data/public-hub";

/** 唯一可編輯內容來源：固定 Demo 資料為預設值，本機覆寫存於此 key（僅此瀏覽器）。 */
export const CONTENT_STORAGE_KEY = "pf-content-overrides-v1";
const VERSION = 1;

export type AnnouncementEdit = { title: string; summary: string; body: string[]; date: string; tag: string; visible: boolean };
export type ActivityEdit = { title: string; subtitle: string; description: string[]; period: string; status: ActivityStatus; visible: boolean };
export type HomeSectionKey = "notices" | "pools" | "activities" | "season-wish" | "recruit-rank" | "cards" | "physical" | "stories";
export type HomeSection = { key: HomeSectionKey; label: string; visible: boolean };
export type ContentOverrides = {
  version: number;
  announcements: Record<string, Partial<AnnouncementEdit>>;
  activities: Record<string, Partial<ActivityEdit>>;
  home: { heroDescription?: string; sections?: HomeSection[] };
  pools: Record<string, { description?: string }>;
  wishes: Record<string, { name?: string; summary?: string }>;
  leaderboard: { note?: string };
};

export const DEFAULT_HOME_SECTIONS: HomeSection[] = [
  { key: "notices", label: "重要公告", visible: true },
  { key: "pools", label: "當季進行中卡池", visible: true },
  { key: "activities", label: "活動專區", visible: true },
  { key: "season-wish", label: "下一季預告／許願卡池", visible: true },
  { key: "recruit-rank", label: "卡池募集／排行榜摘要", visible: true },
  { key: "cards", label: "新卡與熱門卡", visible: true },
  { key: "physical", label: "實體典藏", visible: true },
  { key: "stories", label: "創作者故事", visible: true },
];
export const DEFAULT_LEADERBOARD_NOTE = "Demo 示範排名，只顯示公開且允許排名的收藏家，不顯示消費金額。";
export const ANNOUNCEMENT_TAGS = ["維護", "卡池", "預告", "規則", "活動", "兌換"];
export const ACTIVITY_STATUSES: ActivityStatus[] = ["進行中", "即將開始", "已結束"];

const empty = (): ContentOverrides => ({ version: VERSION, announcements: {}, activities: {}, home: {}, pools: {}, wishes: {}, leaderboard: {} });
const isObj = (v: unknown): boolean => typeof v === "object" && v !== null && !Array.isArray(v);

/** 損壞、舊版或格式不符一律安全退回預設值。 */
export function parseOverrides(raw: string | null): ContentOverrides {
  if (!raw) return empty();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v: any = JSON.parse(raw);
    if (!isObj(v) || v.version !== VERSION) return empty();
    const base = empty();
    for (const k of ["announcements", "activities", "pools", "wishes"] as const) if (isObj(v[k])) (base[k] as Record<string, unknown>) = v[k] as Record<string, unknown>;
    if (isObj(v.home)) {
      const h = v.home;
      if (typeof h.heroDescription === "string") base.home.heroDescription = h.heroDescription;
      if (Array.isArray(h.sections)) {
        const keys = new Set(DEFAULT_HOME_SECTIONS.map((s) => s.key));
        const secs: HomeSection[] = h.sections.filter((s: any): s is HomeSection => isObj(s) && keys.has(s.key as HomeSectionKey) && typeof s.visible === "boolean");
        if (secs.length === DEFAULT_HOME_SECTIONS.length && new Set(secs.map((s: HomeSection) => s.key)).size === secs.length)
          base.home.sections = secs.map((s: HomeSection) => ({ ...DEFAULT_HOME_SECTIONS.find((d) => d.key === s.key)!, visible: s.visible }));
      }
    }
    if (isObj(v.leaderboard) && typeof v.leaderboard.note === "string") base.leaderboard.note = v.leaderboard.note;
    return base;
  } catch {
    return empty();
  }
}

let cache: ContentOverrides | null = null;
const listeners = new Set<() => void>();
const SERVER = empty();
function read(): ContentOverrides {
  if (cache) return cache;
  try { cache = parseOverrides(window.localStorage.getItem(CONTENT_STORAGE_KEY)); } catch { cache = empty(); }
  return cache;
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => { if (e.key === CONTENT_STORAGE_KEY) { cache = null; fn(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(fn); window.removeEventListener("storage", onStorage); };
}
export function writeOverrides(next: ContentOverrides) {
  cache = next;
  try { window.localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(next)); } catch { /* 本機儲存失敗時僅保留記憶體 */ }
  listeners.forEach((l) => l());
}
export function resetOverrides() {
  cache = empty();
  try { window.localStorage.removeItem(CONTENT_STORAGE_KEY); } catch { /* noop */ }
  listeners.forEach((l) => l());
}
export function useOverrides(): ContentOverrides {
  return useSyncExternalStore(subscribe, read, () => SERVER);
}

/** 合併介面：首頁、列表、詳情一律透過此處取用。 */
export function mergeContent(o: ContentOverrides) {
  const announcements = ANNOUNCEMENT_DETAILS.map((a) => ({ ...a, visible: true, ...o.announcements[a.id] }));
  const activities = ACTIVITIES.map((a) => ({ ...activityById(a.id)!, visible: true, ...o.activities[a.id] }));
  return {
    announcements,
    activities,
    announcementById: (id: string) => announcements.find((a) => a.id === id),
    activityById: (id: string) => activities.find((a) => a.id === id),
    heroDescription: o.home.heroDescription ?? SEASON.description,
    homeSections: o.home.sections ?? DEFAULT_HOME_SECTIONS,
    poolDescription: (id: string) => o.pools[id]?.description ?? POOLS.find((p) => p.id === id)?.description ?? "",
    wishes: WISH_CANDIDATES.map((w) => ({ ...w, summary: WISH_DETAILS[w.id]?.summary ?? "", howToView: WISH_DETAILS[w.id]?.howToView ?? "", ...o.wishes[w.id] })),
    leaderboardNote: o.leaderboard.note ?? DEFAULT_LEADERBOARD_NOTE,
  };
}
export function useContent() {
  return mergeContent(useOverrides());
}
export const emptyOverrides = empty;

/**
 * 以本機編輯內容更新目前分頁的標題與描述標籤（僅此瀏覽器）。
 * 外部分享爬蟲只會讀到伺服器端預設內容，不代表對外同步。
 */
export function useLocalHead(title: string, description: string) {
  useEffect(() => {
    const apply = () => {
      document.title = title;
      const set = (sel: string, v: string) => document.querySelectorAll<HTMLMetaElement>(sel).forEach((m) => m.setAttribute("content", v));
      set('meta[name="description"]', description);
      set('meta[property="og:title"]', title);
      set('meta[property="og:description"]', description);
    };
    apply();
    const t = window.setTimeout(apply, 50);
    return () => window.clearTimeout(t);
  }, [title, description]);
}
