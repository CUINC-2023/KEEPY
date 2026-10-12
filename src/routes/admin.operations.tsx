import { createFileRoute } from "@tanstack/react-router";
import { OperationsPage } from "@/components/operations/OperationsPage";
export const Route = createFileRoute("/admin/operations")({ component: OperationsPage });
