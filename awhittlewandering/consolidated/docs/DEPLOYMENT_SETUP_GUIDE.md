# 48 Continental USA - Deployment Setup Guide

This guide provides comprehensive instructions for deploying all components of the 48 Continental USA project, including the edge worker, public site, and necessary configurations.

## Current Deployment Status Summary

| Component | Status | Details |
|-----------|--------|---------|
| Edge Worker (workers.dev) | ✅ Working | API endpoints operational except vehicle API |
| Edge Worker (Custom Domain) | ❌ Not working | Domain not configured |
| Public Site | ❌ Not working | Needs deployment or DNS propagation |
| KV Namespaces | ✅ Configured | Needs data population |
| Vehicle API | ❌ Not working | Missing Tessie credentials |

## Prerequisites

Before starting the deployment process, ensure you have:

1. **Cloudflare Account**: Used for Workers and Pages deployment
2. **Required API Keys**: See [API Keys Explanation](./API_KEYS_EXPLANATION.md)
3. **Node.js & npm**: For building and deploying the application

## Step 1: Configure Environment Variables

### Edge Worker Environment Variables

Create or update the `.dev.vars` file in the `edge-worker` directory:

```bash
cd edge-worker
cat > .dev.vars << EOF
TESSIE_API_TOKEN=your-tessie-api-token
TESSIE_VIN=your-tesla-vehicle-vin
OPENWEATHER_API_KEY=your-openweather-api-key
EDGE_HMAC_KEY=your-hmac-secret-key
EOF
```

### Public Site Environment Variables

Create or update the `.env.production` file in the `48Continental_Starter/public-site` directory:

```bash
cd 48Continental_Starter/public-site
cat > .env.production << EOF
VITE_MAPBOX_TOKEN=your-mapbox-token
VITE_OPENWEATHER_API_KEY=your-openweather-api-key
VITE_API_BASE_URL=https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev
EOF
```

## Step 2: Choose Domain Strategy

You have two options for domain configuration:

### Option A: Use workers.dev Domain (Simpler)

The Edge Worker is already working on the workers.dev domain:
- **URL**: `https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev`

For this option:
1. Update `48Continental_Starter/public-site/.env.production` to use the workers.dev URL
2. Comment out the custom domain section in `edge-worker/wrangler.toml`

### Option B: Set Up Custom Domain (More Professional)

To use `trip.thewanderingwhittle.com`:
1. Register the domain if not already owned
2. Configure in Cloudflare dashboard
3. Add DNS records as described in [Custom Domain Setup](./CUSTOM_DOMAIN_SETUP.md)

## Step 3: Deploy Edge Worker

```bash
# Authenticate with Cloudflare
cd edge-worker
npx wrangler login

# Deploy the worker
npx wrangler deploy
```

## Step 4: Deploy Public Site

```bash
# Build the site
cd 48Continental_Starter/public-site
bun install
bun run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist
```

## Step 5: Populate KV Namespaces

```bash
# Populate APP_KV namespace with static assets
cd edge-worker
npx wrangler kv:key put --binding=APP_KV "config" '{"version":"1.0.0","updateInterval":60}' --metadata='{"created":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}' 

# Populate ITINERARY_KV namespace with trip data
npx wrangler kv:key put --binding=ITINERARY_KV "itinerary" "$(cat ../48Continental_Revised_Final_Itinerary.csv)" --metadata='{"format":"csv"}'
```

## Step 6: Verify Deployment

Run the monitoring script to verify all components are working:

```bash
./scripts/monitor-deployment.sh
```

### Expected Results:

- **Edge Worker (workers.dev)**: All endpoints should return HTTP 200, except vehicle API which may return 503 until Tessie credentials are configured
- **Public Site**: Should be accessible at the Cloudflare Pages URL
- **Custom Domain** (if configured): Should be accessible and proxying to the worker

## Troubleshooting Common Issues

### 1. Edge Worker Deployment Fails

Use the fix-deployment script:
```bash
./scripts/fix-deployment-routes.cjs
```

### 2. Custom Domain Returns 403

Check Cloudflare dashboard settings:
- Verify DNS records
- Check SSL/TLS settings (should be set to "Full" or "Full (Strict)")
- Ensure the domain is activated in Cloudflare

### 3. Vehicle API Returns 503

Confirm Tessie API credentials:
- Verify TESSIE_API_TOKEN and TESSIE_VIN are set in .dev.vars
- Redeploy the worker after updating credentials

### 4. Public Site Not Accessible

Verify the deployment:
```bash
cd 48Continental_Starter/public-site
npx wrangler pages deployment list
```

If deployed but not accessible, check DNS propagation (can take up to 24 hours).

## GitHub Actions Setup

For continuous deployment, configure GitHub Actions:

1. Add required secrets to GitHub repository:
   - `CF_API_TOKEN`: Cloudflare API token
   - `CF_ACCOUNT_ID`: Cloudflare account ID
   - Other API keys as listed in [API Keys Explanation](./API_KEYS_EXPLANATION.md)

2. Push changes to trigger automatic deployment:
   ```bash
   git add .
   git commit -m "Update deployment configuration"
   git push
   ```

## Monitoring the Live Deployment

Use these scripts to monitor the deployment:

```bash
# General monitoring
./scripts/monitor-deployment.sh

# Cloudflare-specific diagnostics
node scripts/cloudflare-diagnostic.js

# Verify deployment status
./scripts/verify-deployment.sh
```

## Additional Resources

- [Deployment Status](./DEPLOYMENT_STATUS.md): Current status of all components
- [Domain Configuration Options](./DOMAIN_CONFIGURATION_OPTIONS.md): Details on domain setup
- [Deployment Troubleshooting](./DEPLOYMENT_TROUBLESHOOTING.md): Solutions for common issues
- [Custom Domain Setup](./CUSTOM_DOMAIN_SETUP.md): Custom domain configuration
- [Authentication Steps](./AUTHENTICATION_STEPS.md): Setting up authentication
- [API Keys Explanation](./API_KEYS_EXPLANATION.md): Details on required API keys

## Next Steps After Deployment

1. **Configure MCP Server**: Set up the local MCP server for real-time tracking
2. **Mobile App Setup**: Configure the mobile app for real-time updates
3. **Dashboard Monitoring**: Set up monitoring dashboards
4. **Backup and Recovery**: Configure backup procedures
