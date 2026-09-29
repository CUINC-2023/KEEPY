import { useEffect, useState } from "react";

/** Keep SSR and the first client render identical; only start the clock after hydration. */
export function useSeasonClock() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

export function seasonCountdown(targetISO: string | null, now: number | null) {
  if (!targetISO) return "開放資訊待更新（Demo）";
  if (now === null) return "倒數計算中…";
  const difference = Date.parse(targetISO) - now;
  if (!Number.isFinite(difference)) return "開放資訊待更新（Demo）";
  if (difference <= 0) return "預定時間已到 · 開放資訊待更新（Demo）";
  const minutes = Math.ceil(difference / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  return `${days} 天 ${hours} 小時 ${minutes % 60} 分鐘`;
}

export function seasonNodeState(targetISO: string | null, daysBefore: number, now: number | null) {
  if (!targetISO || now === null) return "待確認（Demo）";
  const threshold = Date.parse(targetISO) - daysBefore * 86_400_000;
  return now >= threshold ? "節點時間已到（Demo）" : "等待節點（Demo）";
}