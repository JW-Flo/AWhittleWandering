# Site Overhaul — Execution Contract

> Generated from deep audit of every page, component, hook, and backend endpoint.
> This is the sole execution contract for the next session(s).

## Philosophy

Every screen a user can reach must either (a) show **real data** from the backend, or (b) show **contextually accurate, clearly labeled** example data that matches the trip narrative ("A Whittle Wandering — Continental USA, 31 states, 55 days, Tesla Model Y 'Midnight Shadow'"). No screen should look broken, empty, or generic.

---

## Execution Order

| Phase | Section | Commit Prefix | Gate |
|-------|---------|---------------|------|
| 1 | Dead Code Purge | `chore:` | `npm run typecheck` |
| 2 | Backend Connectivity Fixes | `fix:` | `npm run build` (frontend) |
| 3 | Landing & Follower Polish | `feat:` | `npm run build` |
| 4 | Dashboard — Live Tab | `fix:` | `npm run build` |
| 5 | Dashboard — Navigation Tab | `fix:` | `npm run build` |
| 6 | Dashboard — Analytics Tab | `fix:` | `npm run build` |
| 7 | Dashboard — Author Tab | `fix:` | `npm run build` |
| 8 | Dashboard — System Tab | `fix:` | `npm run build` |
| 9 | Coordination Dashboard Overhaul | `feat:` | `npm run build` |
| 10 | Demo Page Redesign | `feat:` | `npm run build` |
| 11 | Global UX & Design Consistency | `style:` | `npm run build` |
| 12 | Deploy & Verify | `chore:` | Production smoke test |

---

## Phase 1: Dead Code Purge

**Goal:** Remove all orphan components that are never rendered from any route. These bloat the bundle and confuse maintenance.

### 1.1 Delete orphan component files

These components are **never imported** from any rendered route (App.tsx routes):

| File | Status | Notes |
|------|--------|-------|
| `components/EnhancedTeslaApp.tsx` | ORPHAN | Not imported by any route |
| `components/MinimalTeslaApp.tsx` | ORPHAN | Not imported by any route |
| `components/AdminPortal.tsx` | ORPHAN | Not imported by any route |
| `components/AdminLogin.tsx` | INTERNAL-ONLY | Only imported by orphan AdminPortal + MediaUpload (remove MediaUpload import too) |
| `components/AIJourneyAssistant.tsx` | INTERNAL-ONLY | Only imported by orphan EnhancedTeslaApp |
| `components/UXEnhancements.tsx` | INTERNAL-ONLY | Only imported by orphan EnhancedTeslaApp |
| `components/ConnectedVehicle.tsx` | ORPHAN | Not imported anywhere |
| `components/Dashboard/Dashboard.tsx` | ORPHAN | Not imported by any route |
| `components/Dashboard/Dashboard.test.tsx` | ORPHAN | Tests a component that isn't used |
| `components/DebugInfo.tsx` | ORPHAN | Not imported anywhere |
| `components/NavBar.tsx` | ORPHAN | Not imported by any route |
| `components/SecurityNotice.tsx` | ORPHAN | Not imported anywhere |
| `components/SystemStatusPanel.tsx` | ORPHAN | Not imported anywhere |
| `components/ProductionBanner.tsx` | ORPHAN | Not imported anywhere |
| `components/RouteOptimizer.tsx` | ORPHAN | Superseded by ConsolidatedRouteOptimizer |
| `components/AdventureCsvUploader.tsx` | ORPHAN | Not imported anywhere |
| `components/AdventureHero.tsx` | ORPHAN | Not imported by any route (Landing uses its own hero) |
| `components/AnalyticsDashboard.tsx` | ORPHAN | Superseded by AdvancedAnalyticsDashboard |

### 1.2 Remove AdminLogin import from MediaUpload.tsx
- MediaUpload.tsx line 10 imports AdminLogin but doesn't appear to use it in render. Verify and remove.

### 1.3 Remove PuppeteerTestingComponent from MasterCoordinationDashboard
- Only connects to `localhost:3001` — non-functional in production.

