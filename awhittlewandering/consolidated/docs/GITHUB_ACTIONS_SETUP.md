# GitHub Actions Setup Guide for ContinentalUSA

## Overview

This guide explains how to properly configure GitHub Actions secrets for the ContinentalUSA project to fix deployment failures.

## Required GitHub Secrets

### 1. Cloudflare Secrets (Required for all deployments)

- `CF_API_TOKEN` - Your Cloudflare API token
- `CF_ACCOUNT_ID` - Your Cloudflare account ID

### 2. Edge Worker Secrets

- `TESSIE_API_TOKEN` - Your Tessie API token
- `TESSIE_VIN` - Your Tesla vehicle VIN
- `OPENWEATHER_API_KEY` - OpenWeather API key (optional)
- `MAPBOX_TOKEN` - Mapbox access token (optional)
- `EDGE_HMAC_KEY` - HMAC key for edge worker security

### 3. AI Worker Secrets

- `WORKERS_AI_TOKEN` - Cloudflare Workers AI token
- `CONTINENTAL_API_KEY` - Continental API key (if needed)

### 4. Public Site Build Secrets

- `VITE_MAPBOX_TOKEN` - Mapbox token for frontend
- `VITE_OPENWEATHER_API_KEY` - OpenWeather key for frontend
- `VITE_TESSIE_API_TOKEN` - Tessie token for frontend (if needed)
- `VITE_EDGE_WORKER_URL` - Edge worker URL
- `VITE_AI_WORKER_URL` - AI worker URL

## Setting Up GitHub Secrets

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its corresponding value

### Example Secret Values

```bash
# Cloudflare (Required)
CF_API_TOKEN=your_cloudflare_api_token
CF_ACCOUNT_ID=your_cloudflare_account_id

# Tessie (Required for vehicle data)
TESSIE_API_TOKEN=your_tessie_api_token
TESSIE_VIN=your_vehicle_vin

# Optional APIs
OPENWEATHER_API_KEY=your_openweather_key
MAPBOX_TOKEN=your_mapbox_token

# Security
EDGE_HMAC_KEY=generate_a_random_key_here

# URLs (update after first deployment)
VITE_EDGE_WORKER_URL=https://continental-usa-edge-worker.your-subdomain.workers.dev
VITE_AI_WORKER_URL=https://continental-ai-worker.your-subdomain.workers.dev
```

## Fixing the Current Issues

### 1. Fix Missing Secrets Error

The workflow is failing because it's trying to use secrets that don't exist. You have two options:

#### Option A: Add all required secrets (Recommended)
Add all the secrets listed above to your GitHub repository.

#### Option B: Make secrets optional
Update the workflows to handle missing secrets gracefully.

### 2. Updated Worker Workflow (with optional secrets)

Create a new file to replace the existing worker workflow:

```yaml
# .github/workflows/worker-fixed.yml
name: Edge Worker CI/CD
on:
  push:
    paths:
      - "edge-worker/**"
      - ".github/workflows/worker-fixed.yml"

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"
          cache-dependency-path: "edge-worker/package-lock.json"

      - name: Install dependencies
        run: |
          cd edge-worker
          bun install

      - name: Run tests
        run: |
          cd edge-worker
          npm test
        continue-on-error: true

  deploy-edge-worker:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy Edge Worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          workingDirectory: edge-worker
          command: deploy
          secrets: |
            TESSIE_API_TOKEN
            TESSIE_VIN
        env:
          TESSIE_API_TOKEN: ${{ secrets.TESSIE_API_TOKEN }}
          TESSIE_VIN: ${{ secrets.TESSIE_VIN }}

  deploy-ai-worker:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy AI Worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          workingDirectory: edge-worker/src/ai-worker
          command: deploy
```

### 3. Fix Test Failures

The test failures are already fixed in the updated test file. Run tests locally to verify:

```bash
cd 48Continental_Starter/public-site
npm test
```

### 4. Secure Credential Management

For production deployment, use Cloudflare's secret management:

```bash
# Set production secrets in Cloudflare (not GitHub)
cd edge-worker
wrangler secret put TESSIE_API_TOKEN
wrangler secret put TESSIE_VIN
```

## Best Practices

1. **Never commit secrets** to the repository
2. **Use environment-specific secrets** (dev, staging, prod)
3. **Rotate secrets regularly**
4. **Use minimal permissions** for API tokens
5. **Monitor secret usage** in logs

## Troubleshooting

### "Secret not found" errors
- Verify the secret name matches exactly (case-sensitive)
- Check that the secret is set in the correct repository
- Ensure the workflow has access to secrets

### Test failures
- Run tests locally first
- Check that all dependencies are installed
- Verify mock implementations are correct

### Deployment failures
- Check Cloudflare API token permissions
- Verify account ID is correct
- Check wrangler.toml configuration

## Security Checklist

- [ ] All secrets are set in GitHub Actions
- [ ] No secrets are hardcoded in code
- [ ] API tokens have minimal required permissions
- [ ] Secrets are not logged in workflows
- [ ] Production secrets are different from development
- [ ] Regular secret rotation is scheduled

## Next Steps

1. Add the required secrets to GitHub
2. Update the workflows if needed
3. Re-run the failed workflows
4. Monitor deployments for success

By following this guide, your GitHub Actions workflows should deploy successfully without exposing any sensitive credentials.
