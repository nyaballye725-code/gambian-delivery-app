import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, stores } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const storeId = new URL(request.url).searchParams.get("storeId");
  const filters = storeId ? [eq(products.storeId, storeId)] : [];
  if (user.role !== "admin") filters.push(eq(products.isAvailable, true));
  const rows = await db.select().from(products).where(filters.length > 1 ? and(...filters) : filters[0]);
  return NextResponse.json({ products: rows });
}

export async function POST(request: Request) {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const body = await request.json().catch(() => null) as {
    storeId?: string; name?: string; description?: string; category?: string; price?: number; stock?: number; emoji?: string;
  } | null;
  const name = body?.name?.trim();
  const price = Number(body?.price);
  const stock = body?.stock === undefined ? 40 : Number(body.stock);
  if (!body?.storeId || !name || name.length > 120 || !Number.isInteger(price) || price < 1 || price > 100000 || !Number.isInteger(stock) || stock < 0 || stock > 10000) {
    return NextResponse.json({ error: "Add a product name, shop, valid price, and stock quantity." }, { status: 400 });
  }
  const [store] = await db.select({ id: stores.id }).from(stores).where(eq(stores.id, body.storeId)).limit(1);
  if (!store) return NextResponse.json({ error: "Choose a shop that exists." }, { status: 400 });
  const [product] = await db.insert(products).values({
    storeId: body.storeId,
    name,
    description: body.description?.trim().slice(0, 300) ?? "",
    category: body.category?.trim().slice(0, 80) || "Popular",
    price,
    stock,
    emoji: body.emoji?.trim().slice(0, 12) || "🍲",
  }).returning();
  return NextResponse.json({ product }, { status: 201 });
}