### 1.4 Audit and remove unused hooks
- `hooks/useSmartTracking.ts` — pure simulation, no real GPS data, not used in any rendered component
- `hooks/useMasterData.ts` — empty file (1 line)
- Verify `hooks/useUnifiedApiData.ts` vs `hooks/useUnifiedJourneyData.ts` — if only one is used in rendered components, delete the other

### 1.5 Audit unused npm dependencies
From `package.json`, check actual usage of:
- `leaflet`, `react-leaflet` (we use mapbox-gl, not leaflet)
- `papaparse` (CSV parsing — only used in orphan AdventureCsvUploader)
- `recharts` (charting — check if any rendered component uses it)
- `embla-carousel-react`, `cmdk`, `vaul`, `react-resizable-panels`
- `react-day-picker`, `react-hook-form`, `@hookform/resolvers`, `input-otp`

**Remove any that are only used by orphan components or not used at all.**

---

## Phase 2: Backend Connectivity Fixes

**Goal:** Ensure every API call the frontend makes actually works in production.

### 2.1 Fix CORS for production domain
- Backend CORS middleware must allow `https://awhittlewandering.pages.dev` and `https://www.awhittlewandering.com`
- Read `backend/edge-worker/src/middleware/cors.ts` and verify allowed origins include production URLs
- Ensure preflight (OPTIONS) responses are correct

### 2.2 Fix api-config.ts production base URL
- Currently: production URL is `https://api.awhittlewandering.com`
- Verify this domain exists and resolves (it may not be configured yet)
- If not configured, the base URL should fall back to the actual backend worker URL
- Consider using a relative `/api/v1/` path if frontend and backend can be served from the same domain via Cloudflare Pages Functions

### 2.3 Verify backend endpoints return real data
Test each endpoint the frontend calls:
- `GET /api/v1/unified-data` — this is the critical one (powers Dashboard + FollowerView)
- `GET /api/v1/config` — returns app config including mapboxToken
- `GET /api/v1/analytics/summary`
- `GET /api/v1/analytics/efficiency`
- `GET /api/v1/analytics/charging`
- `POST /api/v1/route/optimize`
- `POST /api/v1/journal/generate`
- `GET /api/v1/trip-status`
- `GET /api/v1/component/overview`

If endpoints return empty/skeleton data because D1 has no rows, **seed the database with realistic trip data** (see Phase 2.4).

### 2.4 Seed D1 with realistic trip data (if database is empty)
Create a migration or seed script that inserts:
- 1 journey (`continental-usa-2025`)
- 1 vehicle (`midnight-shadow`, Tesla Model Y)
- Vehicle state (current location, battery, etc.)
- 15-20 drives with real-ish coordinates across different states
- 10-15 charging sessions at Supercharger locations
- 5-10 states visited entries
- This makes every data-driven screen show meaningful content immediately

---

## Phase 3: Landing & Follower Polish

### 3.1 Fix broken "Follow the journey" CTA
- Landing.tsx line 39: `to="/journey/live"` links to `/journey/live`
- App.tsx route is `/journey/:id` — so this resolves with `id="live"`
- Backend unified-data endpoint defaults to `continental-usa-2025` journey ID
- **Fix:** Either change CTA to `/journey/continental-usa-2025` or handle `id="live"` specially in FollowerView to fetch the default active journey

### 3.2 Landing page — add contextual trip info
Currently 100% static. Add a lightweight fetch to show:
- Current trip status (e.g., "Day 35 — currently in Colorado")
- Or at minimum, a live "heartbeat" indicator showing the trip is real
- Keep the narrative tone — don't make it a dashboard

### 3.3 FollowerView — improve loading states
- Replace generic "Loading the journey..." text with skeleton cards that match the final layout
- Add shimmer/pulse animations on the hero card, arc card, and moments section
- Use the `animate-shimmer` utility already defined in index.css

