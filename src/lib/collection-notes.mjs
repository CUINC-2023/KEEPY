export const NOTE_CATEGORIES = ["story", "plan", "practice", "memory"];
export function validCollectionNotes(v) {
  return (
    Array.isArray(v) &&
    v.length <= 30 &&
    new Set(v.map((n) => n?.id)).size === v.length &&
    v.every(
      (n) =>
        n &&
        Object.keys(n).sort().join() === "category,id,kind,schema,subjectId,text" &&
        n.schema === 1 &&
        typeof n.id === "string" &&
        /^note-[a-z0-9-]{1,40}$/.test(n.id) &&
        ["card", "album", "award"].includes(n.kind) &&
        typeof n.subjectId === "string" &&
        n.subjectId.length > 0 &&
        n.subjectId.length <= 128 &&
        NOTE_CATEGORIES.includes(n.category) &&
        typeof n.text === "string" &&
        n.text.trim().length > 0 &&
        n.text.length <= 1000,
    )
  );
}
export function noteSubjectAllowed(note, subjects) {
  return !!subjects[note.kind]?.has(note.subjectId);
}
