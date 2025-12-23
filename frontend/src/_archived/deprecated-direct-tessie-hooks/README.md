# Archived: Direct Tessie API Hooks and Components

**Archived Date:** December 22, 2025  
**Reason:** Security violation - these files make direct client-side API calls to `api.tessie.com`

## Why These Were Archived

These hooks and components bypassed the backend security architecture by:
1. Accepting Tessie API keys directly from users
2. Making HTTP requests from the browser directly to `https://api.tessie.com`
3. Exposing API tokens in browser network traffic and memory

## The Correct Pattern

The production app uses:
- **Backend cron jobs** fetch from Tessie API using server-side secrets
- **D1 database** stores cached vehicle/drive/charge data
- **`/api/v1/unified-data` endpoint** serves data to frontend
- **Frontend** only reads from the backend API, never from Tessie directly

## Archived Files

### Hooks (made direct Tessie API calls)
- `useTessieApi.ts` - Original direct API hook
- `useUnifiedTessieApi.ts` - Enhanced version, still direct API
- `useEnhancedTessieApi.ts` - Another variant with direct API
- `useJourneyTessieApi.ts` - Wrapper around useUnifiedTessieApi

### Components (used the insecure hooks)
- `ApiTest.tsx` - Testing component using useUnifiedTessieApi
- `DataDebugger.tsx` - Debug panel using useUnifiedTessieApi
- `EnhancedTeslaMap.tsx` - Map component using useUnifiedTessieApi
- `RealTeslaDataIntegration.tsx` - Integration using useEnhancedTessieApi
- `TessieApiDebugger.tsx` - Debug tools for Tessie API
- `TessieApiSetup.tsx` - UI that solicited API keys from users
- `TimelineDataDisplay.tsx` - Used useRobustData which depended on direct API
- `SystemHealthMonitor.tsx` - Used useRobustData which depended on direct API

### Additional Hooks (depended on archived hooks)
- `useRobustData.ts` - Wrapper that used useUnifiedTessieApi

## If You Need This Functionality

If real-time Tessie data is needed beyond what cron jobs provide:
1. Add a backend proxy endpoint in `backend/edge-worker/src/routers/`
2. The endpoint should use server-side `TESSIE_API_KEY` secret
3. Apply rate limiting and caching
4. Frontend calls the backend proxy, never Tessie directly

## References

- Main app entry: `src/pages/Index.tsx` - correctly uses `api.baseUrl/api/v1/unified-data`
- Backend API: `backend/edge-worker/src/routers/unifiedData.ts`
- Data ingestion: `backend/edge-worker/src/cron-controller.ts`

