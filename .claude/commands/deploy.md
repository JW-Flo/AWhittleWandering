# Deploy

Run the full deployment pipeline for AWhittleWandering.

## Steps
1. Run tests: `npm test`
2. Run build: `npm run build`
3. Deploy backend to staging: `cd backend/edge-worker && wrangler deploy --env staging`
4. Verify staging health: `curl -sf https://staging-api.awhittlewandering.com/api/v1/health`
5. Report status and wait for human approval before production
