# Frontend Audit — Fix These 69 Issues

You are picking up a comprehensive frontend audit of **A Whittle Wandering** (React/Vite SPA on Cloudflare Pages). This document contains every issue found. Work through them in the priority order at the bottom. After each fix, run `npm run build` from `frontend/` to verify. Commit after each logical group of fixes using Conventional Commits.

**Dev site**: https://awhittlewandering.pages.dev/dashboard

---

## 1. CRITICAL — Runtime Bugs (fix these first)

### 1.1 JourneyJournal.tsx is severely broken (7 issues)

**File**: `frontend/src/components/JourneyJournal.tsx`

The component signature at line 52-55 destructures `tripData` (renamed `_tripData`) and `onGenerateEntry` from props, but the `JourneyJournalProps` interface (line 44-50) defines `entries`, `onAddEntry`, `currentLocation`, and `isAutoGenerating` — none of which are actually destructured. Fix all of these:

1. **Line 52-55**: Destructure all needed props from the interface: `entries`, `onAddEntry`, `currentLocation`, `isAutoGenerating`, `onGenerateEntry`. Remove the phantom `tripData`.
2. **Line 120**: `newEntry.title.trim()` crashes because `newEntry` is `Partial<JournalEntry>` so `title` can be `undefined`. Add a null check: `newEntry.title?.trim()`.
3. **Lines 128-132**: References `currentLocation` which is never in scope because it wasn't destructured. Wire it up from props.
4. **Line 135**: Calls `onAddEntry?.(entry)` but `onAddEntry` was never destructured. Wire it up from props.
5. **Line 186**: Reads `isAutoGenerating` in JSX but it was never destructured. Wire it up from props.
6. **Lines 59-67**: `newEntry` initial state includes `style`, `tags`, `distance` which don't exist on `JournalEntry`. Remove them or extend the type.
7. **Lines 401-408**: Quick template buttons reference `currentLocation` — same scoping fix as #3.

### 1.2 EnhancedMapFeatures.tsx — undeclared variable references

**File**: `frontend/src/components/EnhancedMapFeatures.tsx`

1. **Line 172**: References `chargingStations` but line 30 declares it as `_chargingStations`. Rename back to `chargingStations` (remove underscore prefix) since it IS used.
2. **Line 206**: References `recommendations` but line 28 declares it as `_recommendations`. Same fix — remove underscore prefix.

### 1.3 FollowerView.tsx — route param ignored

**File**: `frontend/src/pages/FollowerView.tsx`

**Line 58**: The `useEffect` currently fetches from `/api/v1/unified-data` with an empty dependency array `[]` while the component also reads `id` from `useParams()`. Decide which behavior is correct and update the code accordingly:

- If follower data should be scoped to the specific journey, change the fetch to call an ID-specific endpoint (for example: `/api/v1/unified-data/${id}` or an equivalent route that uses `id`) and add `id` to the dependency array so navigating between `/journey/abc` and `/journey/xyz` re-fetches the correct data.
- If `/api/v1/unified-data` is intentionally global and independent of the route, leave the fetch as-is but document in the component that the route param `id` is only used for follow actions/display and does not affect this data fetch; in that case, adding `id` to the dependency array alone will not change what data is loaded.
---

## 2. HIGH — API Configuration (fix second)

### 2.1 Three conflicting API configs — consolidate to one

There are three files that define API base URLs with different production values:

| File | Production URL | Used by |
|------|---------------|---------|
| `frontend/src/lib/api-config.ts` | `https://api.awhittlewandering.com` | TeslaDataContext, FollowerView, useUnifiedApiData |
| `frontend/src/lib/api.ts` | `https://awhittlewandering-api.kd8jc7v8cd.workers.dev` | `useRealtimeStatus` hook (via `RealtimeStatusCard`) |
| `frontend/src/services/backendApi.ts` | `http://localhost:8787` (NO prod fallback!) | JourneyJournal, ConsolidatedRouteOptimizer, AdvancedAnalyticsDashboard |

**The critical problem**: `backendApi.ts` defaults to `http://localhost:8787` in production. The Navigation tab, Analytics tab, and Journal AI generation all silently fail for real users.

