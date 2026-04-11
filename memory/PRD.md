# A Whittle Wandering — PRD & Work Log

## Original Problem Statement
1. QA and validate the entire repo/branches (Session 1)
2. Complete all required phases to get the platform deployed and functional (Session 2)

## Application Overview
**A Whittle Wandering** — A journey platform that turns Tesla road trip movement into meaning. Live presence for followers and a command center for the journeyer.

- **Live Frontend:** https://awhittlewandering.pages.dev (custom domain: awhittlewandering.com — DNS initializing)
- **Live Backend API:** https://api.awhittlewandering.com
- **Type:** Full-stack TypeScript web platform

## Architecture
- **Frontend:** React 18 + TypeScript + Vite + Tailwind + Mapbox GL (Cloudflare Pages)
- **Backend:** Hono v4 + Cloudflare Workers + D1 (SQLite) + KV + R2
- **Shared:** Zod schemas, provider interfaces
- **Data source:** Tessie API (Tesla telemetry)
- **Auth:** PBKDF2 password hashing (100k iterations), JWT HS256, TOTP MFA

## Core Requirements (Static)
1. Live journey presence — followers see where the trip is in real time
2. Narrative moments — photos, journal entries, milestones
3. Journeyer command center — vehicle data, routing, analytics
4. Privacy-first — H3 redaction for public GPS
5. Single source of truth: `/api/v1/unified-data`
6. Provider-agnostic: Tesla/Tessie adapter, not hardcoded

## Session 1 — QA Audit (2026-04-11)
Full QA report: `/app/QA_REPORT.md`

### P0 Fixes Applied
- [x] Deleted `src/middleware/security.ts` — wrong-framework Express.js file
- [x] Removed `/api/connectors` and `/api/joiner` AtlasIT-context endpoints
- [x] Truncated ROADMAP.md — removed 1,243 lines of AI agent loop noise
- [x] Fixed `api-config.ts` LIVE_STATUS to avoid redirect chain
- [x] Fixed `JourneyJournal.tsx` — missing setEntries, prop sync, emoji→icons
- [x] Fixed Demo.tsx CTA link

## Session 2 — Full Deployment (2026-04-11)
### Backend Deployment
- [x] Fixed critical build bug: `--external:hono --external:zod` in build script
- [x] Changed `main = "dist/index.js"` → `main = "src/index.ts"` (let wrangler bundle)
- [x] Fixed PBKDF2 iterations: 310,000 → 100,000 (Workers CPU time limit compliance)
- [x] Deployed backend worker `awhittlewandering-api` to production
  - Version: `9a9103b2-3400-47bd-9a8d-49795581a35b`
  - Custom domain: `api.awhittlewandering.com`
- [x] Verified API endpoints working (health, unified-data, auth, config)

### Frontend Deployment
- [x] Fixed vite.config.ts: switched terser → esbuild minifier (lower memory)
- [x] Simplified manualChunks to prevent OOM
- [x] Added `_redirects` for SPA client-side routing
- [x] Built frontend successfully (2369 modules, 9s)
- [x] Deployed to Cloudflare Pages (`awhittlewandering.pages.dev`)
- [x] Added custom domains `awhittlewandering.com` + `www.awhittlewandering.com`

### Database & Data
- [x] Verified all 10 migrations applied to production D1
- [x] Journey `continental-usa-2025`: 1,226 drives, 165 charges, 41 states, 15,592.62 miles
- [x] Created admin user `joe@awhittlewandering.com` with hashed password
- [x] Auth system verified: register works, admin requires MFA (correct behavior)

### Live Verification
- [x] Homepage shows "Day 315 — 41 of 48 states" from real data
- [x] Follower view `/journey/continental-usa-2025` shows correct journey data
- [x] API config returns valid Mapbox token (pk.*)

## Session 3 — Mapbox + 401 Fixes (2026-04-11)
- [x] Moved `mapbox-gl/dist/mapbox-gl.css` import from lazy `TeslaMap.tsx` to `main.tsx`
  - CSS now in initial bundle (`index-BVYNEvgv.css`) — loads before ANY component renders
  - This was the root cause of the black map: lazy CSS injection was silently failing in Cloudflare Pages
- [x] Added `mapbox-gl` to Vite `manualChunks` for predictable bundling
- [x] Removed duplicate dynamic CSS import from `RoadtripMap.tsx`
- [x] Added explicit inline `height/width` fallback styles on TeslaMap container divs
- [x] Made `GET /api/v1/journeys/:id/follow/settings` public — no longer requires auth
  - Anonymous users get `{ok: true, following: false, followerCount: N}` — eliminates 401 console errors
- [x] Deployed backend via wrangler (Version ID: `9e2147fe-634c-4201-8434-57d6666f0dad`)
- [x] Deployed frontend via wrangler pages (commit `cc46d4c`)

## Prioritized Backlog

### P0 (Critical)
- [ ] Admin MFA enrollment — owner must complete TOTP setup before accessing dashboard
  - Visit https://awhittlewandering.pages.dev → Dashboard → MFA Setup
  - Or use POST /api/v1/mfa/enroll + verify-enrollment

### P1 (High)
- [ ] Delete all 100+ `auto/*` branches via GitHub (using GH_PAT)
- [ ] Verify `awhittlewandering.com` custom domain DNS propagation (started 2026-04-11)
- [ ] Connect Tessie live sync — set up cron at `*/30 * * * *` in CF dashboard
- [ ] Import remaining data: currently 165/259 target charges (need Tessie charge export)

### P2 (Medium)
- [ ] Connect MasterCoordinationDashboard to real coordinates
- [ ] Persist JourneyJournal entries to backend API
- [ ] Design system color token cleanup (hardcoded Tailwind colors)
- [ ] Set up Cloudflare Analytics for visitor tracking

### P3 (Backlog)
- [ ] AI narrative generation (Phase 3 from ROADMAP)
- [ ] Push notification wiring (VAPID code is in place)
- [ ] Multi-OEM vehicle provider adapters

## Architecture Secrets Configured
- `JWT_SECRET` ✅
- `TESSIE_API_TOKEN` ✅
- `MAPBOX_API_TOKEN` ✅ (pk.*)
- `OPENWEATHER_API_KEY` ✅
- `TESLA_VIN` ✅
- `ADMIN_TOKEN` ✅
- `CLOUDFLARE_API_TOKEN` ✅
