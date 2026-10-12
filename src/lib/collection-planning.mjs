export const PLANNING_SECTIONS = ["goals", "journey", "practice", "guide"];
export function validPlanningOrder(v) {
  return (
    Array.isArray(v) &&
    v.length === 4 &&
    new Set(v).size === 4 &&
    v.every((id) => PLANNING_SECTIONS.includes(id))
  );
}
