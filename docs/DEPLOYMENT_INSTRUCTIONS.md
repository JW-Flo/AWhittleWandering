# 48 Continental USA Deployment Instructions

This document provides comprehensive instructions for deploying the 48 Continental USA project to Cloudflare. The deployment process involves several components including the edge worker API, public site, and data management.

## Prerequisites

Before deploying, ensure you have:

1. Node.js v18+ installed
2. Wrangler CLI installed (`npm install -g wrangler`)
3. Cloudflare account with proper permissions
4. All required API keys:
   - Tessie API token
   - OpenWeather API key
   - Mapbox token
   - Edge HMAC key

## Deployment Steps

### 1. Prepare Environment Variables

Ensure all required environment variables are configured in the appropriate files:

- Edge worker: `.dev.vars` file in the `edge-worker` directory
- Public site: `.env.production` file in the `48Continental_Starter/public-site` directory

### 2. Process Itinerary Data

The itinerary is the core data structure for the entire application. Process it with:

```bash
# Convert itinerary CSV to JSON with coordinates
node scripts/update-itinerary-with-coords.cjs

# Verify generated files:
# - itinerary.json (simplified format for local use)
# - itinerary-full.json (GeoJSON format)
# - edge-worker/trip-data.json (KV upload format)
```

### 3. Deploy Edge Worker

The edge worker provides the API layer for the application:

```bash
# Upload itinerary data to Cloudflare KV
cd edge-worker
npx wrangler kv bulk put trip-data.json --binding=ITINERARY_KV --remote

# Deploy the edge worker
npx wrangler deploy
```

### 4. Deploy Public Site

The public site is the frontend interface for users:

```bash
# Build and deploy the site
cd 48Continental_Starter/public-site
npm run build
npx wrangler pages deploy dist
```

### 5. Verify Deployment

Verify that all components are correctly deployed and functioning:

```bash
./scripts/verify-deployment.sh
```

The verification script checks:
- Edge worker connectivity
- Itinerary API accessibility
- Public site availability
- Basic data integrity

## Troubleshooting

### Common Issues

1. **Environment Variables Missing**
   - Check that all required environment variables are properly set in both the edge worker and public site

2. **KV Data Not Available**
   - Ensure the KV namespaces are correctly configured in `wrangler.toml`
   - Verify KV data was uploaded successfully with `wrangler kv key get itinerary --binding=ITINERARY_KV`

3. **CORS Issues**
   - If the frontend can't access the API, check CORS headers in the edge worker

4. **Build Failures**
   - For public site build issues, check npm dependencies and ensure all required files exist

### Recovering from Failed Deployments

If a deployment fails:

1. Check Cloudflare logs in the dashboard
2. Rollback to previous version if necessary
3. Address the specific error and redeploy

## Custom Domain Setup

Once deployment is verified, configure a custom domain:

1. Register domain in Cloudflare (if not already done)
2. Uncomment the domain settings in `edge-worker/wrangler.toml`
3. Add custom domain to Pages project in Cloudflare dashboard
4. Update DNS settings to point to Cloudflare

## Monitoring and Maintenance

After successful deployment:

1. Monitor application performance using Cloudflare analytics
2. Set up alerts for any critical failures
3. Schedule regular updates for API keys and dependencies

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/commands/)
