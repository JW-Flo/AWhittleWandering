# AWW Work Roadmap

**Source:** `AWW_QA` (UX quality assurance review) + `docs/QA_PLATFORM_REMEDIATION.md` (backend/infra audit)
**Created:** 2026-02-13
**Purpose:** Actionable work tracks for Claude subagents, derived from QA findings

---

## Overview

The AWW_QA review identified **6 key UX/frontend issues** and the existing platform remediation report tracks **8 critical (all resolved)**, **14 high**, **23 medium**, and **12 low** backend/infrastructure findings. This roadmap unifies both into executable work tracks.

### Issue Cross-Reference

| AWW_QA Finding | Remediation Finding | Status |
|---|---|---|
| Follow button no feedback | New (frontend UX) | **Open** |
| Journey page scroll stuck | New (frontend UX) | **Open** |
| Route optimization no results | New (frontend UX + backend AI) | **Open** |
| Data placeholders lack context | New (frontend UX) | **Open** |
| Backend health warnings | H6, H11 (R2, staging) | **Open** |
| Accessibility (contrast, keyboard) | New (frontend UX) | **Open** |

---

## Track 1: Follow Button UX (Frontend)

**QA Finding:** Clicking Follow yields no visible confirmation; unclear if user is following the trip.

**Files:**
- `frontend/src/components/follower/FollowButton.tsx`
- `frontend/src/pages/FollowerView.tsx`
- `backend/edge-worker/src/routers/journeys.ts` (lines 69-204 — follow endpoints)

**Current State:** The FollowButton component exists and calls `POST /api/v1/journeys/:id/follow`. Backend endpoints for follow/unfollow/settings are fully implemented with D1 persistence. The issue is purely UX — the button state change and feedback are insufficient for users to confirm the action succeeded.

### Work Items

#### 1.1 Add optimistic state toggle + toast notification
- **What:** When user clicks Follow, immediately toggle button text to "Following" with a check icon, show a toast ("You're now following this journey"), and revert on error.
- **Where:** `frontend/src/components/follower/FollowButton.tsx`
- **Approach:**
  - Add `isLoading` spinner state during API call
  - On success: change button variant (outline -> solid), text ("Follow" -> "Following"), add check icon
  - On error: revert to previous state, show error toast
  - On hover while following: show "Unfollow" with warning variant
- **Depends on:** None

#### 1.2 Add follow count display
- **What:** Show follower count badge near the Follow button so users see social proof.
- **Where:** `frontend/src/components/follower/FollowButton.tsx`, backend may need a new count endpoint or include count in existing response.
- **Depends on:** 1.1

#### 1.3 Auth prompt for unauthenticated follow
- **What:** If user is not logged in and clicks Follow, show a friendly prompt explaining they need to sign in, with a link to auth flow.
- **Where:** `frontend/src/components/follower/FollowButton.tsx`
- **Approach:** Check for 401/403 response from follow endpoint, display modal/toast with sign-in CTA.
- **Depends on:** 1.1

---

## Track 2: Journey Page Scroll Fix (Frontend)

**QA Finding:** Scrolling sometimes appears stuck on the live journey page; dragging the scroll bar is necessary to view lower sections ("The arc so far", "Moments").

**Files:**
- `frontend/src/pages/FollowerView.tsx`
- `frontend/src/components/follower/JourneyArc.tsx`
- `frontend/src/components/follower/JourneyNarrative.tsx`

### Work Items

#### 2.1 Audit scroll container layout
- **What:** Investigate the FollowerView page layout for CSS issues that prevent native scrolling — look for `overflow: hidden`, nested scroll containers, fixed/sticky elements that block scroll propagation, and `h-screen` containers without `overflow-y-auto`.
- **Where:** `frontend/src/pages/FollowerView.tsx` and its child components
- **Approach:**
  - Check for conflicting `overflow` properties in the component tree
  - Ensure the main content area uses `overflow-y-auto` or relies on body scroll
  - Test with content that exceeds viewport height
  - Remove any `h-screen` or `h-full` constraints on scrollable containers unless paired with `overflow-y-auto`
