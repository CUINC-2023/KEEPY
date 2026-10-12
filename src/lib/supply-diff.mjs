const fields = [
  "partnerId",
  "creatorId",
  "poolId",
  "articleIds",
  "copy",
  "application",
  "cardNotes",
  "promotion",
  "retrospective",
  "releaseAt",
  "withdrawAt",
  "materials",
  "editorial",
];
function leaves(value, path, out) {
  if (value === undefined) return;
  if (value === null || typeof value !== "object") {
    out.set(path, String(value));
    return;
  }
  const keys = Object.keys(value).sort();
  if (!keys.length) out.set(path, Array.isArray(value) ? "[]" : "{}");
  for (const key of keys) leaves(value[key], path + "." + key, out);
}
export function supplyDiff(before, after) {
  const a = new Map(),
    b = new Map();
  for (const key of fields) {
    leaves(before?.[key], key, a);
    leaves(after?.[key], key, b);
  }
  return [...new Set([...a.keys(), ...b.keys()])]
    .sort()
    .filter((path) => a.get(path) !== b.get(path))
    .map((path) => ({
      path,
      kind: !a.has(path) ? "added" : !b.has(path) ? "removed" : "changed",
      before: a.get(path) ?? null,
      after: b.get(path) ?? null,
    }));
}
