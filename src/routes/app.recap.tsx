import { createFileRoute } from "@tanstack/react-router";
import { CollectionRecapPage } from "@/components/collection/CollectionRecapPage";
export const Route = createFileRoute("/app/recap")({ component: CollectionRecapPage });