- **Depends on:** None

#### 2.2 Add smooth scroll behavior
- **What:** Add `scroll-behavior: smooth` to the journey page and ensure anchor links (if any) use smooth scrolling.
- **Where:** `frontend/src/pages/FollowerView.tsx` or global CSS
- **Depends on:** 2.1

#### 2.3 Test on mobile viewports
- **What:** Verify scroll behavior on mobile screen sizes (375px, 414px widths). Touch scrolling can behave differently from mouse scrolling.
- **Depends on:** 2.1

---

## Track 3: Route Optimization Error Handling (Frontend + Backend)

**QA Finding:** Entering origin/destination and clicking "Optimize Route with AI" produced no results; the Optimization Results tab displays "No optimized route yet" with no error feedback.

**Files:**
- `frontend/src/components/ConsolidatedRouteOptimizer.tsx`
- `backend/edge-worker/src/routers/ai.ts` (lines 31-97 — optimize endpoint)
- `frontend/src/services/backendApi.ts` (optimizeRoute method)

**Current State:** The backend `POST /api/v1/route/optimize` calls Cloudflare AI (Llama 3.1 8B) with a 12-second timeout. If the AI binding is missing, the model fails, or the prompt returns unparseable output, the frontend receives an error but may not display it clearly.

### Work Items

#### 3.1 Add loading state + progress indicator
- **What:** When "Optimize Route with AI" is clicked, show a spinner/progress bar with text like "Generating optimized route..." and disable the button. Clear state on completion or error.
- **Where:** `frontend/src/components/ConsolidatedRouteOptimizer.tsx`
- **Depends on:** None

#### 3.2 Display backend errors in the UI
- **What:** Catch errors from `backendApi.optimizeRoute()` and display them inline in the Optimization Results tab instead of silently showing "No optimized route yet." Include retry button.
- **Where:** `frontend/src/components/ConsolidatedRouteOptimizer.tsx`
- **Approach:**
  - Wrap API call in try/catch
  - On error: display error message with details (timeout, AI unavailable, invalid input)
  - Add "Try again" button
  - If AI binding is not configured (503), show "Route optimization is currently unavailable"
- **Depends on:** 3.1

#### 3.3 Add input validation before submission
- **What:** Validate that origin and destination fields are non-empty and contain valid location data before allowing submission. Show inline validation errors.
- **Where:** `frontend/src/components/ConsolidatedRouteOptimizer.tsx`
- **Depends on:** None

#### 3.4 Backend: Add graceful degradation for missing AI binding
- **What:** In `backend/edge-worker/src/routers/ai.ts`, check if the AI binding exists before attempting to call it. Return a structured error (503) with a clear message instead of a 500.
- **Where:** `backend/edge-worker/src/routers/ai.ts`
- **Depends on:** None

---

## Track 4: Empty State / Placeholder Improvements (Frontend)

**QA Finding:** Many panels display "---" or "0" when no journey data exist, without explaining why or what the user should expect.

**Files:**
- `frontend/src/components/AdvancedAnalyticsDashboard.tsx`
- `frontend/src/pages/FollowerView.tsx`
- `frontend/src/components/follower/JourneyArc.tsx`
- `frontend/src/components/VehicleStats.tsx`
- `frontend/src/components/MasterCoordinationDashboard.tsx`

### Work Items

#### 4.1 Design empty state component
- **What:** Create a reusable `EmptyState` component that accepts a title, description, and optional icon/illustration. Use it across all panels that currently show "---" or "0" with no context.
- **Where:** `frontend/src/components/common/EmptyState.tsx` (new)
- **Pattern:**
  ```tsx
  <EmptyState
    icon={<MapIcon />}
    title="No journey data yet"
    description="Your trip metrics will appear here once the journey begins."
  />
  ```
- **Depends on:** None

