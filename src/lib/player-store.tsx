import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_SHOWCASE_BADGES, DEFAULT_SHOWCASE_CARDS } from "@/data/player-profile";

export interface PlayerSettings {
  nickname: string;
  bio: string;
  reduceMotion: boolean;
  skipDrawAnimation: boolean;
  notifyNewPool: boolean;
  notifyGoddessUpdate: boolean;
  notifyMarketing: boolean;
  publicAlbum: boolean;
  publicRanking: boolean;
  publicProfile: boolean;
  publicCardCounts: boolean;
  publicPhysical: boolean;
  showcaseCards: string[];
  showcaseBadges: string[];
}

const STORAGE_KEY = "cu-player-settings";

const DEFAULTS: PlayerSettings = {
  nickname: "橘子收藏家",
  bio: "收集制服序章全等級卡面中。",
  reduceMotion: false,
  skipDrawAnimation: false,
  notifyNewPool: true,
  notifyGoddessUpdate: true,
  notifyMarketing: false,
  publicAlbum: true,
  publicRanking: true,
  publicProfile: true,
  publicCardCounts: true,
  publicPhysical: true,
  showcaseCards: DEFAULT_SHOWCASE_CARDS,
  showcaseBadges: DEFAULT_SHOWCASE_BADGES,
};

const Ctx = createContext<{
  settings: PlayerSettings;
  update: <K extends keyof PlayerSettings>(k: K, v: PlayerSettings[K]) => void;
  updateMany: (patch: Partial<PlayerSettings>) => void;
}>({ settings: DEFAULTS, update: () => {}, updateMany: () => {} });

export const usePlayerSettings = () => useContext(Ctx);

export function PlayerSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PlayerSettings>(DEFAULTS);

  // Local Mock only: read the browser copy after hydration.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings((s) => ({ ...s, ...(JSON.parse(raw) as Partial<PlayerSettings>) }));
    } catch {
      /* ignore malformed local mock data */
    }
  }, []);

  const persist = useCallback((next: PlayerSettings) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable: keep in-memory state only */
    }
    return next;
  }, []);

  const value = useMemo(
    () => ({
      settings,
      update: <K extends keyof PlayerSettings>(k: K, v: PlayerSettings[K]) =>
        setSettings((s) => persist({ ...s, [k]: v })),
      updateMany: (patch: Partial<PlayerSettings>) =>
        setSettings((s) => persist({ ...s, ...patch })),
    }),
    [settings, persist]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
