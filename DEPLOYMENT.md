# AWhittleWandering Deployment Guide

Complete deployment documentation for the Tesla road trip tracker.

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

### Frontend: `.github/workflows/frontend-pages-deploy.yml`

**Triggers:**
- Push to `main` (paths: `frontend/**`)
- Manual dispatch

**Process:**
1. Checkout → Setup Node 20 → Install Bun
2. `bun install` (workspace)
3. `bun run build` (frontend)
4. `wrangler pages deploy dist --project-name=awhittlewandering`

### Backend: `.github/workflows/backend-deploy.yml`

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
| `TESSIE_API_KEY` | Tessie API key for Tesla data | Backend |
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
- **ID**: `09a6ba85-bd36-4ad3-b5a8-92e230943dcb`
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
wrangler secret put TESSIE_API_KEY --project-name awhittlewandering
wrangler secret put MAPBOX_ACCESS_TOKEN --project-name awhittlewandering
wrangler secret put JWT_SECRET --project-name awhittlewandering
```

### Backend (Workers)

```bash
wrangler secret put TESSIE_API_KEY --env production
wrangler secret put MAPBOX_ACCESS_TOKEN --env production
wrangler secret put OPENWEATHER_API_KEY --env production
wrangler secret put JWT_SECRET --env production
wrangler secret put TESLA_VIN --env production
```

## Custom Domain Setup

### Frontend (awhittlewandering.com)

1. Cloudflare Dashboard → Pages → `awhittlewandering`
2. Custom domains → Add `awhittlewandering.com`
3. DNS verification automatic if zone is in same account

### Backend (api.awhittlewandering.com)

Configured in `backend/edge-worker/wrangler.toml`:

```toml
[[env.production.routes]]
pattern = "api.awhittlewandering.com/*"
zone_name = "awhittlewandering.com"
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

1. Verify DNS is proxied through Cloudflare
2. Check SSL certificate is issued
3. Wait 5-15 minutes for propagation

## CI/CD Pipeline Summary

```
Push to main
    │
    ├── frontend/** changed?
    │   └── frontend-pages-deploy.yml
    │       └── Deploy to Cloudflare Pages (awhittlewandering)
    │
    └── backend/edge-worker/** changed?
        └── backend-deploy.yml
            └── Deploy to Cloudflare Workers (awhittlewandering-api)
```
