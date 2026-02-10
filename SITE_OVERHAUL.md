# Site Overhaul — Execution Contract

> Generated from deep audit of every page, component, hook, and backend endpoint.
> This is the sole execution contract for the next session(s).

## Completion Status

| Phase | Status | Branch / PR |
|-------|--------|-------------|
| Phase 0: Branding & Identity | ✅ DONE | `claude/frontend-overhaul-branding-ZFzLK` |
| Phase 1: Dead Code Purge | ✅ DONE | `claude/frontend-overhaul-branding-ZFzLK` |
| Phase 2: Backend Connectivity | ✅ DONE | `claude/frontend-overhaul-branding-ZFzLK` |
| Phase 3: Landing & Follower Polish | ✅ DONE | `claude/frontend-overhaul-branding-ZFzLK` |
| Phase 4: Dashboard — Live Tab | ⬜ TODO | |
| Phase 5: Dashboard — Navigation Tab | ⬜ TODO | |
| Phase 6: Dashboard — Analytics Tab | ⬜ TODO | |
| Phase 7: Dashboard — Author Tab | ⬜ TODO | |
| Phase 8: Dashboard — System Tab | ⬜ TODO | |
| Phase 9: Coordination Dashboard Overhaul | ⬜ TODO | |
| Phase 10: Demo Page Redesign | ⬜ TODO | |
| Phase 11: Global UX & Design Consistency | ⬜ TODO | |
| Phase 12: Deploy & Verify | ⬜ TODO | |

### Phase 0 deliverables (not in original contract — added as prerequisite)
- SVG favicon + ICO fallback (road-themed, brand colors)
- og-image.png (1200×630) for social sharing
- apple-touch-icon.png (180×180) for iOS
- Deleted scaffold placeholder.svg
- Updated index.html meta tags (twitter:image, apple-touch-icon)
- Loading spinner uses brand palette

### Phase 1 deliverables
- Deleted 11 orphan components (AdminLogin, EnhancedMapFeatures, ConnectedTeslaData,
  EnhancedRoadTripTracker, MediaGallery, AdvancedTeslaMap, ConsolidatedAIJourneyManager,
  JourneyTimeline, StateProgressMap, InteractiveRoutePlanner, RealtimeStatusCard)
- Deleted 5 orphan hooks (useWeatherApi, useUnifiedJourneyData, useTeslaData ×2, useRealtimeStatus)
- Deleted 7 orphan services (roadTripApi, IntelligentJourneyProcessor, journeyTimelineProcessor,
  tripDataService, driveAnalysisService, weatherService, journeyIntelligence)
- Deleted orphan lib/mapbox-loader.ts and stale hooks/README.md
- Removed unused deps: leaflet, react-leaflet, @types/leaflet, esbuild
- **6,907 lines of dead code removed**, CSS bundle 79KB → 70KB

### Phase 2 deliverables
- Fixed api-config.ts production URL (added account subdomain)
- Dev mode uses empty base URL (Vite proxy handles /api routing)
- Added localhost:8081 to backend CORS whitelist
- API config is single source of truth (lib/api-config.ts → backendApi.ts)

### Phase 3 deliverables
- Fixed "Follow the journey" CTA: `/journey/1` → `/journey/live`
- Fixed dashboard "Public view" link to same `/journey/live`
- FollowerView treats `live` as alias (omits from API path → default journey)
- JourneyNarrative: richer moments with duration, location labels, milestone detection
- Shows up to 12 moments (was 8), marks state-crossing drives as milestones

---

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

## Phase 1: Dead Code Purge — ✅ COMPLETE

> All items resolved. See "Phase 1 deliverables" above for summary.
> Many orphan files from the original list were already deleted in prior sessions.
> This session deleted an additional 26 files (11 components, 5 hooks, 7 services, 3 misc).

---

## Phase 2: Backend Connectivity Fixes — ✅ COMPLETE

> See "Phase 2 deliverables" above.
> **Remaining items for future sessions:**
> - 2.3: Verify backend endpoints return real data (requires live backend access)
>
> **Data architecture decision:** Journey data is pulled in real time from the
> vehicle (Tessie API → cron ingestion → D1). The user indicates a start date and
> data is stored compressed for the journey duration. There is NO seed/mock data
> step — empty states in the UI must gracefully handle "no data yet" until real
> telemetry arrives. Phase 2.4 (seed script) is **cancelled**.

---

## Phase 3: Landing & Follower Polish — ✅ COMPLETE

> See "Phase 3 deliverables" above. All 5 sub-items resolved.
> Prior sessions already implemented heartbeat fetch, skeleton loading, and error/empty states.
> This session fixed CTA routing and enriched JourneyNarrative moments.

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
