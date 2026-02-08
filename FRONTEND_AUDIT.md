# Frontend Audit Report

**Site**: https://awhittlewandering.pages.dev
**Date**: 2026-02-08
**Scope**: Complete frontend codebase audit

---

## Summary

69 issues identified across 7 categories. 10 are runtime bugs that will cause crashes or broken behavior in production.

| Severity | Count |
|----------|-------|
| CRITICAL (runtime bugs) | 10 |
| HIGH (data/config/security) | 12 |
| MEDIUM (UX/a11y/SEO) | 20 |
| LOW (dead code/cleanup) | 14 |
| INFO (style nits) | 13 |

---

## 1. CRITICAL — Runtime Bugs

### 1.1 JourneyJournal: Multiple broken references crash the component

**File**: `frontend/src/components/JourneyJournal.tsx`

| Line | Issue |
|------|-------|
| 52-55 | Destructures `tripData` (as `_tripData`) but `JourneyJournalProps` has no `tripData` field. The interface defines `entries`, `onAddEntry`, `currentLocation`, `isAutoGenerating` — none of which are destructured. |
| 120 | `newEntry.title.trim()` — `newEntry` is `Partial<JournalEntry>`, so `title` can be `undefined`. Calling `.trim()` on `undefined` throws a `TypeError`. |
| 128-132 | References `currentLocation` variable that was never destructured from props. Always evaluates to `undefined`, so every manual entry gets "Unknown Location". |
| 135 | Calls `onAddEntry?.(entry)` but `onAddEntry` is not destructured from props — created entries are silently discarded. |
| 186 | Reads `isAutoGenerating` in JSX but it was not destructured from props — always `undefined`, so the "AI writing entry..." indicator never shows. |
| 59-67 | `newEntry` initial state includes `style`, `tags`, `distance` — fields that don't exist on `JournalEntry`. Type errors (hidden by `strict: false`). |
| 401-408 | Quick template buttons reference undeclared `currentLocation`. |

### 1.2 EnhancedMapFeatures: Undeclared variable references

**File**: `frontend/src/components/EnhancedMapFeatures.tsx`

| Line | Issue |
|------|-------|
| 172 | References `chargingStations` but line 30 declares it as `_chargingStations`. Runtime `ReferenceError`. |
| 206 | References `recommendations` but line 28 declares it as `_recommendations`. Runtime `ReferenceError`. |

### 1.3 FollowerView: Route parameter ignored

**File**: `frontend/src/pages/FollowerView.tsx`

| Line | Issue |
|------|-------|
| 58 | `useEffect` dependency array is `[]` (empty) but uses `id` from `useParams()`. Navigating between `/journey/abc` and `/journey/xyz` does not re-fetch data. The `id` is displayed in a badge but the fetch always hits the same endpoint regardless. |

---

## 2. HIGH — API & Data Flow Issues

### 2.1 Three conflicting API configurations

| File | Production URL | Used by |
|------|---------------|---------|
| `src/lib/api-config.ts` | `https://api.awhittlewandering.com` | TeslaDataContext, FollowerView, useUnifiedApiData |
| `src/lib/api.ts` | `https://awhittlewandering-api.kd8jc7v8cd.workers.dev` | Nothing (legacy, still exported) |
| `src/services/backendApi.ts` | `http://localhost:8787` (no prod fallback!) | JourneyJournal, ConsolidatedRouteOptimizer, AdvancedAnalyticsDashboard |

**Impact**: `backendApi.ts` defaults to `localhost:8787` in production unless `VITE_BACKEND_URL` env var is set. This means the Navigation tab, Analytics tab, and Journal AI generation all make requests to `localhost` on the user's machine in production — they silently fail.

### 2.2 Inconsistent endpoint paths in backendApi.ts

| Method | Calls | Should be |
|--------|-------|-----------|
| `health()` | `/health` | `/api/v1/health` |
| `getTripStatus()` | `/trip-status` | `/api/v1/trip/status` |

### 2.3 No type safety on API responses

`backendApi.ts` — all 14 methods return `Promise<any>`. API response shapes are never validated. Runtime shape mismatches will cause silent data corruption or crashes downstream.

### 2.4 Duplicate endpoint definitions

`api-config.ts` line 17: `TIMELINE` and `UNIFIED_DATA` both point to `/api/v1/unified-data`.

---

## 3. HIGH — Build & Configuration Issues

### 3.1 TypeScript strict mode disabled

**File**: `frontend/tsconfig.app.json:18-22`

```json
"strict": false,
"noUnusedLocals": false,
"noUnusedParameters": false,
"noImplicitAny": false,
"noFallthroughCasesInSwitch": false
```

This directly violates the project standard: "TypeScript strict mode in all workspaces" (CLAUDE.md line 7). Many of the bugs in this report (undefined `.trim()`, missing prop destructuring) would be caught by the compiler with `strict: true`.

