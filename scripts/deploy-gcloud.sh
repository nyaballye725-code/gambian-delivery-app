#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Deploy Jotna to Google Cloud Run in one command.
#
#   PROJECT=my-project ./scripts/deploy-gcloud.sh
#
# Optional environment variables:
#   REGION=europe-west1             Cloud Run region
#   SERVICE=jotna                   Cloud Run service name
#   SITE_URL=https://jotna.gm       Public URL used for SEO tags + sitemap
#   DEMO_MODE=false                 Disables one-click demo sign-in (recommended)
#   SESSION_SECRET=...              Reuse a secret instead of generating one
#   DATABASE_URL=postgres://...     Cloud SQL / Postgres connection string
#   CLOUD_SQL_INSTANCE=proj:region:instance  Enables the Cloud SQL socket
#   MEMORY=1Gi  CPU=1  MIN_INSTANCES=0  MAX_INSTANCES=10
#
# The script is idempotent: it can be re-run to ship a new revision.
# See DEPLOY.md for the full walkthrough (database, custom domain, CI).
# ---------------------------------------------------------------------------
set -euo pipefail

PROJECT="${PROJECT:-$(gcloud config get-value project 2>/dev/null || true)}"
REGION="${REGION:-europe-west1}"
SERVICE="${SERVICE:-jotna}"
SITE_URL="${SITE_URL:-https://jotna.gm}"
DEMO_MODE="${DEMO_MODE:-false}"
SESSION_SECRET_NAME="${SESSION_SECRET_NAME:-jotna-session-secret}"
DATABASE_URL_SECRET_NAME="${DATABASE_URL_SECRET_NAME:-jotna-database-url}"
MEMORY="${MEMORY:-1Gi}"
CPU="${CPU:-1}"
MIN_INSTANCES="${MIN_INSTANCES:-0}"
MAX_INSTANCES="${MAX_INSTANCES:-10}"
CLOUD_SQL_INSTANCE="${CLOUD_SQL_INSTANCE:-}"
DATABASE_URL="${DATABASE_URL:-}"
SESSION_SECRET="${SESSION_SECRET:-}"

