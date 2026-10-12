const object = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v) => typeof v === "string" && v.length > 0 && v.length <= 128;
const fields = [
  "environment",
  "user",
  "holdings",
  "pity",
  "draws",
  "syntheses",
  "failures",
  "physical",
  "assetEvents",
  "ledger",
];
/** Successful HTTP with an unreadable body is ambiguous: never mark it as a definite rejection. */
export function unreadableLocalResponse(status) {
  return Object.assign(
    new Error(
      "Local response unreadable; confirm the original operation / 本機回應無法讀取，請確認原操作",
    ),
    status >= 400 ? { status } : {},
  );
}
export function isDefiniteLocalRejection(error) {
  const status = error?.status;
  return (
    Number.isInteger(status) &&
    status >= 400 &&
    status < 500 &&
    ![401, 403].includes(status) &&
    error?.code !== "actor-changed"
  );
}
/** Validate the current Local Test identity projection, not an authorization grant or stored actor. */
export function isLocalSummary(v) {
  if (
    !object(v) ||
    Object.keys(v).sort().join() !== fields.slice().sort().join() ||
    v.environment !== "Local Test" ||
    !object(v.user) ||
    Object.keys(v.user).some((k) => !["id", "role", "balance", "active"].includes(k)) ||
    !text(v.user.id) ||
    !["member", "creator", "official"].includes(v.user.role) ||
    !Number.isSafeInteger(v.user.balance) ||
    (v.user.active !== undefined && v.user.active !== 1)
  )
    return false;
  if (
    fields
      .filter((k) => !["environment", "user"].includes(k))
      .some(
        (k) =>
          !Array.isArray(v[k]) ||
          v[k].some((r) => !object(r) || (r.user_id !== undefined && r.user_id !== v.user.id)),
      )
  )
    return false;
  return (
    v.holdings.every((r) => text(r.card_id) && Number.isSafeInteger(r.count) && r.count >= 0) &&
    v.pity.every((r) => text(r.pool_id) && Number.isSafeInteger(r.count) && r.count >= 0)
  );
}
