import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded, hashPassword } from "@/lib/demo-data";

export const dynamic = "force-dynamic";
const roles = ["admin", "customer", "driver"] as const;

export async function GET(request: Request) {
  await ensureSeeded();
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  if (current.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const role = new URL(request.url).searchParams.get("role");
  const rows = role && roles.includes(role as (typeof roles)[number])
    ? await db.select().from(users).where(eq(users.role, role as (typeof roles)[number]))
    : await db.select().from(users);
  return NextResponse.json({ users: rows.map(({ passwordHash: _passwordHash, ...user }) => user) });
}

export async function POST(request: Request) {
  await ensureSeeded();
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  if (current.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const body = await request.json().catch(() => null) as {
    name?: string; email?: string; phone?: string; city?: string; role?: string; password?: string;
  } | null;
  const name = body?.name?.trim();
  const email = body?.email?.trim().toLowerCase();
  const role = body?.role;
  if (!name || name.length > 100 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Add a name and a valid email address." }, { status: 400 });
  }
  if (role !== "customer" && role !== "driver") return NextResponse.json({ error: "Choose a customer or driver account." }, { status: 400 });
  if (body?.password && body.password.length < 8) return NextResponse.json({ error: "Passwords must be at least 8 characters." }, { status: 400 });
  try {
    const [created] = await db.insert(users).values({
      name,
      email,
      role,
      phone: body?.phone?.trim().slice(0, 40) ?? "",
      city: body?.city?.trim().slice(0, 80) || "Banjul",
      passwordHash: hashPassword(body?.password || "jotna2026"),
      isAvailable: role === "driver",
    }).returning();
    const { passwordHash: _passwordHash, ...safeUser } = created;
    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "That email address is already in use." }, { status: 409 });
  }
}