info() { printf '\033[1;32m▸\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; exit 1; }

command -v gcloud >/dev/null 2>&1 || fail "gcloud is not installed. See https://cloud.google.com/sdk/docs/install"
[[ -n "$PROJECT" && "$PROJECT" != "(unset)" ]] || fail "No project selected. Set PROJECT=my-project or run: gcloud config set project my-project"

info "Project: $PROJECT"
info "Region:  $REGION"
info "Service: $SERVICE"

# 1. APIs ---------------------------------------------------------------
info "Enabling required Google Cloud APIs (this can take a minute on a new project)…"
APIS=(
  run.googleapis.com
  cloudbuild.googleapis.com
  artifactregistry.googleapis.com
  secretmanager.googleapis.com
)
[[ -n "$CLOUD_SQL_INSTANCE" ]] && APIS+=(sqladmin.googleapis.com)
gcloud services enable "${APIS[@]}" --project "$PROJECT" --quiet

# 2. Session secret -----------------------------------------------------
if [[ -n "$SESSION_SECRET" ]]; then
  info "Writing supplied SESSION_SECRET to Secret Manager…"
  if gcloud secrets describe "$SESSION_SECRET_NAME" --project "$PROJECT" >/dev/null 2>&1; then
    printf '%s' "$SESSION_SECRET" | gcloud secrets versions add "$SESSION_SECRET_NAME" --data-file=- --project "$PROJECT" --quiet
  else
    printf '%s' "$SESSION_SECRET" | gcloud secrets create "$SESSION_SECRET_NAME" --data-file=- --replication-policy=automatic --project "$PROJECT" --quiet
  fi
elif ! gcloud secrets describe "$SESSION_SECRET_NAME" --project "$PROJECT" >/dev/null 2>&1; then
  info "Creating a random SESSION_SECRET in Secret Manager…"
  openssl rand -hex 32 | tr -d '\n' | gcloud secrets create "$SESSION_SECRET_NAME" --data-file=- --replication-policy=automatic --project "$PROJECT" --quiet
else
  info "Reusing existing secret: $SESSION_SECRET_NAME"
fi

# 3. Optional database secret ------------------------------------------
SECRETS="SESSION_SECRET=${SESSION_SECRET_NAME}:latest"
if [[ -n "$DATABASE_URL" ]]; then
  info "Storing DATABASE_URL in Secret Manager…"
  if gcloud secrets describe "$DATABASE_URL_SECRET_NAME" --project "$PROJECT" >/dev/null 2>&1; then
    printf '%s' "$DATABASE_URL" | gcloud secrets versions add "$DATABASE_URL_SECRET_NAME" --data-file=- --project "$PROJECT" --quiet
  else
    printf '%s' "$DATABASE_URL" | gcloud secrets create "$DATABASE_URL_SECRET_NAME" --data-file=- --replication-policy=automatic --project "$PROJECT" --quiet
  fi
  SECRETS+=",DATABASE_URL=${DATABASE_URL_SECRET_NAME}:latest"
fi
[[ -n "$CLOUD_SQL_INSTANCE" && -z "$DATABASE_URL" ]] && warn "CLOUD_SQL_INSTANCE is set but DATABASE_URL is not — the app will use embedded PGlite."

# 4. IAM ----------------------------------------------------------------
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"
RUNTIME_SA="${RUNTIME_SA:-${PROJECT_NUMBER}-compute@developer.gserviceaccount.com}"
info "Granting $RUNTIME_SA access to secrets…"
gcloud secrets add-iam-policy-binding "$SESSION_SECRET_NAME" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --project "$PROJECT" --quiet >/dev/null
if [[ -n "$DATABASE_URL" ]]; then
  gcloud secrets add-iam-policy-binding "$DATABASE_URL_SECRET_NAME" \
    --member="serviceAccount:${RUNTIME_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --project "$PROJECT" --quiet >/dev/null
fi
if [[ -n "$CLOUD_SQL_INSTANCE" ]]; then
  gcloud projects add-iam-policy-binding "$PROJECT" \
    --member="serviceAccount:${RUNTIME_SA}" \
    --role="roles/cloudsql.client" --quiet >/dev/null
fi

# 5. Deploy -------------------------------------------------------------
ENV_VARS="NODE_ENV=production,DEMO_MODE=${DEMO_MODE},SITE_URL=${SITE_URL}"

DEPLOY_ARGS=(
  run deploy "$SERVICE"
  --source .
  --project "$PROJECT"
  --region "$REGION"
  --platform managed
  --allow-unauthenticated
  --port 8080
  --cpu "$CPU"
  --memory "$MEMORY"
  --min-instances "$MIN_INSTANCES"
  --max-instances "$MAX_INSTANCES"
  --timeout 300
  --set-env-vars "$ENV_VARS"
  --set-secrets "$SECRETS"
  --quiet
)
[[ -n "$CLOUD_SQL_INSTANCE" ]] && DEPLOY_ARGS+=(--add-cloudsql-instances "$CLOUD_SQL_INSTANCE")

info "Building the container and deploying to Cloud Run…"
gcloud "${DEPLOY_ARGS[@]}"

URL="$(gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format='value(status.url)')"

echo
info "Deployed: $URL"
echo "  Health check: ${URL}/api/health"
echo "  Public site:  ${URL}/"
echo "  Running app:  ${URL}/app"
echo
if [[ "$DEMO_MODE" != "false" ]]; then
  warn "DEMO_MODE is on — anyone can sign in as the demo admin. Re-deploy with DEMO_MODE=false before sharing the URL widely."
fi
if [[ -z "$DATABASE_URL" ]]; then
  warn "No DATABASE_URL: the app is using an ephemeral embedded PGlite database. Data disappears on each new revision/cold start. See DEPLOY.md → Cloud SQL."
fi
