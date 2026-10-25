import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSessionToken, sessionCookieName, sessionCookieOptions } from "@/lib/auth";
import { ensureSeeded } from "@/lib/demo-data";
import { demoMode, demoRoleAccounts, isDemoRole } from "@/lib/demo-mode";
import { clientAddress, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Password-less entry into a seeded demo account.
 *
 * Only available while demo mode is on. This is a showcase shortcut, not an
 * authentication mechanism — disable it with DEMO_MODE=false in production.
 */
export async function POST(request: Request) {
  if (!demoMode) {
    return NextResponse.json({ error: "Demo mode is turned off for this deployment." }, { status: 403 });
  }

  const limit = rateLimit(`demo:${clientAddress(request)}`, 30, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many demo sign-ins. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  await ensureSeeded();

  const body = await request.json().catch(() => null) as { role?: string } | null;
  if (!isDemoRole(body?.role)) {
    return NextResponse.json({ error: "Choose a demo role to continue." }, { status: 400 });
  }

  const account = demoRoleAccounts.find((entry) => entry.role === body?.role);
  if (!account) {
    return NextResponse.json({ error: "That demo account is not available." }, { status: 404 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, account.email)).limit(1);
  if (!user || !user.isActive || user.role !== account.role) {
    return NextResponse.json({ error: "That demo account is not available right now." }, { status: 404 });
  }

  const { passwordHash: _passwordHash, ...publicUser } = user;
  const response = NextResponse.json({ user: publicUser });
  response.cookies.set(sessionCookieName, createSessionToken(user.id), sessionCookieOptions());
  return response;
}
