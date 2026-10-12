import { useCopy } from "@/lib/keepy-i18n-shared";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SubNav } from "@/components/layout/SubNav";
import { ADMIN_PERMISSION_NOTE, ADMIN_USER } from "@/data/admin";
import { StatusTag } from "@/components/ui/status-tag";
import { LocalRoleStatus } from "@/components/layout/LocalRoleStatus";
import { useLocalTest } from "@/lib/local-test-client";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const ITEMS = [
  { to: "/admin/supply", label: "創作者素材審核 / Creator material review" },
  { to: "/admin/participation", label: "參與營運管理 / Participation management" },
  { to: "/admin/collection", label: "收藏規則管理 / Collection rules" },
  { to: "/admin/discovery", label: "內容與發現 / Content & discovery" },
  { to: "/admin/operations", label: "合作營運管理 / Collaboration operations" },
  { to: "/admin", label: "營運總覽", exact: true },
  { to: "/admin/pools", label: "卡池管理", exact: true },
  { to: "/admin/pools/templates", label: "卡池範本" },
  { to: "/admin/album-templates", label: "卡冊範本" },
  { to: "/admin/goddesses", label: "女神與申請管理" },
  { to: "/admin/content", label: "內容管理（示範）" },
];

function AdminLayout() {
  const copy = useCopy();
  const local = useLocalTest();
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {local.enabled ? (
        <LocalRoleStatus required="official" />
      ) : (
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
      )}

      <SubNav
        items={ITEMS.map((item) => ({
          ...item,
          label:
            item.label === "創作者素材審核 / Creator material review"
              ? copy("supplyAdmin")
              : item.label === "參與營運管理 / Participation management"
                ? copy("participationAdmin")
                : item.label === "收藏規則管理 / Collection rules"
                  ? copy("collectionAdmin")
                  : item.label === "合作營運管理 / Collaboration operations"
                    ? copy("operations")
                    : item.label,
        }))}
      />
      <Outlet />

      <p className="text-[11px] leading-relaxed text-muted-foreground">{ADMIN_PERMISSION_NOTE}</p>
    </div>
  );
}
