import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SubNav } from "@/components/layout/SubNav";
import { NO_SENSITIVE_DATA_NOTE } from "@/data/partner";

export const Route = createFileRoute("/partner")({
  component: PartnerLayout,
});

const ITEMS = [
  { to: "/partner", label: "合作說明", exact: true },
  { to: "/partner/apply", label: "填寫申請", exact: true },
  { to: "/partner/apply/status", label: "申請進度" },
];

function PartnerLayout() {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="panel flex flex-wrap items-center gap-2 px-3 py-2.5 text-xs">
        <span className="demo-chip">Demo</span>
        <span className="text-muted-foreground">
          合作女神申請流程原型：不做真實證件驗證、檔案上傳、電子簽署或通知寄送。
        </span>
      </div>
      <SubNav items={ITEMS} />
      <Outlet />
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {NO_SENSITIVE_DATA_NOTE}
      </p>
    </div>
  );
}
