import { emptyCreatorProfile, validCreatorProfile } from "../src/lib/creator-profile.mjs";
const fail = (d, status, message) => {
  throw new d.constructor.DiscoveryError(status, "creator-profile", message);
};
function actor(d, token) {
  const u = d.actor(token);
  if (u.role !== "creator" || !d.supplyIdentity(u.id))
    fail(d, 403, "Current creator fixture required");
  return u;
}
export function creatorProfile(d, token) {
  const u = actor(d, token),
    row = d.db
      .prepare("SELECT version,payload FROM documents WHERE id=?")
      .get("creator-profile:" + u.id);
  const data = row ? JSON.parse(row.payload) : emptyCreatorProfile();
  if (!validCreatorProfile(data)) fail(d, 422, "Stored creator draft incompatible; no fallback");
  return { actorId: u.id, version: row?.version ?? 0, data, synthetic: true, published: false };
}
export function saveCreatorProfile(d, token, input, key) {
  actor(d, token);
  return d.mutation(token, input, key, "creator", (u) => {
    if (
      !input ||
      Object.keys(input).sort().join() !== "data,expectedVersion" ||
      !Number.isSafeInteger(input.expectedVersion) ||
      input.expectedVersion < 0 ||
      !validCreatorProfile(input.data)
    )
      fail(d, 422, "Expected bounded bilingual draft and version; unknown fields rejected");
    const prior = creatorProfile(d, token);
    if (prior.version !== input.expectedVersion)
      fail(d, 409, "Creator draft changed; reload before editing");
    const version = prior.version + 1;
    d.db
      .prepare(
        "INSERT INTO documents VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET version=excluded.version,payload=excluded.payload",
      )
      .run("creator-profile:" + u.id, version, JSON.stringify(input.data));
    d.log(u.id, "creator.profile-draft", "v" + version);
    d.fault("after-creator-profile");
    return { version };
  });
}
