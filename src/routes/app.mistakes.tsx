import { createFileRoute } from "@tanstack/react-router";
import { PracticeMistakes } from "@/components/collection/PracticeMistakes";
export const Route = createFileRoute("/app/mistakes")({ component: PracticeMistakes });
