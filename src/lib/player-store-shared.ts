import { createContext, useContext } from "react";
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

export const DEFAULTS: PlayerSettings = {
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

export const Ctx = createContext<{
  settings: PlayerSettings;
  update: <K extends keyof PlayerSettings>(k: K, v: PlayerSettings[K]) => void;
  updateMany: (patch: Partial<PlayerSettings>) => void;
}>({ settings: DEFAULTS, update: () => {}, updateMany: () => {} });

export const usePlayerSettings = () => useContext(Ctx);
