import { createFileRoute } from "@tanstack/react-router";
import { CollectionPlanning } from "@/components/collection/CollectionPlanning";
export const Route = createFileRoute("/app/planning")({ component: CollectionPlanning });
