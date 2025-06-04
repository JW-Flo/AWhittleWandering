# The Wandering Whittle – Deployment Strategy

This document outlines the comprehensive deployment strategy for The Wandering Whittle project. It provides detailed instructions, verification steps, and troubleshooting guidance for each component to ensure consistent and reliable deployments.

---

## Deployment Principles

1. **Sequence Matters**: Components must be deployed in the correct order due to dependencies
2. **Verify Each Step**: Each deployment must be verified before proceeding to the next
3. **Consistent Environments**: Environment variables must be consistent across all components
4. **No Mock Data**: All deployments must use real API integrations, not test or mock data
5. **Fallback Mechanisms**: Every component must have proper error handling and fallbacks

---

## Deployment Sequence

### 1. Edge Worker Deployment

**Prerequisites**:
- Valid Cloudflare API token with Worker permissions
- Tessie API token
- MapBox API token
- Weather API key

**Deployment Steps**:
```bash
# From project root
cd edge-worker

# Install dependencies
npm install

# Verify configuration
npm run validate-config

# Deploy to Cloudflare
# Note: All wrangler commands should use npx wrangler instead of global wrangler
npx wrangler deploy
```

**Verification**:
1. Verify endpoints are accessible:
   ```bash
   curl https://continentalusa.workers.dev/health
   ```
2. Verify Tessie API integration:
   ```bash
   curl -H "Authorization: Bearer ${EDGE_HMAC_KEY}" https://wanderingwhittle.workers.dev/tessie/status
   ```
3. Verify all KV bindings are properly configured in Cloudflare dashboard

**Troubleshooting**:
- If deployment fails with KV errors, verify KV namespaces exist and are properly bound
- If authentication fails, check EDGE_HMAC_KEY consistency
- If Tessie API fails, verify the API token is valid

### 2. MCP Server Startup

**Prerequisites**:
- Node.js v16+ installed
- Edge Worker successfully deployed and accessible
- Port 3000 available on the host machine

**Startup Steps**:
```bash
# From project root
cd mcp-server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with appropriate values

# Start the server
npm start
```

**Verification**:
1. Check server is running:
   ```bash
   curl http://localhost:3000/health
   ```
2. Verify Edge Worker connectivity:
   ```bash
   curl http://localhost:3000/api/edge-worker/status
   ```
3. Check agent registration:
   ```bash
   curl http://localhost:3000/api/agents
   ```

**Troubleshooting**:
- If server fails to start, check port conflicts
- If Edge Worker connection fails, verify EDGE_WORKER_URL and EDGE_HMAC_KEY in .env
- If database errors occur, check data directory permissions

### 3. Public Website Deployment

**Prerequisites**:
- Cloudflare Pages account configured
- Edge Worker successfully deployed and accessible
- Node.js v16+ installed

**Deployment Steps**:
```bash
# From project root
cd 48Continental_Starter/public-site

# Install dependencies
npm install

# Build the site
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy ./dist --project-name wandering-whittle
```

**Verification**:
1. Visit the deployed site (https://continentalusa.pages.dev)
2. Verify map loads with current vehicle location
3. Check that trip statistics are displayed
4. Test offline functionality by disabling network in browser devtools

**Troubleshooting**:
- If "Nothing is here yet" appears, check that Pages project is properly configured
- If map fails to load, verify MAPBOX_TOKEN is set
- If data doesn't appear, check Edge Worker URL configuration

### 4. Mobile Apps Deployment

**Prerequisites**:
- Edge Worker successfully deployed and accessible
- MCP Server running
- Required development SDKs installed (Xcode, Android Studio)

**Deployment Steps**:
```bash
# React Native App
cd ContinentalUSA-mobile
npm install
npm run build:ios
npm run build:android

# iOS Native App
cd ios-client
swift build
```

**Verification**:
1. Install the built app on a test device
2. Verify connection to Edge Worker
3. Check that vehicle data is displayed
4. Test offline functionality

**Troubleshooting**:
- If app fails to connect, check API endpoint configuration
- If builds fail, verify all dependencies are installed
- If authentication fails, check HMAC key configuration

---

## Verification Script

A comprehensive verification script is provided to check all components after deployment:

```bash
# From project root
./scripts/verify-deployment.sh
```

This script checks:
1. Edge Worker accessibility and endpoints
2. MCP Server health and agent registration
3. Public Website accessibility and data display
4. Mobile Apps build artifacts

---

## Rollback Procedures

### Edge Worker Rollback
```bash
cd edge-worker
npx wrangler rollback
```

### Public Website Rollback
```bash
cd 48Continental_Starter/public-site
npx wrangler pages deployment rollback --project-name continentalusa-site
```

### MCP Server Rollback
```bash
cd mcp-server
git checkout [previous-version] src/
npm install
npm start
```

### Mobile Apps Rollback
Reinstall previous version from distribution channel or local archive.

---

## Environment Configuration Reference

For detailed environment configuration, refer to the `.env.example` files in each component directory. Critical environment variables include:

- `EDGE_HMAC_KEY`: Must be consistent across all components
- `EDGE_WORKER_URL`: URL of the deployed Edge Worker
- `MAPBOX_TOKEN`: Required for map functionality
- `TESSIE_API_TOKEN`: Required for Tessie API access

---

## Monitoring & Alerts

After deployment, monitor system health through:

1. Cloudflare Workers analytics dashboard
2. MCP Server logs (`mcp-server/logs/`)
3. Cloudflare Pages analytics
4. Email alerts configured for critical errors

---

## Common Deployment Issues

1. **"Nothing is here yet" on Cloudflare Pages**
   - Solution: Verify build command and output directory in Pages project settings
   - Check: Pages project should use `npm run build` and output directory `dist`

2. **Edge Worker 401/403 Errors**
   - Solution: Verify HMAC keys are consistent across all components
   - Check: Environment variables in all `.env` files

3. **Map Not Loading**
   - Solution: Verify MapBox token is valid and properly configured
   - Check: MAPBOX_TOKEN in public-site environment

4. **Tessie API Connection Failures**
   - Solution: Verify Tessie API token is valid
   - Check: Edge Worker logs for authentication errors

5. **MCP Server Connection Issues**
   - Solution: Verify network connectivity between components
   - Check: Firewall settings and network configuration

---

_Last updated: 2025-06-03_
