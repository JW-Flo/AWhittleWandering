# AWhittleWandering V1 Roadmap
## Tesla Road Trip Tracker - 48 State Journey

**Generated:** December 24, 2025  
**Target:** V1 QA-Ready in 4-6 weeks  
**Live Site:** https://awhittlewandering.com  
**API:** https://awhittlewandering-api.kd8jc7v8cd.workers.dev

---

## 1. Current State Audit

### Infrastructure Status ✅

| Component | Status | Details |
|-----------|--------|---------|
| **API Worker** | ✅ Deployed | `awhittlewandering-api` (last modified: Aug 8, 2025) |
| **D1 Database** | ✅ Exists | `tesla_drive_db` with comprehensive schema |
| **KV Caching** | ✅ Configured | `UNIFIED_DATA_CACHE`, `KV_CACHE` namespaces |
| **Staging** | ✅ Deployed | `awhittlewandering-staging`, `awhittlewandering-api-dev` |
| **MCP Server** | ✅ Exists | `tesla-roadtrip-mcp-server` |

### Database Schema ✅ (Well-Designed)

Tables exist for full journey tracking:
- `journeys` - Journey metadata
- `journey_overview` - Aggregated stats
- `drives` - Individual drive records (30+ columns)
- `charges` - Charging sessions (25+ columns)
- `states_visited` - State crossing tracking
- `vehicle_state` - Real-time vehicle telemetry
- `vehicle_state_history` - Historical snapshots
- `stops` - Extended stays
- `known_places` - POI recognition
- `media` - Photo/video storage
- `analytics_events` - User analytics

### ⚠️ CRITICAL BLOCKERS IDENTIFIED

#### 🚨 Blocker 1: Empty Database (P0)
```
drive_count: 0
charge_count: 0
states_count: 0
vehicle_state_count: 0
```
**Impact:** Users see nothing. Journey shows 0 states, 0 miles, no map data.

#### 🚨 Blocker 2: VIN Not Configured (P0)
```sql
SELECT * FROM vehicles;
-- vin: "UNKNOWN_VIN" ❌
```
**Impact:** Cannot fetch real data from Tessie API.

#### 🚨 Blocker 3: Data Ingestion Not Running (P0)
No telemetry data is flowing from Tessie → D1. Either:
- Scheduled worker not configured
- Tessie API key not set
- Ingestion endpoints not being called

### Frontend Assessment (From Docs)

| Area | Status | Notes |
|------|--------|-------|
| **Hook Sprawl** | ⚠️ Technical Debt | 10+ hooks with overlapping functionality |
| **Map Integration** | ❓ Unknown | Mapbox configured but no route data to display |
| **Mobile** | ❓ Unknown | TailwindCSS suggests responsive support |
| **Loading States** | ❓ Unknown | Need to verify skeleton/error states |

### What's Working Well ✅

1. **Database Design** - Schema is production-ready with proper foreign keys
2. **Infrastructure** - Workers, D1, KV all provisioned correctly
3. **API Structure** - Hono + Zod pattern established
4. **Project Organization** - Clear separation of concerns

---

## 2. Gap Analysis

### Critical for V1 (Must Fix)

| Gap | Impact | Effort |
|-----|--------|--------|
| VIN configuration | Can't fetch vehicle data | XS |
| Tessie API integration | No data source | M |
| Data ingestion pipeline | Database stays empty | L |
| State detection logic | Can't track 48 states | M |
| Real-time polling | No live updates | M |

### Nice-to-Haves (Post-V1)

| Feature | Priority | Notes |
|---------|----------|-------|
| Media gallery | P2 | R2 bucket ready |
| Historical playback | P2 | Schema supports it |
| Push notifications | P3 | Future mobile app |
| Social sharing | P3 | Generate shareable cards |
| Multi-vehicle support | P3 | Schema already supports |

### Technical Debt Worth Fixing Now

| Issue | Risk | Recommendation |
|-------|------|----------------|
| Hook consolidation | Maintenance burden | Consolidate to 3-4 core hooks |
| Demo mode code | Confusion | Remove or clearly flag |
| Unused API routes | Security surface | Audit and prune |

