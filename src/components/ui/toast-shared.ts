import { createContext, useContext } from "react";

export type Toast = { id: number; title: string; description?: string; tone?: "default" | "gold" };

export const ToastContext = createContext<{ push: (t: Omit<Toast, "id">) => void }>({
  push: () => {},
});

export const useToast = () => useContext(ToastContext);
