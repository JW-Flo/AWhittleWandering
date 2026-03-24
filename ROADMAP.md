# A Whittle Wandering — Full Operating Roadmap

This roadmap consolidates the **Agent Execution Roadmap** and **Multi‑OEM Telemetry + Swarm CI/CD Roadmap** into a single, actionable operating plan.

## Principles (Non‑Negotiables)
- **Single source of truth:** clients consume only `/api/v1/unified-data`.
- **Server-side aggregation:** no client-side totals/averages.
- **Deterministic AI:** HMAC seeds ensure reproducible narratives.
- **Privacy by default:** public responses never expose raw GPS (H3 redaction).
- **Idempotent ingestion:** dedupe keys on all imports.
- **Provider-agnostic:** Tesla is not special; adapters emit canonical events.
- **Raw payloads immutable:** raw telemetry stored in append-only R2.
- **CI swarm gates:** LLM steps are advisory only, secret-blind.

---

## Phase 0 — Critical Data Pipeline Fix (Blocker)
**Goal:** Populate canonical tables from raw Tessie data.

**Deliverables**
- `backend/edge-worker/migrations/0007_etl_tessie_to_canonical.sql` (ETL migration)
- `scripts/import-charges.ts` (CSV charge import)
- `states_visited` derived and journey totals updated

**Success Criteria**
- `drives` >= 900, `charges` ≈ 259
- `journeys.total_miles`, `total_drives`, `total_energy_used_kwh` non‑zero

**Verification**
- `wrangler d1 execute tesla_drive_db --remote --command="SELECT COUNT(*) FROM drives;"`
- `wrangler d1 execute tesla_drive_db --remote --command="SELECT total_miles,total_drives,total_energy_used_kwh FROM journeys WHERE id='continental-usa-2025';"`

---

## Phase 1 — Security Hardening
**Goal:** Privacy, rate limiting, CORS, request tracking.

**Deliverables**
- `middleware/privacy.ts` (H3 tiered redaction)
- `middleware/rate-limit.ts` (KV-backed limiter)
- `middleware/cors.ts` (prod + localhost)
- `middleware/logging.ts` (request IDs + JSON logs)
- Middleware wired in `src/index.ts`

**Success Criteria**
- CORS + rate limit headers present
- 101st request/min returns 429
- Every response includes `X-Request-ID`
- JSON logs visible via `wrangler tail`

**Verification**
- `curl -I https://api.awhittlewandering.com/api/v1/health` (CORS + rate limit headers)
- `wrangler tail` (JSON log entries)

---

## Phase 2 — Unified API Completion
**Goal:** Provide unified data endpoint for all clients.

**Deliverables**
- `src/schemas/unified-data.ts`
- `src/routers/unified.ts`
- `src/routers/public.ts` (`/journeys`, `/journeys/:id/stats`)

**Success Criteria**
- `GET /api/v1/unified-data?journeyId=continental-usa-2025` returns valid schema
- `GET /api/v1/journeys` and stats endpoints return data
- Cache returns `cacheHit: true` on repeat

**Verification**
- `curl "https://api.awhittlewandering.com/api/v1/unified-data?journeyId=continental-usa-2025"`
- `curl "https://api.awhittlewandering.com/api/v1/journeys"`

---

## Phase 3 — AI Narrative Generation
**Goal:** Deterministic narrative generation (Claude API).

**Deliverables**
- `services/narrative-seed.ts`
- `services/narrative-generator.ts`
- `routers/narratives.ts`

**Success Criteria**
- Same seed → same narrative
- Cache hit rate > 95%
- Cost < $0.75 per 100 waypoints

**Verification**
- Same input returns identical narrative hash
- KV cache hit ratio >= 95%

---

## Phase 4 — Frontend Implementation
**Goal:** React map + timeline UI powered by unified data.

**Deliverables**
- MapView + Timeline components
- Zustand journey store
- Loading/error UX

**Success Criteria**
- Map renders route + charge points
- Timeline events clickable and sync map
- Mobile responsive, Lighthouse > 90

**Verification**
- Map + timeline sync verified locally
- Lighthouse > 90 on mobile profile

---

## Phase 5 — Production Launch
**Goal:** Safe deploy + monitoring.

**Deliverables**
- Migrations applied, secrets set, KV bindings verified
- CI/CD gates passing
- Health + smoke tests after deploy

**Success Criteria**
- `/health` and `/api/v1/unified-data` succeed post‑deploy
- Rollback ready (`wrangler rollback` / Pages rollback)

**Verification**
- `curl https://api.awhittlewandering.com/api/v1/health`
- `curl "https://api.awhittlewandering.com/api/v1/unified-data?journeyId=continental-usa-2025"`

---

# Multi‑OEM Expansion Track

## P0 — Canonical Contract Foundation
**Deliverables**
- `shared/schemas/canonical/*.ts` (Zod)
- `shared/providers/provider-interface.ts`
- Schema registry + versioning

## P1 — Tesla/Tessie Adapter (First-class, not special)
- Adapter emits canonical events only
- ETL idempotent + replayable from raw

## P2 — Second Provider (Proof of OEM neutrality)
- Add mock/broker adapter
- Contract tests enforced in CI

## P3 — Public SDK + OpenAPI
- OpenAPI snapshot in CI
- Typed client generation

## P4 — Analytics + Narratives (Provider-independent)
- All analytics/narratives use canonical events only

---

# CI/CD Swarm Gates
**Required Parallel Jobs**
- Lint + typecheck
- Unit tests
- Security scan
- Schema snapshot + adapter contract replay
- Migration + ETL idempotency checks
- Build (frontend + backend)

**Synthesis Gate**
- Blocks merge on security, contract, migrations, or build failure.

**Current workflow references**
- `.github/workflows/ci-preflight.yml`
- `.github/workflows/ci-swarm.yml`

---

# Operating Rules
- No manual deploys outside CI/CD.
- No raw GPS for public responses.
- No Tesla-specific UI or shared service logic.
- Never swallow errors; log structured JSON.
- Always use Zod validation for inputs.


## Auto-Update: 2026-03-24

> Generated by local-devops-ai agent loop

### Completed

- [x] **Implement CORS headers** *(dry-run)* — files: src/api.ts, src/middleware.ts

### Needs Attention

- [ ] **Populate canonical tables from raw Tessie data** — LLM produced no code changes
- [ ] **Move service-specific tests to tests/<service>/** — LLM produced no code changes

### Deferred

- [ ] **Update imports to reflect new directory structure** — Unmet dependencies: task-move-service-tests
- [ ] **Append single feed entry referencing all moved groups** — Unmet dependencies: task-update-imports

**Stats:** 3 dispatched, 1 succeeded, 2 failed, 2 skipped (37308ms)
