import { Ctx, PlayerSettings, DEFAULTS } from "./player-store-shared";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "cu-player-settings";

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
    [settings, persist],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