### 3.2 ESLint is broken

`npm run lint` fails with:
```
Cannot find package '@eslint/js' imported from eslint.config.js
```
The linter cannot run at all. No code quality checks are enforced.

### 3.3 EXIF library loaded twice

`index.html:19` loads `exif-js@2.3.0` from CDN as a global script. `package.json` also lists `exif-js` as a dependency. The code in `MediaUpload.tsx` accesses `window.EXIF` with `@ts-expect-error` comments (6 occurrences). The CDN script should be removed and the npm package imported properly.

### 3.4 Manual chunks reference possibly stale files

`vite.config.ts:36-38` — `manualChunks` references `AdminPortal.tsx` and `TeslaMap.tsx`. These exist but `AdminPortal` is not imported in any route — it gets bundled but is unreachable.

---

## 4. HIGH — Security Concerns

### 4.1 Admin token in localStorage

**File**: `src/lib/auth.ts:55`

Session token stored under `awhittlewandering_admin_token` in `localStorage`. Any XSS vulnerability would allow token exfiltration. Consider `httpOnly` cookies or `sessionStorage` at minimum.

### 4.2 Password stored in MFA challenge state

**File**: `src/lib/auth.ts:88-93`

```typescript
this.mfaChallenge = {
  challengeId: data.challengeId,
  email,
  password,  // ← plaintext password held in memory
};
```

The user's password is retained in the singleton's state until MFA is completed or cancelled.

### 4.3 Debug endpoints in production API client

**File**: `src/services/backendApi.ts:125-131`

`getTessieSample()` and `getDrivesCheck()` call `/api/v1/debug/*` endpoints. These methods exist in the production client, even if the backend gates them.

### 4.4 Import ordering in auth.ts

**File**: `src/lib/auth.ts:306`

`import React from 'react'` appears at the very bottom of the file, after all code that uses `React.useState` and `React.useEffect`. Module hoisting makes this work, but it's fragile and non-standard.

---

## 5. MEDIUM — Accessibility Issues

| # | File:Line | Issue |
|---|-----------|-------|
| 5.1 | `NotFound.tsx:15` | Uses hardcoded light-theme colors (`bg-gray-100`, `text-gray-600`, `text-blue-500`). On the dark-themed site this page renders as a jarring white rectangle. |
| 5.2 | `NotFound.tsx:19` | `<a href="/">` instead of `<Link to="/">` — causes full page reload, breaks SPA navigation. |
| 5.3 | `JourneyJournal.tsx:243-258` | Form inputs use only `placeholder` for labeling. No `<label>` elements — screen readers can't identify the fields. |
| 5.4 | `MediaUpload.tsx:245-251` | Hidden file input has no accessible label or `aria-label`. |
| 5.5 | `MediaUpload.tsx:299` | `alt="Uploaded media"` is generic. Should describe the image or use the filename. |
| 5.6 | `VehicleStats.tsx:55` | Loading skeleton uses `bg-gray-200` (hardcoded light color) instead of design system token. |
| 5.7 | No skip-to-content link on any page. |
| 5.8 | No React error boundary — unhandled errors show a white screen with no recovery option. |
| 5.9 | `JourneyerDashboard.tsx:131` — 5-tab grid (`grid-cols-5`) truncates labels on mobile. |
| 5.10 | `MasterCoordinationDashboard.tsx:131` — 6-tab grid (`grid-cols-6`) unreadable on mobile. |

---

## 6. MEDIUM — SEO Issues

| # | Issue |
|---|-------|
| 6.1 | Missing `og:image` — social shares show no preview image. |
| 6.2 | Missing `og:url` and `<link rel="canonical">`. |
| 6.3 | `twitter:card` set to `summary_large_image` but no image specified. |
| 6.4 | No dynamic meta tags — every route shows title "A Whittle Wandering" and the same description. No `react-helmet` or equivalent. |
| 6.5 | No `robots.txt` in `public/`. |
| 6.6 | No `sitemap.xml`. |
| 6.7 | No structured data (JSON-LD / schema.org). |

---

## 7. MEDIUM — Design System Violations

Multiple components bypass the design system's HSL custom properties and use hardcoded Tailwind color classes. On the warm dark theme, these render as clashing light-mode patches.

| File | Hardcoded classes |
|------|-------------------|
| `NotFound.tsx` | `bg-gray-100`, `text-gray-600`, `text-blue-500`, `text-blue-700` |
| `VehicleStats.tsx` | `bg-gray-200` (skeleton) |
| `ConsolidatedRouteOptimizer.tsx` | `bg-blue-50`, `text-blue-700`, `bg-red-50`, `text-red-700`, `bg-slate-50` |
| `AdvancedAnalyticsDashboard.tsx` | `text-gray-600` (18 occurrences), `bg-blue-50`, `bg-green-50`, `bg-purple-50` |
| `MediaUpload.tsx` | `bg-blue-50`, `border-gray-300`, `text-gray-400`, `text-gray-500`, `bg-gray-100` |
| `EnhancedMapFeatures.tsx` | `text-green-600`, `text-blue-600`, `text-gray-600` |
| `Demo.tsx` | Entirely inline styles with light-theme hex colors |

