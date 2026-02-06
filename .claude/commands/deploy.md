# Deploy

Run the full deployment pipeline for AWhittleWandering.

## Steps
1. Run tests: `npm test`
2. Run build: `npm run build`
3. Deploy backend to development: `cd backend/edge-worker && wrangler deploy --env development`
4. Verify development health: `curl -sf "${DEVELOPMENT_API_URL}/health"`  # Set DEVELOPMENT_API_URL in your shell environment to the development API base URL (e.g., export DEVELOPMENT_API_URL=https://awhittlewandering-api-dev.workers.dev)
5. Report status and wait for human approval before production