### 3.4 FollowerView — improve empty/error states
- When backend returns skeleton data (0 miles, 0 states), show a friendly "The journey hasn't started yet" message instead of showing all zeros
- When API fails, show a richer error with the last known good state if available

### 3.5 JourneyNarrative — improve "Moments" rendering
- Currently shows drives as "A meaningful segment: X miles" — this is generic
- Enrich with: start/end locations, date, and optional photos if available
- Use the `Moment` component's `kind` prop more meaningfully (segment vs milestone vs note)

---

## Phase 4: Dashboard — Live Tab

### 4.1 Fix VehicleStats empty state
- When data is `null` (API failed), VehicleStats shows "0%" battery, "0 mi" range, "0 mph" speed
- **Fix:** Show a "Waiting for vehicle data..." card instead of misleading zeros
- Only render stat values when `data !== null`

### 4.2 Fix TeslaMap initial center
- Map defaults to hardcoded USA center coordinates if no vehicle location
- Should show "No location data available" message instead of a random map center
- When vehicle location IS available, auto-center and zoom to it on first load

### 4.3 Fix Trip card empty state
- Shows "—" for everything when offline — acceptable but could show last known values
- Consider caching last successful response in sessionStorage

### 4.4 Add connection status banner
- When `isConnected === false`, show a clear but non-intrusive banner: "Backend offline — showing last known data"
- Remove the "Offline" badge ambiguity (does it mean the car or the backend?)

---

## Phase 5: Dashboard — Navigation Tab

### 5.1 Fix ConsolidatedRouteOptimizer data flow
- Origin/destination inputs accept free text but no geocoding → backend likely fails
- **Fix options:**
  1. Add address autocomplete/geocoding (Mapbox Geocoding API or similar)
  2. Or simplify: provide city/state dropdown or pre-populated waypoints from the trip plan
  3. At minimum, validate input format before sending to backend

### 5.2 Fix route optimization results display
- Results tab shows "No optimized route yet" — fine initially
- But if backend returns an error, user sees nothing helpful
- **Fix:** Show a clear error message with the actual failure reason

### 5.3 Remove hardcoded colors
- Line 174: `text-blue-500` → use design token
- Line 255: `text-green-600` → use design token
- Line 260: `text-blue-600` → use design token
- Line 265: `text-purple-600` → use design token

### 5.4 Wire vehicle data to route optimizer
- Currently `vehicleData.efficiency` is undefined (not passed from dashboard)
- Pass efficiency from analytics or calculate from recent drives

---

## Phase 6: Dashboard — Analytics Tab

### 6.1 Verify AdvancedAnalyticsDashboard shows real data
- This component actually fetches from 3 real API endpoints — good
- **But:** If those endpoints return empty (no D1 data), user sees "---" everywhere
- **Fix:** Add graceful empty states: "No driving data yet — analytics will appear after your first drive"

### 6.2 Fix hardcoded "AI Insights" section
- Lines 393-437: Three hardcoded insight cards with fake recommendations
- Label says "Example" (good) but the content is generic
- **Fix:** Either (a) generate insights from actual analytics data, or (b) hide the section entirely when there's real data available, or (c) make the example content match the actual trip context

### 6.3 Fix remaining hardcoded colors
- Line 152: `text-blue-500` → use token
- Line 187: `text-emerald-500` → use token
- Lines 395-396: `bg-blue-100`, `text-blue-600` → use tokens
- Lines 410-411: `bg-green-100`, `text-green-600` → use tokens
- Lines 425-426: `bg-purple-100`, `text-purple-600` → use tokens

### 6.4 Add charts/visualizations
- Currently all data is shown as text/numbers in cards
- Add simple bar or line charts for efficiency trends and charging patterns
- Use the already-installed recharts (if kept) or lightweight alternatives

---

## Phase 7: Dashboard — Author Tab

### 7.1 Fix JourneyJournal empty state
- Shows empty form with no entries — confusing for new users
- **Fix:** Show an introductory message: "Start documenting your journey — add photos, notes, and milestones"
- Pre-populate with an example entry or show a getting-started guide

