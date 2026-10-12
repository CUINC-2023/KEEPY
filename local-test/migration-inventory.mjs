import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { existsSync, writeFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const digest = (value) => createHash("sha256").update(value).digest("hex");
const quote = (id) => '"' + id.replaceAll('"', '""') + '"';
const reviewDocuments = new Set([
  "content",
  "discovery",
  "operations",
  "collection-rules",
  "participation",
]);

/** Read-only planning evidence. Never exports payloads or authorizes production imports. */
export function migrationInventory(path) {
  if (!existsSync(path)) throw new Error("Existing Local Test database required");
  const db = new DatabaseSync(path, { readOnly: true });
  try {
    db.exec("BEGIN");
    const integrity = db
      .prepare("PRAGMA integrity_check")
      .all()
      .map((r) => r.integrity_check);
    const foreignKeyErrors = db.prepare("PRAGMA foreign_key_check").all().length;
    if (integrity.join() !== "ok" || foreignKeyErrors)
      throw new Error("Source integrity check failed");
    const names = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all();
    const tables = names.map(({ name }) => {
      const rows = db
        .prepare("SELECT * FROM " + quote(name))
        .all()
        .map((r) => JSON.stringify(r))
        .sort();
      return {
        name,
        count: rows.length,
        sha256: digest(rows.join("\n")),
        disposition:
          name === "sessions"
            ? "never-migrate-credentials"
            : name === "documents" || name === "document_versions"
              ? "review-content-and-history"
              : "retain-local-synthetic-only",
        automaticProductionImport: false,
      };
    });
    const documents = names.some((t) => t.name === "documents")
      ? db
          .prepare("SELECT id,version,payload FROM documents ORDER BY id")
          .all()
          .map((r) => ({
            sourceId: r.id,
            sourceVersion: r.version,
            sha256: digest(r.payload),
            disposition:
              reviewDocuments.has(r.id) || r.id.startsWith("supply:")
                ? "manual-source-rights-owner-version-review"
                : "unknown-blocked",
            automaticProductionImport: false,
          }))
      : [];
    db.exec("ROLLBACK");
    return {
      schema: 1,
      environment: "Local Test",
      productionAuth: false,
      automaticProductionImport: false,
      integrity: "ok",
      foreignKeyErrors,
      tables,
      documents,
    };
  } finally {
    db.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 4 || args[0] !== "--db" || args[2] !== "--out")
    throw new Error(
      "Usage: node local-test/migration-inventory.mjs --db EXISTING_SQLITE --out NEW_JSON",
    );
  const source = realpathSync(args[1]),
    target = resolve(args[3]);
  if (
    existsSync(target) ||
    /\.(?:sqlite|db)(?:-(?:wal|shm))?$/i.test(target) ||
    !target.endsWith(".json") ||
    source.toLowerCase() === target.toLowerCase()
  )
    throw new Error("Output must be a new JSON file; cannot overwrite data or prior evidence");
  writeFileSync(target, JSON.stringify(migrationInventory(source), null, 2) + "\n", { flag: "wx" });
  console.log(
    "Read-only inventory saved. No payloads, credentials, imports or production approval.",
  );
}
