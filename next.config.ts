import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native/server-only packages must stay outside the bundler. PGlite ships a
  // WASM Postgres binary and `pg` opens raw sockets, so both run in Node.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  poweredByHeader: false,
  // A self-contained server bundle — this is what the Cloud Run image runs.
  output: "standalone",
  // Never ship local databases, docs or the source archive inside the
  // standalone bundle (it is copied verbatim into the container).
  outputFileTracingExcludes: {
    "*": [
      "./.data/**",
      "./.git/**",
      "./multi-role-delivery-app-development.zip",
      "./README.md",
      "./DEPLOY.md",
    ],
  },
  // The site uses fixed, pre-optimised photography, so the image optimiser is
  // not needed and the container stays lean (no sharp dependency).
  images: { unoptimized: true },
  // Preview sandboxes serve the dev server through a proxied *.e2b.app host.
  allowedDevOrigins: ["*.e2b.app", "*.arena.ai", "localhost", "127.0.0.1"],
};

export default nextConfig;
