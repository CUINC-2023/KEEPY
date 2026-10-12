const projections = ["catalogue", "owner", "showcase", "ranking", "history", "recap"];
const fields = {
  catalogue: [
    "synthetic",
    "readContract",
    "version",
    "visibilityKey",
    "cards",
    "pools",
    "proposal",
  ],
  owner: [
    "actorId",
    "readContract",
    "synthetic",
    "profile",
    "progress",
    "cards",
    "awards",
    "rulesVersion",
    "visibilityKey",
    "acquiredCards",
    "recent",
  ],
  showcase: [
    "handle",
    "readContract",
    "synthetic",
    "displayName",
    "bio",
    "bioEn",
    "layout",
    "theme",
    "shelfLayout",
    "coverMode",
    "badgeLayout",
    "growthPreview",
    "featured",
    "mainCard",
    "shelf",
    "curations",
    "progress",
    "awards",
  ],
  ranking: [
    "rows",
    "q",
    "page",
    "pages",
    "total",
    "pageSize",
    "readContract",
    "updatedAt",
    "ruleVersion",
    "catalogueVersion",
    "visibilityKey",
    "eligibilityVersion",
    "excludedSynthetic",
    "metrics",
    "moneyMetric",
    "seasons",
    "season",
    "denominator",
    "denominatorVersion",
    "preview",
    "synthetic",
    "formalPolicy",
    "settled",
    "rewards",
    "sourcePolicy",
    "periodGroup",
    "scoringVersion",
    "pools",
    "pool",
  ],
  history: [
    "readContract",
    "actorId",
    "visibilityKey",
    "catalogueVersion",
    "page",
    "pageSize",
    "total",
    "totalPages",
    "range",
    "rows",
    "sources",
  ],
  recap: [
    "readContract",
    "actorId",
    "visibilityKey",
    "catalogueVersion",
    "range",
    "positiveEvents",
    "newDistinct",
    "newDesigns",
    "earnedCount",
    "earned",
    "seriesRecords",
    "sources",
    "recordedAtIsNotCompletionTime",
    "playSummary",
    "readOnly",
  ],
};
const cardFields = [
  "cardId",
  "poolId",
  "name",
  "rarity",
  "cardVersion",
  "growthLevel",
  "count",
  "definitionSource",
  "growthPolicyVersion",
];
function cardAllowed(card, owner = false) {
  return (
    !!card &&
    typeof card === "object" &&
    Object.keys(card).every((k) => cardFields.includes(k)) &&
    (owner || !Object.hasOwn(card, "count"))
  );
}
/** Describes an existing projection; never authorises an actor or transforms data. */
export function collectionReadContract(projection) {
  if (!projections.includes(projection)) throw new Error("Unknown collection projection");
  return { schema: 1, domain: "collection", projection, source: "local-test-sqlite" };
}
export function isCollectionProjection(value, projection) {
  if (!value || typeof value !== "object") return false;
  if (!fields[projection] || Object.keys(value).some((k) => !fields[projection].includes(k)))
    return false;
  const expected = collectionReadContract(projection),
    actual = value.readContract;
  if (
    !actual ||
    Object.keys(actual).sort().join() !== "domain,projection,schema,source" ||
    Object.entries(expected).some(([key, v]) => actual[key] !== v)
  )
    return false;
  if (
    projection !== "owner" &&
    projection !== "history" &&
    projection !== "recap" &&
    ["actorId", "profile", "recent", "acquiredCards", "ledger", "session"].some((key) =>
      Object.hasOwn(value, key),
    )
  )
    return false;
  if (projection === "recap")
    return (
      typeof value.actorId === "string" &&
      Array.isArray(value.newDesigns) &&
      value.newDesigns.length <= 20 &&
      Array.isArray(value.earned) &&
      value.readOnly === true
    );
  if (projection === "history")
    return (
      typeof value.actorId === "string" &&
      Array.isArray(value.rows) &&
      Number.isSafeInteger(value.page) &&
      value.pageSize === 20 &&
      value.rows.length <= 20
    );
  if (projection === "owner")
    return (
      typeof value.actorId === "string" &&
      !!value.profile &&
      Array.isArray(value.cards) &&
      value.cards.every((c) => cardAllowed(c, true)) &&
      ["cards", "progress", "awards", "acquiredCards", "recent"].every((key) =>
        Array.isArray(value[key]),
      )
    );
  if (projection === "catalogue")
    return (
      Array.isArray(value.cards) &&
      Array.isArray(value.pools) &&
      value.cards.every((card) => cardAllowed(card))
    );
  if (projection === "showcase")
    return (
      typeof value.handle === "string" &&
      ["shelf", "progress", "awards"].every((key) => Array.isArray(value[key])) &&
      (value.curations === undefined ||
        (Array.isArray(value.curations) &&
          value.curations.every(
            (g) =>
              g &&
              Object.keys(g).sort().join() === "cards,note,title" &&
              typeof g.title === "string" &&
              typeof g.note === "string" &&
              Array.isArray(g.cards),
          ))) &&
      [value.mainCard, ...value.shelf, ...(value.curations ?? []).flatMap((g) => g.cards)]
        .filter(Boolean)
        .every((card) => cardAllowed(card))
    );
  return Array.isArray(value.rows);
}
