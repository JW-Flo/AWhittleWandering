# AWhittleWandering Deployment Guide

Complete deployment documentation for A Whittle Wandering.

> 🔧 **Having deployment issues?** See [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md) for common problems and solutions.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cloudflare                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐      ┌─────────────────────────────┐  │
│  │   Cloudflare Pages  │      │    Cloudflare Workers       │  │
│  │   (Frontend)        │      │    (Backend API)            │  │
│  │                     │      │                             │  │
│  │  Project:           │      │  Worker:                    │  │
│  │  awhittlewandering  │ ───► │  awhittlewandering-api      │  │
│  │                     │      │                             │  │
│  │  React + Vite       │      │  Hono + TypeScript          │  │
│  └─────────────────────┘      └─────────────────────────────┘  │
│           │                              │                      │
│           ▼                              ▼                      │
│  awhittlewandering.com         api.awhittlewandering.com       │
│                                          │                      │
│                           ┌──────────────┼──────────────┐      │
│                           │              │              │      │
│                           ▼              ▼              ▼      │
│                        ┌─────┐      ┌─────┐       ┌─────┐     │
│                        │ D1  │      │ R2  │       │ KV  │     │
│                        │ DB  │      │     │       │     │     │
│                        └─────┘      └─────┘       └─────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                          ┌───────────────┐
                          │  Tessie API   │
                          │  (Tesla Data) │
                          └───────────────┘
