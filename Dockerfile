# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Jotna — production image for Google Cloud Run (or any container host).
#
#   docker build -t jotna:local .
#   docker run --rm -p 8080:8080 --env-file .env.production jotna:local
#
# Cloud Run injects PORT (default 8080). The app binds 0.0.0.0 so the
# container is reachable through Cloud Run's proxy.
# ---------------------------------------------------------------------------

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# --- dependencies ----------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# --- build -----------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# SITE_URL is only read at build time for metadata/sitemap defaults; it can be
# overridden at runtime by the same environment variable.
ARG SITE_URL=https://jotna.gm
ENV SITE_URL=$SITE_URL
RUN npm run build

# --- runtime ---------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Next copies part of the project tree into the standalone folder. Strip the
# source, local database and build scripts so the runtime image only holds what
# the server needs.
RUN rm -rf /app/.data /app/src /app/scripts /app/package-lock.json /app/tsconfig.tsbuildinfo

# When DATABASE_URL is unset the app falls back to an embedded PGlite database.
# That needs a writable directory; on Cloud Run it is ephemeral, so use Cloud
# SQL (see DEPLOY.md) for anything real.
RUN mkdir -p /app/.data && chown nextjs:nodejs /app/.data

USER nextjs
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
