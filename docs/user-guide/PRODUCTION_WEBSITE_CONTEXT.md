# 48 Continental USA Production Website Context

This document provides essential context about the 48 Continental USA (The Wandering Whittle) production website. It outlines key components, critical dependencies, and documents solutions to recurring issues we've encountered during development, particularly with map loading.

## Core Components Architecture

```
Frontend (Public Site) <--> Edge Worker <--> External APIs
```

### Frontend (Public Site)
- **Technology**: React 18, Vite, MapBox GL JS
- **Deployment**: Cloudflare Pages
- **URL**: https://main.continentalusa-site.pages.dev (production)
- **Features**: Interactive map, vehicle tracking, trip statistics, state tracking

### Edge Worker
- **Technology**: Cloudflare Workers
- **URL**: https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev
- **Purpose**: API proxy, data aggregation, WebSocket streaming
- **Features**: Caching, data transformation, authentication handling

### External APIs
- **Tessie API**: Vehicle telemetry data
- **OpenWeather API**: Weather data for route
- **MapBox API**: Map rendering services

## Critical Dependencies

### MapBox Token
- **Issue**: Direct hardcoded token in Map.jsx works more reliably than environment variable
- **Solution**: Configure environment variable `VITE_MAPBOX_TOKEN=your_mapbox_token_here`
- **Location**: `/src/components/Map.jsx`

### API Connection Configuration
- **Base URL**: https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev
- **WebSocket**: wss://thewanderingwhittle-edge.workers.dev/ws
- **Environment Variables**: Must set `VITE_USE_SIMULATED_DATA=true` for fallback if APIs unavailable

## Recurring Issues and Solutions

### Map Loading Failures
1. **Symptom**: Perpetual loading spinner on map
   - **Root Cause**: MapBox token loading incorrectly from environment variables
   - **Solution**: Hardcode MapBox token directly in Map.jsx

2. **Symptom**: Map loads but vehicle doesn't appear
   - **Root Cause**: Vehicle data API connection failure
   - **Solution**: Set `VITE_USE_SIMULATED_DATA=true` in .env

3. **Symptom**: Console errors about MapBox GL JS issues
   - **Root Cause**: CSS/JS resources not loading in correct order
   - **Solution**: Ensure mapbox-gl CSS import is before Map component initialization

### Deployment Issues
1. **Symptom**: Only partial files deployed to production
   - **Root Cause**: Exit code 130 during build process (resource limitation)
   - **Solution**: Ensure clean build environment, no background processes consuming resources

2. **Symptom**: Project name mismatch
   - **Root Cause**: Different names in wrangler.toml vs deployment scripts
   - **Solution**: Use "continentalusa-site" consistently in wrangler.toml and deployment commands

3. **Symptom**: Environment variables not available in production
   - **Root Cause**: Environment files not properly included in build
   - **Solution**: Use Cloudflare Pages environment variables or ensure .env.production is used

## Successful Build Requirements

For a successful build and deployment:

1. **Node Version**: >=20.0.0 (updated from original requirement of 24.1.0)
2. **Essential Environment Variables**:
   ```
   VITE_EDGE_WORKER_URL=https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev
   VITE_MAPBOX_TOKEN=your_mapbox_token_here
   VITE_API_BASE_URL=https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev
   VITE_USE_SIMULATED_DATA=true
   ```
3. **Required Files**: All files in the dist directory must be deployed, not just index.html
4. **Cloudflare Pages Project Name**: continentalusa-site

## Recovery Process for Website Issues

If the site is not functioning properly:

1. **Verify Edge Worker**: Confirm it's responding by checking https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev
2. **Check Map Token**: Ensure Map.jsx has the hardcoded MapBox token
3. **Rebuild with Simulated Data**: Set `VITE_USE_SIMULATED_DATA=true` in .env
4. **Deploy Complete Build**: Ensure full dist directory is uploaded to Cloudflare Pages
5. **Compare with Working Branch**: Reference recovery/map-integration-restored branch for proven working code
6. **Verification**: Use site-verification.js and verification-checklist.md to confirm functionality

## GitHub Actions Workflow

The successful deployment workflow is defined in:
- `.github/workflows/deploy-all-final.yml`

It handles:
- Setting up Node.js environment
- Deploying Edge Worker with proper secrets
- Building and deploying the public site to Cloudflare Pages

## Testing Resources

- `verification-checklist.md`: Manual verification steps
- `verify-site.sh`: Automated verification script
- `SITE_BASELINE.md`: Expected functionality definition

## Reference Deployments

- **Working Deployment**: [7d907a37.continentalusa-site.pages.dev](https://7d907a37.continentalusa-site.pages.dev)
- **Commit**: recovery/map-integration-restored branch, commit 73a0dd7
