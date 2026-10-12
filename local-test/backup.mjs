import { DatabaseSync, backup } from "node:sqlite";
import { mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
const source = process.env.KEEPY_LOCAL_DB ?? resolve(".local-test/keepy.sqlite");
if (!existsSync(source))
  throw Error("Local Test database not found; start npm run local:test first");
const directory = resolve(".local-test/backups");
mkdirSync(directory, { recursive: true });
const target = resolve(directory, "keepy-test-" + randomUUID() + ".sqlite");
const db = new DatabaseSync(source, { readOnly: true });
try {
  await backup(db, target);
  console.log(
    "Local Test backup saved: " + target + "; restore only into a separate database path",
  );
} finally {
  db.close();
}