**Fix**: Make `frontend/src/services/backendApi.ts` import its base URL from `frontend/src/lib/api-config.ts` instead of defining its own. Migrate `frontend/src/hooks/useRealtimeStatus.ts` (and therefore `RealtimeStatusCard`) off `frontend/src/lib/api.ts` to use the consolidated configuration, then delete `frontend/src/lib/api.ts` once it is no longer referenced. There should be exactly one source of truth for the API base URL.

### 2.2 Inconsistent endpoint paths in backendApi.ts

| Method | Currently calls | Should call |
|--------|----------------|-------------|
| `health()` | `/health` | `/api/v1/health` |
| `getTripStatus()` | `/trip-status` | `/api/v1/trip-status` |

### 2.3 No type safety on API responses

`backendApi.ts` — all 14 methods return `Promise<any>`. Add proper return types based on the actual API response shapes.

### 2.4 Duplicate endpoint alias

`api-config.ts` line 17: `TIMELINE` and `UNIFIED_DATA` both point to `/api/v1/unified-data`. Either remove the duplicate or point `TIMELINE` to its own endpoint if one exists.

---

## 3. HIGH — Build & Config (fix third)

### 3.1 Enable TypeScript strict mode

**File**: `frontend/tsconfig.app.json`

Change these settings to match the project standard ("TypeScript strict mode in all workspaces"):

```json
"strict": true,
"noUnusedLocals": true,
"noUnusedParameters": true,
"noFallthroughCasesInSwitch": true
```

Then fix all resulting type errors. This will surface many of the bugs from Section 1 at compile time.

### 3.2 Fix ESLint

`npm run lint` currently fails with "eslint: not found". Since `frontend/package.json` includes `eslint` and `@eslint/js` in `devDependencies`, this usually means devDependencies were not installed (for example, running `npm ci --omit=dev` or setting `NODE_ENV=production`). From `frontend/`, run `npm install` (or `npm ci` without omitting devDependencies) to install workspace dependencies, then run `npm run lint` again. If it still fails, investigate ESLint configuration or version conflicts rather than assuming the binary is missing from `node_modules/.bin/`.

### 3.3 Remove duplicate EXIF library loading

`index.html:19` loads `exif-js` from CDN as a global `<script>`. The same library is also in `package.json`. Remove the CDN script tag and `import EXIF from 'exif-js'` properly in `MediaUpload.tsx`, eliminating the 6 `@ts-expect-error` hacks.

### 3.4 Clean up vite.config.ts manual chunks

`vite.config.ts:36-38` — `manualChunks` references `AdminPortal.tsx` (not imported in any route) and `TeslaMap.tsx`. Verify these are needed or remove the stale entries.

---

## 4. HIGH — Security

### 4.1 Admin session token in localStorage

**File**: `frontend/src/lib/auth.ts:55` — admin session token in `localStorage` is XSS-exfiltrable. Move to `sessionStorage` at minimum.

### 4.2 Password in MFA challenge state

**File**: `frontend/src/lib/auth.ts:88-93` — `this.mfaChallenge` stores the plaintext `password`. Remove the password field; the backend should not need it after the initial auth request returns a challenge ID.

### 4.3 Debug endpoints in production client

**File**: `frontend/src/services/backendApi.ts:125-131` — `getTessieSample()` and `getDrivesCheck()` methods call `/api/v1/debug/*`. Remove these from the production client.

### 4.4 Fix import ordering in auth.ts

**File**: `frontend/src/lib/auth.ts:306` — `import React from 'react'` is at the bottom of the file, after all the code that uses `React.useState` and `React.useEffect`. Move it to the top with the other imports.

---

## 5. MEDIUM — Accessibility

