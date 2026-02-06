# Deploy

Run the full deployment pipeline for AWhittleWandering.

## Prerequisites
- Set DEVELOPMENT_API_URL environment variable to your development API base URL:
  ```bash
  export DEVELOPMENT_API_URL=https://awhittlewandering-api-dev.workers.dev
  ```

## Steps
1. Run tests: `npm test`
2. Run build: `npm run build`
3. Deploy backend to development: `cd backend/edge-worker && wrangler deploy --env development`
4. Verify development health: `curl -sf "${DEVELOPMENT_API_URL}/health"`
5. Report status and wait for human approval before production
