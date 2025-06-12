#!/usr/bin/env bash
#
# One-shot helper to spin-up n8n (if not already running) and trigger the
# `website-deployment` workflow in production.  Exits non-zero on failure.
#
# Usage:
#   ./scripts/deploy-website.sh
#
# Prereqs:
#   • docker & docker-compose installed
#   • `n8n/docker-compose.yml` in repo
#   • env vars N8N_USER / N8N_PASS (basic-auth)  – or set API_KEY token below
#
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

N8N_HOST=${N8N_HOST:-http://localhost:5678}
DEPLOY_WF_NAME="website-deployment"

log(){ echo -e "\033[1;34m[deploy]\033[0m $*"; }

# 1. Ensure containers up ------------------------------------------------------
if ! curl -fs "${N8N_HOST}/healthz" >/dev/null 2>&1; then
  log "Starting n8n containers…"
  docker compose -f n8n/docker-compose.yml up -d
  # wait for health
  for i in {1..30}; do
    if curl -fs "${N8N_HOST}/healthz" >/dev/null 2>&1; then break; fi
    sleep 2
  done
  curl -fs "${N8N_HOST}/healthz" >/dev/null || { echo "n8n did not start"; exit 1; }
fi
log "n8n healthy 👍"

# 2. Find workflow ID ----------------------------------------------------------
auth() {
  if [[ -n "${API_KEY:-}" ]]; then
    echo "-H 'X-N8N-API-KEY: ${API_KEY}'"
  else
    echo "-u ${N8N_USER:?Missing N8N_USER}:${N8N_PASS:?Missing N8N_PASS}"
  fi
}

WF_JSON=$(eval curl -fs $(auth) "${N8N_HOST}/rest/workflows?filter=${DEPLOY_WF_NAME}")
WF_ID=$(echo "$WF_JSON" | jq -r '.data[] | select(.name=="'"$DEPLOY_WF_NAME"'") | .id')
[[ -n "$WF_ID" ]] || { echo "workflow '${DEPLOY_WF_NAME}' not found"; exit 2; }

log "Triggering workflow id=$WF_ID"

# 3. Execute workflow ----------------------------------------------------------
EXEC_JSON=$(eval curl -fsX POST $(auth) \
  -H 'Content-Type: application/json' \
  -d '{"workflowId":'"$WF_ID"', "query": {"env":"production","full_build":"true"}}' \
  "${N8N_HOST}/rest/executions")

EXEC_ID=$(echo "$EXEC_JSON" | jq -r '.id')
[[ -n "$EXEC_ID" ]] || { echo "failed to start execution"; exit 3; }

log "Execution started → id=$EXEC_ID"

# 4. Poll until finished -------------------------------------------------------
while :; do
  STATUS=$(eval curl -fs $(auth) "${N8N_HOST}/rest/executions/${EXEC_ID}" | jq -r '.status')
  [[ "$STATUS" == "finished" || "$STATUS" == "failed" ]] && break
  sleep 5
done

[[ "$STATUS" == "finished" ]] || { echo "n8n execution failed"; exit 4; }
log "🚀 Website deployed successfully!"
