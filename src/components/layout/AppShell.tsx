import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { PLAYER_PROFILE } from "@/data/mock";
import { APP_VERSION } from "@/data/public-hub";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { PlayerSettingsProvider } from "@/lib/player-store";
import { PartnerProvider } from "@/lib/partner-store";
import { LocaleProvider, useCopy, useLocale, type CopyKey } from "@/lib/keepy-i18n";

type Mode = "player" | "goddess";
const ModeContext = createContext<{
  mode: Mode;
  setMode: (m: Mode) => void;
  goddessEligible: boolean;
  setGoddessEligible: (v: boolean) => void;
}>({
  mode: "player",
  setMode: () => {},
  goddessEligible: true,
  setGoddessEligible: () => {},
});
export const useMode = () => useContext(ModeContext);

const AuthContext = createContext<{
  loggedIn: boolean;
  login: () => void;
  logout: () => void;
  requireLogin: (action?: () => void) => void;
}>({ loggedIn: false, login: () => {}, logout: () => {}, requireLogin: () => {} });
export const useAuth = () => useContext(AuthContext);

const SIDEBAR_STORAGE_KEY = "pf-sidebar-collapsed";
const THEME_STORAGE_KEY = "pf-theme";
type Theme = "light" | "dark";

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
export const IconHome = () => <svg {...iconProps}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>;
export const IconSparkle = () => <svg {...iconProps}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9z" /></svg>;
export const IconCards = () => <svg {...iconProps}><rect x="3" y="6" width="10" height="15" rx="2" /><path d="M9 3h10a2 2 0 0 1 2 2v12" /></svg>;
export const IconFlask = () => <svg {...iconProps}><path d="M10 3h4" /><path d="M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 18l-5-9V3" /><path d="M7.5 15h9" /></svg>;
export const IconCrown = () => <svg {...iconProps}><path d="M3 8l4 4 5-7 5 7 4-4v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /></svg>;
export const IconMenu = () => <svg {...iconProps}><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></svg>;
export const IconGem = () => <svg {...iconProps}><path d="M6 3h12l3 6-9 12L3 9z" /><path d="M3 9h18" /><path d="M9 3l3 6 3-6" /></svg>;
export const IconLayers = () => <svg {...iconProps}><path d="M12 3 3 8l9 5 9-5z" /><path d="M3 13l9 5 9-5" /></svg>;
export const IconTrophy = () => <svg {...iconProps}><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 5H5v2a3 3 0 0 0 3 3" /><path d="M16 5h3v2a3 3 0 0 1-3 3" /><path d="M10 20h4" /><path d="M12 13v7" /></svg>;
export const IconBook = () => <svg {...iconProps}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M8 7h8" /><path d="M8 11h6" /></svg>;
export const IconUsers = () => <svg {...iconProps}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5S15 16.7 15 20" /><path d="M16 5.5a3 3 0 0 1 0 5.6" /><path d="M18 14.2c2 .8 3 2.6 3 5.8" /></svg>;
const IconBell = () => <svg {...iconProps}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>;
const IconCalendar = () => <svg {...iconProps}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>;
const IconBox = () => <svg {...iconProps}><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 8 9 5 9-5v8l-9 5-9-5z" /></svg>;
const IconSettings = () => <svg {...iconProps}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z" /></svg>;
const IconChevron = ({ collapsed }: { collapsed: boolean }) => <svg {...iconProps}><path d={collapsed ? "m9 18 6-6-6-6" : "m15 18-6-6 6-6"} /></svg>;
const IconClose = () => <svg {...iconProps}><path d="m6 6 12 12M18 6 6 18" /></svg>;
const IconArrowLeft = () => <svg {...iconProps}><path d="m15 18-6-6 6-6" /><path d="M9 12h10" /></svg>;
const IconSun = () => <svg {...iconProps}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" /></svg>;
const IconMoon = () => <svg {...iconProps}><path d="M20.5 14.3A8.5 8.5 0 0 1 9.7 3.5 8.5 8.5 0 1 0 20.5 14.3z" /></svg>;

type NavItem = { to: string; label: string; Icon: () => ReactNode; copyKey?: CopyKey };

