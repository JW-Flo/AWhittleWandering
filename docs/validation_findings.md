# Validation Findings

Last updated: PR6 (Grand Finale)

## Resolved

| Finding | Resolution |
| ------- | ---------- |
| Production D1 binding commented out | Re-enabled in `wrangler.toml` with correct `database_id` |
| `api.ts` fallback URL pointed to old workers.dev domain | Changed to `https://api.awhittlewandering.com` |
| `deploy-frontend.yml` used `VITE_API_URL` (wrong env var name) | Fixed to `VITE_API_BASE_URL` |
| `_headers` file contained `/api/*` CORS rules (irrelevant for Pages) | Removed — API is on separate subdomain |
| No visible health check on frontend | Added health status indicator to Landing page |
| No staging environment in Worker config | Added `[env.staging]` block with route `api-staging.awhittlewandering.com/*` |
| No CI smoke test for release readiness | Added `.github/workflows/smoke-test.yml` |

## Open Blockers

### B1: DNS Records Not Verified

**Status:** Unknown — requires Cloudflare dashboard access.

**What:** The following DNS records must exist and be proxied:
- `awhittlewandering.com` → Cloudflare Pages
- `api.awhittlewandering.com` → Worker route
- `api-staging.awhittlewandering.com` → Worker route (staging)

**Owner:** Human (Cloudflare dashboard access required)

**Next action:** Verify records in Cloudflare DNS dashboard. If missing, create CNAME records pointing to the appropriate targets.

### B2: Cloudflare Worker Secrets Not Verified

**Status:** Unknown — requires `wrangler secret list` or dashboard access.

**What:** The following secrets must be set for production:
- `TESSIE_API_TOKEN`
- `JWT_SECRET`
- `TESLA_VIN`

**Owner:** Human

**Next action:** Run `npx wrangler secret list --env production` to check. If missing, set them per `docs/SECRETS_STRATEGY.md`.

### B3: Pages Environment Variables Not Verified

**Status:** Unknown — requires Cloudflare Pages dashboard.

**What:** `VITE_API_BASE_URL` must be set to `https://api.awhittlewandering.com` in the Pages project's production environment variables.

**Owner:** Human

**Next action:** Check Pages dashboard → Settings → Environment variables.

### B4: Staging D1 and KV Share Production Resources

**Status:** Known limitation — not blocking deploy but a data integrity risk.

**What:** The staging Worker environment uses the same D1 database and KV namespace as production. Any staging writes will affect production data.

**Owner:** Human

**Next action:** Create dedicated staging resources:
```bash
npx wrangler d1 create tesla-journey-tracker-staging
npx wrangler kv namespace create AUTH_TOKENS_STAGING
```
Then update `wrangler.toml` staging env with the new IDs.

### B5: GitHub Secrets for CI Deployment

**Status:** Unknown — requires repo admin access.

**What:** `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` must be set in GitHub repo secrets for CI deploy workflows to function.

**Owner:** Human (repo admin)

**Next action:** Check Settings → Secrets and variables → Actions. If missing, create them with values from Cloudflare dashboard.
