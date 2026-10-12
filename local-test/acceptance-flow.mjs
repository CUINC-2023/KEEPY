import assert from "node:assert/strict";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalDatabase } from "./database.mjs";
import { loadCatalog } from "./catalog.mjs";
import { createLocalServer } from "./server.mjs";
import {
  SAMPLE_PACKAGE_ID,
  SAMPLE_ARTICLES,
  sampleUniformPackage,
} from "../src/lib/sample-022.mjs";

/** Real Local Test HTTP workflow; refuses existing databases and never imports browser Mock state. */
export async function acceptanceFlow(
  path = join(mkdtempSync(join(tmpdir(), "keepy-handoff-")), "flow.sqlite"),
) {
  if (existsSync(path)) throw Error("Acceptance workflow requires a new isolated SQLite file");
  let now = Date.now(),
    fault = "";
  const start = now,
    d = new LocalDatabase(path, await loadCatalog(), {
      clock: () => now,
      fault: (s) => {
        if (s === fault) throw Error("Isolated rollback probe");
      },
    });
  const server = createLocalServer(d),
    checks = [];
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const base = "http://127.0.0.1:" + server.address().port + "/api/local-test";
  let seq = 0;
  async function api(path, cookie = "", body, key = "handoff-flow-" + ++seq) {
    const r = await fetch(base + path, {
      headers: {
        Origin: "http://127.0.0.1:8787",
        Cookie: cookie,
        "Content-Type": "application/json",
        "Idempotency-Key": key,
      },
      ...(body === undefined ? {} : { method: "POST", body: JSON.stringify(body) }),
    });
    return {
      status: r.status,
      value: await r.json(),
      cookie: r.headers.get("set-cookie")?.split(";")[0],
    };
  }
  const ok = (r) => {
    assert.equal(r.status, 200);
    return r.value;
  };
  try {
    let creator = (await api("/session", "", { fixtureId: "creator-a" })).cookie;
    const other = (await api("/session", "", { fixtureId: "creator-b" })).cookie;
    let official = (await api("/session", "", { fixtureId: "official-a" })).cookie;
    const player = (await api("/session", "", { fixtureId: "member-a" })).cookie;
    const value = sampleUniformPackage("local-partner-a", now);
    const body = (action, value = null, reason = "") => {
      const row = d.db
          .prepare("SELECT version,payload FROM documents WHERE id=?")
          .get("supply:" + SAMPLE_PACKAGE_ID),
        p = row && JSON.parse(row.payload);
      return {
        action,
        id: SAMPLE_PACKAGE_ID,
        expectedVersion: row?.version ?? 0,
        revision:
          action === "save" ? null : action === "withdraw" ? p.publishedRevision : p.draftRevision,
        expectedDiscoveryVersion: ["publish", "withdraw"].includes(action)
          ? d.document("discovery").version
          : null,
        value,
        reason,
      };
    };
    const send = (actor, input, admin = false, key) =>
      api(admin ? "/admin/supply/commands" : "/supply/commands", actor, input, key);
    const save = body("save", value);
    assert.equal((await send(other, save)).status, 403);
    assert.equal((await api("/admin/supply", creator)).status, 403);
    const result = ok(await send(creator, save, false, "handoff-save-once"));
    assert.deepEqual(ok(await send(creator, save, false, "handoff-save-once")), result);
    assert.equal((await send(creator, save)).status, 409);
    assert.ok(!ok(await api("/discovery")).items.some((i) => i.sourcePackId === SAMPLE_PACKAGE_ID));
    ok(await send(creator, body("submit")));
    assert.equal((await send(official, body("return"), true)).status, 422);
    ok(await send(official, body("return", null, "Isolated missing-detail review"), true));
    ok(await send(creator, body("save", value)));
    ok(await send(creator, body("submit")));
    const approve = body("approve", null, "Isolated exact-version review");
    assert.equal((await send(official, { ...approve, revision: 1 }, true)).status, 409);
    ok(await send(official, approve, true));
    const publish = body("publish"),
      before = d.document("discovery");
    fault = "after-supply-publication";
    assert.equal((await send(official, publish, true, "handoff-publish-once")).status, 500);
    assert.deepEqual(d.document("discovery"), before);
    fault = "";
    const published = ok(await send(official, publish, true, "handoff-publish-once"));
    assert.deepEqual(ok(await send(official, publish, true, "handoff-publish-once")), published);
    checks.push({
      item: "Creator isolation, save/replay/conflict, return reason, exact approval and atomic publication",
      status: "PASS",
    });
    const publicContent = ok(await api("/discovery"));
    for (const id of SAMPLE_ARTICLES) {
      const article = publicContent.items.find((i) => i.id === id);
      assert.ok(article.blocks.length >= 3);
      const search = ok(
        await api(
          "/discovery/search?q=" +
            encodeURIComponent(article.copy.title.en) +
            "&type=article&locale=en",
        ),
      );
      assert.ok(JSON.stringify(search).includes(id));
    }
    ok(await api("/draws", player, { mode: "10plus1", poolId: "p-uniform" }));
    const me = ok(await api("/collection/me", player));
    assert.ok(me.cards.length > 0);
    const data = {
      ...me.profile.data,
      isPublic: true,
      showCards: true,
      showProgress: true,
      showBadges: true,
      mainCardId: me.cards[0].cardId,
      shelfIds: [me.cards[0].cardId],
    };
    const profile = { expectedVersion: me.profile.version, data };
    const preview = ok(await api("/collection/profile-preview", player, profile));
    ok(await api("/collection/profile", player, profile, "handoff-profile-once"));
    const anonymous = ok(await api("/collection/profiles/" + me.profile.handle));
    assert.deepEqual(anonymous, preview.projection);
    assert.equal("count" in anonymous.mainCard, false);
    assert.equal("actorId" in anonymous, false);
    assert.equal((await api("/collection/me")).status, 401);
    checks.push({
      item: "Published bilingual articles/search and player display agree with anonymous public scope",
      status: "PASS",
    });
    value.copy.story.en += " Isolated revision two.";
    ok(await send(creator, body("save", value)));
    assert.ok(ok(await api("/discovery")).items.some((i) => i.sourcePackId === SAMPLE_PACKAGE_ID));
    assert.equal((await send(official, body("publish"), true)).status, 409);
    ok(await send(creator, body("submit")));
    ok(await send(official, body("approve", null, "Re-review exact new revision"), true));
    ok(await send(official, body("publish"), true));
    ok(await send(official, body("withdraw"), true));
    assert.ok(!ok(await api("/discovery")).items.some((i) => i.sourcePackId === SAMPLE_PACKAGE_ID));
    assert.equal(ok(await api("/discovery/search?q=服裝&type=article&locale=zh-TW")).count, 0);
    ok(
      await api("/admin/discovery/commands", official, {
        action: "archive",
        expectedVersion: d.document("discovery").version,
        id: "series-p-uniform",
        value: null,
      }),
    );
    assert.equal(ok(await api("/collection/profiles/" + me.profile.handle)).mainCard, null);
    ok(await api("/logout", player, {}));
    assert.equal((await api("/collection/me", player)).status, 401);
    now += 2 * 60 * 60 * 1000;
    assert.equal((await api("/supply/me", creator)).status, 401);
    checks.push({
      item: "Modification requires re-review; withdrawal masks search/display; logout and expiry reject private APIs",
      status: "PASS",
    });
    // Only this new synthetic database is left ready for the four-entrance browser smoke.
    now = start;
    creator = (await api("/session", "", { fixtureId: "creator-a" })).cookie;
    official = (await api("/session", "", { fixtureId: "official-a" })).cookie;
    void creator;
    ok(await send(official, body("publish"), true));
    return { environment: "Local Test", synthetic: true, checks };
  } finally {
    await new Promise((resolve) => server.close(resolve));
    d.close();
  }
}
