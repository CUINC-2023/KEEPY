import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AppShell } from "@/components/layout/AppShell";
import { RouteRecovery } from "@/components/layout/RouteRecovery";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return <RouteRecovery />;
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <RouteRecovery
      retry={() => {
        void router.invalidate();
        reset();
      }}
    />
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "KEEPY 創作者收藏卡平台" },
      {
        name: "description",
        content: "創作者收藏卡平台；目前展示女神系列 Local Mock。",
      },
      { property: "og:title", content: "KEEPY 創作者收藏卡平台" },
      {
        property: "og:description",
        content: "收藏真人創作者、VTuber、原創角色與聯名 IP 的創作時刻。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const themeScript = `
    (() => {
      try {
        const saved = localStorage.getItem('pf-theme');
        const theme = saved === 'light' || saved === 'dark'
          ? saved
          : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
        document.documentElement.dataset.theme = theme;
      } catch (_) {
        document.documentElement.classList.add('dark');
        document.documentElement.dataset.theme = 'dark';
      }
    })();
  `;
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <AppShell>
        <Outlet />
      </AppShell>
    </QueryClientProvider>
  );
}
