export interface CollectionNote {
  schema: 1;
  id: string;
  kind: "card" | "album" | "award";
  subjectId: string;
  category: string;
  text: string;
}
export const NOTE_CATEGORIES: string[];
export function validCollectionNotes(value: unknown): boolean;
export function noteSubjectAllowed(
  note: CollectionNote,
  subjects: Record<string, Set<string>>,
): boolean;