---

## 3. Prioritized Roadmap

### Phase 1: Data Pipeline (Week 1-2) 🔴 P0

**Goal:** Get real data flowing from Tessie → D1 → Frontend

| ID | Task | Priority | Size | Tags |
|----|------|----------|------|------|
| P1-01 | Configure real VIN in vehicles table | P0 | XS | database |
| P1-02 | Verify/set Tessie API key in worker secrets | P0 | XS | infra |
| P1-03 | Build data ingestion service (pulls drives/charges) | P0 | L | api |
| P1-04 | Add scheduled cron trigger for ingestion (every 5min) | P0 | S | infra |
| P1-05 | Implement state detection from drive coordinates | P0 | M | api |
| P1-06 | Backfill historical data from Tessie | P0 | M | api |
| P1-07 | Add real-time vehicle state polling | P0 | M | api |

### Phase 2: Frontend Polish (Week 2-3) 🟡 P1

**Goal:** Display data beautifully with proper states

| ID | Task | Priority | Size | Tags |
|----|------|----------|------|------|
| P2-01 | Wire unified-data endpoint to dashboard | P1 | M | frontend |
| P2-02 | Implement map route visualization | P1 | L | frontend |
| P2-03 | Add states visited counter/map (X/48) | P1 | M | frontend |
| P2-04 | Build battery/charging status widget | P1 | S | frontend |
| P2-05 | Add trip history timeline | P1 | M | frontend |
| P2-06 | Implement loading skeletons everywhere | P1 | S | frontend |
| P2-07 | Test and fix mobile responsiveness | P1 | M | frontend |

### Phase 3: Reliability & QA (Week 3-4) 🟢 P1

**Goal:** Make it trustworthy for friends to test

| ID | Task | Priority | Size | Tags |
|----|------|----------|------|------|
| P3-01 | Add API health checks with detailed status | P1 | S | api |
| P3-02 | Implement error boundaries and fallback UI | P1 | M | frontend |
| P3-03 | Add basic E2E smoke tests | P1 | M | testing |
| P3-04 | Set up error logging/alerting | P1 | M | infra |
| P3-05 | Create bug report mechanism (simple form) | P1 | S | frontend |
| P3-06 | Performance audit (Core Web Vitals) | P1 | S | testing |

### Phase 4: QA Readiness (Week 4-5) 🔵 P2

**Goal:** Polish for friend testing

| ID | Task | Priority | Size | Tags |
|----|------|----------|------|------|
| P4-01 | Write user-facing FAQ/help content | P2 | S | content |
| P4-02 | Add analytics to track user interactions | P2 | M | frontend |
| P4-03 | Clean up console errors/warnings | P2 | S | frontend |
| P4-04 | Hook consolidation (reduce to 4 core hooks) | P2 | M | frontend |
| P4-05 | Document API endpoints for QA testers | P2 | S | docs |

---

## 4. First Sprint Plan (2 Weeks)

### Week 1: Data Pipeline Unblocking

**Sprint Goal:** Live data visible on map

#### Day 1-2: Foundation
- [ ] **P1-01:** Update `vehicles` table with real VIN
- [ ] **P1-02:** Verify Tessie API key in `TESSIE_API_KEY` secret
- [ ] **P1-03 Start:** Create `/api/v1/ingest` endpoint scaffolding

#### Day 3-4: Ingestion Core
- [ ] **P1-03 Complete:** Implement drive/charge ingestion from Tessie
- [ ] **P1-05:** Add state detection service (lat/lng → state name)
- [ ] **P1-06 Start:** Backfill last 30 days of drives

#### Day 5-7: Automation & Verification
- [ ] **P1-04:** Configure scheduled trigger in wrangler.jsonc
- [ ] **P1-06 Complete:** Verify backfill populated states_visited
- [ ] **P1-07:** Add vehicle state polling every 60 seconds
- [ ] Verify data in D1 via queries

### Week 2: Frontend Integration

**Sprint Goal:** Dashboard shows real journey data

