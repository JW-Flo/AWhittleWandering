## Copilot Project Instructions (AWhittleWandering)

### 0. TL;DR (First 5 Things)
- Add >50 line logic in new module (`src/<area>/<feature>.ts`), import in `index.ts`.
- Heavy aggregate? Check `api_cache`; reuse pattern (30s TTL) before computing.
- Health response: only append; never rename/remove existing keys.
- All D1 writes parameterized (`prepare().bind()`); no string interpolation.
- Always scope telemetry/journey joins to `journey_id = 'continental-usa-2025'`.
- Live change feed (machine‑readable): `docs/roadmap/live-change-log.ndjson` (append-only; validate with `live-change-feed.schema.json`).
- Agents manifest: `docs/roadmap/agents-manifest.json` (roles, capabilities, ownership domains).
- Cross‑repo manifest: `docs/roadmap/multi-repo-manifest.json` (authoritative repo purposes & doc anchors).
- Context resolution spec: see Section 13 (agent framework (Codex/Kline/Cline) alignment).

Purpose: Make an AI agent instantly productive while preserving security, performance, data integrity, and deployment safety.

### 1. Core Architecture
- Monorepo workspaces: `frontend/` (React+Vite+TS), `backend/edge-worker/` (Cloudflare Worker + Hono), `shared/` (schemas & types), `qa/`, `data/`.
- Backend uses: D1 (SQL), R2 (media), KV (auth tokens only), Analytics Engine (usage). Main router: `backend/edge-worker/src/index.ts`.
- Key endpoints: unified data `/api/v1/unified-data`, health `/api/v1/health`, journal AI, component parallel `/api/v1/component/*`, cron/admin/debug namespaces.
- Cache table: `api_cache` (e.g. key `unified_data_latest_v2`, 30s TTL). Reuse instead of recomputing per request.
- Logging via `utils/log.ts` (`log(level,event,payload)`); correlation id set automatically.

### Invariants (Do Not Break)
- Append‑only health & config responses.
- Journey isolation constant: `continental-usa-2025`.
- Structured logging (no raw `console.*` except in build tooling).
- Parameterized DB only; zero user input interpolation.
- No long synchronous scans; prefer cached aggregate or batch job.
- Secrets never stored in repo (reference binding/secret names only).

### 2. Conventions & Patterns
- New feature logic > ~50 lines → extract module (`src/{analytics,ai,ingestion,...}/`).
- Handler shape: validate → fast cache read → compute (guarded) → cache write (short TTL) → return.
- Geocoding: `reverseGeocode` inside try/catch; on failure log `debug` with context (no throw unless required).
- Prefer small cohesive PR-sized additions to `index.ts`; keep commentary terse.

### Heuristics
- Add cache if: joins >1 table OR result size >5KB OR compute >30ms median.
- Extract module if: multiple consumers OR unit-testable pure logic OR risk of future branching.
- Use batch/cron if recomputation cadence < per-request (e.g. hourly rollups).

### 3. Build, Run & Test Workflows
- Bootstrap: `bun install` (root).
- Dev (parallel): `bun run dev`.
- Remote dev (preferred for backend stability): `cd backend/edge-worker && bun run deploy`.
- Backend build + contract/schema QA: `bun run build && bun run qa:contract && bun run qa:schema` (in backend).
- Frontend: `bun run build && bun run preview` (in `frontend`).
- Full chain: `bun run build:all`.
- Deploy pipeline: root `bun run deploy`; major gate: `bun run deploy:major` (invokes extended QA).

### 4. QA & Security Tooling
- Extend existing scripts in `qa/` (avoid new parallel frameworks).
- Security scanning configs under `docs/devsecops_super_agent_config_v4/`.
- Rate limiting & token auth: reuse `utils/rateLimit.ts` + KV binding pattern.

### 5. Adding / Modifying Endpoints (Checklist)
1. Module (if >50 lines or reused).
2. Import + register route in `index.ts` near related group.
3. Add cache read/write (short TTL) if any non-trivial aggregation.
4. Extend health (append only) if new resource/freshness dimension.
5. Add contract/schema/QA test under `src/qa/`.
6. Remote deploy + curl (capture latency; watch logs).
7. Update roadmap change log (docs/roadmap).

### 6. Observability
- Every request auto-logged (analytics + D1).
- Batch / cron: explicit `log('info','job.start', {...})` + `job.end`.
- Defer p95/p99 metrics until storage model fixed (avoid per-request heavy writes).
- Propagate correlation id to outbound fetches via `X-Correlation-ID`.

### 7. Frontend Integration Notes
- Mapbox loaded lazily: `frontend/src/lib/mapbox-loader.ts`; keep new map features dynamic.
- Runtime config surfaced via `/api/v1/config`; extend for feature flags (avoid env leaks).
- Data fetching: React Query hooks under `frontend/src/hooks/` (mirror naming).
- Avoid large initial bundle growth (prefer code-split + dynamic import).
 - Console Auth: Prefer Cloudflare Access SSO (header `CF-Access-Authenticated-User-Email`) over password. Env flags: `USE_CF_ACCESS=true`, `SUPER_ADMIN_EMAIL=joe.whittle@atlasit.pro`. Legacy password route retained only for fallback; remove secrets when Access confirmed.
 - Auth Provider Abstraction: Console now uses pluggable providers (`src/lib/auth/provider.ts`). Current active: Cloudflare Access only (super admin bootstrap). Deprecated password endpoint returns HTTP 410 (scheduled removal). Future OIDC: implement provider resolving JWT → UserPrincipal.

