# Platform QA Remediation Report

**Date:** 2026-02-09
**Branch:** `claude/qa-platform-remediation-ZSpU9`
**Scope:** Full-platform audit — backend, frontend, shared, CI/CD, migrations, infrastructure

---

## Executive Summary

The platform **builds and passes all 46 backend tests**, and the frontend **compiles and type-checks cleanly**. However, the audit uncovered **8 critical**, **14 high**, **22 medium**, and **12 low** severity findings across security, standards compliance, dependency health, CI/CD, and architectural debt. The most impactful issues are the non-functional rate limiter, missing input validation middleware, broken QA scripts, and security vulnerabilities in dependencies.

### QA Results At-a-Glance

| Check | Result | Details |
|-------|--------|---------|
| Backend tests (vitest) | **PASS** | 9 files, 46 tests, 0 failures |
| Backend build (esbuild) | **PASS** | dist/index.js 207KB |
| Shared build (tsc) | **PASS** | After dep install |
| Frontend build (vite) | **PASS** | 10 chunks, 30.9s |
| Frontend typecheck (tsc) | **PASS** | 0 errors |
| Frontend lint (eslint) | **59 WARNINGS** | 0 errors; mostly `no-explicit-any` and `no-unused-vars` |
| npm audit | **4 vulnerabilities** | 1 moderate (lodash), 3 high (react-router XSS) |
| Backend typecheck | **PASS** | 0 errors |

---

## CRITICAL Findings (P0 — Fix Before Next Deploy)

### C1. Rate Limiter Is Non-Functional on Workers
**File:** `backend/edge-worker/src/middleware/rateLimit.ts`
**Severity:** CRITICAL

The rate limiter uses an **in-memory `Map`**. Cloudflare Workers are stateless — each request can hit a different isolate, and the Map resets on every deploy. This means the rate limiter provides zero protection in production.

**ROADMAP says:** "KV-backed limiter" (Phase 1)

**Remediation:** Replace with a KV-backed or Durable Object-backed rate limiter that persists across isolates:
```typescript
// Use env.AUTH_TOKENS (KV) to store rate limit counters
const key = `ratelimit:${ip}`;
const current = await env.AUTH_TOKENS.get(key, 'json');
```

### C2. No Input Validation Middleware (zValidator Not Installed)
**File:** `backend/edge-worker/package.json`, all routers
**Severity:** CRITICAL

**CLAUDE.md mandates:** "All route handlers use zValidator() from @hono/zod-validator"

`@hono/zod-validator` is **not installed** as a dependency and `zValidator` is used **zero times** in the codebase. Route handlers accept unvalidated input, creating risk of unexpected data shapes reaching business logic and DB queries.

**Remediation:**
1. `npm install @hono/zod-validator` in backend/edge-worker
2. Add Zod schemas for all route params, query strings, and request bodies
3. Apply `zValidator('param', schema)`, `zValidator('query', schema)`, `zValidator('json', schema)` to each route

### C3. Development KV Shares Production Namespace ID
**File:** `backend/edge-worker/wrangler.toml:150`
**Severity:** CRITICAL

```toml
# Development environment
[[env.development.kv_namespaces]]
binding = "AUTH_TOKENS"
id = "7838e32d8ad04855b13eb2d9aa4f9811"  # ← SAME as production!
```

Development writes will corrupt production auth token data. The staging D1 and KV are placeholders (commented out), meaning staging has no data layer at all.

**Remediation:** Create separate KV namespaces for development and staging:
```bash
npx wrangler kv namespace create AUTH_TOKENS --env development
npx wrangler kv namespace create AUTH_TOKENS --env staging
```

### C4. QA Scripts Reference Non-Existent Directory
**File:** `package.json:22-43`
**Severity:** CRITICAL

10+ npm scripts reference `cd qa && node ...` but the `qa/` directory does not exist:
- `npm run qa` → fails
- `npm run qa:cloud` → fails
- `npm run qa:full` → fails
- `npm run qa:major-deployment` → fails
- `npm run predeploy` → fails (blocks `npm run deploy`)
- `npm run postdeploy` → fails
- `npm run deploy` → fails (depends on predeploy)

