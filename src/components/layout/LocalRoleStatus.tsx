import { Link } from "@tanstack/react-router";
import { useLocalTest } from "@/lib/local-test-client";
import { useDiscoveryText } from "@/lib/discovery-copy";
export function LocalRoleStatus({ required }: { required: "official" | "creator" }) {
  const local = useLocalTest(),
    t = useDiscoveryText(),
    role = local.summary?.user.role;
  return (
    <section
      className="panel space-y-2 px-3 py-3 text-sm"
      data-local-role-status
      data-role={role ?? "unconfirmed"}
    >
      <p>
        <span className="demo-chip">Local Test</span>{" "}
        {t("目前服務端確認的測試角色", "Current server-confirmed test role")}:{" "}
        {role ?? t("尚未確認", "Unconfirmed")}
      </p>
      {role !== required && (
        <p role="status">
          {t(
            required === "official" ? "此操作需要官方測試角色。" : "此操作需要創作者測試角色。",
            required === "official"
              ? "This operation needs the official test role."
              : "This operation needs the creator test role.",
          )}
        </p>
      )}
      <Link className="inline-flex min-h-11 items-center text-primary underline" to="/local-test">
        {t("確認本機測試身分", "Confirm your Local Test identity")}
      </Link>
    </section>
  );
}
