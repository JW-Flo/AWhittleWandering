# Frontend Hooks Documentation

This document explains the purpose and usage of each hook in the `frontend/src/hooks/` directory.

## Hook Overview

### 1. `useTeslaData.ts`
**Purpose:** Simple context wrapper for TeslaDataContext  
**Type:** Context consumer  
**When to use:** When you need access to the TeslaDataContext (legacy pattern)  
**Status:** ✅ Keep (used by context pattern)

---

### 2. `useTessieApi.ts`
**Purpose:** Basic direct Tessie API integration  
**Features:**
- Fetches vehicle list
- Fetches current vehicle state
- Auto-refresh every 30 seconds
- Toast notifications

**When to use:** Simple vehicle data fetching  
**Status:** ⚠️ Consider consolidating into `useUnifiedTessieApi`

---

### 3. `useUnifiedTessieApi.ts`
**Purpose:** Comprehensive direct Tessie API integration  
**Features:**
- Vehicle list and selection
- Current vehicle state
- Historical drives (with date range)
- Historical charges (with date range)
- Auto-refresh
- Uses VIN-based API calls
- Production-only (no demo mode)

**When to use:** When you need full Tessie API access with historical data  
**Status:** ✅ Keep (most complete direct API hook)

---

### 4. `useEnhancedTessieApi.ts`
**Purpose:** Enhanced Tessie API with location history  
**Features:**
- Similar to `useUnifiedTessieApi` but different interface
- Includes location history construction
- Enhanced vehicle data structure
- Drive/charge history

**When to use:** When you need location history tracking  
**Status:** ⚠️ Consider consolidating into `useUnifiedTessieApi` (overlapping functionality)

---

### 5. `useJourneyTessieApi.ts`
**Purpose:** Journey-specific analytics and extended stay detection  
**Features:**
- Drive history with reverse geocoding
- Charge history with location data
- Extended stay detection (overnight, multi-day)
- Journey analytics (states crossed, cities visited, etc.)
- Location history with city/state data

**When to use:** When you need journey analytics and extended stay analysis  
**Status:** ✅ Keep (unique functionality)

---

### 6. `useUnifiedJourneyData.ts`
**Purpose:** Backend API wrapper for unified journey data  
**Features:**
- Uses backend `/api/v1/unified-data` endpoint
- Journey overview, timeline, current status
- Live data from backend
- Auto-polling every 30 seconds
- Does NOT call Tessie API directly

**When to use:** When you want to use backend-processed data instead of direct Tessie calls  
**Status:** ✅ Keep (different purpose - backend API)

---

### 7. `useUnifiedApiData.ts`
**Purpose:** Backend API data fetching  
**Status:** Check file for details

---

### 8. `useMasterData.ts`
**Purpose:** Master data coordination  
**Status:** File appears empty - needs review

---

### 9. `useRobustData.ts`
**Purpose:** Robust data fetching with error handling  
**Status:** Check file for details

---

### 10. `useSmartTracking.ts`
**Purpose:** Smart tracking features  
**Status:** Check file for details

---

### 11. `useRealtimeStatus.ts`
**Purpose:** Real-time status updates  
**Status:** Check file for details

---

### 12. `useWeatherApi.ts`
**Purpose:** Weather API integration  
**Status:** Check file for details

---

### 13. `useEnhancedTessieApi.ts` (duplicate?)
**Status:** ⚠️ Check if this is a duplicate of #4

---

## Consolidation Recommendations

### High Priority
1. **Consolidate `useTessieApi` into `useUnifiedTessieApi`**
   - `useUnifiedTessieApi` is more comprehensive
   - Both do similar things (vehicle data, state)
   - Migration path: Update components to use `useUnifiedTessieApi`

2. **Review `useEnhancedTessieApi` vs `useUnifiedTessieApi`**
   - Both provide similar functionality
   - `useUnifiedTessieApi` seems more complete
   - Consider merging unique features (location history) into `useUnifiedTessieApi`

### Medium Priority
3. **Review empty/incomplete hooks**
   - `useMasterData.ts` appears empty
   - Check other hooks for completeness

4. **Document hook dependencies**
   - Some hooks may depend on others
   - Document the relationship

---

## Usage Guidelines

### For Direct Tessie API Access
- **Use `useUnifiedTessieApi`** - Most complete, production-ready
- **Avoid `useTessieApi`** - Less comprehensive (consider deprecating)

### For Backend API Access
- **Use `useUnifiedJourneyData`** - Backend-processed unified data

### For Journey Analytics
- **Use `useJourneyTessieApi`** - Extended stays, analytics, reverse geocoding

### For Context Access
- **Use `useTeslaData`** - When using TeslaDataContext pattern

---

## Migration Path

If consolidating hooks:

1. **Phase 1:** Document current usage
   - Find all components using `useTessieApi` and `useEnhancedTessieApi`
   - Document differences in usage

2. **Phase 2:** Enhance `useUnifiedTessieApi`
   - Add any missing features from other hooks
   - Ensure backward compatibility

3. **Phase 3:** Update components
   - Migrate components one by one
   - Test thoroughly

4. **Phase 4:** Remove deprecated hooks
   - After all components migrated
   - Remove unused hooks

---

**Last Updated:** 2025-01-27