**Remediation:** Either create the QA tooling or remove the dead scripts. At minimum, fix `deploy` to not depend on non-existent QA.

### C5. High-Severity XSS Vulnerability in react-router
**File:** `frontend/package.json:67`
**Severity:** CRITICAL

```
react-router-dom@^6.26.2 → @remix-run/router <=1.23.1
GHSA-2w69-qvjg-hvjx: React Router vulnerable to XSS via Open Redirects
```

3 high-severity vulnerabilities. This is a known exploitable XSS vector.

**Remediation:** `npm audit fix` or upgrade to react-router v7.

### C6. Cron Trigger Mismatch
**File:** `backend/edge-worker/wrangler.toml:9-13` vs `src/index.ts:264-269`
**Severity:** CRITICAL

wrangler.toml configures **3 cron triggers**:
```toml
crons = ["*/30 * * * *", "0 2 * * *", "5 * * * *"]
```

But the code's mapping expects **5 cron patterns**:
```typescript
'*/15 6-23 * * *': quick_state_update   // ← never fires
'*/30 * * * *': full_sync               // ✓
'0 2 * * *': historical_backfill        // ✓
'5 * * * *': data_quality_check         // ✓
'10 */6 * * *': ai_data_processing      // ← never fires
```

`quick_state_update` and `ai_data_processing` are dead code — they will never execute.

**Remediation:** Add the missing cron triggers to wrangler.toml (up to the free plan limit of 5), or remove the dead mapping entries.

### C7. Error Responses Missing requestId
**File:** `backend/edge-worker/src/middleware/errorHandler.ts`
**Severity:** CRITICAL

**CLAUDE.md mandates:** "Error responses include requestId (crypto.randomUUID())"

The error handler returns:
```json
{ "error": "message", "timestamp": "...", "path": "/..." }
```

No `requestId` field. The `correlationId` generated in `requestLogger.ts` is logged to console but never propagated to the error handler or response headers.

**Remediation:** Pass correlationId through Hono context (`c.set('requestId', cid)`) and include it in all error responses and as an `X-Request-ID` header.

### C8. Admin Auth Bypass When No Secrets Configured
**File:** `backend/edge-worker/src/index.ts:87`
**Severity:** CRITICAL

```typescript
if (!secret && !prev && !jwtCur && !jwtPrev) return next();
```

If `ADMIN_TOKEN` and `JWT_SECRET` are not configured as Wrangler secrets, **all admin routes are publicly accessible** with no auth. This is intentional for local dev but dangerous if production secrets are misconfigured or accidentally deleted.

**Remediation:** Add environment detection — only skip auth in development:
```typescript
if (c.env?.ENVIRONMENT === 'development' && !secret && !jwtCur) return next();
// In production, fail closed:
return c.json({ ok: false, error: 'Admin auth not configured' }, 503);
```

---

## HIGH Findings (P1 — Fix This Sprint)

### H1. `puppeteer` as Root Dependency
**File:** `package.json:64`
**Severity:** HIGH

`puppeteer@^24.15.0` is a root dependency that tries to download Chrome on `npm install`. It fails in CI/restricted environments (observed: `getaddrinfo EAI_AGAIN storage.googleapis.com`), blocking all dependency installation. A Cloudflare Workers project has no use for headless Chrome at the root level.

**Remediation:** Remove from root `package.json`. If needed for E2E tests, it belongs in `frontend/devDependencies` as `@playwright/test` (which is already there).

### H2. `vite` as Backend Production Dependency
**File:** `backend/edge-worker/package.json:18`
**Severity:** HIGH

`vite` is listed under `dependencies` (not `devDependencies`). This bloats the dependency tree and is never used at runtime in a Workers environment.

**Remediation:** Move `vite` to `devDependencies` or remove entirely (esbuild handles bundling).

### H3. Lodash Prototype Pollution Vulnerability
**File:** `node_modules/lodash`
**Severity:** HIGH (moderate per npm audit)

`lodash@4.0.0-4.17.21` has prototype pollution in `_.unset` and `_.omit` (GHSA-xxjr-mmjv-4gpg).

