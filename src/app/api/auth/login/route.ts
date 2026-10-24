import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSessionToken, sessionCookieName, sessionCookieOptions } from "@/lib/auth";
import { ensureSeeded, verifyPassword } from "@/lib/demo-data";
import { clientAddress, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await ensureSeeded();
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;
  if (!email || !password) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  const attempt = rateLimit(`login:${clientAddress(request)}:${email}`, 10, 10 * 60 * 1000);
  if (!attempt.ok) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(attempt.retryAfterSeconds) } },
    );
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "That email and password don't match." }, { status: 401 });
  }

  const { passwordHash: _passwordHash, ...publicUser } = user;
  const response = NextResponse.json({ user: publicUser });
  response.cookies.set(sessionCookieName, createSessionToken(user.id), sessionCookieOptions());
  return response;
}
