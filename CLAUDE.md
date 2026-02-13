# Project: AWhittleWandering (Hono + Cloudflare Workers)

A journey platform for long-haul Tesla road trips with narrative moments and live presence.

## Stack
Hono v4, TypeScript strict, Zod, Cloudflare Workers, D1, KV, R2
Orchestrator: Gastown (gt) + Beads (bd)
Monorepo: backend/edge-worker, frontend (React/Vite), shared

## Commands
```bash
# Root-level
npm run dev              # backend + frontend dev servers
npm test                 # vitest (backend)
npm run build            # build all workspaces
npm run deploy           # full deployment pipeline

# Backend (backend/edge-worker)
cd backend/edge-worker
npm run dev              # wrangler dev (port 8787)
npm run test:run         # vitest run
npm run build            # esbuild bundle
npm run deploy           # wrangler deploy

# Frontend (frontend)
cd frontend
npm run dev              # vite dev server
npm run build            # vite build
npm run lint             # eslint
npm run typecheck        # tsc --noEmit

# Deployment
npm run deploy:frontend  # wrangler pages deploy
wrangler deploy --env staging     # backend to staging
wrangler deploy --env production  # backend to production
wrangler d1 migrations apply DB --remote  # apply migrations
```

## Architecture
```
backend/edge-worker/
├── src/index.ts          — Hono app, middleware chain, route mounting
├── src/routers/          — Route handlers (trips, vehicles, auth, health)
├── src/schemas/          — Zod validation schemas
├── src/middleware/        — CORS, rate limiting, auth
├── src/types/            — TypeScript types + Cloudflare bindings
├── src/services/         — Caching, aggregation, business logic
├── src/providers/        — Vehicle data provider adapters
├── src/ingestion/        — Data ingestion pipeline
├── src/importers/        — Tesla/Tessie data importers
├── migrations/           — Numbered SQL files (forward-only)
└── tests/                — unit, contract, importer tests

frontend/
├── src/components/       — UI components (dashboard, maps, shared)
├── src/pages/            — Page components
├── src/hooks/            — Custom React hooks
├── src/services/         — API client services
└── src/types/            — TypeScript types

shared/
├── schemas/canonical/    — Canonical data schemas (Zod)
└── providers/            — Provider interfaces
```

## Standards
1. All route handlers use zValidator() from @hono/zod-validator
2. NEVER put secrets in wrangler.toml — use `wrangler secret put`
3. NEVER commit .env files — .gitignore enforced
4. All DB queries use parameterized bindings (?.bind())
5. Error responses include requestId (crypto.randomUUID())
6. Structured JSON logging on all errors
7. TypeScript strict mode in all workspaces
8. Conventional Commits for all commit messages

## Workflow (Gastown-managed)
1. Mayor creates convoy with beads for the feature
2. Polecat agent creates feature branch from main
3. Implement changes with tests in feature branch
4. Run: npm test && npm run build
5. IF tests fail: revert last change, try alternative approach
6. IF tests pass: git commit (Conventional Commits), push
7. Create PR via `gh pr create --fill`
8. CI deploys preview, runs smoke tests
9. AI agent (Copilot) reviews PR; human review required only for significant platform changes
10. Merge triggers staging → production pipeline

## D1 Migration Rules
- Migrations are FORWARD-ONLY (no down migrations)
- Migrations live in backend/edge-worker/migrations/
- ALWAYS run `wrangler d1 export DB --remote --output backup.sql` before migrating
- ALWAYS test migration on staging before production
- Use D1 Time Travel for emergency recovery (30-day window)

## Error Recovery
- IF deploy fails: `wrangler rollback` (instant revert to previous version)
- IF migration fails mid-execution: D1 auto-rolls back the failed migration
- IF migration succeeds but app breaks: restore from backup.sql
- IF context window fills: work is on your Gastown hook — new session picks up

## Security
- No secrets in repo. No credentials hard-coded.
- Least privilege, zero trust.
- Pre-commit: secret scanning enforced.
- Branch protection: CI must pass, AI agent review required, human review for significant platform changes only, no force-push to main.
- Production deploys require human approval.
