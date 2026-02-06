# PR6 Scope

## Included Now

These changes are in PR6 and required to ship the minimum demo path (frontend loads → calls backend health → displays result).

| Change | Files | Reason |
| ------ | ----- | ------ |
| Fix production API fallback URL | `frontend/src/lib/api.ts` | Was pointing to old workers.dev URL instead of `api.awhittlewandering.com` |
| Add health check indicator to Landing page | `frontend/src/pages/Landing.tsx` | Visible confirmation of frontend ↔ backend connectivity |
| Fix deploy-frontend env var name | `.github/workflows/deploy-frontend.yml` | Was `VITE_API_URL`, code reads `VITE_API_BASE_URL` |
| Remove incorrect `/api/*` CORS headers from Pages | `frontend/public/_headers` | Pages doesn't serve API routes; these headers were misleading |
| Re-enable production D1 binding | `backend/edge-worker/wrangler.toml` | Was commented out; required for health endpoint to report D1 status |
| Add staging environment to Worker config | `backend/edge-worker/wrangler.toml` | Needed for staging deploys at `api-staging.awhittlewandering.com` |
| CORS already configured correctly | `backend/edge-worker/src/middleware/cors.ts` | No changes needed — already allows `awhittlewandering.com` and Pages preview domains |
| CI smoke test workflow | `.github/workflows/smoke-test.yml` | Automated PASS/FAIL signal for release readiness |
| Documentation | `docs/*.md` (6 files) | Build settings, redirects, secrets, bindings, release gate, triage rules |

## Deferred (with reason)

| Item | Reason |
| ---- | ------ |
| Dedicated staging D1 database | Requires `wrangler d1 create` with Cloudflare account access. Currently sharing production DB. |
| Dedicated staging KV namespace | Same as above. |
| R2 bucket re-enablement | Not needed for MVP demo path. |
| Durable Objects | Not needed for MVP demo path. |
| Queue system | Not needed for MVP demo path. |
| Full frontend test suite fixes | Out of scope for platform wiring PR. |
| Tesla data importer fixes | Data pipeline is separate from the deploy/connectivity concern. |
| 1Password integration | Not blocking deployment. |
| Mobile cloud framework | Documentation-only, not blocking. |

## Unsafe / Needs Review

| Item | Risk | Recommendation |
| ---- | ---- | -------------- |
| Staging shares production D1 + KV | Staging writes could corrupt production data | Create dedicated staging resources before enabling staging data writes |
| `_redirects` SPA fallback | Low risk, standard pattern | Monitor Pages deploy logs for infinite loop warnings |
| CORS allows all `*.awhittlewandering.pages.dev` subdomains | Low risk — Pages preview URLs are ephemeral | Acceptable for now; tighten if needed |
