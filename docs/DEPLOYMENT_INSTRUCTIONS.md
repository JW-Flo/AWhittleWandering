# 48 Continental USA - Deployment Instructions

**Last Updated:** June 6, 2025, 4:50 AM CDT

## Overview

This document provides step-by-step instructions for completing the deployment of the 48 Continental USA project. With the critical issues now fixed, these instructions will guide you through deploying the components and verifying their functionality.

## Prerequisites

Before proceeding with deployment, ensure you have:

1. **Cloudflare Credentials:**
   - Cloudflare API Token with appropriate permissions
   - Cloudflare Account ID

2. **Environment Variables:**
   - Tessie API Token
   - Mapbox API Token
   - OpenWeather API Key

3. **Development Environment:**
   - Node.js 24.x or later
   - npm 10.x or later

## Step 1: Deploy the Edge Worker API

The Edge Worker API has been fixed and is currently operational. If you need to redeploy it:

```bash
cd edge-worker
npm ci
npx wrangler deploy
```

**Verification:**
```bash
# Check vehicle endpoint
curl -s "https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev/api/vehicle" | jq

# Check trip endpoint
curl -s "https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev/api/trip" | jq

# Check weather endpoint
curl -s "https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev/api/weather" | jq
```

## Step 2: Deploy the Public Site

The public site needs to be redeployed to connect to the fixed Edge Worker API. Use the provided deployment script:

```bash
# Set required environment variables
export CLOUDFLARE_API_TOKEN="your-api-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"

# Run the deployment script
./scripts/deploy-public-site.sh
```

**Manual Deployment (if needed):**
```bash
cd 48Continental_Starter/public-site
npm ci
cp .env.production .env
echo "VITE_API_BASE_URL=https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev" >> .env
npm run build
npx wrangler pages deploy dist --project-name=continentalusa-site
```

**Verification:**
- Open https://continentalusa-site.pages.dev in your browser
- Verify that the map loads correctly
- Confirm that vehicle data is displayed
- Check that the route and stops are visible

## Step 3: Test iOS Client (if applicable)

If you're using the iOS client:

```bash
cd ios-client
./Scripts/setup-environment.sh
cd fastlane
bundle exec fastlane test
```

**Testing Notes:**
- Ensure the API base URL is set correctly in the iOS client
- Verify that the Map component displays vehicle location
- Confirm that telemetry data is refreshing correctly

## Step 4: Start the MCP Server

The MCP (Mission Control Platform) server coordinates the entire system:

```bash
cd mcp-server
npm ci
npm run start
```

**Configuration:**
- Ensure the `.env` file in `mcp-server` has the correct API endpoint
- Verify that the MCP server can connect to the Edge Worker API
- Confirm that agent orchestration is functioning correctly

## Monitoring the Deployment

To monitor the health of the deployment:

```bash
# Check Edge Worker logs
cd edge-worker
npx wrangler tail

# Monitor site deployment status
cd 48Continental_Starter/public-site
npx wrangler pages deployment list --project-name=continentalusa-site
```

## Troubleshooting Common Issues

### 1. Public Site 404 Error
If the site still returns a 404 after deployment:
- Verify that the deployment completed successfully
- Check Cloudflare Pages dashboard for any build errors
- Ensure the project name is correct (`continentalusa-site`)

### 2. API Connection Issues
If the site loads but can't connect to the API:
- Check CORS settings in the Edge Worker
- Verify environment variables in the public site build
- Check browser console for specific error messages

### 3. Map Not Displaying
If the map component doesn't render:
- Verify Mapbox token is correctly set
- Check browser console for specific React errors
- Ensure the Map.jsx fixes were applied correctly

## Next Steps

Once the deployment is complete:

1. **Update Documentation:**
   - Update `docs/DEPLOYMENT_STATUS.md` with the current status
   - Mark completed items in `docs/DEPLOYMENT_FIX_SUMMARY.md`

2. **Plan Monitoring Strategy:**
   - Set up uptime monitoring for the APIs
   - Configure alerts for critical failures
   - Establish a backup and recovery procedure

3. **Prepare for Launch:**
   - Conduct a final end-to-end test of all systems
   - Verify mobile responsiveness of the public site
   - Create a launch checklist for the road trip start date

## Conclusion

With these deployment steps completed, the 48 Continental USA tracking system should be fully operational. The fixed Edge Worker API ensures reliable vehicle data retrieval, and the repaired Map component will correctly display the journey's progress.

Remember to maintain regular backups of critical data and monitor the system's performance throughout the road trip. Good luck with your 48-state Tesla adventure!
