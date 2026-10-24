import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as {
    name?: string; category?: string; location?: string; emoji?: string; deliveryFee?: number; prepTime?: string; isOpen?: boolean;
  } | null;
  if (!body) return NextResponse.json({ error: "Invalid store update." }, { status: 400 });
  const changes: Partial<typeof stores.$inferInsert> = {};
  for (const key of ["name", "category", "location"] as const) {
    if (body[key] !== undefined) {
      const value = body[key]?.trim();
      if (!value || value.length > 120) return NextResponse.json({ error: `Enter a valid ${key}.` }, { status: 400 });
      changes[key] = value;
    }
  }
  if (body.emoji !== undefined) changes.emoji = body.emoji.trim().slice(0, 12) || "🍽️";
  if (body.prepTime !== undefined) changes.prepTime = body.prepTime.trim().slice(0, 40) || "20–30 min";
  if (body.deliveryFee !== undefined) {
    if (!Number.isInteger(body.deliveryFee) || body.deliveryFee < 0 || body.deliveryFee > 500) return NextResponse.json({ error: "Delivery fee must be between D 0 and D 500." }, { status: 400 });
    changes.deliveryFee = body.deliveryFee;
  }
  if (body.isOpen !== undefined) changes.isOpen = Boolean(body.isOpen);
  if (Object.keys(changes).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  const [store] = await db.update(stores).set(changes).where(eq(stores.id, id)).returning();
  if (!store) return NextResponse.json({ error: "Store not found." }, { status: 404 });
  return NextResponse.json({ store });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const { id } = await context.params;
  const [deleted] = await db.delete(stores).where(eq(stores.id, id)).returning({ id: stores.id });
  if (!deleted) return NextResponse.json({ error: "Store not found." }, { status: 404 });
  return NextResponse.json({ ok: true, id });
}