**Remediation:** `npm audit fix` or replace lodash usage with native alternatives.

### H4. Dual Mapping Libraries
**File:** `frontend/package.json`
**Severity:** HIGH

Both `mapbox-gl@^3.13.0` and `leaflet@^1.9.4` (+ `react-leaflet@^4.2.1`) are dependencies. This results in:
- **1.66MB mapbox-gl chunk** (over the 1MB warning threshold)
- Redundant bundle weight from two mapping solutions
- Maintenance burden of two parallel implementations

**Remediation:** Consolidate to one mapping library. The codebase already has `AdvancedTeslaMap.tsx` (Mapbox) and `TeslaMap.tsx` (Leaflet) — pick one and remove the other.

### H5. D1 Database ID Mismatch Between Docs and Config
**File:** `docs/DEPLOYMENT.md:122` vs `backend/edge-worker/wrangler.toml:52`
**Severity:** HIGH

Documentation says D1 ID is `09a6ba85-bd36-4ad3-b5a8-92e230943dcb` but wrangler.toml uses `889d864a-966d-4e8a-a3cd-bc60abf23688`. This creates confusion about which database is actually in use.

**Remediation:** Update docs to match the actual wrangler.toml configuration.

### H6. Production R2 Binding Disabled
**File:** `backend/edge-worker/wrangler.toml:199-204`
**Severity:** HIGH

R2 bucket binding is commented out in production:
```toml
# [[env.production.r2_buckets]]
# binding = "MEDIA_BUCKET"
```

But the codebase has a `mediaRouter` mounted at `/api/v1/media` that presumably needs R2. Any media upload/download operations will fail silently in production.

**Remediation:** Enable R2 in the Cloudflare dashboard and uncomment the binding, or add graceful degradation to the media router.

### H7. Missing `typecheck` Script in Frontend
**File:** `frontend/package.json`
**Severity:** HIGH

CLAUDE.md documents `npm run typecheck` in the frontend but no such script exists. This means `tsc --noEmit` must be run manually, and CI may not enforce type checking.

**Remediation:** Add to `frontend/package.json`:
```json
"typecheck": "tsc --noEmit"
```

### H8. Analytics Logging Stores PII in D1
**File:** `backend/edge-worker/src/middleware/requestLogger.ts:52-68`
**Severity:** HIGH

Every API request logs `user_ip` and `user_agent` to the `analytics_events` D1 table. While the admin router excludes this table from exports, this is still PII at rest without:
- Retention policy / automatic cleanup
- Privacy policy disclosure
- IP hashing/anonymization

**Remediation:** Hash IPs before storage, add a cron job to purge analytics older than 30 days, and ensure privacy policy covers this data collection.

### H9. Auth Routes Return 500 in Tests
**File:** `backend/edge-worker/tests/auth.test.ts` (test output)
**Severity:** HIGH

Test logs show login and register both returning HTTP 500:
```
POST /api/v1/auth → status 500
```

The tests still pass because they likely assert on response shape rather than status codes, but this indicates the auth system has runtime errors (likely missing DB bindings in test context).

**Remediation:** Fix auth tests to properly assert success status codes, and provide proper mocked bindings for auth operations.

### H10. `esbuild` as Frontend Production Dependency
**File:** `frontend/package.json:56`
**Severity:** HIGH

`esbuild` is listed under `dependencies` in frontend. It should be in `devDependencies` at most — Vite already bundles its own esbuild.

**Remediation:** Move to `devDependencies` or remove.

### H11. Staging Environment Has No Functional Data Layer
**File:** `backend/edge-worker/wrangler.toml:105-114`
**Severity:** HIGH

Both D1 and KV bindings for staging are commented out with placeholder IDs. The ROADMAP and CLAUDE.md require staging validation before production deploys, but staging deploys would have no database access.

**Remediation:** Provision dedicated staging D1 and KV resources, then uncomment and update the IDs.

### H12. Missing Secret Name Consistency
**File:** `backend/edge-worker/src/` (multiple files)
**Severity:** HIGH

