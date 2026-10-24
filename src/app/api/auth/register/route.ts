import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSessionToken, sessionCookieName, sessionCookieOptions } from "@/lib/auth";
import { ensureSeeded, hashPassword } from "@/lib/demo-data";
import { clientAddress, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Self-service signup. Creates a customer account and signs it in. */
export async function POST(request: Request) {
  await ensureSeeded();

  const address = clientAddress(request);
  const limit = rateLimit(`register:${address}`, 20, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many accounts created from this connection. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null) as {
    name?: string; email?: string; password?: string; phone?: string; city?: string;
  } | null;

  const name = body?.name?.trim();
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;
  const phone = body?.phone?.trim().slice(0, 40) ?? "";
  const city = body?.city?.trim().slice(0, 80) || "Banjul";

  if (!name || name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: "Enter your name (2–100 characters)." }, { status: 400 });
  }
  if (!email || email.length > 200 || !emailPattern.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!password || password.length < 8 || password.length > 200) {
    return NextResponse.json({ error: "Choose a password with at least 8 characters." }, { status: 400 });
  }

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return NextResponse.json({ error: "That email already has a Jotna account. Try signing in instead." }, { status: 409 });
  }

  const [created] = await db.insert(users).values({
    name,
    email,
    passwordHash: hashPassword(password),
    role: "customer",
    phone,
    city,
  }).returning();

  const { passwordHash: _passwordHash, ...publicUser } = created;
  const response = NextResponse.json({ user: publicUser }, { status: 201 });
  response.cookies.set(sessionCookieName, createSessionToken(created.id), sessionCookieOptions());
  return response;
}