const PUBLIC_NAV: NavItem[] = [
  { to: "/", label: "首頁", Icon: IconHome, copyKey: "home" },
  { to: "/pools", label: "卡池", Icon: IconLayers, copyKey: "pools" },
  { to: "/activities", label: "活動", Icon: IconCalendar, copyKey: "activities" },
  { to: "/leaderboards", label: "排行榜", Icon: IconTrophy, copyKey: "rankings" },
  { to: "/physical-collection", label: "實體卡", Icon: IconBox, copyKey: "physical" },
  { to: "/announcements", label: "公告", Icon: IconBell, copyKey: "announcements" },
  { to: "/seasons/next", label: "下一季預告", Icon: IconSparkle, copyKey: "nextSeason" },
  { to: "/wish-pools", label: "許願卡池", Icon: IconCrown, copyKey: "wishPools" },
  { to: "/recruitment", label: "卡池募集", Icon: IconUsers, copyKey: "recruitment" },
  { to: "/goddesses", label: "女神系列", Icon: IconUsers, copyKey: "goddessSeries" },
  { to: "/partner", label: "女神合作申請", Icon: IconCrown, copyKey: "creatorApply" },
  { to: "/rules", label: "遊戲規則", Icon: IconBook, copyKey: "rules" },
  { to: "/faq", label: "常見問題 FAQ", Icon: IconBook, copyKey: "faq" },
];

const PLAYER_NAV: NavItem[] = [
  { to: "/app", label: "玩家首頁", Icon: IconHome, copyKey: "playerHome" },
  { to: "/app/album", label: "卡冊", Icon: IconCards, copyKey: "album" },
  { to: "/app/achievements", label: "成就與徽章", Icon: IconTrophy, copyKey: "achievements" },
  { to: "/app/growth", label: "指定卡成長", Icon: IconSparkle, copyKey: "growth" },
  { to: "/app/synthesis", label: "合成工坊", Icon: IconFlask, copyKey: "synthesis" },
  { to: "/physical-collection", label: "實體卡", Icon: IconBox, copyKey: "physical" },
  { to: "/app/wallet", label: "KP 錢包", Icon: IconGem, copyKey: "wallet" },
  { to: "/app/history", label: "抽卡／消費紀錄", Icon: IconBook, copyKey: "history" },
  { to: "/app/settings/privacy", label: "公開頁設定", Icon: IconUsers, copyKey: "privacy" },
  { to: "/app/settings", label: "玩家設定", Icon: IconSettings, copyKey: "settings" },
];

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "營運總覽", Icon: IconHome, copyKey: "overview" },
  { to: "/admin/pools", label: "卡池管理", Icon: IconLayers, copyKey: "poolAdmin" },
  { to: "/admin/pools/templates", label: "卡池範本", Icon: IconSparkle, copyKey: "poolTemplates" },
  { to: "/admin/album-templates", label: "卡冊範本", Icon: IconCards, copyKey: "albumTemplates" },
  { to: "/admin/goddesses", label: "女神與申請管理", Icon: IconUsers, copyKey: "creatorAdmin" },
  { to: "/admin/content", label: "內容管理（示範）", Icon: IconCards, copyKey: "contentAdmin" },
];

const GODDESS_NAV: NavItem[] = [
  { to: "/goddess", label: "女神後台總覽", Icon: IconHome, copyKey: "creatorHome" },
  { to: "/goddess/dashboard", label: "女神儀表板", Icon: IconCrown, copyKey: "creatorDashboard" },
  { to: "/goddess/revenue", label: "凍結收益（Demo）", Icon: IconGem, copyKey: "frozenRevenue" },
  { to: "/goddess/contracts", label: "數位合約", Icon: IconBook, copyKey: "agreements" },
  { to: "/goddess/profile", label: "公開資料", Icon: IconUsers, copyKey: "profile" },
];

type Area = "public" | "player" | "admin" | "goddess";

function areaFor(pathname: string): Area {
  if (pathname === "/app" || pathname.startsWith("/app/")) return "player";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (pathname === "/goddess" || pathname.startsWith("/goddess/")) return "goddess";
  return "public";
}

function itemsFor(area: Area) {
  if (area === "player") return PLAYER_NAV;
  if (area === "admin") return ADMIN_NAV;
  if (area === "goddess") return GODDESS_NAV;
  return PUBLIC_NAV;
}

