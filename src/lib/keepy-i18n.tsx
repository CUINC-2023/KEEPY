import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "zh-TW" | "en";
export const copy = {
  home: { "zh-TW": "首頁", en: "Home" },
  activities: { "zh-TW": "活動", en: "Activities" },
  rankings: { "zh-TW": "排行榜", en: "Rankings" },
  announcements: { "zh-TW": "公告", en: "News" },
  nextSeason: { "zh-TW": "下一季預告", en: "Next season" },
  wishPools: { "zh-TW": "許願卡池", en: "Wish pools" },
  recruitment: { "zh-TW": "卡池募集", en: "Pool proposals" },
  goddessSeries: { "zh-TW": "女神系列", en: "Goddess series" },
  creatorApply: { "zh-TW": "女神合作申請", en: "Apply as creator" },
  rules: { "zh-TW": "遊戲規則", en: "Rules" },
  playerHome: { "zh-TW": "玩家首頁", en: "Player home" },
  achievements: { "zh-TW": "成就與徽章", en: "Achievements" },
  growth: { "zh-TW": "指定卡成長", en: "Card growth" },
  synthesis: { "zh-TW": "合成工坊", en: "Synthesis" },
  wallet: { "zh-TW": "KP 錢包", en: "KP wallet" },
  history: { "zh-TW": "抽卡／消費紀錄", en: "History" },
  privacy: { "zh-TW": "公開頁設定", en: "Public profile" },
  settings: { "zh-TW": "玩家設定", en: "Settings" },
  overview: { "zh-TW": "營運總覽", en: "Overview" },
  poolAdmin: { "zh-TW": "卡池管理", en: "Manage pools" },
  poolTemplates: { "zh-TW": "卡池範本", en: "Pool templates" },
  albumTemplates: { "zh-TW": "卡冊範本", en: "Album templates" },
  creatorAdmin: { "zh-TW": "女神與申請管理", en: "Creators" },
  contentAdmin: { "zh-TW": "內容管理（示範）", en: "Content" },
  creatorHome: { "zh-TW": "女神後台總覽", en: "Creator home" },
  creatorDashboard: { "zh-TW": "女神儀表板", en: "Dashboard" },
  agreements: { "zh-TW": "數位合約", en: "Agreements" },
  profile: { "zh-TW": "公開資料", en: "Profile" },

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
  noTransactions: { "zh-TW": "預覽版：不提供真實交易、簽約、提領或寄送。", en: "Specification preview and local mock only. No real transactions, contracts, withdrawals or shipping in any region." },
} as const;
export type CopyKey = keyof typeof copy;
const LocaleContext = createContext<{ locale: Locale; setLocale: (value: Locale) => void }>({ locale: "zh-TW", setLocale: () => {} });
export const useLocale = () => useContext(LocaleContext);
export const useCopy = () => { const { locale } = useLocale(); return (key: CopyKey) => copy[key][locale]; };
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("zh-TW");
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try { setLocale(localStorage.getItem("keepy-locale-v1") === "en" ? "en" : "zh-TW"); } catch { /* unavailable storage */ }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = locale;
    try { localStorage.setItem("keepy-locale-v1", locale); } catch { /* unavailable storage */ }
  }, [locale, hydrated]);
  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}