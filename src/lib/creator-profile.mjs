const locales = ["zh-TW", "en"];
const exact = (v, keys) =>
  v &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  Object.keys(v).sort().join() === [...keys].sort().join();
export const emptyCreatorProfile = () => ({
  schema: 1,
  displayName: { "zh-TW": "", en: "" },
  tagline: { "zh-TW": "", en: "" },
  intro: { "zh-TW": "", en: "" },
  links: [],
});
export function validCreatorProfile(v) {
  if (!exact(v, ["schema", "displayName", "tagline", "intro", "links"]) || v.schema !== 1)
    return false;
  for (const [field, max] of [
    ["displayName", 80],
    ["tagline", 120],
    ["intro", 1000],
  ]) {
    if (
      !exact(v[field], locales) ||
      locales.some(
        (l) =>
          typeof v[field][l] !== "string" ||
          v[field][l].length > max ||
          /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(v[field][l]),
      )
    )
      return false;
  }
  return (
    Array.isArray(v.links) &&
    v.links.length <= 3 &&
    new Set(v.links).size === v.links.length &&
    v.links.every((link) => {
      if (typeof link !== "string" || link.length > 300 || /\s/u.test(link)) return false;
      try {
        const u = new URL(link);
        return u.protocol === "https:" && !u.username && !u.password && !!u.hostname;
      } catch {
        return false;
      }
    })
  );
}
export function isCreatorProfileProjection(v) {
  return (
    exact(v, ["actorId", "version", "data", "synthetic", "published"]) &&
    typeof v.actorId === "string" &&
    Number.isSafeInteger(v.version) &&
    v.version >= 0 &&
    v.synthetic === true &&
    v.published === false &&
    validCreatorProfile(v.data)
  );
}
