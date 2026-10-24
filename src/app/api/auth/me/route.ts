import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  return NextResponse.json({ user: await getCurrentUser() });
}

export async function PATCH(request: Request) {
  await ensureSeeded();
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const body = await request.json().catch(() => null) as { name?: string; phone?: string; city?: string; isAvailable?: boolean } | null;
  if (!body) return NextResponse.json({ error: "Invalid profile update." }, { status: 400 });
  const changes: Partial<typeof users.$inferInsert> = {};
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name || name.length > 100) return NextResponse.json({ error: "Enter a valid name." }, { status: 400 });
    changes.name = name;
  }
  if (body.phone !== undefined) changes.phone = body.phone.trim().slice(0, 40);
  if (body.city !== undefined) changes.city = body.city.trim().slice(0, 80) || "Banjul";
  if (body.isAvailable !== undefined) {
    if (current.role !== "driver") return NextResponse.json({ error: "Only driver accounts can change delivery availability." }, { status: 403 });
    changes.isAvailable = Boolean(body.isAvailable);
  }
  if (Object.keys(changes).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  const [updated] = await db.update(users).set(changes).where(eq(users.id, current.id)).returning();
  const { passwordHash: _passwordHash, ...publicUser } = updated;
  return NextResponse.json({ user: publicUser });
}
