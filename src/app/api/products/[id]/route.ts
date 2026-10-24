import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, stores } from "@/db/schema";
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
    storeId?: string; name?: string; description?: string; category?: string; price?: number; stock?: number; emoji?: string; isAvailable?: boolean;
  } | null;
  if (!body) return NextResponse.json({ error: "Invalid product update." }, { status: 400 });
  const changes: Partial<typeof products.$inferInsert> = {};
  if (body.storeId !== undefined) {
    const [store] = await db.select({ id: stores.id }).from(stores).where(eq(stores.id, body.storeId)).limit(1);
    if (!store) return NextResponse.json({ error: "Choose a shop that exists." }, { status: 400 });
    changes.storeId = body.storeId;
  }
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name || name.length > 120) return NextResponse.json({ error: "Enter a valid product name." }, { status: 400 });
    changes.name = name;
  }
  if (body.description !== undefined) changes.description = body.description.trim().slice(0, 300);
  if (body.category !== undefined) changes.category = body.category.trim().slice(0, 80) || "Popular";
  if (body.emoji !== undefined) changes.emoji = body.emoji.trim().slice(0, 12) || "🍲";
  if (body.price !== undefined) {
    if (!Number.isInteger(body.price) || body.price < 1 || body.price > 100000) return NextResponse.json({ error: "Enter a price above D 0." }, { status: 400 });
    changes.price = body.price;
  }
  if (body.stock !== undefined) {
    if (!Number.isInteger(body.stock) || body.stock < 0 || body.stock > 10000) return NextResponse.json({ error: "Enter a valid stock quantity." }, { status: 400 });
    changes.stock = body.stock;
  }
  if (body.isAvailable !== undefined) changes.isAvailable = Boolean(body.isAvailable);
  if (Object.keys(changes).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  const [product] = await db.update(products).set(changes).where(eq(products.id, id)).returning();
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ product });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const { id } = await context.params;
  const [deleted] = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });
  if (!deleted) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ ok: true, id });
}
