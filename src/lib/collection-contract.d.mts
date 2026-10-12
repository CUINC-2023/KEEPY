export type CollectionProjection =
  "catalogue" | "owner" | "showcase" | "ranking" | "history" | "recap";
export interface CollectionReadContract {
  schema: 1;
  domain: "collection";
  projection: CollectionProjection;
  source: "local-test-sqlite";
}
export function collectionReadContract(projection: CollectionProjection): CollectionReadContract;
export function isCollectionProjection(value: unknown, projection: CollectionProjection): boolean;