Code references both `TESSIE_API_TOKEN` and `TESSIE_API_KEY` with fallback patterns:
```typescript
const token = this.env.TESSIE_API_TOKEN || this.env.TESSIE_API_KEY;
```

wrangler.toml comments reference `TESSIE_API_TOKEN` but docs/DEPLOYMENT.md references `TESSIE_API_KEY`. This creates confusion about which secret name to configure.

**Remediation:** Standardize on one name (`TESSIE_API_TOKEN`) and remove all fallback references.

### H13. 59 ESLint Warnings in Frontend
**File:** Multiple frontend files
**Severity:** HIGH

59 warnings across 20+ files, dominated by:
- `@typescript-eslint/no-explicit-any` (30+ instances)
- `@typescript-eslint/no-unused-vars` (5+ instances)
- `react-hooks/exhaustive-deps` (1 instance)
- `react-refresh/only-export-components` (7 instances)

**Remediation:** Address in priority order: exhaustive-deps (bug risk) → no-unused-vars (dead code) → no-explicit-any (type safety). Consider `eslint --max-warnings 0` in CI to prevent regression.

### H14. Large Mapbox Chunk (1.66MB)
**File:** `frontend/dist/assets/mapbox-gl-RV8mjIKK.js`
**Severity:** HIGH

The mapbox-gl chunk is 1.66MB minified (447KB gzipped), triggering Vite's chunk size warning. This significantly impacts initial page load for users on the map view.

**Remediation:** mapbox-gl is already lazily loaded via `LazyTeslaMap`. Ensure the map route uses `React.lazy()` so the chunk isn't loaded until the map page is visited. Consider `mapbox-gl-js` lite if full GL features aren't needed.

---

## MEDIUM Findings (P2 — Fix This Month)

### M1. No `@hono/zod-validator` Despite Standard Mandate
While covered in C2, this also affects **every router file** — all route params and query strings are manually parsed without schema validation. Files affected:
- `src/routers/admin.ts` (manual z.object but no middleware)
- `src/routers/journeys.ts`
- `src/routers/analytics.ts`
- `src/routers/places.ts`
- `src/routers/vehicle.ts`
- `src/routers/auth.ts`
- `src/routers/media.ts`

### M2. Global `any` Types in Core Code
**File:** `backend/edge-worker/src/index.ts:66,80,106,210`
**Severity:** MEDIUM

The admin auth middleware uses `any` for context and next function types instead of proper Hono types.

### M3. Empty Frontend Chunk
**File:** Build output
**Severity:** MEDIUM

`hooks-utils-l0sNRNKZ.js` is an empty chunk (0 bytes). This indicates a barrel export file with no actual exports, adding an unnecessary network request.

### M4. `node-fetch` as Root Dependency
**File:** `package.json:62`
**Severity:** MEDIUM

Workers have native `fetch`. `node-fetch` is unnecessary and may cause confusion or bundle issues.

### M5. wrangler.toml D1 ID in Global Scope
**File:** `backend/edge-worker/wrangler.toml:49-52`
**Severity:** MEDIUM

The global (non-environment) scope has a D1 binding pointing to the production database. Running `wrangler dev` without `--env development` would connect to production data.

### M6. `console.log/console.error` Mixed with Structured Logger
**File:** `backend/edge-worker/src/automation/tesla-automation.ts:347,370,386,488`
**Severity:** MEDIUM

Multiple files use `console.log` and `console.error` instead of the structured `logger` utility, creating inconsistent log formats.

### M7. Test Coverage Gaps
**Severity:** MEDIUM

Tested: contract schemas, CSV importers, auth endpoints, notifications, platform surface, OpenAPI drift
**Not tested:**
- Individual router handlers (journeys, places, analytics, vehicle, media, AI)
- Middleware (CORS, rate limit, error handler, request logger)
- Services (cache, state-detection, journey provisioning)
- Cron jobs
- Data ingestion pipeline

### M8. Frontend Missing Test Configuration
**File:** `frontend/package.json:14-15`
**Severity:** MEDIUM

Frontend has vitest and testing-library as devDependencies but `npm run test` runs `npx vitest` without a vitest config. No frontend component or integration tests exist (only `dynamic-config.test.ts`).

