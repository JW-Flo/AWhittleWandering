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

## GitHub Access

**Do NOT use MCP GitHub tools.** Use the GitHub REST API via `curl` with the `GH_PAT` env var:
```bash
TOKEN="$(printenv GH_PAT)"
# Authenticated request pattern:
curl -sS -H "Authorization: Bearer ${TOKEN}" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/JW-Flo/AWhittleWandering/..."
```

Common API endpoints (relative to `https://api.github.com/repos/JW-Flo/AWhittleWandering`):
- `GET /pulls?state=open` — list open PRs
- `POST /pulls` — create PR (JSON body: title, head, base, body)
- `POST /pulls/{n}/requested_reviewers` — assign reviewer (see below for login)
- `GET /pulls/{n}/reviews` — get reviews
- `GET /pulls/{n}/comments` — get review comments
- `PUT /pulls/{n}/merge` — merge PR (JSON: `{"merge_method":"squash"}`)
- `DELETE /git/refs/heads/{branch}` — delete branch after merge
- `GET /commits/{sha}/check-runs` — check CI status

Automated reviewer login: `"copilot"` (GitHub Copilot pull-request reviewer bot).

### Retry Pattern for Token Contention

**The GitHub API is always the best solution** — it just may need retry-with-backoff for rate limits or token contention. The retry pattern handles transient failures reliably:

```bash
# Retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s)
for attempt in {1..4}; do
  if curl -sS -H "Authorization: Bearer ${TOKEN}" ...; then
    break
  fi
  sleep $((2 ** attempt))
done
```

If API calls fail with 403, 429, or 5xx errors, wait a few seconds and retry. The retry-with-backoff pattern handled the `gh_pat` token contention — just needed persistence.

## PR Workflow

1. **Branch**: Create/checkout feature branch from main
2. **Implement**: Make changes with tests
3. **Verify locally**: `npm test && npm run build` — if tests fail, fix before proceeding
4. **Commit**: Use Conventional Commits, then `git push -u origin <branch>`
5. **Create PR**: `POST /pulls` with title, head branch, base: main, and body (summary + test plan)
6. **Assign Copilot**: `POST /pulls/{n}/requested_reviewers` with `{"reviewers":["copilot"]}` (the bot login)
7. **Wait for CI + review**: Poll `GET /commits/{sha}/check-runs` and `GET /pulls/{n}/reviews` until:
   - All CI checks pass (security, quality, tests, build)
   - Copilot/Codex review completes
8. **Address review comments**: If Copilot/Codex requests changes:
   - `GET /pulls/{n}/comments` to read specific feedback
   - Make the requested fixes
   - Commit and push to the same branch (PR updates automatically)
   - Re-check reviews until approved or no blocking comments remain
9. **Merge**: `PUT /pulls/{n}/merge` with `{"merge_method":"squash"}`
10. **Clean up**: `DELETE /git/refs/heads/{branch}` to remove the merged branch

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
