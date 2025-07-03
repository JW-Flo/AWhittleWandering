# Deployment Instructions

This document outlines the deployment process for A Whittle Wandering, including local development, staging, and production deployments.

## Overview

The deployment strategy uses:
- **Local Development**: MCP stack + Workers development server
- **Staging**: Cloudflare Workers staging environment
- **Production**: Cloudflare Workers production environment

## Prerequisites

### Required Tools
- Docker Desktop
- Node.js 18+ or Bun
- Git
- curl and jq (for scripts)

### Environment Variables
Create a `.env` file in the project root with:

```bash
# Cloudflare
WRANGLER_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
CF_ZONE_ID=your_zone_id

# API Keys
TESSIE_TOKEN=your_tessie_api_token
MAPBOX_TOKEN=your_mapbox_public_token
MAPBOX_SECRET_TOKEN=your_mapbox_secret_token
OPENWEATHER_API_KEY=your_openweather_api_key

# MCP
MCP_API_KEY=your_mcp_api_key
```

### KV Namespaces
Create the following KV namespaces in Cloudflare dashboard:
- `TELEMETRY_CACHE`
- `WEATHER_CACHE` 
- `LIMIT_METRICS`

Update the IDs in `awhittlewandering/wrangler.toml`.

## Local Development

### Quick Start
```bash
# Start the MCP stack
docker compose -f configs/docker-compose.yml up -d

# Start Workers development server
cd awhittlewandering
npm run dev
# or
bun dev
```

### Full Local CI Pipeline
For a complete local test that mirrors production:

```bash
# Run the full CI pipeline
./scripts/full-local-ci-deploy.sh
```

This script:
1. Builds and starts all MCP services
2. Runs unit tests
3. Builds the frontend
4. Deploys to staging
5. Verifies the deployment

## Staging Deployment

### Automatic (via script)
```bash
./scripts/full-local-ci-deploy.sh
```

### Manual
```bash
cd awhittlewandering
wrangler deploy --env staging
```

### Verification
- **URL**: https://staging.awhittlewandering.com
- **Health**: https://staging.awhittlewandering.com/health
- **API**: https://staging.awhittlewandering.com/api/telemetry

## Production Deployment

### Via GitHub Actions
Push to `main` branch triggers automatic deployment:

```bash
git push origin main
```

### Manual
```bash
cd awhittlewandering
wrangler deploy --env production
```

### Verification
- **URL**: https://awhittlewandering.com
- **Health**: https://awhittlewandering.com/health

## API Endpoints

### Core APIs
- `GET /api/telemetry` - Live vehicle telemetry
- `GET /api/weather?lat={lat}&lon={lon}` - Weather data
- `GET /api/mapbox/*` - Proxied Mapbox requests

### Legacy APIs (via service worker)
- `GET /api/trip/current` - Current trip status
- `GET /api/trip/day/{day}` - Trip data for specific day
- `GET /api/summary/{day}` - AI-generated day summary

## Architecture Components

### Workers
- **Main Worker** (`site.ts`) - Routes requests, serves static assets
- **Telemetry DO** (`TelemetryCacheDO.ts`) - Caches live vehicle data
- **Mapbox Proxy** (`mapboxProxy.ts`) - Secure API proxy
- **Weather Cache** (`weatherCache.ts`) - Weather data caching

### MCP Services
- **Code Analysis** (port 9011) - ESLint, TypeScript, Prettier
- **Doc Processing** (port 9012) - Document parsing
- **Knowledge Graph** (port 9013) - Neo4j queries
- **Deployment** (port 9014) - Wrangler deployment
- **Test Runner** (port 9015) - Vitest execution

### External Services
- **Tessie API** - Live vehicle telemetry
- **Mapbox API** - Maps, geocoding, directions
- **OpenWeather API** - Weather data

## Performance Considerations

### Caching Strategy
- **Telemetry**: 30s in-memory, 24h KV fallback
- **Weather**: 15min Cache API, 4h KV fallback
- **Mapbox**: 5min-24h based on endpoint type
- **Static Assets**: 7 days edge cache

### Rate Limiting
- **Tessie**: Max 1 call/30s (circuit breaker)
- **Mapbox**: 5000 req/day monitoring
- **OpenWeather**: 1000 req/day free tier

### Scalability
- Cloudflare Workers auto-scale globally
- KV provides cross-PoP data consistency
- Durable Objects ensure single-instance telemetry

## Monitoring & Alerts

### Health Checks
- Worker: `/health` endpoint
- MCP Services: `/health` on each port
- External APIs: Circuit breaker monitoring

### Logging
- Workers Analytics (automatic)
- Optional Logpush to external service
- MCP container logs via Docker

### Alerts
Configure in Cloudflare dashboard:
- 5xx error rate > 2%
- Worker CPU > 50ms average
- KV operation latency

## Troubleshooting

### Common Issues

**Workers not deploying**
- Check `WRANGLER_API_TOKEN` is valid
- Verify KV namespace IDs in `wrangler.toml`
- Ensure Durable Objects are enabled

**MCP services failing**
- Check Docker Desktop is running
- Verify ports 9011-9015 are free
- Review logs: `docker compose logs <service>`

**Telemetry data stale**
- Check `TESSIE_TOKEN` is valid
- Verify circuit breaker status in logs
- Test Tessie API directly

**Map not loading**
- Verify `MAPBOX_TOKEN` in frontend build
- Check `MAPBOX_SECRET_TOKEN` for proxy endpoints
- Review Content Security Policy headers

### Debug Commands
```bash
# Check worker logs
wrangler tail

# Test MCP services
curl http://localhost:9015/run_unit

# Check container status
docker compose ps

# View service logs
docker compose logs deployment-server
```

## Security

### API Keys
- Store in Cloudflare environment variables
- Never commit to git
- Rotate regularly

### Content Security Policy
Configured in Workers with restrictions on:
- Script sources
- External connections
- Inline styles/scripts

### CORS
Configured for frontend domain only in production.

## Backup & Recovery

### Data Sources
- Trip data: Stored in KV (automatically replicated)
- Live data: Re-fetched from APIs on demand
- Static assets: Rebuilt from source

### Recovery Process
1. Redeploy from `main` branch
2. Verify KV namespace bindings
3. Check external API connectivity
4. Monitor for 5 minutes post-deployment