### M9. Missing CSRF Protection
**Severity:** MEDIUM

State-changing endpoints (POST/PUT/DELETE) have no CSRF token validation. While the API is CORS-protected, the `credentials: true` configuration means cookies are sent cross-origin to allowed origins. A compromised allowed subdomain could perform CSRF.

### M10. Overly Permissive CORS Regex
**File:** `backend/edge-worker/src/middleware/cors.ts:18-20`
**Severity:** MEDIUM

The regex patterns for preview domains allow any subdomain:
```typescript
if (/^https:\/\/[a-z0-9-]+\.awhittlewandering-frontend\.pages\.dev$/i.test(origin)) return true;
```
If an attacker could create a Pages project with a matching subdomain pattern, they could bypass CORS.

### M11. D1 Write on Every Request (Analytics)
**File:** `backend/edge-worker/src/middleware/requestLogger.ts:52-68`
**Severity:** MEDIUM

Every API request performs a D1 INSERT to `analytics_events`. At scale, this will:
- Consume D1 write quotas quickly
- Add latency to every request
- Fill the database with analytics data

Consider batching writes or using Analytics Engine exclusively.

### M12. Unused/Dead Imports and Code
**File:** Multiple frontend components
**Severity:** MEDIUM

ESLint flagged unused variables (`_setRecommendations`, `_setChargingStations`, `actionTypes`) indicating dead code paths.

### M13. Missing Error Boundaries in Frontend
**Severity:** MEDIUM

No React error boundaries detected in the component tree. A rendering error in any component will crash the entire application.

### M14. CI Workflows Missing Concurrency Controls
**File:** `.github/workflows/*.yml`
**Severity:** MEDIUM

Multiple workflow files lack `concurrency` groups, which can lead to:
- Redundant deploy runs on rapid pushes
- Resource contention between parallel workflows
- Wasted GitHub Actions minutes

### M15. CI Workflows Not Enforcing TypeScript Strict
**Severity:** MEDIUM

The CI preflight runs lint and test but may not enforce `tsc --noEmit` for all workspaces, potentially allowing type errors to reach production.

### M16. Third-Party Actions Not Pinned to SHAs
**File:** `.github/workflows/*.yml`
**Severity:** MEDIUM

Workflow files likely use tag-based references (`@v4`) instead of SHA-pinned references for third-party actions, creating supply chain risk.

### M17. Excessive Radix UI Dependencies
**File:** `frontend/package.json:21-46`
**Severity:** MEDIUM

26 individual `@radix-ui/*` packages are listed. Many may be unused. A dependency audit should identify which are actually imported.

### M18. Missing Frontend Route Guards
**Severity:** MEDIUM

Admin-only features (like the Journeyer Dashboard) need route-level auth guards to prevent unauthorized access in the SPA.

### M19. No Health Check for D1 Connectivity
**File:** `backend/edge-worker/src/routers/health.ts`
**Severity:** MEDIUM

Health endpoint should verify D1 binding is available and responsive, not just return `{ ok: true }`.

### M20. `@types/leaflet` in Dependencies
**File:** `frontend/package.json:49`
**Severity:** MEDIUM

`@types/leaflet` is in `dependencies` instead of `devDependencies`. Type packages should never be runtime dependencies.

### M21. Missing `.env.example` File
**Severity:** MEDIUM

No `.env.example` or similar template exists to document required environment variables for new developers.

### M22. No Automated Migration Testing
**Severity:** MEDIUM

The ROADMAP specifies "Migration + ETL idempotency checks" in CI, but no migration testing is visible in the test suite.

### M23. `create_1password_secret()` Non-Zero Returns Abort Validation Script
**File:** `scripts/validate-secrets.sh`
**Severity:** MEDIUM

`create_1password_secret()` returns non-zero (`return 1`) in several normal branches (e.g., item missing, field already exists). Because the script runs with `set -e` and the caller invokes `create_1password_secret` without guarding the return code, these `return 1` paths terminate the entire validation run early — potentially skipping remaining validations and the summary.

