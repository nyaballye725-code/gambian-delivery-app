/**
 * Demo mode.
 *
 * When enabled (the default), the sign-in screen offers one-click entry into
 * the seeded demo accounts and the workspace shows a "demo data" marker.
 * Set `DEMO_MODE=false` to remove the shortcut entirely — the accounts still
 * exist and can sign in with their password, but there is no password-less
 * entry point.
 *
 * The flag is read on the server only and handed to the client through
 * `/api/auth/me`, so a single environment variable controls both the UI and
 * the `/api/auth/demo` endpoint.
 */
export type DemoRole = "admin" | "customer" | "driver";

export const demoMode = process.env.DEMO_MODE !== "false" && process.env.DEMO_MODE !== "0";

export const demoRoleAccounts: { role: DemoRole; email: string; name: string; color: string; description: string }[] = [
  { role: "admin", email: "admin@jotna.gm", name: "Operations team", color: "green", description: "Shops, orders, riders and reports" },
  { role: "customer", email: "aisha@jotna.gm", name: "Aisha Jallow", color: "coral", description: "Browse, order and track deliveries" },
  { role: "driver", email: "lamin@jotna.gm", name: "Lamin Touray", color: "blue", description: "Accept and complete local deliveries" },
];

export function isDemoRole(value: unknown): value is DemoRole {
  return value === "admin" || value === "customer" || value === "driver";
}
