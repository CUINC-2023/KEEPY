import { createFileRoute } from "@tanstack/react-router";
import { CollectionNotes } from "@/components/collection/CollectionNotes";
export const Route = createFileRoute("/app/notes")({ component: CollectionNotes });
