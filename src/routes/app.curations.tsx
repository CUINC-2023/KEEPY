import { createFileRoute } from "@tanstack/react-router";
import { CollectionCurations } from "@/components/collection/CollectionCurations";
export const Route = createFileRoute("/app/curations")({ component: CollectionCurations });