const AREA_LABEL: Record<Area, string> = {
  public: "官方網站",
  player: "玩家個人後台",
  admin: "官方管理後台",
  goddess: "女神專屬後台",
};

function activePath(pathname: string, items: NavItem[]) {
  return items
    .filter(({ to }) => to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0]?.to;
}

function ModeSwitch() {
  const { mode, setMode } = useMode();
  const navigate = useNavigate();
  return (
    <div className="flex shrink-0 items-center rounded-full border border-border bg-muted/60 p-1 text-[11px] font-semibold sm:text-xs">
      <button onClick={() => { setMode("player"); void navigate({ to: "/app" }); }} className={`whitespace-nowrap rounded-full px-2.5 py-1.5 transition-colors sm:px-3 ${mode === "player" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>玩家</button>
      <button onClick={() => { setMode("goddess"); void navigate({ to: "/goddess/dashboard" }); }} className={`flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1.5 transition-colors sm:px-3 ${mode === "goddess" ? "bg-gold text-ink" : "text-muted-foreground hover:text-foreground"}`}><IconCrown /><span>女神</span></button>
    </div>
  );
}

function NavLinks({ area, collapsed = false, onNavigate }: { area: Area; collapsed?: boolean; onNavigate?: () => void }) {
  const t = useCopy();
  const pathname = useLocation().pathname;
  const items = itemsFor(area);
  const current = activePath(pathname, items);
  return (
    <nav className="flex flex-col gap-1" aria-label={`${AREA_LABEL[area]}選單`}>
      {items.map(({ to, label, Icon, copyKey }) => {
        const active = current === to;
        const shown = copyKey ? t(copyKey) : label;
        return (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: true }}
            onClick={onNavigate}
            aria-label={shown}
            aria-current={active ? "page" : undefined}
            title={collapsed ? shown : undefined}
            className={`flex min-h-11 items-center rounded-lg text-sm font-medium transition-colors ${collapsed ? "justify-center px-2" : "gap-3 px-3"} ${active ? "bg-primary/15 text-foreground ring-1 ring-primary/30" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            <span className="shrink-0" aria-hidden="true"><Icon /></span>
            {!collapsed && <span className="min-w-0 flex-1">{shown}</span>}
            {!collapsed && active && <span className="text-[10px] font-bold text-primary">目前</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function LoginDemoDialog({ open, onClose, onLogin }: { open: boolean; onClose: () => void; onLogin: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/80 p-4 backdrop-blur-md" onClick={onClose}>
      <div className="panel panel-glow w-full max-w-sm p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-2"><h2 className="text-lg font-black">請先登入</h2><span className="demo-chip">Demo</span></div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">抽卡與收藏功能需要登入帳號。此原型不連接真實帳號、密碼或金流，點擊下方按鈕即可模擬登入狀態。</p>
        <div className="mt-5 space-y-2">
          <button onClick={onLogin} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90">以 Demo 帳號登入</button>
          <button onClick={onClose} className="w-full rounded-xl border border-border px-4 py-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">稍後再說</button>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">正式版將提供帳號註冊與驗證，此處僅為介面流程示意。</p>
      </div>
    </div>
  );
}

function SidebarBrand({ area, collapsed }: { area: Area; collapsed: boolean }) {
  return (
    <div className={`flex min-h-14 items-center border-b border-border ${collapsed ? "justify-center px-2" : "gap-3 px-4"}`}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-xs font-black text-primary-foreground">K</span>
      {!collapsed && <div className="min-w-0"><p className="truncate text-sm font-black">{AREA_LABEL[area]}</p><p className="truncate text-[10px] text-muted-foreground">瀏覽器本機選單偏好</p></div>}
    </div>
  );
}

function ThemeToggle({ theme, collapsed = false, onToggle }: { theme: Theme; collapsed?: boolean; onToggle: () => void }) {
  const nextLabel = theme === "dark" ? "切換至淺色" : "切換至深色";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`${nextLabel}，目前為${theme === "dark" ? "深色" : "淺色"}模式`}
      aria-pressed={theme === "dark"}
      title={nextLabel}
      className={`flex min-h-11 items-center rounded-lg border border-border font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${collapsed ? "justify-center" : "gap-3 px-3"}`}
    >
      <span aria-hidden="true">{theme === "dark" ? <IconSun /> : <IconMoon />}</span>
      {!collapsed && <span className="text-xs">{nextLabel}</span>}
    </button>
  );
}

function ShellInner({ children }: { children: ReactNode }) {
  const { locale, setLocale } = useLocale();
  const t = useCopy();
  const pathname = useLocation().pathname;
  const area = areaFor(pathname);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [loginOpen, setLoginOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const { push } = useToast();

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true");
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme: Theme = saved === "light" || saved === "dark"
      ? saved
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(initialTheme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(initialTheme);
    document.documentElement.dataset["theme"] = initialTheme;

    if (saved === "light" || saved === "dark") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const followSystemTheme = (event: MediaQueryListEvent) => {
      const nextTheme: Theme = event.matches ? "dark" : "light";
      setTheme(nextTheme);
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(nextTheme);
      document.documentElement.dataset["theme"] = nextTheme;
    };
    media.addEventListener("change", followSystemTheme);
    return () => media.removeEventListener("change", followSystemTheme);
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileNavOpen]);

  useEffect(() => setMobileNavOpen(false), [pathname]);

  const setSidebarCollapsed = useCallback((next: boolean) => {
    setCollapsed(next);
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const nextTheme: Theme = current === "dark" ? "light" : "dark";
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(nextTheme);
      document.documentElement.dataset["theme"] = nextTheme;
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      return nextTheme;
    });
  }, []);

  const requireLogin = useCallback((action?: () => void) => {
    if (loggedIn) { action?.(); return; }
    setPending(action ? () => action : null);
    setLoginOpen(true);
  }, [loggedIn]);

  const login = useCallback(() => {
    setLoggedIn(true);
    setLoginOpen(false);
    push({ title: "已模擬登入", description: "此為 Demo 帳號，不含真實資料。", tone: "gold" });
    if (pending) { const run = pending; setPending(null); run(); }
  }, [pending, push]);
  const logout = useCallback(() => { setLoggedIn(false); push({ title: "已登出（Demo）" }); }, [push]);

  const authValue = useMemo(() => ({ loggedIn, login, logout, requireLogin }), [loggedIn, login, logout, requireLogin]);

  return (
    <AuthContext.Provider value={authValue}>
      <div className="min-h-screen overflow-x-clip">
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
          <div className="grid min-h-[61px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:px-6">
            <button className="grid h-10 w-10 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden" onClick={() => setMobileNavOpen(true)} aria-label="開啟選單" title="開啟選單"><IconMenu /></button>
            <Link to={area === "public" ? "/" : area === "player" ? "/app" : area === "admin" ? "/admin" : "/goddess"} className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-sm font-black text-primary-foreground lg:hidden">K</span>
              <span className="min-w-0 leading-tight"><span className="block truncate text-xs font-black sm:text-sm">{t("brand")}</span><span className="block truncate text-[10px] text-gold">{AREA_LABEL[area]}</span></span>
            </Link>
            <div className="flex items-center justify-end gap-2 sm:gap-4">
              <button type="button" onClick={() => setLocale(locale === "zh-TW" ? "en" : "zh-TW")} className="shrink-0 rounded-full border border-border px-2 py-1.5 text-xs font-bold" aria-label={locale === "zh-TW" ? "Switch to English preview" : "切換繁體中文預覽"}>{locale === "zh-TW" ? "EN" : "繁中"}</button>
              {loggedIn ? <><span className="hidden items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs font-semibold sm:flex"><span className="text-gold">◆</span>{PLAYER_PROFILE.points.toLocaleString()} 點數<span className="demo-chip ml-1">Demo</span></span><button onClick={logout} className="hidden rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground sm:block">登出</button></> : <button onClick={() => setLoginOpen(true)} className="shrink-0 whitespace-nowrap rounded-full border border-gold/40 px-3 py-1.5 text-xs font-bold text-gold transition-colors hover:bg-gold/10">登入<span className="hidden sm:inline"> Demo</span></button>}
              <ModeSwitch />
            </div>
          </div>
        </header>

        <div className="flex w-full">
          <aside className={`sticky top-[61px] hidden h-[calc(100vh-61px)] shrink-0 flex-col border-r border-border bg-background/45 transition-[width] duration-200 lg:flex ${collapsed ? "w-[72px]" : "w-64"}`}>
            <SidebarBrand area={area} collapsed={collapsed} />
            <div className={`flex-1 overflow-y-auto py-4 ${collapsed ? "px-2" : "px-3"}`}>
              {area !== "public" && <Link to="/" aria-label="返回官方網站" title={collapsed ? "返回官方網站" : undefined} className={`mb-3 flex min-h-11 items-center rounded-lg border border-border text-sm font-bold text-gold hover:bg-gold/10 ${collapsed ? "justify-center px-2" : "gap-3 px-3"}`}><IconArrowLeft />{!collapsed && <span>返回官方網站</span>}</Link>}
              <NavLinks area={area} collapsed={collapsed} />
            </div>
            <div className="mx-2 mb-2"><ThemeToggle theme={theme} collapsed={collapsed} onToggle={toggleTheme} /></div>
            {!collapsed && <p className="mx-3 mb-3 rounded-lg border border-border bg-muted/40 p-3 text-[10px] leading-relaxed text-muted-foreground">選單與佈景偏好只保存在此瀏覽器，不會同步至帳號。</p>}
            <button onClick={() => setSidebarCollapsed(!collapsed)} aria-label={collapsed ? "展開選單" : "收合選單"} title={collapsed ? "展開選單" : "收合選單"} className={`m-2 flex min-h-11 items-center rounded-lg border border-border font-bold text-muted-foreground hover:bg-muted hover:text-foreground ${collapsed ? "justify-center" : "gap-3 px-3"}`}><IconChevron collapsed={collapsed} />{!collapsed && <span className="text-xs">收合選單</span>}</button>
          </aside>

          <main className="min-w-0 flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8">{children}</main>
        </div>

        {mobileNavOpen && <div className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-sm lg:hidden" onClick={() => setMobileNavOpen(false)} role="presentation">
          <aside className="flex h-full w-[min(82vw,320px)] flex-col border-r border-border bg-background shadow-2xl" role="dialog" aria-modal="true" aria-label={`${AREA_LABEL[area]}選單`} onClick={(event) => event.stopPropagation()}>
             <div className="flex min-h-16 items-center justify-between border-b border-border px-4"><div><p className="text-sm font-black">{AREA_LABEL[area]}</p><p className="text-[10px] text-muted-foreground">KEEPY · {APP_VERSION}</p></div><button onClick={() => setMobileNavOpen(false)} aria-label="關閉選單" title="關閉選單" className="grid h-10 w-10 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><IconClose /></button></div>
            <div className="flex-1 overflow-y-auto p-3">
              {area !== "public" && <Link to="/" onClick={() => setMobileNavOpen(false)} className="mb-3 flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 text-sm font-bold text-gold"><IconArrowLeft />返回官方網站</Link>}
              <NavLinks area={area} onNavigate={() => setMobileNavOpen(false)} />
            </div>
            <div className="border-t border-border p-3">
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
              <p className="mt-2 px-1 text-[10px] leading-relaxed text-muted-foreground">目前為{theme === "dark" ? "深色" : "淺色"}模式。佈景只保存在此瀏覽器，不會同步至帳號。</p>
            </div>
          </aside>
        </div>}

        <LoginDemoDialog open={loginOpen} onClose={() => { setLoginOpen(false); setPending(null); }} onLogin={login} />
      </div>
    </AuthContext.Provider>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(PLAYER_PROFILE.activeMode);
  const [goddessEligible, setGoddessEligible] = useState(PLAYER_PROFILE.goddessModeUnlocked);
  const modeValue = useMemo(() => ({ mode, setMode, goddessEligible, setGoddessEligible }), [mode, goddessEligible]);
  return (
    <ModeContext.Provider value={modeValue}>
      <LocaleProvider><ToastProvider><PlayerSettingsProvider><PartnerProvider><ShellInner>{children}</ShellInner></PartnerProvider></PlayerSettingsProvider></ToastProvider></LocaleProvider>
    </ModeContext.Provider>
  );
}