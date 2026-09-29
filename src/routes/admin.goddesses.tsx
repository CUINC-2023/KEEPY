import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SubNav } from "@/components/layout/SubNav";
import { ADMIN_APPLY_TBD } from "@/data/partner";

export const Route = createFileRoute("/admin/goddesses")({
  component: AdminGoddessesLayout,
});

const ITEMS = [
  { to: "/admin/goddesses", label: "女神名單", exact: true },
  { to: "/admin/goddesses/applications", label: "申請管理" },
];

function AdminGoddessesLayout() {
  return (
    <div className="space-y-5">
      <SubNav items={ITEMS} />
      <Outlet />
      <section className="panel p-5">
        <h2 className="font-black">待決策項目（Demo／待定）</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
          {ADMIN_APPLY_TBD.map((t) => (
            <li key={t}>・{t}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
