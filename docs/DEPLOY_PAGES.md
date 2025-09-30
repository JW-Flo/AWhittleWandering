# Cloudflare Pages Deployment Guide

## Overview

This guide covers deploying the frontend to Cloudflare Pages using both Git integration and direct Wrangler uploads.

## Method 1: Git Integration (Recommended)

### Prerequisites

- Cloudflare account with Pages enabled
- GitHub repository with frontend code
- Wrangler CLI installed: `npm install -g wrangler`

### Setup Steps

1. **Create Pages Project**

   ```bash
   wrangler pages create atlas-it
   ```

2. **Configure wrangler.toml**

   ```toml
   name = "atlas-it"
   compatibility_date = "2023-10-30"
   pages_build_output_dir = "dist"

   [env.production]
   name = "atlas-it"
   ```

3. **Set up GitHub Actions**
   Create `.github/workflows/frontend-pages-deploy.yml`:

   ```yaml
   name: frontend-pages-deploy
   on:
     push:
       branches: [ main ]
       paths:
         - 'frontend/**'
   jobs:
     deploy-frontend:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '20'
         - name: Build frontend
           working-directory: frontend
           run: npm run build
         - name: Deploy to Cloudflare Pages
           env:
             CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}
             CLOUDFLARE_API_TOKEN: ${{ secrets.CF_PAGES_TOKEN }}
           run: wrangler pages deploy dist --project-name atlas-it
   ```

4. **Set Secrets in GitHub**
   - `CF_ACCOUNT_ID`: Your Cloudflare account ID
   - `CF_PAGES_TOKEN`: Pages API token

5. **Deploy**
   Push to main branch - deployment triggers automatically.

## Method 2: Direct Wrangler Upload

### Prerequisites

- Wrangler CLI installed
- Built frontend assets

### Deployment Steps

1. **Build the frontend**

   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy directly**

   ```bash
   wrangler pages deploy dist --project-name atlas-it
   ```

3. **With custom domain** (optional)

   ```bash
   wrangler pages deploy dist --project-name atlas-it --branch main
   ```

## Environment Variables & Secrets

### Setting Secrets

```bash
# API Keys
wrangler secret put TESSIE_API_KEY --project-name atlas-it
wrangler secret put MAPBOX_ACCESS_TOKEN --project-name atlas-it

# Environment Variables
wrangler pages deployment create atlas-it --env production --var PUBLIC_BASE_URL=https://atlas-it.pages.dev
```

### Required Variables

- `PUBLIC_BASE_URL`: The public URL of your Pages site
- `NODE_ENV`: Set to "production"
- Feature flags: `FEATURE_MAPBOX`, `FEATURE_WEATHER`, etc.

## Troubleshooting

### Common Issues

1. **Build fails**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check build logs for errors

2. **Deployment fails**
   - Verify API token has Pages permissions
   - Check project name matches exactly
   - Ensure build output directory exists

3. **Secrets not working**
   - Use `wrangler secret put` for sensitive values
   - Use `--var` for non-sensitive environment variables
   - Restart deployment after adding secrets

### Health Checks

```bash
# Check deployment status
wrangler pages deployment list --project-name atlas-it

# Test health endpoint
curl -I https://atlas-it.pages.dev/healthz
```

## Rollback

If deployment fails, see `ops/rollback/pages-switch.md` for rollback procedures.

## Best Practices

- Use Git integration for automatic deployments
- Set up preview deployments for pull requests
- Monitor deployment logs in Cloudflare dashboard
- Use semantic versioning for releases
- Keep secrets secure and rotate regularly
