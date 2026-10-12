import { LocaleContext, Locale } from "./keepy-i18n-shared";
import { useEffect, useState, type ReactNode } from "react";
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("zh-TW");
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      setLocale(localStorage.getItem("keepy-locale-v1") === "en" ? "en" : "zh-TW");
    } catch {
      /* unavailable storage */
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = locale;
    try {
      localStorage.setItem("keepy-locale-v1", locale);
    } catch {
      /* unavailable storage */
    }
  }, [locale, hydrated]);
  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}
