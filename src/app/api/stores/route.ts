import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const rows = user.role === "admin"
    ? await db.select().from(stores)
    : await db.select().from(stores).where(eq(stores.isOpen, true));
  return NextResponse.json({ stores: rows });
}

export async function POST(request: Request) {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const body = await request.json().catch(() => null) as {
    name?: string; category?: string; location?: string; emoji?: string; deliveryFee?: number; prepTime?: string;
  } | null;
  const name = body?.name?.trim();
  const category = body?.category?.trim();
  const location = body?.location?.trim();
  const deliveryFee = Number(body?.deliveryFee);
  if (!name || !category || !location || name.length > 100 || !Number.isInteger(deliveryFee) || deliveryFee < 0 || deliveryFee > 500) {
    return NextResponse.json({ error: "Add a name, category, location, and delivery fee between D 0 and D 500." }, { status: 400 });
  }
  const [store] = await db.insert(stores).values({
    name,
    category,
    location,
    emoji: body?.emoji?.trim().slice(0, 12) || "🍽️",
    deliveryFee,
    prepTime: body?.prepTime?.trim().slice(0, 40) || "20–30 min",
  }).returning();
  return NextResponse.json({ store }, { status: 201 });
}