```

## Deployment Targets

| Component | Platform | Project/Worker Name | Custom Domain |
|-----------|----------|---------------------|---------------|
| Frontend | Cloudflare Pages | `awhittlewandering` | `awhittlewandering.com` |
| Backend | Cloudflare Workers | `awhittlewandering-api` | `api.awhittlewandering.com` |

## GitHub Actions Workflows

### Frontend: `.github/workflows/deploy-frontend.yml`

**Triggers:**
- Push to `main` (paths: `frontend/**`)
- Manual dispatch

**Process:**
1. Checkout → Setup Node 20 → Install Bun
2. `bun install` (workspace)
3. `bun run build` (frontend)
4. `wrangler pages deploy dist --project-name=awhittlewandering`

### Backend: `.github/workflows/deploy-backend.yml`

**Triggers:**
- Push to `main` (paths: `backend/edge-worker/**`, `shared/**`)
- Manual dispatch

**Process:**
1. Checkout → Setup Node 20 → Install Bun
2. Build shared schemas
3. Build backend worker
4. Set secrets via wrangler
5. `wrangler deploy --env production`

## Required GitHub Secrets

Configure these in GitHub → Settings → Secrets and variables → Actions:

| Secret Name | Description | Used By |
|-------------|-------------|---------|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account identifier | Both |
| `CLOUDFLARE_API_TOKEN` | API token with Workers/Pages edit | Both |
| `TESSIE_API_TOKEN` | Tessie API key for Tesla data | Backend |
| `MAPBOX_ACCESS_TOKEN` | Mapbox access token | Backend |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key | Backend |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Backend |
| `TESLA_VIN` | Tesla Vehicle Identification Number | Backend |

## Manual Deployment

### Frontend

```bash
cd frontend
bun install
bun run build
wrangler pages deploy dist --project-name=awhittlewandering
```

Or from repo root:
```bash
bun run deploy:frontend
```

### Backend

```bash
cd backend/edge-worker
bun install
bun run build
wrangler deploy --env production
```

## Cloudflare Resources

### D1 Database

- **Name**: `tesla-journey-tracker`
- **ID**: `889d864a-966d-4e8a-a3cd-bc60abf23688`
- **Binding**: `TESLA_DB`

### R2 Bucket

- **Name**: `awhittlewandering-media`
- **Binding**: `MEDIA_BUCKET`

### KV Namespace

- **ID**: `7838e32d8ad04855b13eb2d9aa4f9811`
- **Binding**: `AUTH_TOKENS`

### Analytics Engine

- **Binding**: `TELEMETRY_ANALYTICS`

### AI

- **Gateway**: `awhittlewandering-ai`
- **Model**: `@cf/meta/llama-3.1-8b-instruct`

## Environment Configuration

### Frontend (`frontend/wrangler.toml`)

```toml
name = "awhittlewandering"
compatibility_date = "2023-10-30"
pages_build_output_dir = "dist"

[env.production]
name = "awhittlewandering"
```

### Backend (`backend/edge-worker/wrangler.toml`)

See full config in file. Key settings:
- Production worker: `awhittlewandering-api`
- Custom domain: `api.awhittlewandering.com/*`
- Cron triggers for data sync

## Setting Secrets (Wrangler CLI)

### Frontend (Pages)

```bash
wrangler secret put TESSIE_API_TOKEN --project-name awhittlewandering
wrangler secret put MAPBOX_ACCESS_TOKEN --project-name awhittlewandering
wrangler secret put JWT_SECRET --project-name awhittlewandering
```

### Backend (Workers)

```bash
wrangler secret put TESSIE_API_TOKEN --env production
wrangler secret put MAPBOX_ACCESS_TOKEN --env production
wrangler secret put OPENWEATHER_API_KEY --env production
wrangler secret put JWT_SECRET --env production
wrangler secret put TESLA_VIN --env production
```

## Custom Domain Setup

Custom domains are optional but recommended for production. If not configured, the application will use Cloudflare's default domains:
- Frontend: `https://awhittlewandering.pages.dev`
- Backend: `https://awhittlewandering-api.workers.dev`

### Prerequisites

1. Domain registered and added to Cloudflare
2. DNS managed by Cloudflare (nameservers pointing to Cloudflare)
3. SSL/TLS encryption mode set to "Full" or "Full (strict)"

### Frontend (awhittlewandering.com)

**Via Cloudflare Dashboard:**

1. Go to **Cloudflare Dashboard** → **Workers & Pages**
2. Select your Pages project: `awhittlewandering`
3. Go to **Custom domains** tab
4. Click **Set up a custom domain**
5. Enter `awhittlewandering.com` (or your domain)
6. Cloudflare will automatically:
   - Create/update DNS records
   - Provision SSL certificate
   - Configure routing

**Verification:**
```bash
curl -I https://awhittlewandering.com
# Should return HTTP/2 200
```

### Backend (api.awhittlewandering.com)

**Step 1: Configure wrangler.toml**

The route is already configured in `backend/edge-worker/wrangler.toml`:

```toml
[[env.production.routes]]
pattern = "api.awhittlewandering.com/*"
zone_name = "awhittlewandering.com"
```

**Step 2: Add DNS Record (if not automatic)**

If the DNS record isn't created automatically after deployment:

1. Go to **Cloudflare Dashboard** → **DNS** → **Records**
2. Add an **A** or **CNAME** record:
   - **Type**: CNAME
   - **Name**: `api`
   - **Target**: `awhittlewandering-api.workers.dev`
   - **Proxy status**: Proxied (orange cloud)
3. Or use an A record pointing to any Cloudflare IP (e.g., `192.0.2.1`) with Proxy enabled

**Step 3: Deploy with Route**

```bash
cd backend/edge-worker
wrangler deploy --env production
```

Wrangler will bind the worker to the custom domain route.

**Verification:**
```bash
curl https://api.awhittlewandering.com/api/v1/health
# Should return: {"status":"ok",...}
```

## Health Checks

### Frontend
```bash
curl -I https://awhittlewandering.com
```

### Backend
```bash
curl https://api.awhittlewandering.com/api/v1/health
```

## Verification Script

```bash
./ops/checks/pages-binding-check.sh
```

## Rollback

### Frontend (Pages)

Via Cloudflare Dashboard:
1. Pages → `awhittlewandering` → Deployments
2. Find working deployment → "Rollback to this deployment"

### Backend (Workers)

```bash
# List recent deployments
wrangler deployments list --env production

# Rollback to previous
wrangler rollback --env production
```

## Troubleshooting

### Build Failures

1. Check Node.js version (requires 20+)
2. Verify `bun install` completed
3. Check build logs for TypeScript errors

### Deployment Failures

1. Verify Cloudflare API token has correct permissions
2. Check project/worker name matches exactly
3. Ensure secrets are set

### Custom Domain Issues

**Domain not resolving (HTTP 000 error):**

1. **Check DNS records**: Ensure DNS records exist and are proxied (orange cloud)
   ```bash
   dig awhittlewandering.com
   dig api.awhittlewandering.com
   ```

2. **Verify zone configuration**: The domain's zone must be active in Cloudflare
   - Go to **Cloudflare Dashboard** → Select your domain
   - Ensure status is "Active" (not "Pending")

3. **Check SSL certificate**: 
   - Go to **SSL/TLS** → **Edge Certificates**
   - Verify certificate is active for your domain
   - Wait up to 15 minutes for certificate issuance

4. **Test with fallback URLs**: If custom domains aren't working, the app still works on:
   - Frontend: `https://awhittlewandering.pages.dev`
   - Backend: `https://awhittlewandering-api.workers.dev`

5. **Worker route binding**: For backend custom domain
   - Deploy must succeed: `wrangler deploy --env production`
   - Check routes in dashboard: **Workers & Pages** → **awhittlewandering-api** → **Settings** → **Triggers** → **Routes**
   - Ensure route `api.awhittlewandering.com/*` is listed

6. **Propagation time**: Wait 5-15 minutes after DNS changes

## CI/CD Pipeline Summary

```
Push to main
    │
    ├── CI gates
    │   ├── ci-preflight.yml
    │   └── ci-swarm.yml (contract + migration + build synthesis)
    │
    ├── deploy-frontend.yml (Pages)
    └── deploy-backend.yml (Workers)

Post-deploy:
    └── post-deploy-verify.yml (smoke + route checks)
```
