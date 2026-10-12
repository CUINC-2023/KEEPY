import { validateFeedback } from "../src/lib/supply-feedback.mjs";
import { projectDiscoveryRecords } from "./discovery.mjs";
import { publicationPeriod } from "./publication-period.mjs";
import { validateEditorial, editorialIssues, publishEditorial } from "./editorial.mjs";
import { supplyChecklist } from "../src/lib/supply-checklist.mjs";
const locales = ["zh-TW", "en"];
const copyFields = ["title", "summary", "story", "goal", "endPolicy", "teaser"];
const uses = ["website", "social", "print"];
const states = ["pending", "sample-confirmed", "not-requested"];
const fail = (d, message, status = 422) => {
  throw new d.constructor.DiscoveryError(status, "supply", message);
};
const exact = (d, v, keys) => {
  if (
    !v ||
    typeof v !== "object" ||
    Array.isArray(v) ||
    Object.keys(v).sort().join(",") !== keys.slice().sort().join(",")
  )
    fail(d, "Unknown or missing fields");
};
const text = (d, s, max = 2000) => {
  if (typeof s !== "string" || s.length > max) fail(d, "Invalid bounded text");
};
const bilingual = (d, v) => {
  exact(d, v, locales);
  locales.forEach((l) => text(d, v[l]));
};
const date = (d, s) => {
  text(d, s, 40);
  if (
    s &&
    (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?(?:Z|[+-]\d\d:\d\d)$/.test(s) ||
      !Number.isFinite(Date.parse(s)))
  )
    fail(d, "Explicit timezone ISO required");
};
const revision = (p, n) => p.revisions.find((r) => r.revision === n)?.value;
function context(d, u) {
  const identity = d.supplyIdentity(u.id),
    ops = d.document("operations").data;
  const partners = ops.partners.filter(
    (p) => p.accountId === identity?.accountId && p.accountActive,
  );
  return { identity, partners, ops };
}
function own(d, u, p) {
  const c = context(d, u);
  if (u.role !== "creator" || !c.identity || !c.partners.length || (p && p.ownerId !== u.id))
    fail(d, "Current creator and own package required", 403);
  if (p && !c.partners.some((x) => x.id === p.partnerId))
    fail(d, "Current partner ownership required", 403);
  return c;
}
function pack(d, id) {
  if (typeof id !== "string" || !/^local-[a-z0-9-]{1,65}$/.test(id))
    fail(d, "Local package ID required");
  const row = d.db.prepare("SELECT * FROM documents WHERE id=?").get("supply:" + id);
  return row ? { version: row.version, data: JSON.parse(row.payload) } : null;
}
function all(d) {
  return d.db
    .prepare("SELECT version,payload FROM documents WHERE id LIKE 'supply:%' ORDER BY id")
    .all()
    .map((r) => ({ version: r.version, data: JSON.parse(r.payload) }));
}
function validate(d, v, c, prior, history = [], packageId) {
  exact(d, v, [
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
    ...(v.editorial === undefined ? [] : ["editorial"]),
  ]);
  for (const k of ["partnerId", "creatorId", "poolId"]) text(d, v[k], 100);
  if (
    !c.partners.some((p) => p.id === v.partnerId) ||
    v.creatorId !== c.identity.creatorId ||
    !d.catalog.discoveryPools.some((p) => p.id === v.poolId && p.goddessIds.includes(v.creatorId))
  )
    fail(d, "Own linked creator and catalogue series required", 403);
  if (
    prior &&
    (v.partnerId !== prior.partnerId ||
      v.creatorId !== prior.creatorId ||
      v.poolId !== prior.poolId)
  )
    fail(d, "Package owner/creator/series relations immutable");
  if (prior?.editorial && !v.editorial)
    fail(
      d,
      "Keep the review-bound editorial structure; remove individual articles in a new revision",
    );
  validateEditorial(d, v, packageId);
  const bindings = c.ops.bindings.filter(
    (b) =>
      b.partnerId === v.partnerId &&
      d.catalog.cards.some((x) => x.id === b.cardId && x.poolId === v.poolId),
  );
  if (!bindings.length) fail(d, "Existing cooperation/card relation required");
  if (
    !Array.isArray(v.articleIds) ||
    v.articleIds.length > 12 ||
    new Set(v.articleIds).size !== v.articleIds.length ||
    v.articleIds.some(
      (id) =>
        !v.editorial?.articles.some((a) => a.id === id) &&
        !d
          .document("discovery")
          .data.items.some(
            (i) =>
              i.id === id &&
              i.draft.kind === "article" &&
              i.draft.creatorIds.includes(v.creatorId) &&
              i.draft.poolIds.includes(v.poolId),
          ),
    )
  )
    fail(d, "Related journal IDs required");
  exact(d, v.copy, copyFields);
  copyFields.forEach((k) => bilingual(d, v.copy[k]));
  for (const k of ["application", "cardNotes", "promotion", "retrospective"]) bilingual(d, v[k]);
  for (const k of ["releaseAt", "withdrawAt"]) date(d, v[k]);
  if (v.releaseAt && v.withdrawAt && Date.parse(v.releaseAt) >= Date.parse(v.withdrawAt))
    fail(d, "Release must precede withdrawal");
  if (!Array.isArray(v.materials) || v.materials.length > 24)
    fail(d, "Bounded material list required");
  const ids = new Set();
  for (const m of v.materials) {
    exact(d, m, [
      "id",
      "ref",
      "version",
      "source",
      "evidence",
      "uses",
      "startAt",
      "endAt",
      "alt",
      "cardId",
    ]);
    if (typeof m.id !== "string" || !/^m-[a-z0-9-]{1,50}$/.test(m.id) || ids.has(m.id))
      fail(d, "Unique material IDs required");
    ids.add(m.id);
    if (
      !["season-hero", "text-only"].includes(m.ref) ||
      !Number.isInteger(m.version) ||
      m.version < 1 ||
      m.version > 10000
    )
      fail(d, "Allowlisted local material and version required");
    text(d, m.source);
    text(d, m.evidence);
    bilingual(d, m.alt);
    exact(d, m.uses, uses);
    if (uses.some((k) => !states.includes(m.uses[k])))
      fail(d, "Separate website/social/print sample-use states required");
    date(d, m.startAt);
    date(d, m.endAt);
    if (m.startAt && m.endAt && Date.parse(m.startAt) >= Date.parse(m.endAt))
      fail(d, "Material start must precede end");
    text(d, m.cardId, 100);
    if (
      m.cardId &&
      !d.catalog.cards.some(
        (x) =>
          x.id === m.cardId && x.poolId === v.poolId && bindings.some((b) => b.cardId === x.id),
      )
    )
      fail(d, "Own linked card definition required");
    const old =
      history
        .flatMap((r) => r.value.materials)
        .filter((x) => x.id === m.id)
        .at(-1) ?? prior?.materials.find((x) => x.id === m.id);
    if (
      old &&
      JSON.stringify({ ...old, version: 0 }) !== JSON.stringify({ ...m, version: 0 }) &&
      m.version <= old.version
    )
      fail(d, "Changed material requires a new material version");
    if (old && m.version < old.version) fail(d, "Material version cannot go backwards");
  }
}
export function supplyIssues(d, v, u) {
  const c = context(d, u),
    issues = [];
  const owner = d.db.prepare("SELECT role,active FROM users WHERE id=?").get(u.id);
  if (!owner?.active || owner.role !== "creator") issues.push("creator-role");
  if (!c.partners.some((p) => p.id === v.partnerId && p.cooperation === "active"))
    issues.push("cooperation");
  if (
    !c.ops.contracts.some(
      (x) =>
        x.partnerId === v.partnerId &&
        x.status === "agreed" &&
        x.terms.display &&
        x.terms.evidence.trim(),
    )
  )
    issues.push("contract");
  for (const k of ["title", "summary", "story", "goal", "endPolicy"])
    if (locales.some((l) => !v.copy[k][l].trim())) issues.push(k);
  for (const k of ["application", "cardNotes", "promotion"])
    if (locales.some((l) => !v[k][l].trim())) issues.push(k);
  if (!v.releaseAt || !v.withdrawAt) issues.push("publication-period");
  if (!v.materials.length) issues.push("materials");
  for (const m of v.materials) {
    if (
      !m.source.trim() ||
      !m.evidence.trim() ||
      locales.some((l) => !m.alt[l].trim()) ||
      !m.source?.trim() ||
      !m.evidence?.trim() ||
      locales.some((l) => !m.alt?.[l]?.trim()) ||
      !Number.isFinite(Date.parse(m.startAt)) ||
      !Number.isFinite(Date.parse(m.endAt)) ||
      m.uses.website !== "sample-confirmed" ||
      !m.startAt ||
      !m.endAt ||
      Date.parse(m.startAt) > Date.parse(v.releaseAt) ||
      Date.parse(m.endAt) < Date.parse(v.withdrawAt)
    )
      issues.push("material:" + m.id);
  }
  return [...issues, ...editorialIssues(v)];
}
function view(d, p) {
  const v = revision(p, p.draftRevision),
    u = { id: p.ownerId, role: "creator" },
    c = context(d, u);
  return {
    ...p,
    issues: supplyIssues(d, v, u),
    checks: supplyChecklist(v, supplyIssues(d, v, u)),
    schedule: {
      checkedAt: d.at(),
      submittedAt:
        d.db
          .prepare(
            "SELECT at FROM audit WHERE action='supply.submit' AND substr(subject,1,length(?))=? ORDER BY at DESC,id LIMIT 1",
          )
          .get("supply:" + p.id + ":", "supply:" + p.id + ":")?.at ?? null,
      nextBoundary:
        [v, revision(p, p.publishedRevision)]
          .filter(Boolean)
          .flatMap((v) => [
            v.releaseAt,
            v.withdrawAt,
            ...v.materials.flatMap((m) => [m.startAt, m.endAt]),
          ])
          .filter((x) => Number.isFinite(Date.parse(x)) && Date.parse(x) > d.clock())
          .sort((a, b) => Date.parse(a) - Date.parse(b))[0] ?? null,
      draftPeriod: publicationPeriod(v, d.clock()),
      publicPeriod: p.publishedRevision
        ? publicationPeriod(revision(p, p.publishedRevision), d.clock())
        : null,
      needsReview: p.approvedRevision !== p.draftRevision,
      visible: p.published && d.publicDiscovery().items.some((i) => i.sourcePackId === p.id),
    },
    remuneration: c.ops.contracts
      .filter((x) => x.partnerId === p.partnerId)
      .map((x) => ({ id: x.id, version: x.version, status: x.status, terms: x.terms })),
    synthetic: true,
  };
}
export function supplyList(d, token, official = false) {
  const u = official ? d.official(token) : d.actor(token);
  const c = official ? null : own(d, u);
  return {
    actorId: u.id,
    packages: all(d)
      .filter(
        (p) =>
          official ||
          (p.data.ownerId === u.id && c.partners.some((x) => x.id === p.data.partnerId)),
      )
      .map((p) => ({ ...p, data: view(d, p.data) })),
    context: official
      ? null
      : {
          creatorId: c.identity.creatorId,
          partners: c.partners,
          pools: d.catalog.discoveryPools
            .filter(
              (p) =>
                p.goddessIds.includes(c.identity.creatorId) &&
                c.ops.bindings.some(
                  (b) =>
                    c.partners.some((x) => x.id === b.partnerId) &&
                    d.catalog.cards.some((x) => x.id === b.cardId && x.poolId === p.id),
                ),
            )
            .map((p) => ({ id: p.id, name: p.name })),
          articles: d
            .document("discovery")
            .data.items.filter(
              (i) =>
                i.draft.kind === "article" && i.draft.creatorIds.includes(c.identity.creatorId),
            )
            .map((i) => ({ id: i.id, poolIds: i.draft.poolIds })),
        },
  };
}
function publicMaterial(d, m, poolId, context) {
  if (
    m.uses.website !== "sample-confirmed" ||
    Date.parse(m.startAt) > d.clock() ||
    d.clock() >= Date.parse(m.endAt)
  )
    return null;
  const pool = (context?.pools ?? d.pools()).find((p) => p.id === poolId),
    rule = (context?.rules ?? d.document("collection-rules").data).visibility.find(
      (v) => v.poolId === poolId,
    );
  if (!pool || pool.visibility === "hidden" || !rule) return null;
  if (m.cardId) {
    const card = d.catalog.cards.find((c) => c.id === m.cardId && c.poolId === poolId),
      binding = d.document("operations").data.bindings.find((b) => b.cardId === m.cardId);
    if (
      !card ||
      !d.db
        .prepare("SELECT 1 FROM collection_definitions WHERE card_id=? AND version=1")
        .get(m.cardId) ||
      !binding ||
      rule.hiddenGrades.includes(card.grade) ||
      binding.visibility === "hidden"
    )
      return null;
  }
  return { ref: m.ref, version: m.version, alt: m.alt };
}
export function supplyProjection(d, item, context) {
  const pools = context?.pools ?? d.pools(),
    rules = context?.rules ?? d.document("collection-rules").data;
  const ids = item.kind === "series" ? [item.referenceId, ...item.poolIds] : item.poolIds;
  if (
    ids.some(
      (id) =>
        !pools.some((p) => p.id === id && p.visibility !== "hidden") ||
        !rules.visibility.some((v) => v.poolId === id),
    )
  )
    return null;
  const { materials = [], blocks, ...value } = item;
  return {
    ...value,
    materials: materials.map((m) => publicMaterial(d, m, ids[0], context)).filter(Boolean),
    ...(blocks
      ? {
          blocks: blocks
            .map((b) => {
              if (b.type !== "image") return b;
              const material = b.material && publicMaterial(d, b.material, ids[0], context);
              return material ? { type: "image", caption: b.caption, material } : null;
            })
            .filter(Boolean),
        }
      : {}),
  };
}
export function supplyCommand(d, token, input, key, official = false) {
  const initial = official ? d.official(token) : d.actor(token),
    existing = pack(d, input?.id);
  if (!official) own(d, initial, existing?.data);
  return d.mutation(token, input, key, official ? "supply-official" : "creator", (u) => {
    exact(d, input, [
      "action",
      "id",
      "expectedVersion",
      "revision",
      "expectedDiscoveryVersion",
      "value",
      "reason",
      ...(Object.hasOwn(input ?? {}, "feedback") ? ["feedback"] : []),
    ]);
    if (Object.hasOwn(input ?? {}, "feedback") && input.action !== "return")
      fail(d, "Feedback is allowed only on return");
    const prior = pack(d, input.id),
      c = official ? null : own(d, u, prior?.data);
    if (input.expectedVersion !== (prior?.version ?? 0))
      fail(d, "Package changed; reload before editing", 409);
    text(d, input.reason, 2000);
    if (!["save", "submit", "return", "approve", "publish", "withdraw"].includes(input.action))
      fail(d, "Unknown command");
    if (official === ["save", "submit"].includes(input.action))
      fail(d, "Current role cannot perform this action", 403);
    let p = structuredClone(prior?.data);
    if (input.action === "save") {
      if (input.revision !== null || input.expectedDiscoveryVersion !== null || input.reason)
        fail(d, "Invalid save fields");
      validate(d, input.value, c, p && revision(p, p.draftRevision), p?.revisions ?? [], input.id);
      if (!p) {
        if (all(d).filter((p) => p.data.ownerId === u.id).length >= 30)
          fail(d, "Package limit reached");
        p = {
          id: input.id,
          ownerId: u.id,
          partnerId: input.value.partnerId,
          creatorId: input.value.creatorId,
          poolId: input.value.poolId,
          revisions: [],
          draftRevision: 0,
          submittedRevision: null,
          approvedRevision: null,
          publishedRevision: null,
          published: false,
          status: "draft",
          reviews: [],
          publications: [],
        };
        d.db
          .prepare("INSERT INTO documents VALUES(?,0,?)")
          .run("supply:" + input.id, JSON.stringify(p));
      }
      if (p.revisions.length >= 100) fail(d, "Revision limit reached");
      p.draftRevision++;
      p.revisions.push({
        revision: p.draftRevision,
        value: structuredClone(input.value),
        at: d.at(),
      });
      p.submittedRevision = null;
      p.approvedRevision = null;
      p.status = "draft";
    } else {
      if (!p) fail(d, "Unknown package", 404);
      if (
        input.value !== null ||
        (input.revision !== p.draftRevision && input.action !== "withdraw")
      )
        fail(d, "Specified current draft revision required", 409);
      const v = revision(p, p.draftRevision),
        owner = { id: p.ownerId, role: "creator" };
      if (input.action === "submit") {
        if (
          !["draft", "returned"].includes(p.status) ||
          input.reason ||
          input.expectedDiscoveryVersion !== null
        )
          fail(d, "Draft required", 409);
        const issues = supplyIssues(d, v, owner);
        if (issues.length) fail(d, "Missing: " + issues.join(", "));
        p.status = "submitted";
        p.submittedRevision = p.draftRevision;
      } else if (["return", "approve"].includes(input.action)) {
        if (
          p.status !== "submitted" ||
          p.submittedRevision !== input.revision ||
          input.expectedDiscoveryVersion !== null
        )
          fail(d, "Submitted revision required", 409);
        if (!input.reason.trim()) fail(d, "Review reason required");
        if (Object.hasOwn(input ?? {}, "feedback") && !validateFeedback(v, input.feedback))
          fail(
            d,
            "Feedback must reference this exact revision; up to 10 entries and 500 characters per note",
          );
        if (input.action === "approve") {
          const issues = supplyIssues(d, v, owner);
          if (issues.length) fail(d, "Missing: " + issues.join(", "));
          p.approvedRevision = input.revision;
          p.status = "approved";
        } else {
          p.status = "returned";
          p.approvedRevision = null;
        }
        p.reviews.push({
          revision: input.revision,
          decision: input.action,
          reason: input.reason,
          at: d.at(),
          actor: u.id,
          ...(Object.hasOwn(input ?? {}, "feedback")
            ? { feedback: structuredClone(input.feedback) }
            : {}),
        });
      } else {
        const discovery = d.document("discovery");
        if (input.expectedDiscoveryVersion !== discovery.version)
          fail(d, "Public content changed; reload before publishing", 409);
        if (input.reason) fail(d, "Unexpected publication reason");
        const content = structuredClone(discovery.data),
          item = content.items.find(
            (i) => i.draft.kind === "series" && i.draft.referenceId === p.poolId,
          );
        if (!item) fail(d, "Known series required");
        if (input.action === "publish") {
          if (
            (p.status !== "approved" && !(p.status === "published" && !p.published)) ||
            p.approvedRevision !== input.revision
          )
            fail(d, "Exact approved revision required", 409);
          const issues = supplyIssues(d, v, owner);
          if (issues.length) fail(d, "Missing: " + issues.join(", "));
          if (item.supplyPackId && item.supplyPackId !== p.id && item.status === "published")
            fail(d, "Withdraw the other package before replacing this series", 409);
          stageSupplyContent(d, content, p, v, discovery.version + 1);
          p.published = true;
          p.publishedRevision = p.draftRevision;
          p.status = "published";
        } else {
          if (
            !p.published ||
            (!revision(p, p.publishedRevision)?.editorial && item.supplyPackId !== p.id) ||
            input.revision !== p.publishedRevision
          )
            fail(d, "Current published package revision required", 409);
          if (revision(p, p.publishedRevision)?.editorial) {
            content.items
              .filter((i) => i.supplyPackId === p.id)
              .forEach((i) => {
                i.status = "archived";
              });
          } else item.status = "archived";
          p.published = false;
          if (p.status === "published" && p.approvedRevision === p.draftRevision)
            p.status = "approved";
        }
        d.writeDocument("discovery", discovery, content, u.id, "supply." + input.action);
        d.fault("after-supply-publication");
        p.publications.push({
          revision: input.revision,
          action: input.action,
          at: d.at(),
          actor: u.id,
          discoveryVersion: discovery.version + 1,
        });
      }
    }
    const result = d.writeDocument(
      "supply:" + p.id,
      prior ?? { version: 0 },
      p,
      u.id,
      "supply." + input.action,
    );
    d.fault("after-supply-package");
    return result;
  });
}

