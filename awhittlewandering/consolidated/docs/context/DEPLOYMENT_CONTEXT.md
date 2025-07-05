# 48 Continental USA Deployment Context

This document provides essential context about the deployment environment, endpoints, and configuration for the 48 Continental USA road trip tracking system.

## API Endpoints

### Base URLs

| Environment | URL |
|-------------|-----|
| Production (workers.dev) | https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev |
| Custom Domain (not active) | https://trip.thewanderingwhittle.com |
| Public Site | https://main.continentalusa-site.pages.dev |

### API Reference

| Endpoint | Method | Description | Example Response |
|----------|--------|-------------|-----------------|
| `/test` | GET | Basic health check | `{"status":"ok","version":"1.0.0","time":"2025-06-06T08:16:56.818Z","environment":"production"}` |
| `/api/v1/status` | GET | Detailed API status | `{"version":"1.0.0","environment":"production","status":"ok"}` |
| `/api/vehicle` | GET | Vehicle telemetry data | `{"name":"Midnight Shadow","batteryLevel":97,"range":"262.76 miles"}` |
| `/api/trip` | GET | Trip itinerary and progress | `{"visitedStates":["TX","LA","MS",...]}` |
| `/api/weather` | GET | Current weather at vehicle location | Weather data object |

## Cloudflare Configuration

### Workers

| Setting | Value |
|---------|-------|
| Worker Name | thewanderingwhittle-edge |
| Worker Environment | production |
| Workers Domain | kd8jc7v8cd.workers.dev |
| CORS | Enabled for all origins (*) |
| Memory Limit | 128 MB |
| Cron Triggers | None currently configured |

### KV Namespaces

| Namespace | ID | Purpose |
|-----------|----|---------| 
| APP_KV | [ID in wrangler.toml] | Application configuration |
| ITINERARY_KV | [ID in wrangler.toml] | Trip itinerary data |

### Pages

| Setting | Value |
|---------|-------|
| Project Name | continentalusa-site |
| Production Branch | main |
| Framework | React |
| Build Command | npm run build |
| Build Output Directory | build |

## Environment Variables

### Edge Worker

Key environment variables configured in `.dev.vars`:

```
TESSIE_API_TOKEN=*****
TESSIE_VEHICLE_VIN=*****
OPENWEATHER_API_KEY=*****
MAPBOX_ACCESS_TOKEN=*****
```

### Public Site

Key environment variables configured in `.env.production`:

```
REACT_APP_API_URL=https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev
REACT_APP_MAPBOX_TOKEN=*****
REACT_APP_VERSION=1.0.0
```

## Deployment Scripts

| Script | Purpose |
|--------|---------|
| `scripts/fix-deployment-routes.cjs` | Fixes route configuration in wrangler.toml |
| `scripts/monitor-deployment.sh` | Checks status of all deployment components |
| `scripts/verify-deployment.sh` | Verifies successful deployment |
| `scripts/check-api-data.cjs` | Verifies API data structure and content |
| `scripts/upload-fixed-itinerary.cjs` | Uploads corrected itinerary data |

## GitHub Actions Workflow

The CI/CD pipeline is configured in `.github/workflows/deploy-all-final.yml` with the following stages:

1. **Setup**: Install dependencies
2. **Build**: Build edge worker and public site
3. **Test**: Run tests against built components
4. **Deploy**: Deploy to Cloudflare Workers and Pages
5. **Verify**: Run post-deployment verification

## Domain Configuration Options

1. **Option A: Continue with workers.dev domain**
   - Simpler approach with no additional configuration
   - Uses URL: https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev
   - Already functional and deployed

2. **Option B: Set up custom domain**
   - More professional approach with branded URL
   - Requires domain registration and DNS configuration
   - Would use URL: https://trip.thewanderingwhittle.com
   - Currently not configured

## Next Steps for Final Deployment

1. **Decide on domain strategy**:
   - For workers.dev domain: No additional configuration needed
   - For custom domain:
     1. Register domain if not already owned
     2. Configure DNS in Cloudflare
     3. Update wrangler.toml with domain info
     4. Re-deploy edge worker

2. **Deploy with GitHub Actions**:
   - Push changes to GitHub repository
   - GitHub Action will handle the deployment process
   - Verify deployment with monitoring scripts

3. **Final Verification**:
   - Run `scripts/monitor-deployment.sh` to verify all components
   - Check all API endpoints manually
   - Verify data appears correctly on public site

4. **Configure MCP Server**:
   - Set up for persistent operation
   - Configure telemetry buffering
   - Connect to edge worker
