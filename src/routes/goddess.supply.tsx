import { createFileRoute } from "@tanstack/react-router";
import { SupplyPage } from "@/components/supply/SupplyViews";
export const Route = createFileRoute("/goddess/supply")({
  component: () => <SupplyPage official={false} />,
});
