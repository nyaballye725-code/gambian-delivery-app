# Deploying Jotna on Google Cloud

This guide takes the repository to a live, public HTTPS URL on **Google Cloud Run** — the
natural home for Jotna because the site and the ordering app are one Next.js server (pages +
API routes), and Cloud Run runs the container, gives you a managed URL with TLS, and scales to
zero when nobody is ordering.

There is one Dockerfile, one deploy script, and one Cloud Build pipeline in this repo. You can
deploy with a single command, or wire it into CI.

```
Browser ──HTTPS──▶ Cloud Run (Next.js: marketing site + app + API)
                        │
                        ├── Secret Manager  (SESSION_SECRET, DATABASE_URL)
                        └── Cloud SQL for PostgreSQL  (orders, shops, riders)
```

| Piece | File |
| --- | --- |
| Container image | `Dockerfile`, `.dockerignore` |
| One-command deploy | `scripts/deploy-gcloud.sh` |
| CI pipeline | `cloudbuild.yaml`, `.gcloudignore` |
| Health probe | `GET /api/health` |

---

## 1. Prerequisites

- A Google Cloud project with **billing enabled**.
- The [gcloud CLI](https://cloud.google.com/sdk/docs/install) (Cloud Shell already has it).
- Permission to enable APIs and create services: `roles/owner` or, at minimum,
  `roles/run.admin`, `roles/cloudbuild.builds.editor`, `roles/artifactregistry.admin`,
  `roles/secretmanager.admin`, `roles/iam.serviceAccountUser`, and `roles/cloudsql.admin`
  if you use Cloud SQL.

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

> **Region.** The examples use `europe-west1` (Belgium) because it has the lowest latency to
> The Gambia of the common Cloud Run regions. `africa-south1` (Johannesburg) works too — pass
> `REGION=africa-south1`. Either way, put Cloud SQL in the same region as Cloud Run.

---

## 2. Deploy in one command

```bash
PROJECT=your-project-id \
SITE_URL=https://jotna.gm \
DEMO_MODE=false \
./scripts/deploy-gcloud.sh
```

The script is idempotent — run it again for every release. It will:

1. Enable Cloud Run, Cloud Build, Artifact Registry and Secret Manager.
2. Create a random `SESSION_SECRET` in Secret Manager (or reuse the existing one).
3. Grant the Cloud Run runtime service account access to the secret.
4. Build the Dockerfile with Cloud Build and deploy it to Cloud Run as the `jotna` service,
   publicly reachable on port 8080.
5. Print the service URL and warn you if demo mode is on or no database is configured.

### Environment variables the script understands

| Variable | Default | Meaning |
| --- | --- | --- |
| `PROJECT` | current `gcloud` project | Target Google Cloud project |
| `REGION` | `europe-west1` | Cloud Run + Artifact Registry region |
| `SERVICE` | `jotna` | Cloud Run service name |
| `SITE_URL` | `https://jotna.gm` | Canonical URL used by SEO tags, `sitemap.xml`, `robots.txt` |
| `DEMO_MODE` | `false` | `true` re-enables one-click demo sign-in (never for a public launch) |
| `SESSION_SECRET` | generated | Supply to pin the signing key instead of generating one |
| `DATABASE_URL` | _(unset)_ | Postgres connection string (see §3) |
| `CLOUD_SQL_INSTANCE` | _(unset)_ | `project:region:instance` → mounts the Cloud SQL socket |
| `MEMORY` / `CPU` | `1Gi` / `1` | Cloud Run resources |
| `MIN_INSTANCES` / `MAX_INSTANCES` | `0` / `10` | `MIN_INSTANCES=1` removes cold starts for ~the price of one always-on instance |

> **No `DATABASE_URL`?** The app falls back to an embedded PGlite database on the container’s
> local disk. Cloud Run’s disk is ephemeral, so orders vanish whenever a revision restarts.
> That is fine for a quick preview; use Cloud SQL (§3) for anything real.

### The equivalent manual commands

If you would rather not use the script:

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com

openssl rand -hex 32 | gcloud secrets create jotna-session-secret --data-file=-

gcloud run deploy jotna \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --set-env-vars NODE_ENV=production,DEMO_MODE=false,SITE_URL=https://jotna.gm \
  --set-secrets SESSION_SECRET=jotna-session-secret:latest
```

`gcloud run deploy --source .` builds the Dockerfile with Cloud Build. To deploy a pre-built
image instead, push it to Artifact Registry and use `--image`.

---

## 3. Production database: Cloud SQL for PostgreSQL

Cloud Run is stateless, so production data belongs in Cloud SQL.

```bash
# 1. Create a small Postgres instance (raise the tier as you grow)
gcloud sql instances create jotna-db \
  --database-version=POSTGRES_16 \
  --edition=enterprise \
  --tier=db-f1-micro \
  --region=europe-west1 \
  --storage-size=10GB

# 2. Create the database and a user
gcloud sql databases create jotna --instance=jotna-db
gcloud sql users create jotna --instance=jotna-db --password='choose-a-strong-password'

# 3. Note the connection name (project:region:instance)
gcloud sql instances describe jotna-db --format='value(connectionName)'
```

Deploy with the socket connection string and the instance attached:

```bash
CONNECTION="$(gcloud sql instances describe jotna-db --format='value(connectionName)')"

DATABASE_URL='postgresql://jotna:choose-a-strong-password@/jotna?host=/cloudsql/'"$CONNECTION" \
CLOUD_SQL_INSTANCE="$CONNECTION" \
./scripts/deploy-gcloud.sh
```

The script stores `DATABASE_URL` in Secret Manager, grants `roles/cloudsql.client` to the
runtime service account, and attaches the instance with `--add-cloudsql-instances`.

**Schema.** There is no migration step: on the first request the app applies its idempotent
schema (guarded by a Postgres advisory lock) and seeds the catalogue. Confirm it worked with

```bash
curl -s https://YOUR-SERVICE-URL/api/health
# {"ok":true,"database":"postgres"}
```

**External Postgres** (Neon, Supabase, Aiven, an existing server) works too — just pass its
`DATABASE_URL` (with `?sslmode=require` where needed) and skip `CLOUD_SQL_INSTANCE`.

---

## 4. Continuous deployment with Cloud Build

`cloudbuild.yaml` builds the image, pushes it to Artifact Registry and deploys the new
revision. Create the secret once, then trigger builds on demand or from GitHub:

```bash
# One-time: Artifact Registry repo + session secret
gcloud artifacts repositories create jotna \
  --repository-format=docker --location=europe-west1

gcloud secrets create jotna-session-secret \
  --data-file=<(openssl rand -hex 32)

# Manual build + deploy
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_REGION=europe-west1,_SERVICE=jotna,_SITE_URL=https://jotna.gm
```

To deploy on every push to `main`, connect the repository in **Cloud Build → Triggers**, choose
the `cloudbuild.yaml` configuration, and mirror the substitution variables above.

> The pipeline sets `SESSION_SECRET` from Secret Manager. Grant the Cloud Build service account
> `roles/run.admin`, `roles/iam.serviceAccountUser` and
> `roles/secretmanager.secretAccessor`. Runtime secrets are attached to the service, so the
> Cloud Run runtime service account needs `roles/secretmanager.secretAccessor` as well — the
> deploy script does this for you.

---

## 5. Custom domain (jotna.gm)

```bash
gcloud run domain-mappings create \
  --service jotna \
  --domain jotna.gm \
  --region europe-west1

gcloud run domain-mappings describe \
  --domain jotna.gm --region europe-west1 \
  --format='value(status.resourceRecords)'
```

Add the returned `A`/`AAAA` and `CNAME` records at your DNS provider (and verify the domain in
Google Search Console if prompted). TLS certificates are provisioned automatically once DNS
resolves. If your domain or region is not supported by domain mappings, put a global external
Application Load Balancer or Firebase Hosting in front of the Cloud Run service instead.

Then redeploy with the final URL so canonical tags, Open Graph and `sitemap.xml` are correct:

```bash
SITE_URL=https://jotna.gm ./scripts/deploy-gcloud.sh
```

---

## 6. Configuration reference

| Variable | Default | Notes |
| --- | --- | --- |
| `DATABASE_URL` | _(unset)_ | Postgres connection string; unset → embedded PGlite (not for production) |
| `DATABASE_POOL_SIZE` | `10` | Max pooled connections per instance |
| `SESSION_SECRET` | generated per instance | **Set it.** Without it sessions break across instances/restarts |
| `DEMO_MODE` | `true` | `false` removes the one-click demo sign-in and `POST /api/auth/demo` returns 403 |
| `SITE_URL` | `https://jotna.gm` | Canonical origin for SEO metadata, sitemap and robots |
| `PGLITE_DATA_DIR` | `.data/pglite` | Embedded database directory (local only) |
| `PORT` | `8080` | Injected by Cloud Run; the server binds `0.0.0.0` |

Set them with:

```bash
gcloud run services update jotna --region europe-west1 \
  --update-env-vars SITE_URL=https://jotna.gm,DEMO_MODE=false
```

---

## 7. Local container test

Validate exactly what Cloud Run runs before you ship:

```bash
docker build -t jotna:local .
docker run --rm -p 8080:8080 \
  -e SESSION_SECRET="$(openssl rand -hex 32)" \
  -e DEMO_MODE=true \
  jotna:local
# → http://localhost:8080
```

The build uses Next.js `output: "standalone"`, so the runtime image only contains the traced
server files, `.next/static` and `public/`.

---

## 8. Before you share the URL

- [ ] `DEMO_MODE=false` on the deployed service.
- [ ] `SESSION_SECRET` set (Secret Manager) — never the generated per-instance file.
- [ ] `DATABASE_URL` points at Cloud SQL with backups enabled; the health endpoint reports
      `"database":"postgres"`.
- [ ] The seeded demo accounts (`admin@jotna.gm`, `aisha@jotna.gm`, `lamin@jotna.gm`, password
      `jotna2026`) have been rotated or removed. **They are created by the seed used for demos
      and are a real security risk on a public deployment.**
- [ ] Contact details in `src/lib/site.ts` (phone, WhatsApp, email, address) are the real ones.
- [ ] Copy, photography testimonials and coverage areas have been reviewed by the business.
- [ ] `SITE_URL` matches the live domain, then submit `https://jotna.gm/sitemap.xml` in Google
      Search Console.
- [ ] Budget alerts configured on the project.

---

## 9. Operations

```bash
# Tail logs
gcloud run services logs read jotna --region europe-west1 --limit 100

# List revisions (roll back by sending traffic to an older one)
gcloud run revisions list --service jotna --region europe-west1
gcloud run services update-traffic jotna --region europe-west1 --to-revisions JOTNA-00003-abc=100

# Inspect the live URL and config
gcloud run services describe jotna --region europe-west1
```

**Scale & cost.** Defaults are `min-instances=0`, `max-instances=10`, 1 vCPU / 1 GiB. Requests
are concurrency-limited by Cloud Run; the app is stateless apart from Postgres, so instances
scale horizontally. Costs are request + instance-time based plus Cloud SQL while it runs — check
the current [Cloud Run pricing](https://cloud.google.com/run/pricing) for your region.

**Cold starts.** A cold instance needs a few seconds; `MIN_INSTANCES=1` removes that for a fixed
monthly cost. Keep the image lean (the standalone output already is).

**Rate limiting.** Login/signup throttling is in-process. If you run many instances, put Cloud
Armor or an external rate limiter in front, or move throttling to Redis.

---

## 10. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Container failed to start and listen on PORT` | Check `gcloud run services logs read`. The server must bind `0.0.0.0:$PORT` (the Dockerfile already does). |
| `Permission denied` on a secret | Re-run the IAM step: `roles/secretmanager.secretAccessor` for the runtime service account. |
| Users are signed out after every revision | `SESSION_SECRET` is not set, so each instance generated its own. Store it in Secret Manager. |
| Orders disappear after a while | No `DATABASE_URL`: PGlite writes to ephemeral disk. Move to Cloud SQL. |
| `/api/health` returns 500 or `{"ok":false,...}` | The database is unreachable — verify the socket path and that `--add-cloudsql-instances` is attached. |
| Cloud Build runs out of memory | Build locally (`docker build`) and `gcloud run deploy --image`, or raise the build machine type. |
| `npm ci` fails in Docker | `package-lock.json` is out of sync — run `npm install` and commit the lockfile. |
| Slow first request | Cold start. Set `MIN_INSTANCES=1` or reduce the image/build surface. |