#### Day 1-2: Data Display
- [ ] **P2-01:** Connect frontend to `/api/v1/unified-data`
- [ ] **P2-04:** Battery/charging widget with live data

#### Day 3-4: Map & Stats
- [ ] **P2-02:** Render route on Mapbox from drive coordinates
- [ ] **P2-03:** States visited counter with clickable state map

#### Day 5-7: Polish
- [ ] **P2-05:** Trip history timeline component
- [ ] **P2-06:** Loading skeletons for all widgets
- [ ] **P2-07:** Mobile responsiveness testing

### Sprint Success Metrics

| Metric | Target |
|--------|--------|
| Drives in database | > 0 (actual trip data) |
| States visited count | Matches reality |
| Map route displayed | Yes |
| Mobile usable | Yes |
| API health | 100% |

---

## 5. Work Prompts (Top 5 Tasks)

### Work Prompt 1: Configure Vehicle VIN (P1-01)

```markdown
## Task: Configure Real Vehicle VIN in Database

### Context
The database has a placeholder VIN ("UNKNOWN_VIN") which prevents Tessie API 
integration from working. This is a 5-minute fix that unblocks all data ingestion.

### Acceptance Criteria
- [ ] Real VIN updated in `vehicles` table
- [ ] VIN matches the Model Y "Midnight Shadow"
- [ ] Verified via D1 query

### Implementation
1. Get the actual VIN from Tessie dashboard or vehicle registration
2. Run D1 update query:

```sql
UPDATE vehicles 
SET vin = 'YOUR_ACTUAL_VIN_HERE'
WHERE id = 'midnight-shadow';
```

3. Verify:
```sql
SELECT id, vin, display_name FROM vehicles;
```

### Notes
- VIN is 17 characters, alphanumeric
- Never commit VIN to git (use secrets for logging)
```

---

### Work Prompt 2: Build Tessie Data Ingestion Service (P1-03)

```markdown
## Task: Build Tessie Data Ingestion Service

### Context
The database schema exists but is empty. We need a service that pulls drives and
charges from the Tessie API and inserts them into D1. This is the critical data
pipeline that makes the entire app work.

### Acceptance Criteria
- [ ] Fetches drives from Tessie API for configured VIN
- [ ] Fetches charges from Tessie API
- [ ] Inserts new records into D1 (deduplicates by tessie_id)
- [ ] Updates journey aggregates after insertion
- [ ] Returns count of records processed
- [ ] Handles API errors gracefully

### Implementation Guide

**Files to create/modify:**
- `backend/edge-worker/src/services/tessie-ingest.ts` (new)
- `backend/edge-worker/src/routers/admin.ts` (add ingest endpoint)

**Pattern:**
```typescript
// services/tessie-ingest.ts
import { Env } from '../types';

interface TessieDrive {
  id: number;
  started_at: string;
  ended_at: string;
  start_location: { latitude: number; longitude: number };
  end_location: { latitude: number; longitude: number };
  distance_miles: number;
  // ... other fields
}

