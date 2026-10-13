export const PLANNING_SECTIONS = ["goals", "journey", "practice", "guide", "curations"];
export function validPlanningOrder(v) {
  return (
    Array.isArray(v) &&
    [4, 5].includes(v.length) &&
    new Set(v).size === v.length &&
    v.every((id) => PLANNING_SECTIONS.includes(id)) &&
    (v.length === 5 || !v.includes("curations"))
  );
}
export function normalizePlanningOrder(v) {
  if (v === undefined) return PLANNING_SECTIONS;
  if (!validPlanningOrder(v)) throw Error("Incompatible planning order");
  return v.length === 4 ? [...v, "curations"] : v;
}
