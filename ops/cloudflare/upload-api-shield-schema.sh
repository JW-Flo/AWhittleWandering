#!/usr/bin/env bash
set -euo pipefail

# Upload OpenAPI v3 schema to Cloudflare API Shield Schema Validation.
# - No secrets are read from files; pass as env vars.
# - Uses Cloudflare API: POST /zones/:zone_id/schema_validation/schemas
#
# Required env:
#   CF_API_TOKEN   Cloudflare API token with appropriate permissions (Zone:Read + API Shield write)
#   CF_ZONE_ID     Zone ID (for api.awhittlewandering.com)
#
# Optional env:
#   SCHEMA_NAME    Defaults to "awhittlewandering-openapi"
#   SCHEMA_FILE    Defaults to "backend/edge-worker/openapi.json"
#
# Usage:
#   CF_API_TOKEN=... CF_ZONE_ID=... ./ops/cloudflare/upload-api-shield-schema.sh

SCHEMA_NAME="${SCHEMA_NAME:-awhittlewandering-openapi}"
SCHEMA_FILE="${SCHEMA_FILE:-backend/edge-worker/openapi.json}"

if [[ -z "${CF_API_TOKEN:-}" ]]; then
  echo "Missing CF_API_TOKEN" >&2
  exit 2
fi
if [[ -z "${CF_ZONE_ID:-}" ]]; then
  echo "Missing CF_ZONE_ID" >&2
  exit 2
fi
if [[ ! -f "${SCHEMA_FILE}" ]]; then
  echo "Schema file not found: ${SCHEMA_FILE}" >&2
  exit 2
fi

SOURCE_JSON_STRING="$(
  node -e "const fs=require('fs'); const s=fs.readFileSync(process.argv[1],'utf8'); process.stdout.write(JSON.stringify(s));" "${SCHEMA_FILE}"
)"

API="https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/schema_validation/schemas"

echo "Uploading schema '${SCHEMA_NAME}' from '${SCHEMA_FILE}' to Cloudflare..."

curl --fail --silent --show-error \
  --connect-timeout 10 --max-time 60 \
  "${API}" \
  --request POST \
  --header "Authorization: Bearer ${CF_API_TOKEN}" \
  --header "Content-Type: application/json" \
  --data-binary "$(cat <<EOF
{
  "kind": "openapi_v3",
  "name": "${SCHEMA_NAME}",
  "source": ${SOURCE_JSON_STRING},
  "validation_enabled": true
}
EOF
)"

echo
echo "Done."
echo
echo "Next (required for enforcement): sync Endpoint Management so Schema Validation applies:"
echo "CF_API_TOKEN=... CF_ZONE_ID=... node ops/cloudflare/sync-endpoint-management.mjs"
echo
echo "Then set schema action to Log/Block as desired in Cloudflare dashboard."


