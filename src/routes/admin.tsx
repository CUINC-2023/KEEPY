import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SubNav } from "@/components/layout/SubNav";
import { ADMIN_PERMISSION_NOTE, ADMIN_USER } from "@/data/admin";
import { StatusTag } from "@/components/ui/status-tag";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const ITEMS = [
  { to: "/admin", label: "營運總覽", exact: true },
  { to: "/admin/pools", label: "卡池管理", exact: true },
  { to: "/admin/pools/templates", label: "卡池範本" },
  { to: "/admin/album-templates", label: "卡冊範本" },
  { to: "/admin/goddesses", label: "女神與申請管理" },
  { to: "/admin/content", label: "內容管理（示範）" },
];

function AdminLayout() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="panel flex flex-wrap items-center gap-2 px-3 py-2.5 text-xs">
        <span className="demo-chip">Demo</span>
        <span className="text-muted-foreground">
          官方管理後台骨架｜{ADMIN_USER.name}｜{ADMIN_USER.role}
        </span>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {ADMIN_USER.restricted.map((r) => (
            <StatusTag key={r} tone="danger" label={`無權限：${r}`} />
          ))}
        </div>
      </div>

      <SubNav items={ITEMS} />
      <Outlet />

      <p className="text-[11px] leading-relaxed text-muted-foreground">{ADMIN_PERMISSION_NOTE}</p>
    </div>
  );
}
