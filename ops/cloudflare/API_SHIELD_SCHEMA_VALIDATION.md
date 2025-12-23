# Cloudflare API Shield: Schema Validation (OpenAPI v3.0)

This repo includes a **Cloudflare-compatible OpenAPI v3.0 schema** for the worker API:

- `backend/edge-worker/openapi.json`

It is designed for **Cloudflare API Shield Schema Validation** to prevent API abuse by rejecting requests that do not match the expected method/path/parameter/body shapes.

## What this protects

- **Method + path enforcement**: only declared operations are considered “valid API requests”.
- **Query/path parameter shape enforcement**: numeric-string query params, enums, etc.
- **JSON body shape enforcement**: request bodies for POST endpoints such as telemetry/auth/AI.

## Critical Cloudflare note (don’t skip)

Per Cloudflare’s docs: **Schema Validation only protects endpoints that are present in Endpoint Management.**

- **Dashboard upload** generally auto-adds endpoints.
- **API upload** may require you to add endpoints manually (host + method + path tuples) in **API Shield → Endpoint Management**, or via **API Discovery**.

If you upload a schema but don’t see endpoints in Endpoint Management, Schema Validation will not enforce on your traffic.

## Workflow (recommended)

### 1) Keep schema and code in sync

We enforce drift via a test:

```bash
cd backend/edge-worker
npm test
```

The test compares Hono’s implemented routes to `openapi.json` and fails if a route is missing from the spec.

### 2) Upload the schema to Cloudflare

No secrets are committed. Use env vars:

```bash
chmod +x ./ops/cloudflare/upload-api-shield-schema.sh
export CF_API_TOKEN="..."     # API token with API Shield permissions for the zone
export CF_ZONE_ID="..."       # Zone ID for awhittlewandering.com
./ops/cloudflare/upload-api-shield-schema.sh
```

### 3) Confirm endpoints are protected

In Cloudflare dashboard:

- **Security → API Shield → Endpoint Management**:
  - Confirm endpoints for `api.awhittlewandering.com` exist.
  - If missing, add endpoints or use **API Discovery** to add them.
- **Security → API Shield → Schema validation**:
  - Apply the uploaded schema to the hostname / endpoints.
  - Start with **Log**, review events, then move to **Block** once clean.

## Deploy strategy

- **Phase 1 (safe)**: Schema action = **Log** (observe false positives)
- **Phase 2 (enforce)**: Schema action = **Block** for high-value endpoints first (auth/admin/telemetry), then expand.

## Tech-debt callout (cleanup path)

Two items will eventually cause schema/behavior ambiguity:

1. **Admin auth is currently layered**:
   - `Authorization: Bearer ...` (from `JWT_SECRET`) at `/api/v1/admin/*` in `backend/edge-worker/src/index.ts`
   - `X-Admin-Token` in `backend/edge-worker/src/routers/admin.ts`
   - Cleanup path: choose **one** mechanism and standardize headers + OpenAPI `security` accordingly.

2. **Response shapes vary** (`ok` vs `success`, different error payloads):
   - Cloudflare Schema Validation focuses on requests, but for developer UX we should standardize responses.
   - Cleanup path: introduce a shared response helper + update endpoints incrementally.


