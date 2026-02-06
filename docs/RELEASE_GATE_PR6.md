# Release Gate — PR6

Checklist and prerequisites for shipping PR6 to production.

## DNS Prerequisites

| Record                               | Type  | Target                         | Status       |
| ------------------------------------ | ----- | ------------------------------ | ------------ |
| `awhittlewandering.com`              | CNAME | Cloudflare Pages               | Verify in CF dashboard |
| `api.awhittlewandering.com`          | CNAME | `awhittlewandering-api.workers.dev` or proxied | Verify in CF dashboard |
| `api-staging.awhittlewandering.com`  | CNAME | `awhittlewandering-api-staging.workers.dev` or proxied | Verify in CF dashboard |

**Action:** Confirm all three DNS records exist and are proxied (orange cloud) in Cloudflare.

## Pages Build Settings

See [PAGES_BUILD_SETTINGS.md](./PAGES_BUILD_SETTINGS.md) for exact values.

- [ ] Root directory: `frontend`
- [ ] Build command: `npm ci && npm run build`
- [ ] Output directory: `dist`
- [ ] `VITE_API_BASE_URL` set to `https://api.awhittlewandering.com` in Pages dashboard

## Worker Routes

- [ ] Production: `api.awhittlewandering.com/*` → `awhittlewandering-api` Worker
- [ ] Staging: `api-staging.awhittlewandering.com/*` → `awhittlewandering-api-staging` Worker

## Required Environment Variables / Secrets

### Cloudflare Worker Secrets

- [ ] `TESSIE_API_TOKEN` set for production
- [ ] `JWT_SECRET` set for production (min 32 chars)
- [ ] `TESLA_VIN` set for production

### GitHub Secrets

- [ ] `CLOUDFLARE_API_TOKEN` set in repo settings
- [ ] `CLOUDFLARE_ACCOUNT_ID` set in repo settings

## One-Click Verification Steps

After merge + deploy, run these checks:

### 1. API Health (manual)

```bash
curl -s https://api.awhittlewandering.com/health | jq .
# Expected: { "ok": true, "status": "healthy", ... }
```

### 2. Pages Site (manual)

```bash
curl -s -o /dev/null -w "%{http_code}" https://awhittlewandering.com
# Expected: 200
```

### 3. CORS Preflight (manual)

```bash
curl -s -I -X OPTIONS \
  -H "Origin: https://awhittlewandering.com" \
  -H "Access-Control-Request-Method: GET" \
  https://api.awhittlewandering.com/health
# Expected: access-control-allow-origin: https://awhittlewandering.com
```

### 4. CI Smoke Test (automated)

Run: **Actions → Smoke Test → Run workflow → production**

Expected: all checks PASS.

## Blockers

See [validation_findings.md](./validation_findings.md) for any unresolved blockers.
