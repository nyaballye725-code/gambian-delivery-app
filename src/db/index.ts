import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePostgres, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Database connection.
 *
 * - When DATABASE_URL is set we talk to Postgres through a pooled `pg` client.
 * - When it is not set (local development and preview sandboxes) we fall back
 *   to an embedded PGlite database persisted in `.data/pglite`, so the app is
 *   fully usable with zero infrastructure.
 *
 * The instance is created lazily on first query. That keeps `next build` and
 * static analysis from opening a database connection, and lets the app boot
 * before the database is ready.
 */
type Database = NodePgDatabase<typeof schema>;

export type DatabaseDriver = "postgres" | "pglite";

const globalForDb = globalThis as typeof globalThis & {
  __jotnaDb?: Database;
  __jotnaPool?: Pool;
  __jotnaPglite?: PGlite;
};

export function databaseDriver(): DatabaseDriver {
  return process.env.DATABASE_URL ? "postgres" : "pglite";
}

function pgliteDataDir() {
  const configured = process.env.PGLITE_DATA_DIR ?? ".data/pglite";
  const directory = resolve(process.cwd(), configured);
  mkdirSync(dirname(directory), { recursive: true });
  return directory;
}

function createDatabase(): Database {
  if (databaseDriver() === "postgres") {
    const pool = globalForDb.__jotnaPool ?? new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
    });
    if (process.env.NODE_ENV !== "production") globalForDb.__jotnaPool = pool;
    return drizzlePostgres(pool, { schema }) as Database;
  }

  const client = globalForDb.__jotnaPglite ?? new PGlite(pgliteDataDir());
  if (process.env.NODE_ENV !== "production") globalForDb.__jotnaPglite = client;
  // PGlite speaks the Postgres wire protocol; the query API is identical.
  return drizzlePglite(client, { schema }) as unknown as Database;
}

function instance(): Database {
  if (!globalForDb.__jotnaDb) globalForDb.__jotnaDb = createDatabase();
  return globalForDb.__jotnaDb;
}

/**
 * Lazy proxy so `db.select(...)` behaves exactly like a Drizzle database while
 * the connection itself is only opened the first time it is used.
 */
export const db: Database = new Proxy({} as Database, {
  get(_target, property, receiver) {
    const value = Reflect.get(instance(), property, receiver) as unknown;
    return typeof value === "function" ? value.bind(instance()) : value;
  },
  has(_target, property) {
    return property in instance();
  },
});

export { schema };