export async function ingestDrivesFromTessie(env: Env, vin: string): Promise<number> {
  const response = await fetch(
    `https://api.tessie.com/${vin}/drives?distance_format=mi`,
    {
      headers: { Authorization: `Bearer ${env.TESSIE_API_KEY}` }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Tessie API error: ${response.status}`);
  }
  
  const { results } = await response.json<{ results: TessieDrive[] }>();
  
  // Batch insert with deduplication
  const insertStmt = env.DB.prepare(`
    INSERT OR IGNORE INTO drives (
      tessie_id, vehicle_id, journey_id, started_at, ended_at,
      start_latitude, start_longitude, end_latitude, end_longitude,
      distance_miles, ...
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ...)
  `);
  
  const batch = results.map(drive => 
    insertStmt.bind(
      drive.id,
      'midnight-shadow',
      'continental-usa-2025',
      drive.started_at,
      drive.ended_at,
      drive.start_location.latitude,
      drive.start_location.longitude,
      // ... map all fields
    )
  );
  
  await env.DB.batch(batch);
  return results.length;
}
```

**Endpoint:**
```typescript
// routers/admin.ts
app.post('/api/v1/admin/ingest', async (c) => {
  const vin = await c.env.DB.prepare(
    'SELECT vin FROM vehicles WHERE id = ?'
  ).bind('midnight-shadow').first();
  
  const drivesIngested = await ingestDrivesFromTessie(c.env, vin);
  const chargesIngested = await ingestChargesFromTessie(c.env, vin);
  
  // Update aggregates
  await updateJourneyOverview(c.env, 'continental-usa-2025');
  
  return c.json({
    status: 'success',
    drives_ingested: drivesIngested,
    charges_ingested: chargesIngested
  });
});
```

### Testing
```bash
# Trigger manual ingestion
curl -X POST https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/admin/ingest \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Verify data
# Query D1 for drive count
```

### Tessie API Reference
- Drives: `GET /{vin}/drives`
- Charges: `GET /{vin}/charges`
- State: `GET /{vin}/state`
- Docs: https://developer.tessie.com/
```

---

### Work Prompt 3: Implement State Detection Service (P1-05)

```markdown
## Task: Implement State Detection from Coordinates

### Context
When drives are ingested, we have lat/lng coordinates but need to determine
which US state each drive starts/ends in. This powers the "X/48 states visited"
feature which is core to the journey tracking.

### Acceptance Criteria
- [ ] Given lat/lng, returns US state name and code
- [ ] Handles edge cases (coordinates outside US)
- [ ] Updates states_visited table when new state detected
- [ ] Tracks first_visited_date and first_drive_id
- [ ] Works for both drive start and end points

### Implementation Guide

**Option A: Reverse Geocoding via API (Simpler)**
```typescript
// services/state-detection.ts
export async function getStateFromCoords(
  lat: number, 
  lng: number
): Promise<{ name: string; code: string } | null> {
  // Use Nominatim (free) or Mapbox reverse geocoding
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
  );
  const data = await response.json();
  
  // Parse state from address
  const state = data.address?.state;
  const stateCode = US_STATE_CODES[state]; // lookup table
  
  return state ? { name: state, code: stateCode } : null;
}
```

**Option B: Point-in-Polygon (Offline, Faster)**
```typescript
// Use pre-computed US state boundaries GeoJSON
// Store in KV or embed simplified boundaries
import { statePolygons } from './data/us-states-simplified.json';

export function getStateFromCoords(lat: number, lng: number) {
  for (const state of statePolygons.features) {
    if (pointInPolygon([lng, lat], state.geometry.coordinates)) {
      return {
        name: state.properties.name,
        code: state.properties.code
      };
    }
  }
  return null;
}
```

**Integration with Ingestion:**
```typescript
// After inserting a drive
const startState = await getStateFromCoords(drive.start_latitude, drive.start_longitude);
const endState = await getStateFromCoords(drive.end_latitude, drive.end_longitude);

// Check if this is a new state
for (const state of [startState, endState].filter(Boolean)) {
  await env.DB.prepare(`
    INSERT INTO states_visited (
      journey_id, state_name, state_code, first_visited_date, first_drive_id
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(journey_id, state_name) DO UPDATE SET
      visit_count = visit_count + 1,
      last_updated = CURRENT_TIMESTAMP
  `).bind(
    'continental-usa-2025',
    state.name,
    state.code,
    drive.started_at,
    drive.id
  ).run();
}
```

### Testing
```typescript
// Test coordinates
const testCases = [
  { lat: 34.0522, lng: -118.2437, expected: 'California' },  // LA
  { lat: 40.7128, lng: -74.0060, expected: 'New York' },     // NYC
  { lat: 41.8781, lng: -87.6298, expected: 'Illinois' },     // Chicago
];
```
```

---

### Work Prompt 4: Wire Frontend to Unified Data Endpoint (P2-01)

```markdown
## Task: Connect Dashboard to Unified Data API

### Context
The backend has a `/api/v1/unified-data` endpoint that returns journey overview,
timeline, and current vehicle status. The frontend needs to consume this and
display it across the dashboard widgets.

### Acceptance Criteria
- [ ] Single hook fetches all unified data
- [ ] Data refreshes every 30 seconds
- [ ] Loading states shown while fetching
- [ ] Error state with retry option
- [ ] Data passed to child components via props (not global state)

### Implementation Guide

**Consolidate hooks into one:**
```typescript
// hooks/useJourneyData.ts
import { useState, useEffect, useCallback } from 'react';

interface JourneyData {
  overview: {
    total_miles: number;
    states_visited_count: number;
    days_elapsed: number;
    status: string;
  };
  current_status: {
    battery_level: number;
    battery_range: number;
    charging_state: string;
    latitude: number;
    longitude: number;
    state_name: string;
    city: string;
  };
  timeline: Array<{
    type: 'drive' | 'charge' | 'stop';
    started_at: string;
    ended_at: string;
    // ... type-specific fields
  }>;
}

export function useJourneyData() {
  const [data, setData] = useState<JourneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/unified-data`
      );
      if (!response.ok) throw new Error('Failed to fetch journey data');
      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
```

**Dashboard integration:**
```tsx
// pages/Dashboard.tsx
export function Dashboard() {
  const { data, loading, error, refetch } = useJourneyData();

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!data) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <JourneyOverviewCard overview={data.overview} />
      <VehicleStatusCard status={data.current_status} />
      <StatesVisitedCard count={data.overview.states_visited_count} />
      <div className="lg:col-span-3">
        <TripMap 
          currentLocation={data.current_status} 
          timeline={data.timeline}
        />
      </div>
      <div className="lg:col-span-3">
        <TripTimeline events={data.timeline} />
      </div>
    </div>
  );
}
```

### Testing
1. Start frontend dev server
2. Verify network tab shows `/api/v1/unified-data` requests
3. Check that data updates every 30 seconds
4. Test error handling by blocking API requests
```

---

### Work Prompt 5: Add Scheduled Ingestion Trigger (P1-04)

```markdown
## Task: Configure Scheduled Cron Trigger for Data Ingestion

### Context
Data ingestion currently requires manual API calls. We need automated polling
so the database stays current with Tessie data without user intervention.

### Acceptance Criteria
- [ ] Worker runs every 5 minutes
- [ ] Calls ingestion service automatically
- [ ] Logs results to D1 ingestion_logs table
- [ ] Handles failures gracefully (doesn't crash worker)
- [ ] Can be disabled via feature flag if needed

### Implementation Guide

**wrangler.jsonc configuration:**
```jsonc
{
  "name": "awhittlewandering-api",
  "main": "src/index.ts",
  "compatibility_date": "2025-03-07",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true,
    "head_sampling_rate": 1
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "tesla_drive_db",
      "database_id": "fd68642b-757f-43df-b59e-28aab41f5d39"
    }
  ],
  "triggers": {
    "crons": ["*/5 * * * *"]
  }
}
```

**Scheduled handler:**
```typescript
// src/index.ts
import { Hono } from 'hono';
import { ingestDrivesFromTessie, ingestChargesFromTessie } from './services/tessie-ingest';