function stageSupplyContent(d, content, p, v, nextRevision) {
  if (v.editorial) return publishEditorial(d, content, p, v, nextRevision);
  const item = content.items.find(
    (i) => i.draft.kind === "series" && i.draft.referenceId === p.poolId,
  );
  if (!item) fail(d, "Known series required");
  const value = {
    ...structuredClone(item.draft),
    copy: { ...structuredClone(item.draft.copy), ...v.copy },
    releaseAt: v.releaseAt,
    withdrawAt: v.withdrawAt,
  };
  item.published = {
    ...value,
    revision: nextRevision,
    publishedAt: d.at(),
    sourcePackId: p.id,
    sourceRevision: p.draftRevision,
    materials: structuredClone(v.materials),
  };
  item.status = "published";
  item.supplyPackId = p.id;
}
export function supplyPreview(d, token, input, official = false) {
  const u = official ? d.official(token) : d.actor(token);
  exact(d, input, ["id", "expectedVersion", "revision", "value"]);
  const prior = pack(d, input.id),
    c = official ? null : own(d, u, prior?.data);
  if (input.expectedVersion !== (prior?.version ?? 0))
    fail(d, "Package changed; reload before preview", 409);
  if (official && (!prior || input.value !== null))
    fail(d, "Official preview requires a saved revision", 403);
  let v, n, kind;
  if (input.value !== null) {
    if (official || input.revision !== null) fail(d, "Own unsaved preview only", 403);
    validate(
      d,
      input.value,
      c,
      prior && revision(prior.data, prior.data.draftRevision),
      prior?.data.revisions ?? [],
      input.id,
    );
    v = structuredClone(input.value);
    n = (prior?.data.draftRevision ?? 0) + 1;
    kind = "local-unsaved";
  } else {
    if (!prior || !Number.isInteger(input.revision) || !(v = revision(prior.data, input.revision)))
      fail(d, "Known saved revision required", 404);
    n = input.revision;
    kind = "saved";
  }
  const p = {
    ...(prior?.data ?? {}),
    id: input.id,
    ownerId: prior?.data.ownerId ?? u.id,
    creatorId: v.creatorId,
    poolId: v.poolId,
    draftRevision: n,
  };
  const issues = supplyIssues(d, v, { id: p.ownerId, role: "creator" }),
    period = publicationPeriod(v, d.clock());
  let items = [];
  if (!issues.length && period === "current") {
    const content = structuredClone(d.document("discovery").data);
    stageSupplyContent(d, content, p, v, d.document("discovery").version + 1);
    items = projectDiscoveryRecords(d, content.items).items.filter((i) => i.sourcePackId === p.id);
  }
  // Both sides use the same current public projection. This authorized summary
  // contains field names only: no private evidence, prose, receipts or asset data.
  const current = d.publicDiscovery().items.filter((i) => i.sourcePackId === p.id);
  const fields = [
    "copy",
    "category",
    "creatorIds",
    "poolIds",
    "order",
    "featured",
    "releaseAt",
    "withdrawAt",
    "blocks",
    "materials",
    "questions",
    "promotion",
    "retrospective",
  ];
  const entries = [...new Set([...current, ...items].map((i) => i.id))].sort().map((id) => {
    const before = current.find((i) => i.id === id),
      after = items.find((i) => i.id === id),
      item = after ?? before;
    const changedFields =
      before && after
        ? fields.filter((field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]))
        : [];
    return {
      id,
      kind: item.kind,
      change: !before
        ? "added"
        : !after
          ? "removed"
          : changedFields.length
            ? "changed"
            : "unchanged",
      fields: changedFields,
      href:
        item.kind === "article"
          ? "/journal/" + id
          : item.kind === "creator"
            ? "/goddesses/" + item.referenceId
            : item.kind === "series"
              ? "/pools/" + item.referenceId
              : "/",
    };
  });
  return {
    actorId: u.id,
    serverTime: d.at(),
    source: {
      id: p.id,
      documentVersion: prior?.version ?? 0,
      revision: kind === "saved" ? n : null,
      kind,
    },
    period,
    issues,
    items,
    impact: {
      publishedRevision: prior?.data.publishedRevision ?? null,
      entries,
      reasons: [
        ...(period !== "current" ? [period] : []),
        ...(issues.length ? ["requirements"] : []),
        ...(kind !== "saved" || prior?.data.approvedRevision !== n ? ["approval"] : []),
        ...(!items.length && period === "current" && !issues.length ? ["public-visibility"] : []),
      ],
    },
    publicationEligible:
      kind === "saved" &&
      prior?.data.approvedRevision === n &&
      !issues.length &&
      period === "current",
    synthetic: true,
  };
}
