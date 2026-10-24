import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded, hashPassword } from "@/lib/demo-data";

export const dynamic = "force-dynamic";
const allowedRoles = ["admin", "customer", "driver"] as const;

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  if (current.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as {
    name?: string; email?: string; phone?: string; city?: string; role?: string; password?: string; isAvailable?: boolean; isActive?: boolean;
  } | null;
  if (!body) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const changes: Partial<typeof users.$inferInsert> = {};
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name || name.length > 100) return NextResponse.json({ error: "Enter a valid name." }, { status: 400 });
    changes.name = name;
  }
  if (body.email !== undefined) {
    const email = body.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    changes.email = email;
  }
  if (body.phone !== undefined) changes.phone = body.phone.trim().slice(0, 40);
  if (body.city !== undefined) changes.city = body.city.trim().slice(0, 80) || "Banjul";
  if (body.role !== undefined) {
    if (!allowedRoles.includes(body.role as (typeof allowedRoles)[number])) return NextResponse.json({ error: "That account role is not supported." }, { status: 400 });
    changes.role = body.role as (typeof allowedRoles)[number];
  }
  if (body.isAvailable !== undefined) changes.isAvailable = Boolean(body.isAvailable);
  if (body.isActive !== undefined) {
    if (id === current.id && !body.isActive) return NextResponse.json({ error: "You cannot deactivate your own admin account." }, { status: 400 });
    changes.isActive = Boolean(body.isActive);
  }
  if (body.password) {
    if (body.password.length < 8) return NextResponse.json({ error: "Passwords must be at least 8 characters." }, { status: 400 });
    changes.passwordHash = hashPassword(body.password);
  }
  if (Object.keys(changes).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  try {
    const [updated] = await db.update(users).set(changes).where(eq(users.id, id)).returning();
    if (!updated) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    const { passwordHash: _passwordHash, ...safeUser } = updated;
    return NextResponse.json({ user: safeUser });
  } catch {
    return NextResponse.json({ error: "That email address is already in use." }, { status: 409 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  if (current.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const { id } = await context.params;
  if (id === current.id) return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 400 });
  const [updated] = await db.update(users).set({ isActive: false, isAvailable: false }).where(eq(users.id, id)).returning({ id: users.id });
  if (!updated) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  return NextResponse.json({ ok: true, id });
}