#### 4.2 Apply empty states to analytics panels
- **What:** Replace bare "---" and "No efficiency data yet" in analytics dashboard with the EmptyState component that explains what data will appear and when.
- **Where:** `frontend/src/components/AdvancedAnalyticsDashboard.tsx`
- **Apply to:**
  - Key metrics cards (distance, efficiency, cost, carbon) — "Metrics appear after your first drive"
  - Efficiency trends — "Efficiency data will appear after multiple drives"
  - Charging breakdown — "Charging data appears after your first charging session"
  - AI insights — "AI insights generate after enough data is collected"
- **Depends on:** 4.1

#### 4.3 Apply empty states to journey/follower page
- **What:** Replace blank "Moments" section and empty "arc so far" with contextual empty states.
- **Where:** `frontend/src/pages/FollowerView.tsx`, `frontend/src/components/follower/JourneyArc.tsx`
- **Apply to:**
  - Arc progress (0%) — "The journey hasn't started yet. Check back for live updates!"
  - Moments section — "Moments will appear here as the traveller adds highlights along the way."
  - States visited (0/48) — "States will light up as the journey crosses borders."
- **Depends on:** 4.1

#### 4.4 Apply empty states to dashboard panels
- **What:** Replace blank orientation panel, battery/range, vehicle status with contextual messaging.
- **Where:** `frontend/src/components/VehicleStats.tsx`, `frontend/src/components/MasterCoordinationDashboard.tsx`
- **Apply to:**
  - Map/orientation — "Connect your vehicle to see live location"
  - Battery/range — "Vehicle telemetry not yet available"
  - Vehicle status — "Waiting for first data sync"
- **Depends on:** 4.1

---

## Track 5: Backend Health & Infrastructure (Backend)

**QA Finding:** System tab shows "R2 storage not configured", degraded backend status, and "Failed to compute ingestion metrics."

**Cross-ref:** QA_PLATFORM_REMEDIATION H6 (R2 disabled), H11 (staging not provisioned), M19 (health check D1 ping)

**Files:**
- `backend/edge-worker/wrangler.toml` (R2 binding commented out)
- `backend/edge-worker/src/routers/health.ts`
- `backend/edge-worker/src/routers/admin.ts`

### Work Items

#### 5.1 Add graceful R2 degradation to health endpoint
- **What:** Instead of showing "R2 storage not configured" as an error/warning, classify it as "optional — media uploads disabled" in the health response. Only flag as degraded if R2 is expected (i.e., media routes are actively used).
- **Where:** `backend/edge-worker/src/routers/health.ts`
- **Depends on:** None

#### 5.2 Fix "Failed to compute ingestion metrics" error
- **What:** The health endpoint's ingestion metrics query likely fails when the ingestion tables are empty or don't exist. Add null checks and return "No ingestion data" instead of an error.
- **Where:** `backend/edge-worker/src/routers/health.ts`
- **Depends on:** None

#### 5.3 Add D1 connectivity check to health endpoint
- **What:** Execute a lightweight `SELECT 1` against D1 in the health check to verify database connectivity. Report D1 status as connected/disconnected.
- **Where:** `backend/edge-worker/src/routers/health.ts`
- **Cross-ref:** QA_PLATFORM_REMEDIATION M19
- **Depends on:** None

#### 5.4 Improve frontend system tab messaging
- **What:** Update the System tab in the dashboard to show health status with context-appropriate messaging. "R2 not configured" should say "Media storage: Not enabled (optional)". Backend warnings should distinguish between expected vs. unexpected states.
- **Where:** Frontend system/health display components
- **Depends on:** 5.1, 5.2

---

## Track 6: Accessibility Improvements (Frontend)

**QA Finding:** Dark theme text contrast insufficient; no light theme option; keyboard navigation not verified; focus outlines may be missing.

**Files:**
- `frontend/src/App.tsx`
- `frontend/src/index.css` or Tailwind config
- All interactive components (buttons, forms, links)

### Work Items

#### 6.1 Audit text contrast ratios
- **What:** Review all text-on-background combinations for WCAG AA compliance (4.5:1 for normal text, 3:1 for large text). Focus on muted/gray text on dark backgrounds.
- **Where:** All frontend components, especially:
  - Muted labels and descriptions
  - Status chips and badges
  - Placeholder text in inputs
  - Secondary text in cards