**Remediation:**
- Return 0 for the "skip to prevent overwriting" path (expected behavior, not an error)
- Guard calls at the call site: `create_1password_secret ... || true` and track failures in a counter
- Or unify on a pattern where only truly fatal errors return non-zero

---

## LOW Findings (P3 — Backlog)

### L1. `dangerouslySetInnerHTML` in chart.tsx
**File:** `frontend/src/components/ui/chart.tsx:79`
Uses `dangerouslySetInnerHTML` for CSS theme injection from constants. Low risk since data comes from trusted source (not user input).

### L2. `@ts-ignore` in index.ts
**File:** `backend/edge-worker/src/index.ts:66`

### L3. `csv-parser` as Root devDependency
**File:** `package.json:55`
Should be in backend workspace only.

### L4. `react-refresh/only-export-components` Warnings
7 instances in shadcn/ui components. Low risk — these are vendor patterns.

### L5. Empty `hooks-utils` Barrel File
Generates a 0-byte chunk. Should either add exports or remove the file.

### L6. `debug.tsx` Has No Exports
**File:** `frontend/src/debug.tsx`
ESLint warns about missing exports for fast refresh.

### L7. Version Pinning Inconsistency
Root `package.json` uses `^` ranges but some packages should be pinned for reproducibility.

### L8. Missing `engines` Field
No `engines` field in package.json to enforce Node.js 20+ requirement.

### L9. Legacy `/drop` Endpoint
**File:** `backend/edge-worker/src/index.ts:232`
Backward compatibility proxy that internally re-fetches the app. Could be simplified.

### L10. Mapbox Token Exposed via Config Endpoint
**File:** `backend/edge-worker/src/index.ts:155`
The public token is exposed at `/api/v1/config`. While Mapbox public tokens are designed for this, it should be documented in the security policy.

### L11. Demo/Stub Endpoints in Production
**File:** `backend/edge-worker/src/index.ts:176-184,210-229`
`/api/connectors` (stubbed) and `/api/joiner` (demo) endpoints ship to production.

### L12. No Contributor Security Policy
`docs/SECURITY.md` exists but is minimal. Consider adding a vulnerability disclosure process.

---

## Remediation Roadmap

### Phase A: Critical Stabilization (Immediate)
1. **Fix rate limiter** → KV-backed implementation (C1)
2. **Install and apply `@hono/zod-validator`** on top 5 routes (C2)
3. **Fix development KV namespace** to not share production ID (C3)
4. **Remove or fix broken QA scripts** in package.json (C4)
5. **Upgrade react-router-dom** to fix XSS vulnerability (C5)
6. **Align cron triggers** between wrangler.toml and code (C6)
7. **Add requestId to error responses** and response headers (C7)
8. **Fail-closed admin auth** in production when no secrets configured (C8)

### Phase B: Dependency & Build Health (This Sprint)
1. Remove `puppeteer` from root dependencies (H1)
2. Move `vite` to devDependencies in backend (H2)
3. Run `npm audit fix` for lodash (H3)
4. Consolidate mapping libraries (H4) — evaluate removing Leaflet
5. Fix documentation D1 ID mismatch (H5)
6. Enable R2 binding or add graceful degradation (H6)
7. Add `typecheck` script to frontend (H7)
8. Hash IPs in analytics, add retention cron (H8)
9. Fix auth test assertions (H9)
10. Move `esbuild` to devDependencies in frontend (H10)
11. Provision staging D1/KV (H11)
12. Standardize secret names (H12)
13. Address ESLint warnings (H13)
14. Optimize mapbox chunk loading (H14)

### Phase C: Architecture Hardening (This Month)
1. Add zValidator to ALL route handlers (M1)
2. Eliminate `any` types in core code (M2)
3. Remove empty hooks-utils barrel (M3)
4. Remove `node-fetch` from root (M4)
5. Fix global-scope D1 binding (M5)
6. Replace console.log with structured logger (M6)
7. Expand test coverage (middleware, routers, services) (M7)
8. Set up frontend component tests (M8)
9. Evaluate CSRF mitigation (M9)
10. Tighten CORS regex patterns (M10)
11. Batch D1 analytics writes (M11)
12. Add React error boundaries (M13)
13. Add CI concurrency controls (M14)
14. Enforce `tsc --noEmit` in CI for all workspaces (M15)
15. Pin third-party actions to SHAs (M16)
16. Fix `create_1password_secret()` early-exit under `set -e` (M23)

