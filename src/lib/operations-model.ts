import { z } from "zod";
import { ALBUM } from "@/data/player";
import { POOLS, GRADES } from "@/data/mock";

const id = z.string().min(1).max(200);
export const DEMO_ACCOUNTS = [
  { id: "demo-approved-a", name: "示意創作者 A", approved: true },
  { id: "demo-approved-b", name: "示意創作者 B", approved: true },
  { id: "demo-pending", name: "示意待審帳號", approved: false },
] as const;
const partnerSchema = z.object({
  id,
  name: z.string().min(1).max(100),
  accountId: z.string(),
  accountActive: z.boolean(),
  cooperation: z.enum(["active", "stopped"]),
  restrictionReason: z.string().max(1000),
});
const termsSchema = z.object({
  term: z.enum(["fixed", "perpetual"]),
  start: z.string(),
  end: z.string(),
  scope: z.string().max(1000),
  display: z.boolean(),
  print: z.boolean(),
  evidence: z.string().max(1000),
  remuneration: z.enum(["buyout", "share", "mixed"]),
  rate: z.number().min(0).max(100),
  basis: z.string().max(1000),
  payeeId: id,
});
const contractSchema = z.object({
  id,
  partnerId: id,
  version: z.number().int().positive(),
  terms: termsSchema,
  text: z.string().min(1).max(10000),
  createdAt: z.string(),
  status: z.enum(["draft", "pending", "agreed", "returned"]),
  confirmedAt: z.string(),
  returnReason: z.string(),
});
const bindingSchema = z.object({
  cardId: id,
  partnerId: id,
  contractId: id,
  artwork: z.boolean(),
  visibility: z.enum(["normal", "grayscale", "hidden"]),
});
const schema = z.object({
  version: z.literal(1),
  partners: z.array(partnerSchema),
  contracts: z.array(contractSchema),
  bindings: z.array(bindingSchema),
  poolVersions: z.array(
    z.object({
      id,
      poolId: id,
      number: z.number().int().positive(),
      at: z.string(),
      bindings: z.array(bindingSchema),
      rules: z.string().max(100000),
    }),
  ),
  revenue: z.array(
    z.object({
      id,
      partnerId: id,
      contractId: id,
      base: z.number().nonnegative(),
      rate: z.number(),
      amount: z.number(),
      at: z.string(),
    }),
  ),
  audit: z.array(
    z.object({ id, action: z.string(), target: z.string(), at: z.string(), note: z.string() }),
  ),
  requests: z.array(
    z.object({ id, partnerId: id, note: z.string(), at: z.string(), status: z.literal("pending") }),
  ),
});
export type OpsState = z.infer<typeof schema>;
export type OpsPartner = z.infer<typeof partnerSchema>;
export type OpsTerms = z.infer<typeof termsSchema>;
export type OpsContract = z.infer<typeof contractSchema>;
export const EMPTY_OPS: OpsState = {
  version: 1,
  partners: [],
  contracts: [],
  bindings: [],
  poolVersions: [],
  revenue: [],
  audit: [],
  requests: [],
};
export const DEFAULT_TERMS: OpsTerms = {
  term: "fixed",
  start: "2026-10-01",
  end: "2027-10-01",
  scope: "KEEPY 平台內展示（測試）",
  display: true,
  print: false,
  evidence: "",
  remuneration: "buyout",
  rate: 20,
  basis: "符合來源條件的示意付費抽卡基礎 NT$1,000；比例仅為測試，非正式結算",
  payeeId: "",
};
export function parseOperations(raw: string | null): OpsState {
  if (!raw) return EMPTY_OPS;
  try {
    const result = schema.safeParse(JSON.parse(raw));
    if (!result.success) return EMPTY_OPS;
    const s = result.data;
    if (
      new Set(s.partners.map((p) => p.id)).size !== s.partners.length ||
      new Set(s.contracts.map((c) => c.id)).size !== s.contracts.length ||
      new Set(s.audit.map((a) => a.id)).size !== s.audit.length ||
      new Set(s.bindings.map((b) => b.cardId)).size !== s.bindings.length ||
      new Set(s.poolVersions.map((v) => v.id)).size !== s.poolVersions.length
    )
      return EMPTY_OPS;
    if (
      s.contracts.some(
        (c) => !s.partners.some((p) => p.id === c.partnerId) || c.terms.payeeId !== c.partnerId,
      ) ||
      s.bindings.some(
        (b) =>
          !ALBUM.some((c) => c.id === b.cardId) ||
          !s.contracts.some((c) => c.id === b.contractId && c.partnerId === b.partnerId),
      )
    )
      return EMPTY_OPS;
    if (
      s.partners.some((p) => p.accountId && !DEMO_ACCOUNTS.some((a) => a.id === p.accountId)) ||
      s.poolVersions.some((v) => !POOLS.some((p) => p.id === v.poolId)) ||
      s.revenue.some(
        (r) =>
          !s.contracts.some((c) => c.id === r.contractId && c.partnerId === r.partnerId) ||
          r.rate < 0 ||
          r.rate > 100 ||
          r.amount !== (r.base * r.rate) / 100,
      ) ||
      s.requests.some((r) => !s.partners.some((p) => p.id === r.partnerId))
    )
      return EMPTY_OPS;
    return s;
  } catch {
    return EMPTY_OPS;
  }
}
function record(
  s: OpsState,
  operationId: string,
  action: string,
  target: string,
  at: string,
  note = "",
): OpsState {
  return { ...s, audit: [...s.audit, { id: operationId, action, target, at, note }] };
}
function repeated(s: OpsState, operationId: string) {
  return !operationId || s.audit.some((a) => a.id === operationId);
}
export function savePartner(
  s: OpsState,
  input: OpsPartner,
  operationId: string,
  at: string,
): OpsState {
  if (
    repeated(s, operationId) ||
    !partnerSchema.safeParse(input).success ||
    (input.accountId && !DEMO_ACCOUNTS.some((a) => a.id === input.accountId)) ||
    ((!input.accountActive || input.cooperation === "stopped") && !input.restrictionReason.trim())
  )
    return s;
  const prior = s.partners.find((p) => p.id === input.id);
  if (prior && JSON.stringify(prior) === JSON.stringify(input)) return s;
  return record(
    {
      ...s,
      partners: prior
        ? s.partners.map((p) => (p.id === input.id ? { ...input } : p))
        : [...s.partners, { ...input }],
    },
    operationId,
    "partner.save",
    input.id,
    at,
    input.restrictionReason,
  );
}
export function createContract(
  s: OpsState,
  partnerId: string,
  terms: OpsTerms,
  text: string,
  operationId: string,
  at: string,
): OpsState {
  if (
    repeated(s, operationId) ||
    !s.partners.some((p) => p.id === partnerId) ||
    !termsSchema.safeParse(terms).success ||
    terms.payeeId !== partnerId ||
    !text.trim() ||
    text.length > 10000
  )
    return s;
  const version =
    1 + Math.max(0, ...s.contracts.filter((c) => c.partnerId === partnerId).map((c) => c.version));
  const contract: OpsContract = {
    id: operationId,
    partnerId,
    version,
    terms: { ...terms },
    text,
    createdAt: at,
    status: "draft",
    confirmedAt: "",
    returnReason: "",
  };
  return record(
    { ...s, contracts: [...s.contracts, contract] },
    operationId,
    "contract.create",
    contract.id,
    at,
  );
}
export function transitionContract(
  s: OpsState,
  contractId: string,
  status: "pending" | "agreed" | "returned",
  operationId: string,
  at: string,
  reason = "",
): OpsState {
  const c = s.contracts.find((c) => c.id === contractId);
  if (
    !c ||
    repeated(s, operationId) ||
    !(
      (status === "pending" && c.status === "draft") ||
      (status !== "pending" && c.status === "pending")
    ) ||
    (status === "returned" && !reason.trim())
  )
    return s;
  return record(
    {
      ...s,
      contracts: s.contracts.map((row) =>
        row.id === contractId
          ? { ...row, status, confirmedAt: status === "agreed" ? at : "", returnReason: reason }
          : row,
      ),
    },
    operationId,
    "contract." + status,
    contractId,
    at,
    reason,
  );
}
export function bindCard(
  s: OpsState,
  cardId: string,
  contractId: string,
  artwork: boolean,
  visibility: "normal" | "grayscale" | "hidden",
  operationId: string,
  at: string,
): OpsState {
  const c = s.contracts.find((c) => c.id === contractId);
  if (!c || !ALBUM.some((a) => a.id === cardId) || repeated(s, operationId)) return s;
  const binding = { cardId, partnerId: c.partnerId, contractId, artwork, visibility };
  return record(
    { ...s, bindings: [...s.bindings.filter((b) => b.cardId !== cardId), binding] },
    operationId,
    "card.bind",
    cardId,
    at,
  );
}
export function listingIssues(s: OpsState, poolId: string, at: string): string[] {
  const pool = POOLS.find((p) => p.id === poolId);
  if (!pool) return ["pool"];
  const bindings = s.bindings.filter(
    (b) => ALBUM.find((c) => c.id === b.cardId)?.poolId === poolId,
  );
  if (!bindings.length) return ["cards"];
  const issues: string[] = ALBUM.filter(
    (c) => c.poolId === poolId && !bindings.some((b) => b.cardId === c.id),
  ).map((c) => c.id + ":relations");
  for (const b of bindings) {
    const c = s.contracts.find((c) => c.id === b.contractId),
      p = s.partners.find((p) => p.id === b.partnerId);
    if (!b.artwork) issues.push(b.cardId + ":artwork");
    const card = ALBUM.find((card) => card.id === b.cardId);
    if (!card || !GRADES.includes(card.grade)) issues.push(b.cardId + ":rarity");
    if (!["normal", "grayscale", "hidden"].includes(b.visibility))
      issues.push(b.cardId + ":visibility");
    if (!c || !p) {
      issues.push(b.cardId + ":relations");
      continue;
    }
    if (c.status !== "agreed" || !c.confirmedAt) issues.push(b.cardId + ":consent");
    const t = c.terms,
      date = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Taipei" }).format(new Date(at));
    if (
      !t.scope.trim() ||
      !t.evidence.trim() ||
      !t.display ||
      !validDate(t.start) ||
      t.start > date ||
      (t.term === "fixed" && (!validDate(t.end) || t.end <= t.start || t.end < date))
    )
      issues.push(b.cardId + ":license");
    if (t.payeeId !== p.id) issues.push(b.cardId + ":payee");
    if (
      t.remuneration !== "buyout" &&
      (!p.accountActive ||
        !DEMO_ACCOUNTS.some((a) => a.id === p.accountId && a.approved) ||
        !t.basis.trim() ||
        t.rate <= 0)
    )
      issues.push(b.cardId + ":share-account-or-basis");
    // Account status does not silently extend/revoke signed license; cooperation itself is audited separately.
    if (p.cooperation === "stopped") issues.push(b.cardId + ":cooperation-review");
  }
  return issues;
}
export function snapshotPool(
  s: OpsState,
  poolId: string,
  rules: string,
  operationId: string,
  at: string,
  requireListing = true,
): OpsState {
  if (
    repeated(s, operationId) ||
    !POOLS.some((p) => p.id === poolId) ||
    rules.length > 100000 ||
    (requireListing && listingIssues(s, poolId, at).length)
  )
    return s;
  const number =
    1 + Math.max(0, ...s.poolVersions.filter((v) => v.poolId === poolId).map((v) => v.number));
  const bindings = s.bindings
    .filter((b) => ALBUM.find((c) => c.id === b.cardId)?.poolId === poolId)
    .map((b) => ({ ...b }));
  return record(
    {
      ...s,
      poolVersions: [...s.poolVersions, { id: operationId, poolId, number, at, bindings, rules }],
    },
    operationId,
    requireListing ? "pool.preview" : "pool.rules-version",
    poolId,
    at,
    "Local Mock only; public pool status unchanged",
  );
}
export function revenueExample(
  s: OpsState,
  contractId: string,
  operationId: string,
  at: string,
): OpsState {
  const c = s.contracts.find((c) => c.id === contractId);
  if (!c || c.status !== "agreed" || c.terms.remuneration === "buyout" || repeated(s, operationId))
    return s;
  const base = 1000,
    rate = c.terms.rate;
  return record(
    {
      ...s,
      revenue: [
        ...s.revenue,
        {
          id: operationId,
          partnerId: c.partnerId,
          contractId,
          base,
          rate,
          amount: (base * rate) / 100,
          at,
        },
      ],
    },
    operationId,
    "revenue.fixture",
    c.partnerId,
    at,
    "NT$1000 eligible paid-draw fixture; excludes 11th/free/activity/synthesis; no real payout",
  );
}
export function withdrawalBlocked(p: OpsPartner) {
  return (
    !p.accountActive ||
    p.cooperation !== "active" ||
    !DEMO_ACCOUNTS.some((a) => a.id === p.accountId && a.approved)
  );
}
export function requestReview(
  s: OpsState,
  partnerId: string,
  note: string,
  operationId: string,
  at: string,
): OpsState {
  if (repeated(s, operationId) || !s.partners.some((p) => p.id === partnerId) || !note.trim())
    return s;
  return record(
    {
      ...s,
      requests: [...s.requests, { id: operationId, partnerId, note, at, status: "pending" }],
    },
    operationId,
    "withdrawal.review-request",
    partnerId,
    at,
    note,
  );
}
function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function printingAllowed(c: OpsContract, at: string) {
  const date = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Taipei" }).format(new Date(at));
  return (
    c.status === "agreed" &&
    c.terms.print &&
    !!c.terms.evidence.trim() &&
    !!c.terms.scope.trim() &&
    validDate(c.terms.start) &&
    c.terms.start <= date &&
    (c.terms.term === "perpetual" || (validDate(c.terms.end) && c.terms.end >= date))
  );
}
