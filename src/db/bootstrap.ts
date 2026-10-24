import { sql } from "drizzle-orm";
import { db, databaseDriver } from "@/db";
import { schemaStatements } from "@/db/ddl";

/**
 * Applies the idempotent schema, exactly once per process.
 *
 * A Postgres advisory lock keeps concurrent workers from racing during a cold
 * start. PGlite supports the same lock, so a single code path is used for both.
 */
const bootstrapLockKey = 728_340_551;

let schemaTask: Promise<void> | undefined;
let schemaReady = false;

export function schemaIsReady() {
  return schemaReady;
}

export function ensureSchema(): Promise<void> {
  if (!schemaTask) {
    schemaTask = applySchema()
      .then(() => {
        schemaReady = true;
      })
      .catch((error: unknown) => {
        schemaTask = undefined;
        throw error;
      });
  }
  return schemaTask;
}

async function applySchema() {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${bootstrapLockKey})`);
    for (const statement of schemaStatements) {
      await tx.execute(sql.raw(statement));
    }
  });

  if (databaseDriver() === "pglite" && process.env.NODE_ENV !== "test") {
    // One line so it is obvious which database a local run is using.
    console.info("[jotna] using embedded PGlite database (.data/pglite)");
  }
}
