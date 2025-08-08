## Copilot Project Instructions (AWhittleWandering)

Purpose: Make an AI agent instantly productive while preserving security, performance, data integrity, and deployment safety.

### 1. Core Architecture

- Monorepo (Node/Bun workspaces): `frontend/` (React + Vite + TS), `backend/edge-worker/` (Cloudflare Worker + Hono), `shared/` (schemas & types), `qa/` (gating + deployment QA), `data/` (ingested/raw telemetry).
- Backend Worker stack uses Cloudflare D1 (SQL), R2 (media), KV (auth tokens only), Analytics Engine (usage metrics). All primary APIs defined in `backend/edge-worker/src/index.ts` (~large file; keep additions cohesive & small).
- Ingestion + analytics endpoints: unified data (`/api/v1/unified-data`), health (`/api/v1/health`), journal AI, component parallel endpoints (`/api/v1/component/*`), cron/maintenance endpoints (`/api/v1/cron/*`, `/api/v1/admin/*`, `/api/v1/debug/*`). Caching layer: `api_cache` table (key `unified_data_latest_v2`, 30s TTL) – reuse pattern when adding expensive aggregates.
- Logging & correlation: `utils/log.ts` (setCorrelationId, level). Prefer `log(level, event, payload)` vs `console.*` for consistency.
- Security middleware already sets CORS, security headers, analytics logging before route handlers. New APIs automatically inherit.

### 2. Conventions & Patterns

- Keep new route handlers minimal; extract complex logic into a new module under `src/` (e.g. `src/analytics/<feature>.ts`) then import inside `index.ts`.
- Always gate potentially heavy recomputation with short TTL cache (D1 table) or analytics batch job rather than recomputing per request.
- Health endpoint: add new resource / freshness fields under `resources` or `ingestion` sections without breaking existing shape (treat as append‑only; consumers expect existing keys).
- Data freshness: When adding ingestion tables, expose `ageSeconds` metrics in health for observability.
- D1 writes: Use parameterized `prepare().bind()` only; never string interpolate user input.
- State/telemetry joins: filter journey data using journey id `'continental-usa-2025'` (constant across code) to avoid cross-vehicle leakage.
- Geocoding: Use `reverseGeocode` helper; wrap in `try/catch` and log with `log('debug', 'context', { ... })`.

### 3. Build, Run & Test Workflows

- Install & bootstrap: `bun install` (root) uses workspaces.
- Dev (parallel): `bun run dev` (runs frontend & backend via workspace scripts). Backend local dev has had instability; prefer remote deploy for reliable testing: `cd backend/edge-worker && bun run deploy` (Cloudflare dev env) then curl remote URL.
- Backend build: `cd backend/edge-worker && bun run build` (esbuild bundles worker + QA scripts).
- Unified contract/schema QA: after build run `bun run build && bun run qa:contract && bun run qa:schema` inside `backend/edge-worker`.
- Frontend build & preview: `cd frontend && bun run build` then `bun run preview`.
- Full repo build: `bun run build:all` (root script orchestrates shared → backend → frontend).
- Deployment pipeline trigger: root `bun run deploy` (includes pre/post QA hooks in `qa/`). Major deployment gate: `bun run deploy:major` (invokes `qa:major-deployment`).

### 4. QA & Security Tooling

- QA automation scripts in `qa/` (e.g. `recursive-qa-pipeline.js`, `major-deployment-qa.js`) produce gating outputs; extend them instead of duplicating logic.
- Security scanning (Semgrep/Bandit/Trivy/Sonar) config lives under `docs/devsecops_super_agent_config_v4/` (import when adding CI jobs). Keep secrets out of repo; rely on Cloudflare & GitHub secrets.
- Rate limiting & auth tokens: `utils/rateLimit.ts` & KV binding (tokens) — reuse pattern for new privileged admin endpoints.

### 5. Adding / Modifying Endpoints (Checklist)

1. Create helper module if logic > ~50 lines.
2. Register route in `index.ts` (group similar endpoints together; keep commentary concise).
3. Add caching if expensive (pattern: select cache row → build → insert with short expiry).
4. Extend health metrics if new subsystem (avoid breaking existing keys).
5. Add QA validation or contract test (place under `src/qa/` and include in build script list).
6. Deploy to remote and verify with curl (capture response time for potential performance metrics).

### 6. Observability

- Analytics: Every request logs to Analytics Engine + D1 `analytics_events`. For new batch jobs, add explicit `log('info', 'job.start', {...})` & `job.end`.
- Performance: Health endpoint collects response time; extend with p95/p99 only after storage model chosen (avoid large writes per request).
- Correlation ID: Present in logs per request; propagate if adding downstream fetches (include header `X-Correlation-ID`).

### 7. Frontend Integration Notes

- Dynamic Mapbox loader (reduces initial bundle) located in `frontend/src/lib/mapbox-loader.ts`; keep additional map features lazy via dynamic imports.
- API base URL surfaced via `/api/v1/config`; when adding feature flags update that endpoint to keep frontend decoupled from environment direct reads.
- Use React Query for data fetching patterns (create new hook under `frontend/src/hooks/` mirroring existing ones).

### 8. Migrations & Data Changes

- D1 schema adjustments require coordinated deploy (update any creation scripts + add health verification). Provide idempotent `INSERT OR REPLACE` when evolving aggregated summary tables.
- For large backfill/repair tasks, model after existing admin endpoints (`/api/v1/admin/*`); ensure they are safe & idempotent.

### 9. DO / AVOID Quick Reference

- DO: Append new metrics/fields (avoid breaking consumers). DO: Cache heavy aggregates. DO: Use structured logging. DO: Keep journey id constant.
- AVOID: Hardcoded secrets, unbounded scans per request, adding large dependencies to worker bundle, rewriting health response structure, bypassing rate limit utilities.

---

Refine this file when architecture, build scripts, or deployment flows change. Keep under ~50 lines of actionable guidance.
