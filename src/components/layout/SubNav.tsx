import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export interface SubNavItem {
  to: string;
  label: string;
  /** 完全比對（用於索引頁）*/
  exact?: boolean;
}

/** 後台次導覽（女神後台／管理後台共用）*/
export function SubNav({ items }: { items: SubNavItem[] }) {
  const pathname = useLocation().pathname;
  return (
    <nav className="panel -mx-1 flex gap-1.5 overflow-x-auto px-2 py-2">
      {items.map((it) => {
        const active = it.exact
          ? pathname === it.to
          : pathname.startsWith(it.to);
        return (
          <Link
            key={it.to}
            to={it.to}
            className={cn(
              "shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors sm:text-sm",
              active
                ? "bg-primary/15 text-foreground ring-1 ring-primary/30"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