### 7.2 Fix JourneyJournal persistence
- Entries are client-side only (useState) — lost on page refresh
- **Fix:** Wire to `backendApi.generateJournal()` or a new CRUD endpoint for manual entries
- At minimum, persist to sessionStorage as a stopgap

### 7.3 Fix MediaUpload empty state
- Remove the AdminLogin import (dead code from Phase 1.2)
- Show helpful empty state: "Upload photos from your journey — they'll appear in the timeline"
- Wire uploads to R2 via the backend media endpoint

### 7.4 Fix AI journal generation
- The "Generate with AI" button calls backendApi which hits `/api/v1/journal/generate`
- Verify this endpoint works and returns contextually relevant content
- If not, disable the button with a tooltip: "AI generation coming soon"

---

## Phase 8: Dashboard — System Tab

### 8.1 Improve System tab content
- Currently just 2 buttons (Coordination, Demo) with vague text
- **Fix:** Show actual system status:
  - Backend health (fetch `/api/v1/health`)
  - Data freshness (from TeslaDataContext's `tessieStatus.dataFreshness`)
  - Last sync time
  - Mapbox token status (configured/not configured)
  - Database connection status

---

## Phase 9: Coordination Dashboard Overhaul

**Goal:** Transform from a 100% mock prototype into a useful operational view.

### 9.1 Remove all mock sub-components
Delete or completely rewrite these simulation-only components:
- `SmartMapFeatures.tsx` — fake route optimization with setTimeout, 0 API calls
- `SmartAssistant.tsx` — fake AI responses, hardcoded suggestions
- `UXEnhancementSuite.tsx` — local-only settings, fake real-time badge
- `AnalyticsDashboard.tsx` (the coordination one, not AdvancedAnalyticsDashboard) — all hardcoded

### 9.2 Replace with real operational panels
Redesign the coordination dashboard around real data:

**Tab 1: Trip Overview**
- Embed the JourneyArc component showing real trip progress
- Map with current location (reuse LazyTeslaMap)
- Recent drives timeline from unified-data API

**Tab 2: Analytics (real)**
- Embed AdvancedAnalyticsDashboard (already wired to real APIs)
- Or provide a summary view linking to the main dashboard analytics tab

**Tab 3: Route Planning**
- Embed ConsolidatedRouteOptimizer (already partially wired)
- Remove the fake SmartMapFeatures

**Tab 4: System Health**
- Backend health status
- Data pipeline status (last sync, data freshness)
- Error log summary

### 9.3 Remove hardcoded AI model status bars
- Lines 43-95 of MasterCoordinationDashboard: fake phi3/gemma3/codellama/mistral progress bars
- These are completely fabricated and serve no purpose
- Replace with actual system metrics or remove entirely

### 9.4 Update or remove prototype banner
- If real data is wired up, downgrade to "Beta" or remove
- If still partially mock, keep but make more specific about what's simulated

---

## Phase 10: Demo Page Redesign

### 10.1 Rebuild Demo page from scratch
Current Demo.tsx is a raw API test page — just a button that calls `/api/joiner` and shows raw JSON.

**Replace with a guided demo experience:**
- Show what the platform does (follower view with sample data)
- Walk through key features: live tracking, journey narrative, analytics
- Use realistic seed data, not raw JSON dumps
- Link to the real follower view with the default journey

### 10.2 Make demo self-contained
- Don't require backend to be running for the demo to work
- Embed static example data that matches the trip narrative
- Show screenshots or interactive previews of dashboard features

---

## Phase 11: Global UX & Design Consistency

### 11.1 Consistent navigation across all pages
Currently there's no shared nav component — each page has its own ad-hoc header:
- Landing: Just a "Journeyer dashboard" ghost button (top right)
- Dashboard: Header with title, Public view/Coordination/Refresh buttons
- FollowerView: Home + Dashboard buttons
- Coordination: No back navigation
- Demo: No navigation at all

**Fix:** Create a minimal shared header/nav that adapts per context:
- Public pages (Landing, FollowerView, Demo): Show "A Whittle Wandering" brand + relevant nav
- Dashboard pages: Show back-to-dashboard breadcrumb + current section

### 11.2 Fix all remaining hardcoded Tailwind colors
Sweep all components for `text-blue-*`, `text-green-*`, `text-purple-*`, `bg-blue-*`, etc.
Replace with design system tokens: `text-primary`, `bg-primary/10`, `text-muted-foreground`, etc.

### 11.3 Add proper loading states everywhere
Every component that fetches data should show:
1. Skeleton/shimmer while loading (not just "Loading...")
2. Clear error state with retry option
3. Empty state with helpful guidance (not blank space or zeros)

### 11.4 Mobile responsiveness audit
Check every page at 375px, 768px, and 1024px:
- Dashboard tabs: already responsive (grid-cols-2 sm:3 lg:5) ✅
- Coordination tabs: already responsive ✅
- Map heights: fixed `h-[420px]` may be too tall on mobile
- Route optimizer form: check input layout on narrow screens

---

## Phase 12: Deploy & Verify

### 12.1 Build and typecheck
```bash
cd frontend && npm run typecheck && npm run build
```

### 12.2 Deploy to preview
```bash
cd frontend && npx wrangler pages deploy dist --project-name=awhittlewandering --branch=overhaul
```

### 12.3 Smoke test every route
- `/` — Landing loads, CTAs work
- `/journey/live` (or `/journey/continental-usa-2025`) — FollowerView loads with data
- `/dashboard` — All 5 tabs render without errors
- `/dashboard/coordination` — Operational view loads
- `/demo` — Demo experience works
- `/nonexistent` — NotFound page renders

### 12.4 Deploy to production
```bash
cd frontend && npx wrangler pages deploy dist --project-name=awhittlewandering --branch=main
```

---

## Data Source Summary (Current State → Target State)

| Component | Current Data Source | Target |
|---|---|---|
| Landing page | 100% hardcoded | Fetch trip status for live heartbeat |
| FollowerView hero | Real API (unified-data) | Real API (working) |
| FollowerView narrative | Real API (drives) | Real API + richer moments |
| Dashboard Live tab | Real API (TeslaDataContext) | Real API with better empty states |
| Dashboard Navigation | Real API (route optimize) | Real API with input validation |
| Dashboard Analytics | Real API (3 endpoints) | Real API with charts + better empty states |
| Dashboard Author | Client-side only (useState) | Backend persistence |
| Dashboard System | 2 static buttons | Real health/status from API |
| Coordination Overview | 100% MOCK (fake AI bars) | Real trip overview |
| Coordination Maps | 100% SIMULATED (fake delays) | Reuse LazyTeslaMap with real data |
| Coordination Analytics | 100% MOCK (hardcoded) | Embed AdvancedAnalyticsDashboard |
| Coordination AI | 100% SIMULATED (fake responses) | Remove or connect to real AI |
| Coordination UX | 100% MOCK (local state) | Remove or merge into Settings |
| Coordination Testing | LIVE (localhost only) | Remove (non-functional in prod) |
| Demo page | Raw JSON API test | Guided demo experience |

---

## Orphan Component Summary (to delete in Phase 1)

Total files to delete: **~18 component files + 2 hook files + 1 test file**

This will reduce the frontend component count from ~85 to ~65 and remove significant bundle bloat.

---

## Priority Order (if time-constrained)

If you can only do some phases, prioritize in this order:
1. **Phase 1** (dead code) — smallest effort, biggest cleanup
2. **Phase 2** (backend connectivity) — makes everything else work
3. **Phase 4** (Live tab fixes) — the most-visited dashboard page
4. **Phase 3** (Landing/Follower) — public-facing pages
5. **Phase 9** (Coordination overhaul) — biggest visual improvement
6. **Phase 10** (Demo) — user asked about this
7. Phases 5-8, 11 — incremental improvements
