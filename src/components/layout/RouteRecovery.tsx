import { Link } from "@tanstack/react-router";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { LocaleProvider } from "@/lib/keepy-i18n";

/** Root errors can replace AppShell, so restore its existing language preference. */
export function RouteRecovery({ retry }: { retry?: () => void }) {
  return (
    <LocaleProvider>
      <RecoveryContent retry={retry} />
    </LocaleProvider>
  );
}

function RecoveryContent({ retry }: { retry: (() => void) | undefined }) {
  const en = useLocale().locale === "en";
  return (
    <section
      className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center gap-5 px-4 text-center"
      data-route-recovery
    >
      <h1 className="text-2xl font-black">
        {retry
          ? en
            ? "Page could not load"
            : "頁面載入失敗"
          : en
            ? "Page not found"
            : "找不到這個頁面"}
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {retry
          ? en
            ? "Retry loading this page, or use a normal entry below. Retrying does not submit an operation."
            : "可重試讀取頁面，或由下列正常入口繼續。重試不會送出操作。"
          : en
            ? "This link may be incorrect or no longer available. Choose a normal entry to continue."
            : "連結可能有誤或已失效，請由正常入口繼續。"}
      </p>
      {retry && (
        <button
          type="button"
          onClick={retry}
          className="min-h-11 rounded-xl bg-primary px-5 py-2 font-bold text-primary-foreground"
        >
          {en ? "Retry loading" : "重試讀取"}
        </button>
      )}
      <nav aria-label={en ? "Recovery entries" : "繼續操作入口"} className="grid grid-cols-2 gap-3">
        <Link
          className="flex min-h-11 items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-bold hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          to="/explore"
        >
          {en ? "Public discovery" : "公開探索"}
        </Link>
        <Link
          className="flex min-h-11 items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-bold hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          to="/app/collection"
        >
          {en ? "My collection" : "本人收藏"}
        </Link>
        <Link
          className="flex min-h-11 items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-bold hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          to="/goddess/supply"
        >
          {en ? "Creator supply" : "創作者供給"}
        </Link>
        <Link
          className="flex min-h-11 items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-bold hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          to="/admin/supply"
        >
          {en ? "Official review" : "官方審核"}
        </Link>
      </nav>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {en
          ? "These links do not grant permissions. Local fixture sessions and server role checks still apply."
          : "入口不授予權限；仍沿用本機測試身分及服務端角色檢查。"}
      </p>
      <Link to="/local-test" className="text-sm font-bold text-primary underline">
        {en ? "Local operation guide" : "本機操作引導"}
      </Link>
      <Link to="/" className="text-sm underline">
        {en ? "Back to home" : "返回首頁"}
      </Link>
    </section>
  );
}