| # | File | Fix |
|---|------|-----|
| 5.1 | `NotFound.tsx:15` | Replace hardcoded light-theme colors (`bg-gray-100`, `text-gray-600`, `text-blue-500`) with design system tokens (`bg-background`, `text-muted-foreground`, `text-primary`). |
| 5.2 | `NotFound.tsx:19` | Replace `<a href="/">` with `<Link to="/">` for SPA navigation. |
| 5.3 | `JourneyJournal.tsx:243-258` | Add `<Label>` elements to form inputs. Placeholders alone are not accessible. |
| 5.4 | `MediaUpload.tsx:245-251` | Add `aria-label="Upload photos and videos"` to the hidden file input. |
| 5.5 | `MediaUpload.tsx:299` | Replace `alt="Uploaded media"` with the actual filename: `alt={media.file.name}`. |
| 5.6 | `VehicleStats.tsx:55` | Replace `bg-gray-200` in skeleton with `bg-muted`. |
| 5.7 | All pages | Add a skip-to-content link in the app shell. |
| 5.8 | `App.tsx` | Wrap routes in a React error boundary component with a user-friendly fallback UI. |
| 5.9 | `JourneyerDashboard.tsx:131` | Change 5-col tab grid to responsive: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`. |
| 5.10 | `MasterCoordinationDashboard.tsx:131` | Change 6-col tab grid to responsive or use a scrollable `TabsList`. |

---

## 6. MEDIUM — SEO

| # | Fix |
|---|-----|
| 6.1 | Add `<meta property="og:image" content="...">` to `index.html`. Create or reference a social share image. |
| 6.2 | Add `<meta property="og:url">` and `<link rel="canonical">` to `index.html`. |
| 6.3 | The `twitter:card` is `summary_large_image` but has no image — either add one or change to `summary`. |
| 6.4 | Install `react-helmet-async` and set per-route titles and descriptions in each page component. |
| 6.5 | Add `public/robots.txt` with basic rules. |
| 6.6 | Add `public/sitemap.xml` listing the public routes. |
| 6.7 | Add JSON-LD structured data for the journey (schema.org `Event` or `Trip`). |

---

## 7. MEDIUM — Design System Violations

These components use hardcoded Tailwind colors that clash with the warm dark theme. Replace with design system tokens from `index.css`:

| File | Hardcoded | Replace with |
|------|-----------|--------------|
| `NotFound.tsx` | `bg-gray-100` | `bg-background` |
| `VehicleStats.tsx` | `bg-gray-200` | `bg-muted` |
| `ConsolidatedRouteOptimizer.tsx` | `bg-blue-50`, `text-blue-700`, `bg-red-50`, `bg-slate-50` | `bg-primary/10`, `text-primary`, `bg-destructive/10`, `bg-secondary` |
| `AdvancedAnalyticsDashboard.tsx` | `text-gray-600` (18x), `bg-blue-50`, `bg-green-50`, `bg-purple-50` | `text-muted-foreground`, `bg-primary/10`, `bg-accent/10`, `bg-secondary/10` |
| `MediaUpload.tsx` | `bg-blue-50`, `border-gray-300`, `text-gray-400`, `text-gray-500`, `bg-gray-100` | Design system equivalents |
| `EnhancedMapFeatures.tsx` | `text-green-600`, `text-blue-600`, `text-gray-600` | `text-primary`, `text-muted-foreground` |
| `Demo.tsx` | All inline styles with light-theme hex colors | Use Tailwind design system classes |

---

## 8. LOW — Dead Code Cleanup

Delete these files and references:

| # | Item |
|---|------|
| 8.1 | `frontend/src/_archived/` — entire directory (14 deprecated files) |
| 8.2 | `frontend/src/pages/Index.tsx` (unreferenced) |
| 8.3 | `frontend/src/pages/Index.temp.tsx` (unreferenced) |
| 8.4 | `frontend/src/pages/SimpleTest.tsx` (unreferenced, has hardcoded worker URL) |
| 8.5 | `frontend/src/pages/TestIndex.tsx` (unreferenced) |
| 8.6 | `frontend/src/lib/config.ts` (deprecated, only emits console.warn) |
| 8.7 | `frontend/src/lib/api.ts` (superseded by `api-config.ts`, migrate `useRealtimeStatus` first) |
| 8.8 | Remove either `@radix-ui/react-toast` Toaster OR `sonner` Sonner from `App.tsx` — pick one toast system |
| 8.9 | Remove `next-themes` from `package.json` — `ThemeProvider` is never used; before removal, update `frontend/src/components/ui/sonner.tsx` to stop importing `useTheme` from `next-themes` (or remove Sonner entirely per 8.8) so the build does not break. |
| 8.10 | `frontend/src/components/VehicleStats.tsx:43-47` — delete `_getBatteryColor()` (unused) |
| 8.11 | `frontend/src/lib/auth.ts:192-193` — delete `generateSessionId()` (unused) |
| 8.12 | Audit these deps and remove if unused: `leaflet`, `react-leaflet`, `papaparse`, `recharts`, `embla-carousel-react`, `cmdk`, `vaul`, `react-resizable-panels`, `react-day-picker`, `react-hook-form`, `@hookform/resolvers`, `input-otp` |
| 8.13 | `frontend/src/services/backendApi.ts:125-131` — remove debug endpoint methods |
| 8.14 | Edit and expand existing `frontend/.env.example` to document `VITE_API_BASE_URL`, `VITE_BACKEND_URL`, `VITE_MAPBOX_TOKEN` (and ensure naming matches `backendApi.ts`) |

---

## 9. INFO — UX Polish (address if time permits)

| # | Issue |
|---|-------|
| 9.1 | Landing page: two CTA buttons link to the same URL (`/journey/live`). Merge or differentiate. |
| 9.2 | `MasterCoordinationDashboard` is all mock data. Either connect to real data or add a clear "demo/prototype" banner. |
| 9.3 | `AdvancedAnalyticsDashboard:392-435` — "AI-Powered Insights" is hardcoded static text. Either generate from data or label as example. |
| 9.4 | Demo page says "AtlasIT Joiner Demo" — wrong branding. Update or hide behind auth. |
| 9.5 | JourneyJournal entries are local state only — lost on refresh. Consider persisting to backend. |
| 9.6 | `MediaUpload.tsx:188` — `URL.createObjectURL()` during EXIF extraction is never revoked. Add cleanup. |
| 9.7 | No loading indicator for initial app shell (blank page until React mounts). Add a spinner to `index.html`. |
| 9.8 | `App.tsx` — Coordination dashboard at both `/coordination` and `/dashboard/coordination`. Remove the duplicate. |
| 9.9 | `useUnifiedApiData.ts:107-116` — emoji `console.warn` on every 30s poll. Clean up or reduce to debug level. |
| 9.10 | `TeslaDataContext.tsx:109` — CORS detection `err.message.includes('cors')` doesn't work. Fetch CORS errors don't include "cors" in the message. |
| 9.11 | No CSRF protection on state-changing API calls. |
| 9.12 | `ConsolidatedRouteOptimizer` — no loading skeleton during optimization. |
| 9.13 | No favicon in `index.html`. |

---

## Execution Order

Work through these in order. Each numbered section is a commit-worthy unit:

1. **Section 1** — Fix all runtime bugs. Commit: `fix: resolve runtime crashes in JourneyJournal, EnhancedMapFeatures, FollowerView`
2. **Section 2** — Consolidate API config. Commit: `fix: consolidate API configuration, fix backendApi production URL`
3. **Section 3** — Enable strict mode, fix ESLint, clean EXIF. Commit: `build: enable TypeScript strict mode, fix ESLint, clean EXIF loading`
4. **Section 4** — Security fixes. Commit: `fix: harden auth token storage and remove debug endpoints`
5. **Section 8** — Delete dead code. Commit: `chore: remove archived files, unused pages, and legacy configs`
6. **Section 5** — Accessibility. Commit: `fix: accessibility improvements (labels, error boundary, responsive tabs)`
7. **Section 7** — Design system. Commit: `style: replace hardcoded colors with design system tokens`
8. **Section 6** — SEO. Commit: `feat: add SEO meta tags, robots.txt, and sitemap`
9. **Section 9** — UX polish. Commit: `fix: UX polish (deduplicate routes, cleanup console, add favicon)`

After each commit, run `cd frontend && npm run build` to verify no regressions.
