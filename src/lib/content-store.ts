import { useDiscovery } from "./discovery-store";
import { useLocale } from "./keepy-i18n-shared";
import { useLocalTest, localTestState } from "./local-test-client";
import { useEffect, useSyncExternalStore } from "react";
import { FAQ, type FaqEntry } from "@/data/faq";
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

export type AnnouncementEdit = {
  title: string;
  summary: string;
  body: string[];
  date: string;
  tag: string;
  visible: boolean;
};
export type ActivityEdit = {
  title: string;
  subtitle: string;
  description: string[];
  period: string;
  status: ActivityStatus;
  visible: boolean;
};
export type HomeSectionKey =
  | "notices"
  | "pools"
  | "activities"
  | "season-wish"
  | "recruit-rank"
  | "cards"
  | "physical"
  | "stories";
export type HomeSection = { key: HomeSectionKey; label: string; visible: boolean };
export type FaqEdit = {
  title?: Partial<FaqEntry["title"]>;
  body?: Partial<FaqEntry["body"]>;
  hint?: Partial<FaqEntry["hint"]>;
};
export type ContentOverrides = {
  faq: Record<string, FaqEdit>;
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
export const DEFAULT_LEADERBOARD_NOTE =
  "Demo 示範排名，只顯示公開且允許排名的收藏家，不顯示消費金額。";
/** Homepage labels share the content facade; published stories remain the discovery source. */
export const HOME_UI_COPY = {
  "zh-TW": {
    explore: "探索收藏",
    collection: "本人收藏",
    play: "收藏遊玩",
    rankings: "公開排行",
    more: "了解更多與使用限制",
    stories: "故事與收藏指南",
    storyNext: "閱讀完整故事 →",
    summary: "收藏喜歡，留下創作時刻。",
    future: "下一季預告",
    notices: "重要公告",
    pools: "公開系列",
    activities: "活動與票選",
    recruitment: "創作者合作",
    cards: "創作者與作品",
    physical: "實體典藏說明",
    index: "查看全部 →",
    status: "本機示意／前端預覽",
    imageUnavailable: "主視覺暫時無法載入；仍可探索公開內容。",
    limit: "此站為前端預覽；本人保存與審核需要本機測試服務。未接真人登入、正式付款或實體履約。",
    mock: "示意主視覺，非已確認合作；日期與素材用途依各內容頁說明。",
    games: "五種練習玩法，無資產消耗或獎勵；紀錄僅本人可見。",
    rankingNote: "自願公開與排行同意；正式榜排除測試資料，不以消費或玩法分數排名。",
  },
  en: {
    explore: "Explore collections",
    collection: "My collection",
    play: "Collection play",
    rankings: "Public rankings",
    more: "Learn more and usage limits",
    stories: "Stories and collection guides",
    storyNext: "Read the full story →",
    summary: "Collect what you love. Keep creative moments.",
    future: "Next season",
    notices: "Announcements",
    pools: "Public series",
    activities: "Activities and voting",
    recruitment: "Creator collaboration",
    cards: "Creators and works",
    physical: "Physical collection guide",
    index: "View all →",
    status: "Local samples / frontend preview",
    imageUnavailable: "Hero artwork is unavailable; public exploration remains available.",
    limit:
      "This is a frontend preview. Private saves and reviews need the Local Test service. No real sign-in, payment or physical fulfillment.",
    mock: "Sample hero artwork, not a confirmed collaboration. See each content page for dates and material uses.",
    games: "Five practice games with no asset cost or rewards; records stay private.",
    rankingNote:
      "Public visibility and ranking consent are required. Formal rankings exclude test data, spending and game scores.",
  },
};
export const ANNOUNCEMENT_TAGS = ["維護", "卡池", "預告", "規則", "活動", "兌換"];
export const ACTIVITY_STATUSES: ActivityStatus[] = ["進行中", "即將開始", "已結束"];

const empty = (): ContentOverrides => ({
  version: VERSION,
  faq: {},
  announcements: {},
  activities: {},
  home: {},
  pools: {},
  wishes: {},
  leaderboard: {},
});
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** 損壞、舊版或格式不符一律安全退回預設值。 */
export function parseOverrides(raw: string | null): ContentOverrides {
  if (!raw) return empty();
  try {
    const v: unknown = JSON.parse(raw);
    if (!isObj(v) || v["version"] !== VERSION) return empty();
    const base = empty();
    for (const k of ["announcements", "activities", "pools", "wishes"] as const)
      if (isObj(v[k])) (base[k] as Record<string, unknown>) = v[k] as Record<string, unknown>;
    if (isObj(v["home"])) {
      const h = v["home"];
      if (typeof h["heroDescription"] === "string")
        base.home.heroDescription = h["heroDescription"];
      if (Array.isArray(h["sections"])) {
        const keys = new Set(DEFAULT_HOME_SECTIONS.map((s) => s.key));
        const secs: Pick<HomeSection, "key" | "visible">[] = h["sections"].filter(
          (s: unknown): s is Pick<HomeSection, "key" | "visible"> =>
            isObj(s) && keys.has(s["key"] as HomeSectionKey) && typeof s["visible"] === "boolean",
        );
        if (
          secs.length === DEFAULT_HOME_SECTIONS.length &&
          new Set(secs.map((s) => s.key)).size === secs.length
        )
          base.home.sections = secs.map((s) => ({
            ...DEFAULT_HOME_SECTIONS.find((d) => d.key === s.key)!,
            visible: s.visible,
          }));
      }
    }
    if (isObj(v["leaderboard"]) && typeof v["leaderboard"]["note"] === "string")
      base.leaderboard.note = v["leaderboard"]["note"];
    if (isObj(v["faq"]))
      for (const item of FAQ) {
        const input = v["faq"][item.id];
        if (!isObj(input)) continue;
        const next: FaqEdit = {};
        for (const field of ["title", "body", "hint"] as const) {
          const record = input[field];
          if (!isObj(record)) continue;
          const text: Partial<FaqEntry["title"]> = {};
          for (const locale of ["zh-TW", "en"] as const)
            if (
              typeof record[locale] === "string" &&
              record[locale].trim() &&
              record[locale].length <= (field === "body" ? 8000 : 300)
            )
              text[locale] = record[locale];
          if (Object.keys(text).length) next[field] = text;
        }
        if (Object.keys(next).length) base.faq[item.id] = next;
      }
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
  try {
    cache = parseOverrides(window.localStorage.getItem(CONTENT_STORAGE_KEY));
  } catch {
    cache = empty();
  }
  return cache;
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === CONTENT_STORAGE_KEY) {
      cache = null;
      fn();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}
export function writeOverrides(next: ContentOverrides) {
  if (localTestState().enabled) return false;
  cache = next;
  let persisted = true;
  try {
    window.localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    persisted = false;
    /* 本機儲存失敗時僅保留記憶體 */
  }
  listeners.forEach((l) => l());
  return persisted;
}
export function resetOverrides() {
  if (localTestState().enabled) return;
  cache = empty();
  try {
    window.localStorage.removeItem(CONTENT_STORAGE_KEY);
  } catch {
    /* noop */
  }
  listeners.forEach((l) => l());
}
export function useOverrides(): ContentOverrides {
  const mock = useSyncExternalStore(subscribe, read, () => SERVER);
  const local = useLocalTest();
  return local.enabled ? local.content : mock;
}

/** 合併介面：首頁、列表、詳情一律透過此處取用。 */
export function mergeContent(o: ContentOverrides) {
  const announcements = ANNOUNCEMENT_DETAILS.map((a) => ({
    ...a,
    visible: true,
    ...o.announcements[a.id],
  }));
  const activities = ACTIVITIES.map((a) => ({
    ...activityById(a.id)!,
    visible: true,
    ...o.activities[a.id],
  }));
  return {
    faq: FAQ.map((item) => ({
      ...item,
      title: { ...item.title, ...o.faq[item.id]?.title },
      body: { ...item.body, ...o.faq[item.id]?.body },
      hint: { ...item.hint, ...o.faq[item.id]?.hint },
    })),
    announcements,
    activities,
    announcementById: (id: string) => announcements.find((a) => a.id === id),
    activityById: (id: string) => activities.find((a) => a.id === id),
    heroDescription: o.home.heroDescription ?? SEASON.description,
    homeSections: o.home.sections ?? DEFAULT_HOME_SECTIONS,
    poolDescription: (id: string) =>
      o.pools[id]?.description ?? POOLS.find((p) => p.id === id)?.description ?? "",
    wishes: WISH_CANDIDATES.map((w) => ({
      ...w,
      summary: WISH_DETAILS[w.id]?.summary ?? "",
      howToView: WISH_DETAILS[w.id]?.howToView ?? "",
      ...o.wishes[w.id],
    })),
    leaderboardNote: o.leaderboard.note ?? DEFAULT_LEADERBOARD_NOTE,
  };
}
export function useContent() {
  const content = mergeContent(useOverrides());
  const discovery = useDiscovery();
  const { locale } = useLocale();
  return {
    ...content,
    homeUi: HOME_UI_COPY[locale],
    poolDescription: (id: string) =>
      discovery.items.find((i) => i.kind === "series" && i.referenceId === id)?.copy.summary[
        locale
      ] ?? content.poolDescription(id),
  };
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
      const set = (sel: string, v: string) =>
        document
          .querySelectorAll<HTMLMetaElement>(sel)
          .forEach((m) => m.setAttribute("content", v));
      set('meta[name="description"]', description);
      set('meta[property="og:title"]', title);
      set('meta[property="og:description"]', description);
    };
    apply();
    const t = window.setTimeout(apply, 50);
    return () => window.clearTimeout(t);
  }, [title, description]);
}

// Discovery uses the existing SQLite documents/version mechanism, exposed through this shared content source.
export { useDiscovery, type DiscoveryItem } from "./discovery-store";

export { useParticipation } from "./participation-store";

export { useSupply } from "./supply-store";

export { publicContentSearch } from "./public-search.mjs";