- **Approach:** Check Tailwind color classes like `text-muted-foreground`, `text-gray-400`, `text-gray-500` against their background counterparts. Replace with higher-contrast alternatives where needed.
- **Depends on:** None

#### 6.2 Ensure focus outlines on all interactive elements
- **What:** Verify that all buttons, links, form inputs, and tabs have visible focus outlines when navigated via keyboard (Tab/Shift-Tab). Add `focus-visible:ring-2 focus-visible:ring-ring` where missing.
- **Where:** All interactive components; check shadcn/ui defaults.
- **Depends on:** None

#### 6.3 Add skip-to-content link
- **What:** Verify the existing skip-to-content link works on all pages (it was found in the codebase). Ensure it targets the correct `#main-content` landmark.
- **Where:** `frontend/src/App.tsx` or layout component
- **Depends on:** None

#### 6.4 Add ARIA labels to data-display panels
- **What:** Add `aria-label` or `aria-labelledby` to dashboard panels, metric cards, and progress indicators so screen readers can identify them.
- **Where:** Analytics dashboard, vehicle stats, journey arc, status chips
- **Depends on:** None

#### 6.5 Evaluate high-contrast / light theme option
- **What:** Assess feasibility of a theme toggle (light/dark/system) using Tailwind's `dark:` class strategy. If the `dark` class is applied at the root level, a toggle is straightforward.
- **Where:** `frontend/src/App.tsx`, Tailwind config, new `ThemeProvider` context
- **Approach:**
  - Add a `ThemeContext` with `light | dark | system` options
  - Store preference in localStorage
  - Apply/remove `dark` class on `<html>` element
  - Add toggle button in header or settings
- **Depends on:** 6.1 (contrast audit should inform light-theme color choices)

---

## Track 7: Dependency & Build Health (Backend + Frontend)

**Source:** QA_PLATFORM_REMEDIATION Phase B (11 remaining items)

**Files:** `package.json` files across workspaces, `wrangler.toml`

### Work Items

#### 7.1 Move misplaced dependencies to devDependencies
- **What:**
  - Move `vite` from dependencies to devDependencies in `backend/edge-worker/package.json` (H2)
  - Move `esbuild` from dependencies to devDependencies in `frontend/package.json` (H10)
  - Move `@types/leaflet` from dependencies to devDependencies in `frontend/package.json` (M20)
- **Depends on:** None

#### 7.2 Consolidate mapping libraries
- **What:** Evaluate removing Leaflet (`leaflet`, `react-leaflet`, `@types/leaflet`) since `mapbox-gl` is the primary mapping solution. The codebase has both `AdvancedTeslaMap.tsx` (Mapbox) and `TeslaMap.tsx` (Leaflet).
- **Where:** `frontend/package.json`, map components
- **Cross-ref:** H4, H14
- **Depends on:** None — but requires decision on which map to keep

#### 7.3 Add typecheck script to frontend
- **What:** Add `"typecheck": "tsc --noEmit"` to `frontend/package.json` scripts.
- **Where:** `frontend/package.json`
- **Cross-ref:** H7
- **Depends on:** None

#### 7.4 Fix documentation D1 ID mismatch
- **What:** Update `docs/DEPLOYMENT.md` to match the actual D1 database ID in `wrangler.toml`.
- **Cross-ref:** H5
- **Depends on:** None

#### 7.5 Standardize Tessie secret names
- **What:** Pick `TESSIE_API_TOKEN` as the canonical name. Remove all `TESSIE_API_KEY` references and fallback patterns.
- **Cross-ref:** H12
- **Depends on:** None

#### 7.6 Address ESLint warnings
- **What:** Fix the 59 ESLint warnings in frontend. Priority order: `react-hooks/exhaustive-deps` (bug risk), `no-unused-vars` (dead code), `no-explicit-any` (type safety).
- **Cross-ref:** H13
- **Depends on:** None

---

## Track 8: Architecture Hardening (Backend)

**Source:** QA_PLATFORM_REMEDIATION Phase C (15 remaining items)

### Work Items

