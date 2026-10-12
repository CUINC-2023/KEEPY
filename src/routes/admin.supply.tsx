import { createFileRoute } from "@tanstack/react-router";
import { SupplyPage } from "@/components/supply/SupplyViews";
export const Route = createFileRoute("/admin/supply")({
  component: () => <SupplyPage official={true} />,
});
