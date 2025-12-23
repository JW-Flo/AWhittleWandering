# Cloudflare Pages Deployment Guide

## Overview

This guide covers deploying the AWhittleWandering frontend to Cloudflare Pages.

## Project Details

- **Project name**: `awhittlewandering`
- **Pages URL**: `https://awhittlewandering.pages.dev`
- **Custom domain**: `awhittlewandering.com`

## Method 1: Automated (GitHub Actions)

Deployments are automatic on push to `main` when frontend files change.

### Workflow Location

`.github/workflows/frontend-pages-deploy.yml`

### Required GitHub Secrets

- `Cloudflare_Account_ID`: Your Cloudflare account ID
- `Cloudflare_API_token`: Cloudflare API token (with Pages edit permissions)

### Trigger Manually

```bash
gh workflow run frontend-pages-deploy.yml
```

## Method 2: Manual Deployment

### Prerequisites

- Wrangler CLI: `npm install -g wrangler`
- Authenticated: `wrangler login`

### Deploy Steps

```bash
# Build the frontend
cd frontend
npm run build

# Deploy to Pages
wrangler pages deploy dist --project-name=awhittlewandering
```

Or use the npm script from repo root:

```bash
npm run deploy:frontend
```

## Initial Setup (One-time)

If the Pages project doesn't exist:

```bash
wrangler pages project create awhittlewandering
```

## Environment Variables & Secrets

### Setting Secrets

```bash
# API Keys
wrangler secret put TESSIE_API_KEY --project-name awhittlewandering
wrangler secret put MAPBOX_ACCESS_TOKEN --project-name awhittlewandering
wrangler secret put OPENWEATHER_API_KEY --project-name awhittlewandering

# Auth
wrangler secret put JWT_SECRET --project-name awhittlewandering

# Other
wrangler secret put TESLA_VIN --project-name awhittlewandering
```

### Environment Variables

Set via Cloudflare Dashboard or wrangler:

- `PUBLIC_BASE_URL`: `https://awhittlewandering.pages.dev`
- `NODE_ENV`: `production`

## Custom Domain Setup

1. Go to Cloudflare Dashboard → Pages → awhittlewandering
2. Click "Custom domains" → "Set up a custom domain"
3. Enter `awhittlewandering.com`
4. Follow DNS verification steps

## Troubleshooting

### Common Issues

1. **Build fails**
   - Check Node.js version (should be 20+)
   - Run `bun install` to ensure dependencies

2. **Deployment fails**
   - Verify API token has Pages edit permissions
   - Check project name matches exactly: `awhittlewandering`

3. **Secrets not working**
   - Redeploy after adding secrets
   - Verify secret names match code expectations

### Health Checks

```bash
# Check deployment status
wrangler pages deployment list --project-name awhittlewandering

# Test health endpoint
curl -I https://awhittlewandering.pages.dev/healthz
curl -I https://awhittlewandering.com/healthz
```

## Rollback

See `ops/rollback/pages-switch.md` for rollback procedures.
