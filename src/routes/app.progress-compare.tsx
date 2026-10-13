import { createFileRoute } from "@tanstack/react-router";
import { PracticeComparison } from "@/components/collection/PracticeComparison";
export const Route = createFileRoute("/app/progress-compare")({ component: PracticeComparison });
