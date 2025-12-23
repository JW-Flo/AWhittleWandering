# Pages Project Rollback Guide

## Overview

If the current Pages deployment fails, follow these steps to troubleshoot or roll back to a previous deployment.

## Current Configuration

- **Project name**: `awhittlewandering`
- **Pages URL**: `https://awhittlewandering.pages.dev`
- **Custom domain**: `awhittlewandering.com`

## Rollback to Previous Deployment

### Option 1: Via Cloudflare Dashboard

1. Go to Cloudflare Dashboard → Pages → awhittlewandering
2. Click "Deployments"
3. Find a working deployment and click "Rollback to this deployment"

### Option 2: Via Wrangler CLI

```bash
# List recent deployments
wrangler pages deployment list --project-name awhittlewandering

# Note the deployment ID of a working version, then promote it
# (This is done via dashboard - CLI rollback requires redeploying from git)
```

### Option 3: Redeploy from Git

```bash
# Checkout a known working commit
git checkout <working-commit-sha>

# Build and deploy manually
cd frontend
npm run build
wrangler pages deploy dist --project-name=awhittlewandering

# Return to main
git checkout main
```

## Verify Deployment

```bash
# Run the binding check script
./ops/checks/pages-binding-check.sh

# Or manually check:
curl -I https://awhittlewandering.pages.dev/healthz
curl -I https://awhittlewandering.com/healthz
```

## Prevention

- Always test deployments in preview branches first
- Monitor deployment logs in Cloudflare dashboard
- Keep the health endpoint (`/healthz`) functional

## Contact

If rollback fails, check the Cloudflare dashboard for deployment logs and project settings.