### Phase D: Polish & Future Development (Backlog)
1. Audit and prune unused Radix UI packages (M17)
2. Add route guards for admin features (M18)
3. Enhance health check with D1 ping (M19)
4. Move `@types/leaflet` to devDependencies (M20)
5. Create `.env.example` template (M21)
6. Add migration idempotency tests (M22)
7. Address all LOW findings (L1-L12)

---

## Future Development Priorities (Based on ROADMAP Alignment)

### Where We Are vs. Where We Should Be

| ROADMAP Phase | Status | Blockers |
|---------------|--------|----------|
| Phase 0: Data Pipeline | Partially done | ETL migration exists (0007), but canonical tables may not be fully populated |
| Phase 1: Security | **Incomplete** | Rate limiter non-functional, input validation missing, auth bypass risk |
| Phase 2: Unified API | Done | `/api/v1/unified-data` exists and returns data |
| Phase 3: AI Narratives | Partial | AI router exists but narrative seed/generator services not found |
| Phase 4: Frontend | Done | React app with map + dashboard deployed |
| Phase 5: Production Launch | **Blocked** | Security issues, staging not provisioned, CI gaps |
| Multi-OEM P0 | Done | Canonical schemas exist in `shared/` |
| Multi-OEM P1 | Done | Tessie adapter exists |
| Multi-OEM P2-P4 | Not started | — |

### Recommended Next Development Tracks

**Track 1: Security Completion (Phase 1)**
Complete the security hardening that was started but not finished:
- Functional rate limiting (KV-backed)
- Input validation on all routes (zValidator)
- Request ID propagation
- Fail-closed auth
- IP anonymization

**Track 2: CI/CD Pipeline Completion**
Build the "CI swarm gates" described in the ROADMAP:
- Enforce lint + typecheck + tests on all PRs
- Schema snapshot + adapter contract replay
- Migration idempotency checks
- Build verification for all workspaces
- `eslint --max-warnings 0`

**Track 3: Staging Environment**
Before any further production deployments:
- Provision staging D1 database
- Provision staging KV namespace
- Test migration pipeline on staging
- Add staging deployment workflow

**Track 4: Test Coverage Expansion**
- Frontend component tests (React Testing Library is installed but unused)
- Backend middleware unit tests
- Backend router integration tests
- E2E smoke tests (Playwright is configured)
- Migration idempotency tests

**Track 5: AI Narrative System (Phase 3)**
Once security and CI are solid:
- Implement `services/narrative-seed.ts`
- Implement `services/narrative-generator.ts`
- KV caching for narrative responses
- Cost controls for AI API calls

---

## Appendix: File Reference Index

| Finding | Primary File(s) |
|---------|-----------------|
| C1 | `backend/edge-worker/src/middleware/rateLimit.ts` |
| C2 | `backend/edge-worker/package.json`, all `src/routers/*.ts` |
| C3 | `backend/edge-worker/wrangler.toml:150` |
| C4 | `package.json:22-43` |
| C5 | `frontend/package.json:67` |
| C6 | `backend/edge-worker/wrangler.toml:9-13`, `src/index.ts:264-269` |
| C7 | `backend/edge-worker/src/middleware/errorHandler.ts` |
| C8 | `backend/edge-worker/src/index.ts:87` |
| H1 | `package.json:64` |
| H2 | `backend/edge-worker/package.json:18` |
| H5 | `docs/DEPLOYMENT.md:122` |
| H6 | `backend/edge-worker/wrangler.toml:199-204` |
| H7 | `frontend/package.json` (missing script) |
| H8 | `backend/edge-worker/src/middleware/requestLogger.ts:52-68` |
| H12 | `backend/edge-worker/src/jobs/index.ts:4`, `src/routers/admin.ts:84` |
| M23 | `scripts/validate-secrets.sh` |
