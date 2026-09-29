import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "zh-TW" | "en";
export const copy = {
  brand: { "zh-TW": "KEEPY", en: "KEEPY" },
  faq: { "zh-TW": "常見問題", en: "FAQ" },
  player: { "zh-TW": "玩家", en: "Players" },
  creator: { "zh-TW": "創作者", en: "Creators" },
  pools: { "zh-TW": "卡池", en: "Card pools" },
  album: { "zh-TW": "卡冊", en: "Collection" },
  cards: { "zh-TW": "卡牌", en: "Cards" },
  physical: { "zh-TW": "實體卡", en: "Physical cards" },
  frozenRevenue: { "zh-TW": "凍結收益", en: "Frozen revenue" },
  preview: { "zh-TW": "範例／非正式上架", en: "Sample / not officially released" },
  noTransactions: { "zh-TW": "僅規格說明與 Local Mock，不開放真實交易、簽約、提領或物流。", en: "Specification preview and local mock only. No real transactions, contracts, withdrawals or shipping in any region." },
} as const;
export type CopyKey = keyof typeof copy;
const LocaleContext = createContext<{ locale: Locale; setLocale: (value: Locale) => void }>({ locale: "zh-TW", setLocale: () => {} });
export const useLocale = () => useContext(LocaleContext);
export const useCopy = () => { const { locale } = useLocale(); return (key: CopyKey) => copy[key][locale]; };
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    try { return localStorage.getItem("keepy-locale-v1") === "en" ? "en" : "zh-TW"; } catch { return "zh-TW"; }
  });
  useEffect(() => { document.documentElement.lang = locale; try { localStorage.setItem("keepy-locale-v1", locale); } catch { /* unavailable storage */ } }, [locale]);
  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}