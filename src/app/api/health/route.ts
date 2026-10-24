import { sql } from "drizzle-orm";
import { db, databaseDriver } from "@/db";
import { ensureSchema } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

/** Readiness probe: database reachable and schema applied. */
export async function GET() {
  try {
    await ensureSchema();
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, database: databaseDriver() });
  } catch (error) {
    console.error("[jotna] health check failed", error);
    return Response.json({ ok: false, database: databaseDriver() }, { status: 500 });
  }
}
