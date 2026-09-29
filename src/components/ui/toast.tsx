import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Toast = { id: number; title: string; description?: string; tone?: "default" | "gold" };
const ToastContext = createContext<{ push: (t: Omit<Toast, "id">) => void }>({
  push: () => {},
});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-20 left-1/2 z-[60] flex w-[min(92vw,360px)] -translate-x-1/2 flex-col gap-2 lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`panel panel-glow animate-in fade-in slide-in-from-bottom-2 px-4 py-3 text-sm shadow-xl ${
              t.tone === "gold" ? "hairline-gold" : ""
            }`}
          >
            <p className="font-semibold">{t.title}</p>
            {t.description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