#### 8.1 Apply zValidator to all remaining route handlers
- **What:** Add Zod validation via `zValidator()` to all route handlers that currently lack it: `admin.ts`, `analytics.ts`, `vehicle.ts`, `auth.ts`, `media.ts`.
- **Cross-ref:** M1
- **Depends on:** None

#### 8.2 Eliminate `any` types in core backend code
- **What:** Replace `any` types in `src/index.ts` admin auth middleware and other core files with proper Hono types.
- **Cross-ref:** M2
- **Depends on:** None

#### 8.3 Replace console.log with structured logger
- **What:** Replace `console.log`/`console.error` calls in `tesla-automation.ts` and other files with the existing `logger` utility for consistent structured JSON logging.
- **Cross-ref:** M6
- **Depends on:** None

#### 8.4 Add React error boundaries
- **What:** Wrap major page sections (dashboard tabs, map, analytics) in error boundaries so a crash in one panel doesn't take down the entire app.
- **Cross-ref:** M13
- **Depends on:** None

#### 8.5 Batch D1 analytics writes
- **What:** Instead of writing to `analytics_events` on every request, batch writes using `waitUntil()` or a KV-based accumulator that flushes periodically.
- **Cross-ref:** M11
- **Depends on:** None

#### 8.6 Hash IPs in analytics + add retention cleanup
- **What:** Hash `user_ip` before storing in `analytics_events`. Add a cron job to purge analytics older than 30 days.
- **Cross-ref:** H8
- **Depends on:** None

---

## Track 9: Test Coverage Expansion (Backend + Frontend)

**Source:** QA_PLATFORM_REMEDIATION M7, M8

### Work Items

#### 9.1 Add frontend component tests
- **What:** Set up vitest + React Testing Library for frontend. Add tests for FollowButton, ConsolidatedRouteOptimizer, AdvancedAnalyticsDashboard, and EmptyState components.
- **Where:** `frontend/src/__tests__/` or co-located `*.test.tsx` files
- **Depends on:** Track 1, Track 3, Track 4 (test the improved components)

#### 9.2 Add backend middleware tests
- **What:** Unit test CORS, rate limiter, error handler, and request logger middleware.
- **Where:** `backend/edge-worker/tests/`
- **Depends on:** None

#### 9.3 Add backend router integration tests
- **What:** Integration tests for journey, analytics, health, and AI routers using Hono's test client.
- **Where:** `backend/edge-worker/tests/`
- **Depends on:** None

#### 9.4 Fix auth test assertions
- **What:** Auth tests currently pass despite 500 responses. Fix to assert correct status codes and provide proper mocked D1/KV bindings.
- **Cross-ref:** H9
- **Depends on:** None

---

## Track 10: CI/CD Pipeline Hardening

**Source:** QA_PLATFORM_REMEDIATION M14, M15, M16

### Work Items

#### 10.1 Add CI concurrency controls
- **What:** Add `concurrency` groups to GitHub Actions workflows to cancel redundant runs on rapid pushes.
- **Where:** `.github/workflows/*.yml`
- **Depends on:** None

#### 10.2 Enforce typecheck in CI
- **What:** Add `tsc --noEmit` for all workspaces (backend, frontend, shared) to CI preflight.
- **Where:** `.github/workflows/*.yml`
- **Depends on:** 7.3 (frontend typecheck script)

#### 10.3 Pin third-party actions to SHAs
- **What:** Replace `@v4` tag references with SHA-pinned references for all third-party GitHub Actions.
- **Where:** `.github/workflows/*.yml`
- **Depends on:** None

#### 10.4 Add eslint --max-warnings 0 to CI
- **What:** Once ESLint warnings are fixed (7.6), add `--max-warnings 0` to prevent regression.
- **Where:** `.github/workflows/*.yml` or `frontend/package.json` lint script
- **Depends on:** 7.6

---

## Execution Plan (Subagent Assignment)

### Wave 1 — Immediate UX Fixes (No Dependencies)
These can all run in parallel:

| Item | Track | Subagent Type | Estimated Complexity |
|---|---|---|---|
| 1.1 Follow button feedback | Track 1 | general-purpose | Medium |
| 2.1 Scroll container audit + fix | Track 2 | general-purpose | Low-Medium |
| 3.1 + 3.2 Route optimizer loading + errors | Track 3 | general-purpose | Medium |
| 3.3 Input validation | Track 3 | general-purpose | Low |
| 3.4 Backend AI graceful degradation | Track 3 | general-purpose | Low |
| 4.1 EmptyState component | Track 4 | general-purpose | Low |
| 5.1 + 5.2 + 5.3 Health endpoint fixes | Track 5 | general-purpose | Medium |

### Wave 2 — Apply Empty States + Accessibility (Depends on Wave 1)

| Item | Track | Subagent Type | Depends On |
|---|---|---|---|
| 4.2 Empty states in analytics | Track 4 | general-purpose | 4.1 |
| 4.3 Empty states in journey page | Track 4 | general-purpose | 4.1 |
| 4.4 Empty states in dashboard | Track 4 | general-purpose | 4.1 |
| 1.2 Follow count display | Track 1 | general-purpose | 1.1 |
| 1.3 Auth prompt for follow | Track 1 | general-purpose | 1.1 |
| 5.4 Frontend system tab messaging | Track 5 | general-purpose | 5.1, 5.2 |
| 6.1 Contrast audit | Track 6 | Explore | None (can start in Wave 1) |
| 6.2 Focus outlines | Track 6 | general-purpose | None |

### Wave 3 — Dependency & Build Health (Independent)

| Item | Track | Subagent Type | Depends On |
|---|---|---|---|
| 7.1 Move misplaced deps | Track 7 | Bash | None |
| 7.3 Add typecheck script | Track 7 | Bash | None |
| 7.4 Fix docs D1 ID | Track 7 | general-purpose | None |
| 7.5 Standardize secret names | Track 7 | general-purpose | None |
| 7.6 ESLint warnings | Track 7 | general-purpose | None |
| 8.2 Eliminate `any` types | Track 8 | general-purpose | None |
| 8.3 Structured logger | Track 8 | general-purpose | None |

### Wave 4 — Architecture & Testing (After Waves 1-3)

| Item | Track | Subagent Type | Depends On |
|---|---|---|---|
| 8.1 zValidator all routes | Track 8 | general-purpose | None |
| 8.4 Error boundaries | Track 8 | general-purpose | None |
| 8.5 Batch analytics writes | Track 8 | general-purpose | None |
| 8.6 IP hashing + retention | Track 8 | general-purpose | None |
| 9.1 Frontend component tests | Track 9 | general-purpose | Wave 1 |
| 9.2 Backend middleware tests | Track 9 | general-purpose | None |
| 9.3 Backend router tests | Track 9 | general-purpose | None |
| 9.4 Fix auth tests | Track 9 | general-purpose | None |

### Wave 5 — CI/CD + Polish (After Waves 3-4)

| Item | Track | Subagent Type | Depends On |
|---|---|---|---|
| 10.1 CI concurrency | Track 10 | general-purpose | None |
| 10.2 CI typecheck | Track 10 | general-purpose | 7.3 |
| 10.3 Pin actions to SHAs | Track 10 | general-purpose | None |
| 10.4 ESLint max-warnings 0 | Track 10 | general-purpose | 7.6 |
| 6.5 Theme toggle | Track 6 | general-purpose | 6.1 |
| 7.2 Consolidate map libs | Track 7 | general-purpose | Decision required |

---

## Decision Points (Require Human Input)

1. **Map library:** Keep Mapbox or Leaflet? Recommend Mapbox (already used for primary map) and remove Leaflet.
2. **Theme toggle priority:** Is a light/dark toggle needed before launch, or is dark-only acceptable?
3. **R2 storage:** Enable R2 for production media uploads, or keep it disabled and mark as optional?
4. **Staging environment:** Provision staging D1/KV resources? Required for safe production deploys per CLAUDE.md.
5. **Smartcar integration:** Begin multi-OEM provider work, or defer to post-launch?
