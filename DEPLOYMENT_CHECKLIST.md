# Deployment Checklist

## Pre-Deployment
- [ ] Verify D1 database binding is configured
- [ ] Verify R2 storage binding is configured
- [ ] Set all required secrets (TESSIE_API_KEY, MAPBOX_ACCESS_TOKEN, etc.)
- [ ] Run database migrations
- [ ] Test all endpoints locally
- [ ] Build backend: npm run build:backend
- [ ] Build frontend: npm run build:frontend

## Deployment
- [ ] Deploy backend: cd backend/edge-worker && npx wrangler deploy
- [ ] Deploy frontend: cd frontend && npx wrangler pages deploy dist
- [ ] Verify deployment: Check Cloudflare dashboard

## Post-Deployment
- [ ] Test health endpoint: GET /api/v1/health
- [ ] Test unified data: GET /api/v1/unified-data
- [ ] Test telemetry: GET /api/v1/telemetry/status
- [ ] Test trip status: GET /api/v1/trip-status
- [ ] Verify database connectivity
- [ ] Run comprehensive audit: node scripts/comprehensive-platform-audit.js

## Critical Issues to Address

1. **Database Connectivity**
   - Verify D1 database is bound correctly
   - Test database queries
   - Check database permissions

2. **Route Accessibility**
   - Verify all routes are properly mounted
   - Test each endpoint after deployment
   - Check for 404 errors

3. **External API Configuration**
   - Set TESSIE_API_KEY secret
   - Set MAPBOX_ACCESS_TOKEN secret
   - Test external API connectivity

4. **Error Handling**
   - Ensure graceful degradation
   - Add proper error messages
   - Test error scenarios
