import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";

export const sessionCookieName = "jotna_session";
const sessionLifetime = 60 * 60 * 24 * 30;

export type SessionUser = Omit<typeof users.$inferSelect, "passwordHash">;

const developmentSecret = "jotna-development-session-secret";
let cachedSecret: string | undefined;

/**
 * Signing key for session cookies.
 *
 * Set SESSION_SECRET in production. If it is missing we persist a generated
 * key in .data/session-secret so a single-instance deployment still works and
 * keeps sessions across restarts (a warning is logged).
 */
function sessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (cachedSecret) return cachedSecret;
  cachedSecret = process.env.NODE_ENV === "production" ? loadOrCreateSecret() : developmentSecret;
  return cachedSecret;
}

function loadOrCreateSecret() {
  const file = resolve(process.cwd(), process.env.SESSION_SECRET_FILE ?? ".data/session-secret");
  try {
    if (existsSync(file)) return readFileSync(file, "utf8").trim();
    const secret = randomBytes(32).toString("hex");
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, secret, { mode: 0o600 });
    console.warn(`[jotna] SESSION_SECRET is not set — generated ${file} for this instance. Set it explicitly when running more than one server.`);
    return secret;
  } catch {
    console.warn("[jotna] SESSION_SECRET is not set and could not be persisted; sessions will reset when the server restarts.");
    return randomBytes(32).toString("hex");
  }
}

export function createSessionToken(userId: string) {
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt: Date.now() + sessionLifetime * 1000 })).toString("base64url");
  const signature = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readSessionToken(token: string) {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  const expected = createHmac("sha256", sessionSecret()).update(payload).digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { userId?: string; expiresAt?: number };
    if (!decoded.userId || !decoded.expiresAt || decoded.expiresAt < Date.now()) return null;
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (!token) return null;
  const userId = readSessionToken(token);
  if (!userId) return null;
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !user.isActive) return null;
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: sessionLifetime,
  };
}