const app = new Hono<{ Bindings: Env }>();

// ... existing routes ...

export default {
  fetch: app.fetch,
  
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const startTime = Date.now();
    
    try {
      // Check feature flag
      const flagEnabled = await env.KV_FEATURE_FLAGS?.get('ingestion_enabled');
      if (flagEnabled === 'false') {
        console.log('Ingestion disabled via feature flag');
        return;
      }

      // Get VIN
      const vehicle = await env.DB.prepare(
        'SELECT vin FROM vehicles WHERE id = ?'
      ).bind('midnight-shadow').first<{ vin: string }>();
      
      if (!vehicle?.vin || vehicle.vin === 'UNKNOWN_VIN') {
        console.error('VIN not configured');
        return;
      }

      // Run ingestion
      const drivesCount = await ingestDrivesFromTessie(env, vehicle.vin);
      const chargesCount = await ingestChargesFromTessie(env, vehicle.vin);
      
      // Log results
      await env.DB.prepare(`
        INSERT INTO ingestion_logs (
          timestamp, drives_processed, charges_processed, 
          duration_ms, status, error_message
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        new Date().toISOString(),
        drivesCount,
        chargesCount,
        Date.now() - startTime,
        'success',
        null
      ).run();

      console.log(`Ingestion complete: ${drivesCount} drives, ${chargesCount} charges`);
      
    } catch (error) {
      console.error('Scheduled ingestion failed:', error);
      
      // Log failure
      await env.DB.prepare(`
        INSERT INTO ingestion_logs (
          timestamp, drives_processed, charges_processed,
          duration_ms, status, error_message
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        new Date().toISOString(),
        0,
        0,
        Date.now() - startTime,
        'error',
        (error as Error).message
      ).run();
    }
  }
};
```

### Deployment
```bash
# Deploy with cron triggers
wrangler deploy

