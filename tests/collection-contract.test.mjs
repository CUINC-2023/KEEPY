import assert from "node:assert/strict";
import { collectionReadContract, isCollectionProjection } from "../src/lib/collection-contract.mjs";
const card = { cardId: "known", poolId: "p", name: "Known", rarity: "C", cardVersion: 1 },
  pub = {
    readContract: collectionReadContract("showcase"),
    handle: "opaque",
    mainCard: card,
    shelf: [],
    progress: [],
    awards: [],
  };
assert.equal(isCollectionProjection(pub, "showcase"), true);
for (const k of ["profile", "actorId", "session", "privateEvidence", "ledger"]) {
  assert.equal(isCollectionProjection({ ...pub, [k]: {} }, "showcase"), false);
}
assert.equal(
  isCollectionProjection({ ...pub, mainCard: { ...card, sourceEvidence: "private" } }, "showcase"),
  false,
);
assert.equal(
  isCollectionProjection({ ...pub, mainCard: { ...card, count: 1 } }, "showcase"),
  false,
);
assert.equal(
  isCollectionProjection({ ...pub, readContract: { ...pub.readContract, schema: 2 } }, "showcase"),
  false,
);
assert.equal(
  isCollectionProjection(
    { ...pub, readContract: { ...pub.readContract, credential: "private" } },
    "showcase",
  ),
  false,
);
const owner = {
  readContract: collectionReadContract("owner"),
  actorId: "own",
  profile: {},
  cards: [{ ...card, count: 2, growthPolicyVersion: null }],
  progress: [],
  awards: [],
  acquiredCards: [],
  recent: [],
};
assert.equal(isCollectionProjection(owner, "owner"), true);
assert.equal(isCollectionProjection({ ...owner, privateUnexpected: "unknown" }, "owner"), false);
console.log(
  "PASS source/schema and root/card field whitelists, legacy optional showcase fields, private/public boundaries",
);