### 8. Migrations & Data Changes
- D1 schema change: coordinate deploy + update creation scripts + health freshness metric (`ageSeconds`).
- Aggregated summary tables: use `INSERT OR REPLACE` idempotent writes.
- Large backfill/repair: implement safe idempotent admin endpoint (`/api/v1/admin/*`) with rate limiting.

### 9. DO / AVOID Quick Reference
DO
- Append, never mutate existing response keys.
- Cache expensive queries (30s baseline; adjust if needed).
- Log with structured fields and correlation id.
- Filter all journey-scoped telemetry by constant id.
- Add QA assertions for new public contract fields.

AVOID
- Unbounded per-request scans / full table reads.
- Adding large deps to worker bundle without justification.
- Rewriting health response structure.
- Storing secrets or raw keys.
- Duplicating existing caching or logging patterns.

### 10. Roadmap & Context Maintenance (Append‑Only)
- Canonical docs: `docs/roadmap/` (index + optional topic files when >40 lines).
- Add: (1) section stub (2) health metric (3) optional QA contract (4) change log entry.
- Preserve historical intent—never rewrite prior entries; append timestamped lines.
- Reference secure locations instead of embedding confidential detail.
- Use concise conceptual descriptors for potential patentable areas (no disclosure specifics).
- Live feed for agents: update by appending a JSON line to `docs/roadmap/live-change-log.ndjson` (do not reorder or edit prior lines).
- Each entry MUST conform to `docs/roadmap/live-change-feed.schema.json` (run lightweight JSON schema check in automation if extending).
- Include incremental `seq` (monotonic integer) when adding new lines; derive as (last_seq + 1). If merge conflict: rebase & increment.

### 11. Multi-Agent Coordination
- Manifest: `docs/roadmap/agents-manifest.json` defines agent roles, scopes, and write permissions (treat as authoritative; append roles only).
- Feed Usage: Agents read `live-change-log.ndjson` from end; resume via highest observed `seq`.
- Append Protocol: Single atomic line append per logical change. Never edit or delete prior lines.
- Conflict Resolution: If concurrent appends collide on seq, later agent recalculates seq = last_seq + 1 and re-appends.
- Change Classification: Use `type` + optional `"breaking": true` (only when external contract requires consumer action; must include mitigation note in `details`).
- Quality Gates: Before appending, agent validates schema + ensures invariants untouched (health shape, journey constant, parameterized DB, logging standard).
- Ownership: If change spans multiple domains, list all in `tags`; primary responsible agent = first tag owner.
- Rollback: Never remove a line; add a new line with `type:"fix"` referencing prior `seq`.
- Observability: Planned automation will diff last N lines to detect potential invariant drift (keep entries precise).
- Avoid Noise: Group minor doc wording tweaks; append only when semantic guidance shifts.

### 12. Cross-Repo Standardization
- Canonical spec lives here (AWhittleWandering); other repos host thin wrappers referencing this path.
- Multi-repo manifest: `docs/roadmap/multi-repo-manifest.json` (append-only; add new repos or domains, never delete).
- Wrapper instruction files MUST NOT fork guidance; only append repo-local nuances beneath a “Local Overrides” heading (rare).
- Restructure plans per repo: `docs/restructure/REPO_RESTRUCTURE_PLAN.md` (proposed moves as patterns; changes applied via PR, not ad-hoc).
- File normalization rules: classify new files before commit; if pattern missing, extend normalization doc instead of improvising.
- Cross-repo change: add single feed entry tagging all impacted repos in `tags`.
- Drift check (future QA): compare canonical section hashes vs wrapper acknowledgment block.

### 13. Agent Context Resolution & Compatibility
- Purpose: Ensure all agent frameworks (Copilot, Codex, Kline, Cline, others) derive identical authoritative context.
- Priority Order (highest first): (1) Invariants (2) Sections 10–13 (3) Live change feed latest seq (4) Agents manifest (5) Repo wrapper overrides.
- Retrieval Contract: Each agent must (a) read live-change-log.ndjson tail (b) capture highest seq (c) cache hash of Sections 1–13 for drift detection.
- Fallback: If feed unavailable, proceed read-only; no structural changes allowed (must log blocked state).
- Scoped Context: Agents must not embed entire documents into generated code comments; only reference section + seq.
- Conflict Guard: Before proposing changes touching invariants, re-fetch feed; abort if new seq appeared post initial read.
- Extension: New frameworks append role in agents-manifest.json + update multi-repo-manifest supportedFrameworks.
- Logging: Agents adding entries must include framework id in tags.
- Non-Compliant Action: Any change lacking seq or role tag considered invalid; future QA will block merge.

### Glossary (Compact)
- D1: Cloudflare SQLite-like DB.
- R2: Object storage for media/binaries.
- KV: Key-value for short-lived auth tokens.
- Unified Data: Aggregated multi-source telemetry endpoint.
- TTL: Time-to-live (seconds) for cached aggregate row.
- Codex: External code generation agent consuming canonical context.
- Kline: Planning/analysis agent; read-only unless granted documented role.
- Cline: Refactoring agent; may reorganize files respecting normalization rules.

---
Refine when architecture, build scripts, or deployment flows change. Maintain brevity while preserving invariants.