# Verify cron is registered
wrangler triggers list
```

### Monitoring
```sql
-- Check recent ingestion logs
SELECT timestamp, drives_processed, charges_processed, status, error_message
FROM ingestion_logs
ORDER BY timestamp DESC
LIMIT 20;
```
```

---

## 6. Quick Reference

### Key Database IDs

| Resource | ID |
|----------|-----|
| D1 Database | `fd68642b-757f-43df-b59e-28aab41f5d39` |
| Vehicle ID | `midnight-shadow` |
| Journey ID | `continental-usa-2025` |

### API Endpoints (Target State)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/health` | GET | Service health check |
| `/api/v1/unified-data` | GET | All journey data for frontend |
| `/api/v1/telemetry` | POST | Receive vehicle telemetry |
| `/api/v1/admin/ingest` | POST | Trigger manual data ingestion |
| `/api/v1/admin/backfill` | POST | Backfill historical data |

### Worker Names

| Worker | Purpose |
|--------|---------|
| `awhittlewandering-api` | Production API |
| `awhittlewandering-api-dev` | Development API |
| `awhittlewandering-staging` | Staging frontend |
| `tesla-roadtrip-mcp-server` | MCP server for AI agents |

---

## 7. Success Metrics (V1 QA Ready)

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Drives in DB | > 0 | D1 query |
| States tracked | Matches actual journey | D1 query vs GPS history |
| Map shows route | Yes | Visual inspection |
| Battery widget works | Shows real % | Compare to Tessie app |
| Mobile responsive | No horizontal scroll | Device testing |
| Error handling | Graceful failures | Kill API, verify UI |
| Load time | < 3s initial | Lighthouse |
| Auto-refresh working | Updates every 30s | Dev tools network tab |

---

## 8. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Tessie API rate limits | Medium | High | Cache aggressively, backoff retry |
| State detection inaccurate | Low | Medium | Use reliable geocoding service |
| D1 query performance | Low | Medium | Add indexes, use aggregation caching |
| Frontend state complexity | Medium | Medium | Keep hooks simple, avoid global state |
| Deployment breaks prod | Medium | High | Always deploy to staging first |

---

## Appendix: Useful Queries

### Check journey progress
```sql
SELECT 
  j.name,
  jo.states_visited_count,
  jo.total_miles,
  jo.days_elapsed
FROM journey_overview jo
JOIN journeys j ON jo.journey_id = j.id
WHERE j.id = 'continental-usa-2025';
```

### List states visited
```sql
SELECT state_name, state_code, first_visited_date
FROM states_visited
WHERE journey_id = 'continental-usa-2025'
ORDER BY first_visited_date;
```

### Recent drives
```sql
SELECT 
  started_at,
  start_address,
  end_address,
  distance_miles,
  start_state,
  end_state
FROM drives
WHERE journey_id = 'continental-usa-2025'
ORDER BY started_at DESC
LIMIT 10;
```

### Ingestion health
```sql
SELECT 
  date(timestamp) as day,
  SUM(drives_processed) as total_drives,
  SUM(charges_processed) as total_charges,
  COUNT(CASE WHEN status = 'error' THEN 1 END) as errors
FROM ingestion_logs
GROUP BY date(timestamp)
ORDER BY day DESC
LIMIT 7;
```
