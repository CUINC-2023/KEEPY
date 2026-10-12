import { readFileSync } from "node:fs";
import { supplyPreview } from "./supply.mjs";
import {
  previewCollectionProfile,
  collectionRankings,
  collectionProfileHealth,
} from "./collection.mjs";
import { seasonRankings, albumRankings } from "./collection-rankings.mjs";
import { collectionHistory, collectionRecap } from "./collection-history.mjs";
import { playMe, playCommand } from "./play.mjs";
import { PLAY_CONTENT_PACKS, playPackIssues, playPackHealth } from "../src/lib/play-packs.mjs";
import { readingMe, readingCommand, discoverySearch } from "./discovery.mjs";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { LocalDatabase, ApiError, FIXTURES } from "./database.mjs";
import { loadCatalog } from "./catalog.mjs";
import { inspectCatalogue } from "../src/lib/catalogue-health.mjs";
import { COLLECTION_THEMES, CREATOR_CONTENT_TEMPLATES } from "../src/lib/collection-samples.mjs";

const apiVersion = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
).version;
export function createLocalServer(database, { port = 8787, webPort = 8083 } = {}) {
  const allowedOrigins = new Set(
    [port, webPort, 8787, 8080, 8082, 8083].flatMap((p) => [
      "http://127.0.0.1:" + p,
      "http://localhost:" + p,
    ]),
  );
  const app = createServer(async (req, res) => {
    const requestId = randomUUID();
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const send = (status, data) => {
      res.statusCode = status;
      res.end(JSON.stringify(data));
    };
    try {
      if (!/^(127\.0\.0\.1|localhost):\d+$/.test(req.headers.host ?? ""))
        throw new ApiError(403, "host", "Loopback Host required");
      if (req.method !== "GET" && !allowedOrigins.has(req.headers.origin))
        throw new ApiError(403, "origin", "Local same-origin request required");
      const url = new URL(req.url, "http://127.0.0.1:" + port);
      const path = url.pathname.replace(/^\/api\/local-test/, "");
      if (!url.pathname.startsWith("/api/local-test/"))
        throw new ApiError(404, "route", "Local Test route not found");
      const token =
        (req.headers.cookie ?? "")
          .split(";")
          .map((s) => s.trim())
          .find((s) => s.startsWith("keepy_local_session="))
          ?.slice(20) ?? "";
      let body = null;
      const expectedActor = req.headers["x-keepy-expected-actor"];
      if (expectedActor !== undefined && path !== "/session" && path !== "/me") {
        if (typeof expectedActor !== "string" || expectedActor.length > 128)
          throw new ApiError(422, "actor-boundary", "Invalid expected actor");
        if (database.actor(token).id !== expectedActor)
          throw new ApiError(
            409,
            "actor-changed",
            "Session changed; reload identity before continuing",
          );
      }
      if (req.method !== "GET") {
        let raw = "";
        for await (const chunk of req) {
          raw += chunk;
          if (Buffer.byteLength(raw) > 128000) throw new ApiError(413, "body", "Request too large");
        }
        try {
          body = raw ? JSON.parse(raw) : {};
        } catch {
          throw new ApiError(422, "json", "Invalid JSON");
        }
      }
      if (req.method === "GET" && path === "/health")
        return send(200, {
          environment: "Local Test",
          version: apiVersion,
          syntheticIdentity: true,
          persistent: "SQLite",
          productionAuth: false,
        });
      if (req.method === "GET" && path === "/participation")
        return send(200, database.publicParticipation());
      if (req.method === "GET" && path === "/play/me")
        return send(200, playMe(database, token, Object.fromEntries(url.searchParams)));
      if (req.method === "POST" && path === "/play/commands")
        return send(200, playCommand(database, token, body, req.headers["idempotency-key"]));
      if (req.method === "GET" && path === "/participation/me")
        return send(200, database.participationMe(token));
      if (req.method === "POST" && path === "/participation/commands")
        return send(
          200,
          database.participationCommand(token, body, req.headers["idempotency-key"]),
        );
      if (req.method === "GET" && path === "/admin/participation")
        return send(200, database.participationAdmin(token));
      if (req.method === "POST" && path === "/admin/participation/commands")
        return send(
          200,
          database.participationAdminCommand(token, body, req.headers["idempotency-key"]),
        );
      if (req.method === "GET" && path === "/collection/catalogue")
        return send(200, database.collectionCatalogue());
      if (req.method === "GET" && path === "/collection/me")
        return send(200, database.collectionMe(token));
      if (req.method === "GET" && path === "/collection/recap")
        return send(
          200,
          collectionRecap(
            database,
            token,
            Object.fromEntries(new URL(req.url, "http://localhost").searchParams),
          ),
        );
      if (req.method === "GET" && path === "/collection/history")
        return send(
          200,
          collectionHistory(
            database,
            token,
            Object.fromEntries(new URL(req.url, "http://localhost").searchParams),
          ),
        );
      if (req.method === "GET" && path.startsWith("/collection/profiles/"))
        return send(200, database.publicCollection(path.slice(21)));
      if (req.method === "GET" && path === "/collection/rankings")
        return send(
          200,
          collectionRankings(
            database,
            Object.fromEntries(new URL(req.url, "http://localhost").searchParams),
          ),
        );
      if (req.method === "GET" && path === "/collection/rankings/seasons")
        return send(
          200,
          seasonRankings(
            database,
            Object.fromEntries(new URL(req.url, "http://localhost").searchParams),
          ),
        );
      if (req.method === "GET" && path === "/collection/rankings/albums")
        return send(
          200,
          albumRankings(
            database,
            Object.fromEntries(new URL(req.url, "http://localhost").searchParams),
          ),
        );
      if (req.method === "GET" && path === "/admin/collection/rules") {
        database.official(token);
        return send(200, database.document("collection-rules"));
      }
      if (req.method === "GET" && path === "/admin/collection/health") {
        // Keep publication approval separate from sample integrity.
        database.official(token);
        return send(200, {
          ...inspectCatalogue(
            database.collectionCatalogue(),
            COLLECTION_THEMES,
            CREATOR_CONTENT_TEMPLATES,
          ),
          profileChecks: collectionProfileHealth(database, token),
          playPacks: playPackHealth(),
        });
      }
      if (req.method === "POST" && path === "/collection/profile-preview")
        return send(200, previewCollectionProfile(database, token, body));
      if (req.method === "POST" && path === "/collection/profile")
        return send(200, database.collectionProfile(token, body, req.headers["idempotency-key"]));
      if (req.method === "POST" && path === "/collection/preview")
        return send(200, database.collectionPreview(token, body));
      if (req.method === "POST" && path === "/admin/collection/rules")
        return send(200, database.collectionRules(token, body, req.headers["idempotency-key"]));
      if (req.method === "POST" && path === "/admin/collection/participation")
        return send(
          200,
          database.collectionParticipation(token, body, req.headers["idempotency-key"]),
        );
      if (req.method === "POST" && ["/supply/preview", "/admin/supply/preview"].includes(path))
        return send(200, supplyPreview(database, token, body, path.startsWith("/admin/")));
      if (req.method === "GET" && path === "/supply/me")
        return send(200, database.supplyList(token));
      if (req.method === "GET" && path === "/admin/play/packs") {
        database.official(token);
        return send(200, {
          schema: 1,
          synthetic: true,
          publicationApproval: false,
          packs: PLAY_CONTENT_PACKS.map((pack) => ({ ...pack, issues: playPackIssues(pack) })),
        });
      }
      if (req.method === "GET" && path === "/admin/play/preview") {
        database.official(token);
        const keys = [...url.searchParams.keys()];
        if (keys.some((k) => !["id", "version"].includes(k)))
          throw new ApiError(422, "play", "Unknown preview fields");
        const pack = PLAY_CONTENT_PACKS.find((p) => p.id === url.searchParams.get("id"));
        if (!pack) throw new ApiError(404, "play", "Sample pack unavailable");
        if (String(pack.version) !== url.searchParams.get("version"))
          throw new ApiError(409, "play", "Specified pack version changed");
        return send(200, {
          schema: 1,
          id: pack.id,
          version: pack.version,
          readOnly: true,
          publicationApproval: false,
          issues: playPackIssues(pack),
          questionCount: pack.questions.length,
        });
      }
      if (req.method === "GET" && path === "/admin/supply") {
        const r = database.supplyList(token, true);
        return send(200, { ...r, discoveryVersion: database.document("discovery").version });
      }
      if (req.method === "POST" && path === "/supply/commands")
        return send(200, database.supplyCommand(token, body, req.headers["idempotency-key"]));
      if (req.method === "POST" && path === "/admin/supply/commands")
        return send(200, database.supplyCommand(token, body, req.headers["idempotency-key"], true));
      if (req.method === "GET" && path === "/discovery/search") {
        const params = new URL(req.url, "http://localhost").searchParams;
        return send(
          200,
          discoverySearch(
            database,
            params.get("q") ?? "",
            params.get("type") ?? "all",
            params.get("locale") ?? "zh-TW",
            {
              category: params.get("category"),
              creator: params.get("creator"),
              pool: params.get("pool"),
            },
          ),
        );
      }
      if (req.method === "GET" && path === "/discovery")
        return send(200, database.publicDiscovery());
      if (req.method === "GET" && path === "/discovery/reading/me")
        return send(200, readingMe(database, token));
      if (req.method === "POST" && path === "/discovery/reading/commands")
        return send(200, readingCommand(database, token, body, req.headers["idempotency-key"]));
      if (req.method === "GET" && path === "/discovery/me")
        return send(200, database.discoveryMe(token));
      if (req.method === "GET" && path === "/admin/discovery") {
        database.official(token);
        return send(200, database.document("discovery"));
      }
      if (req.method === "POST" && path === "/admin/discovery/commands")
        return send(200, database.discoveryCommand(token, body, req.headers["idempotency-key"]));
      if (req.method === "POST" && path === "/discovery/follow")
        return send(200, database.followCreator(token, body, req.headers["idempotency-key"]));
      if (req.method === "POST" && path === "/discovery/events")
        return send(200, database.discoveryVisit(token, body, req.headers["idempotency-key"]));
      if (req.method === "GET" && path === "/fixtures")
        return send(
          200,
          FIXTURES.map(({ id }) => ({ id })),
        );
      if (req.method === "POST" && path === "/session") {
        if (Object.keys(body ?? {}).join(",") !== "fixtureId")
          throw new ApiError(422, "fixture", "Only fixtureId is accepted");
        const t = database.session(body.fixtureId);
        res.setHeader(
          "Set-Cookie",
          "keepy_local_session=" +
            t +
            "; HttpOnly; SameSite=Strict; Path=/api/local-test; Max-Age=7200",
        );
        return send(200, { environment: "Local Test", user: database.actor(t) });
      }
      if (req.method === "POST" && path === "/logout") {
        database.logout(token);
        res.setHeader(
          "Set-Cookie",
          "keepy_local_session=; HttpOnly; SameSite=Strict; Path=/api/local-test; Max-Age=0",
        );
        return send(200, { loggedOut: true });
      }
      if (req.method === "GET" && path === "/pools") {
        database.actor(token);
        return send(
          200,
          database.pools().map(({ cooperation, ...pool }) => {
            void cooperation;
            return pool;
          }),
        );
      }
      if (req.method === "POST" && path === "/syntheses")
        return send(200, database.synthesis(token, body, req.headers["idempotency-key"]));
      if (req.method === "GET" && /^\/syntheses\/[a-z0-9-]+$/.test(path))
        return send(200, database.synthesisById(token, path.slice(11)));
      if (req.method === "POST" && path === "/physical-previews")
        return send(200, database.physicalPreview(token, body, req.headers["idempotency-key"]));
      if (req.method === "GET" && path === "/revenue") return send(200, database.revenue(token));
      if (req.method === "GET" && path === "/admin/summary")
        return send(200, database.adminSummary(token));
      if (req.method === "GET" && path === "/me") return send(200, database.summary(token));
      if (req.method === "POST" && path === "/draws")
        return send(200, database.draw(token, body, req.headers["idempotency-key"]));
      if (req.method === "GET" && /^\/draws\/[a-z0-9-]+$/.test(path))
        return send(200, database.drawById(token, path.slice(7)));
      if (req.method === "GET" && /^\/admin\/pools\/[a-z0-9-]+\/settings-history$/.test(path)) {
        database.official(token);
        return send(
          200,
          database.db
            .prepare(
              "SELECT version,payload FROM pool_versions WHERE pool_id=? ORDER BY version DESC",
            )
            .all(path.split("/")[3])
            .map((r) => {
              const p = JSON.parse(r.payload);
              return {
                version: r.version,
                at: p.publishedAt ?? "",
                settings: p.editorSettings ?? null,
                selection: p.selection,
              };
            }),
        );
      }
      if (req.method === "GET" && path === "/content") {
        database.actor(token);
        return send(200, database.document("content"));
      }
      if (req.method === "POST" && path === "/cooperation/commands")
        return send(200, database.creatorCommand(token, body, req.headers["idempotency-key"]));
      if (req.method === "PUT" && path === "/admin/content")
        return send(200, database.saveContent(token, body, req.headers["idempotency-key"]));
      if (req.method === "POST" && /^\/admin\/pools\/[a-z0-9-]+\/settings$/.test(path))
        return send(
          200,
          database.publishSettings(token, path.split("/")[3], body, req.headers["idempotency-key"]),
        );
      if (req.method === "GET" && path === "/cooperation")
        return send(200, database.cooperation(token));
      if (req.method === "PUT" && path === "/admin/cooperation")
        return send(200, database.saveCooperation(token, body));
      if (req.method === "GET" && path === "/admin/audit") return send(200, database.audit(token));
      if (req.method === "POST" && /^\/admin\/roles\/[a-z-]+\/revoke$/.test(path))
        return send(200, database.revoke(token, path.split("/")[3]));
      if (req.method === "POST" && /^\/admin\/pools\/[a-z0-9-]+\/versions$/.test(path))
        return send(200, database.appendPoolVersion(token, path.split("/")[3], body));
      throw new ApiError(404, "route", "Local Test route not found");
    } catch (e) {
      if (!(e instanceof ApiError))
        console.error("Local Test request failed", requestId, e.message);
      send(e instanceof ApiError ? e.status : 500, {
        code: e instanceof ApiError ? e.code : "internal",
        message:
          e instanceof ApiError
            ? e.message
            : "Local Test operation failed; no partial draw committed",
        requestId,
      });
    }
  });
  return app;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const catalog = await loadCatalog();
  const database = new LocalDatabase(
    process.env.KEEPY_LOCAL_DB ?? resolve(".local-test/keepy.sqlite"),
    catalog,
  );
  const app = createLocalServer(database);
  app.listen(8787, "127.0.0.1", () =>
    console.log(
      "KEEPY Local Test API http://127.0.0.1:8787 — synthetic fixtures only; SQLite; not production Auth",
    ),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () =>
      app.close(() => {
        database.close();
        process.exit(0);
      }),
    );
}