---

## 8. LOW — Dead Code & Cleanup

| # | Item | Action |
|---|------|--------|
| 8.1 | `src/_archived/` — 14 deprecated files | Delete entire directory |
| 8.2 | `src/pages/Index.tsx` | Delete (unreferenced) |
| 8.3 | `src/pages/Index.temp.tsx` | Delete (unreferenced) |
| 8.4 | `src/pages/SimpleTest.tsx` | Delete (unreferenced, has hardcoded worker URL) |
| 8.5 | `src/pages/TestIndex.tsx` | Delete (unreferenced) |
| 8.6 | `src/lib/config.ts` | Delete (deprecated, only emits console.warn) |
| 8.7 | `src/lib/api.ts` | Delete (superseded by `api-config.ts`, uses wrong production URL) |
| 8.8 | Duplicate toast systems | Remove either `@radix-ui/react-toast` Toaster or `sonner` Sonner from `App.tsx` |
| 8.9 | `next-themes` in dependencies | Remove — `ThemeProvider` is not used in `App.tsx` |
| 8.10 | `VehicleStats.tsx:43-47` | `_getBatteryColor()` — defined, never called |
| 8.11 | `auth.ts:192-193` | `generateSessionId()` — defined, never called |
| 8.12 | Large unused dependencies | `leaflet`, `react-leaflet`, `papaparse`, `recharts`, `embla-carousel-react`, `cmdk`, `vaul`, `react-resizable-panels`, `react-day-picker`, `react-hook-form`, `@hookform/resolvers`, `input-otp` — verify usage or remove |
| 8.13 | `backendApi.ts:125-131` | Debug endpoint methods — remove from production client |
| 8.14 | No `.env.example` file | Add one documenting `VITE_API_BASE_URL`, `VITE_BACKEND_URL`, `VITE_MAPBOX_TOKEN` |

---

## 9. INFO — UX Observations

| # | Issue |
|---|-------|
| 9.1 | Landing page: Two CTA buttons ("Follow the journey" / "Preview follower view") link to the same URL (`/journey/live`). Confusing — merge or differentiate. |
| 9.2 | `MasterCoordinationDashboard` uses entirely mock/hardcoded data (battery 78%, temp 72F, fake AI model progress bars). Not connected to real data. |
| 9.3 | `AdvancedAnalyticsDashboard:392-435` — "AI-Powered Insights" section is three hardcoded paragraphs, not generated from actual data. |
| 9.4 | Demo page says "AtlasIT Joiner Demo" — different branding. Publicly accessible at `/demo`. |
| 9.5 | JourneyJournal entries are local state only — lost on page refresh. No persistence to backend or localStorage. |
| 9.6 | `MediaUpload.tsx:188` — `URL.createObjectURL()` called during EXIF extraction but never revoked. Memory leak on repeated uploads. |
| 9.7 | No loading indicator for the initial app shell (blank page until React mounts). |
| 9.8 | `App.tsx` — Coordination dashboard mounted at both `/coordination` and `/dashboard/coordination` (duplicate routes). |
| 9.9 | `useUnifiedApiData.ts:107-116` — Logs full API response summaries with emoji via `console.warn` on every 30-second poll. Stripped in production via terser but noisy in dev. |
| 9.10 | `TeslaDataContext.tsx:109` — CORS error detection checks `err.message.includes('cors')` but fetch CORS errors typically don't include "cors" in the message. |
| 9.11 | No CSRF protection on state-changing API calls (follow/unfollow, journal generate, route optimize). |
| 9.12 | `ConsolidatedRouteOptimizer` — no loading skeleton; shows nothing while optimizing. |
| 9.13 | No favicon specified in `index.html`. |

---

## Recommended Priority Order

1. **Fix runtime bugs** (Section 1) — these cause crashes for users right now
2. **Consolidate API configuration** (2.1) — `backendApi.ts` hitting localhost in prod
3. **Enable TypeScript strict mode** (3.1) — prevents most of the bugs in Section 1
4. **Fix ESLint** (3.2) — restore linting capability
5. **Add React error boundary** (5.8) — prevent white-screen crashes
6. **Fix accessibility violations** (Section 5) — legal/compliance risk
7. **Delete dead code** (Section 8) — reduce maintenance burden
8. **Design system consistency** (Section 7) — visual coherence
9. **SEO improvements** (Section 6) — discoverability
10. **Security hardening** (Section 4) — defense in depth
