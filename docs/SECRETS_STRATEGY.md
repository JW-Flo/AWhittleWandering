# Secrets Strategy

## Principles

1. **No secrets in the repository.** Not in code, not in config files, not in comments.
2. **Least privilege.** Each environment only has the secrets it needs.
3. **Two storage locations:** GitHub Secrets (for CI) and Cloudflare Secrets (for Workers runtime).

## Required Secrets

### Cloudflare Worker Secrets (runtime)

These are injected into the Worker runtime via `wrangler secret put`.

| Secret               | Required | Description                          | Environments       |
| -------------------- | -------- | ------------------------------------ | ------------------ |
| `TESSIE_API_TOKEN`   | Yes      | Tessie API bearer token for Tesla data | production, staging |
| `JWT_SECRET`         | Yes      | HMAC signing key for auth tokens (min 32 chars) | production, staging |
| `MAPBOX_API_TOKEN`   | No       | Mapbox public token for map services | production, staging |
| `OPENWEATHER_API_KEY`| No       | OpenWeather API key                  | production, staging |
| `TESLA_VIN`          | Yes      | Vehicle Identification Number        | production, staging |
| `ADMIN_TOKEN`        | No       | Static admin bearer token (rolling)  | production         |

**How to set:**

```bash
# Production
npx wrangler secret put TESSIE_API_TOKEN --env production
npx wrangler secret put JWT_SECRET --env production
npx wrangler secret put MAPBOX_API_TOKEN --env production
npx wrangler secret put OPENWEATHER_API_KEY --env production
npx wrangler secret put TESLA_VIN --env production

# Staging
npx wrangler secret put TESSIE_API_TOKEN --env staging
npx wrangler secret put JWT_SECRET --env staging
npx wrangler secret put TESLA_VIN --env staging
```

### GitHub Secrets (CI/CD)

These are used by GitHub Actions workflows for deployment.

| Secret                  | Required | Used By                        | Description                    |
| ----------------------- | -------- | ------------------------------ | ------------------------------ |
| `CLOUDFLARE_API_TOKEN`  | Yes      | deploy-frontend, deploy-backend | Cloudflare API token for deploys |
| `CLOUDFLARE_ACCOUNT_ID` | Yes      | deploy-frontend, deploy-backend | Cloudflare account identifier  |

**How to set:**

1. Go to repository Settings → Secrets and variables → Actions
2. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`

### Cloudflare Pages Environment Variables

These are set in the Cloudflare Pages dashboard (not secrets, but build-time config).

| Variable             | Value (Production)                    | Value (Preview)                         |
| -------------------- | ------------------------------------- | --------------------------------------- |
| `VITE_API_BASE_URL`  | `https://api.awhittlewandering.com`   | `https://api-staging.awhittlewandering.com` |
| `NODE_VERSION`       | `20`                                  | `20`                                    |

## Injection Flow

```
GitHub Secrets
  └─→ GitHub Actions workflows
       ├─→ wrangler deploy (uses CLOUDFLARE_API_TOKEN)
       └─→ wrangler pages deploy (uses CLOUDFLARE_API_TOKEN + ACCOUNT_ID)

Cloudflare Secrets (wrangler secret put)
  └─→ Worker runtime (env.TESSIE_API_TOKEN, env.JWT_SECRET, etc.)

Cloudflare Pages Dashboard
  └─→ Build-time environment variables (VITE_API_BASE_URL)
```

## Automation Limitations

1. **Cloudflare Worker secrets cannot be set via CI without the Wrangler CLI.** The `wrangler secret put` command requires interactive input or piping. For CI automation, secrets must be pre-configured manually via:
   - `echo "value" | npx wrangler secret put SECRET_NAME --env production`
   - Or set via the Cloudflare dashboard

2. **Pages environment variables** must be set in the Cloudflare dashboard or via the Pages API. There is no wrangler CLI command for this.

## Blocker

- Setting Cloudflare Worker secrets and Pages env vars requires manual dashboard access. This is documented as a known limitation. The `scripts/validate-secrets.sh` script can verify that secrets are configured but cannot set them.
