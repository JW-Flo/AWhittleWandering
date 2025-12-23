# Architecture Fixes - December 22, 2025

## Summary

Two critical architecture issues were resolved:
1. **Shared database between environments** - Dev and production no longer share the same D1 database
2. **Dead hooks with security violations** - Frontend hooks making direct Tessie API calls have been archived

---

## Fix 1: Database Environment Separation

### Problem
The `wrangler.toml` configuration used the same D1 database ID for both production and development:
- `database_id = "09a6ba85-bd36-4ad3-b5a8-92e230943dcb"`
- `preview_database_id = "09a6ba85-bd36-4ad3-b5a8-92e230943dcb"` (same!)

This meant local development could accidentally corrupt production data.

### Solution
Updated `backend/edge-worker/wrangler.toml`:

**Root-level D1 binding:**
```toml
[[d1_databases]]
binding = "TESLA_DB"
database_name = "tesla-journey-tracker"
database_id = "09a6ba85-bd36-4ad3-b5a8-92e230943dcb"
preview_database_id = "local"  # <-- Changed from production ID
```

**Development environment:**
```toml
[[env.development.d1_databases]]
binding = "TESLA_DB"
database_name = "tesla-journey-tracker-dev"
database_id = "local"  # <-- Uses local SQLite
```

### Effect
- Local development (`wrangler dev`) now uses local SQLite
- Production deployments continue using the production D1 database
- No risk of accidental production data corruption

---

## Fix 2: Archived Dead Tessie Hooks

### Problem
Multiple frontend hooks and components were making direct HTTP calls to `api.tessie.com` from the browser:
- Bypassed backend security (API keys exposed to client)
- Not used by the main app (`Index.tsx` correctly uses backend API)
- Created confusion about the correct data flow pattern

### Solution
Moved all insecure files to `frontend/src/_archived/deprecated-direct-tessie-hooks/`:

**Archived Hooks:**
- `useTessieApi.ts`
- `useUnifiedTessieApi.ts`
- `useEnhancedTessieApi.ts`
- `useJourneyTessieApi.ts`
- `useRobustData.ts`

**Archived Components (depended on archived hooks):**
- `ApiTest.tsx`
- `DataDebugger.tsx`
- `EnhancedTeslaMap.tsx`
- `RealTeslaDataIntegration.tsx`
- `TessieApiDebugger.tsx`
- `TessieApiSetup.tsx`
- `TimelineDataDisplay.tsx`
- `SystemHealthMonitor.tsx`

### Additional Changes
Created `frontend/src/types/tessie.ts` with shared type definitions:
- `HistoricalDrive`
- `HistoricalCharge`
- `VehicleState`
- `Vehicle`

Updated utility files to import from the new types file instead of archived hooks:
- `utils/journeyCalculations.ts`
- `services/journeyTimelineProcessor.ts`
- `services/driveAnalysisService.ts`

### Effect
- No frontend code can make direct Tessie API calls
- Types remain available for backend API response handling
- Archived code preserved for reference but excluded from builds
- Clear documentation in archive README explains why files were removed

---

## Verification

Run these commands to verify the fixes:

```bash
# Verify no direct Tessie API calls in active frontend code
grep -r "api.tessie.com" frontend/src --include="*.ts" --include="*.tsx" | grep -v "_archived"
# Should return: no results

# Verify wrangler.toml has correct database separation
grep -A2 "preview_database_id" backend/edge-worker/wrangler.toml
# Should show: preview_database_id = "local"

# Verify types file exists
cat frontend/src/types/tessie.ts
# Should show type definitions
```

---

## Files Changed

### Modified
- `backend/edge-worker/wrangler.toml` - Database separation
- `frontend/src/utils/journeyCalculations.ts` - Updated imports
- `frontend/src/services/journeyTimelineProcessor.ts` - Updated imports
- `frontend/src/services/driveAnalysisService.ts` - Updated imports

### Created
- `frontend/src/types/tessie.ts` - Shared type definitions
- `frontend/src/_archived/deprecated-direct-tessie-hooks/README.md` - Archive documentation
- `docs/ARCHITECTURE_FIXES_2025-12-22.md` - This document

### Moved to Archive
- 5 hooks → `_archived/deprecated-direct-tessie-hooks/`
- 8 components → `_archived/deprecated-direct-tessie-hooks/`


