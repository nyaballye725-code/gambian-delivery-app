import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native/server-only packages must stay outside the bundler. PGlite ships a
  // WASM Postgres binary and `pg` opens raw sockets, so both run in Node.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  poweredByHeader: false,
  // Preview sandboxes serve the dev server through a proxied *.e2b.app host.
  allowedDevOrigins: ["*.e2b.app", "*.arena.ai", "localhost", "127.0.0.1"],
};

export default nextConfig;
