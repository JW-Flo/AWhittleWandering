# Deploy

Run the full deployment pipeline for AWhittleWandering.

## Steps
1. Run tests: `npm test`
2. Run build: `npm run build`
3. Deploy backend to staging: `cd backend/edge-worker && wrangler deploy`
4. Verify staging health: `curl -sf https://awhittlewandering-api-staging.workers.dev/api/v1/health`