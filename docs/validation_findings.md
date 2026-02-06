# Validation Findings (PR0–PR2 Review Gate)

Date: 2026-02-06

## Summary

PR0 (#149) and PR2 (#167) merged to main. Validation: **PASS** (after one fix).

## Findings

### 1. Shared package not built — test suite failure (FIXED)

- **Suite**: `tests/contract/adapters/tessie/adapter.contract.spec.ts`
- **Error**: `Cannot find module '@awhittlewandering/shared/schemas/canonical/event-types'`
- **Cause**: `shared/` exports point to `dist/` which was not built. No `npm run build` step for shared package in root scripts or CI.
- **Fix applied**: Added `shared:build` script and `prebuild`/`pretest` hooks to root `package.json`. Added shared build step to CI workflow.
- **Follow-up**: Ensure CI always builds shared before running backend tests.

### 2. Missing `[env.staging]` in backend wrangler.toml

- **Check**: Framework requires staging environment for deploy-staging formula and CI workflows.
- **Cause**: Only `development` and `production` envs defined; staging absent.
- **Fix applied**: Added `[env.staging]` section to `backend/edge-worker/wrangler.toml`.
- **Follow-up**: Staging D1 database ID and KV namespace ID need real values from Cloudflare dashboard.

### 3. Missing AGENTS.md symlink

- **Check**: Framework Phase 2 scaffold requires `AGENTS.md -> CLAUDE.md`.
- **Fix applied**: Created symlink.

### 4. Missing `db-migrate.formula.toml`

- **Check**: Framework Phase 2 scaffold lists this formula.
- **Fix applied**: Created `.beads/formulas/db-migrate.formula.toml`.

### 5. Non-blocking warnings (no action required)

- **Lint**: 0 errors, 127 warnings (all `@typescript-eslint/no-explicit-any`)
- **npm audit**: 14 vulnerabilities (9 moderate, 5 high) — upstream dependencies
- **Frontend build**: Chunk size warning for mapbox-gl (1.6MB) — expected for map library
- **Puppeteer**: Browser download fails in sandboxed env — skipped via `PUPPETEER_SKIP_DOWNLOAD`
