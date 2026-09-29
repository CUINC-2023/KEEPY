import { useEffect, useState } from "react";

/** Demo 用：模擬短暫載入狀態（無任何真實請求） */
export function useMockLoading(ms = 450) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}
