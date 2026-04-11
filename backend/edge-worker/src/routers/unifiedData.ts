import { Hono } from 'hono';
import type { Env } from '../types/env';
import { z } from 'zod';
import { CacheService } from '../services/cache';
import { logger } from '../utils/log';
import { resolveJourneyRef, DEFAULT_JOURNEY_ID, DEFAULT_VEHICLE_ID } from '../utils/resolveJourney';

export const unifiedDataRouter = new Hono<{ Bindings: Env }>();

const querySchema = z.object({
  revalidate: z.union([z.literal('true'), z.literal('false')]).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  journeyId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
});

function isoToDateOnly(iso?: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

function daysSince(dateStr?: string | null) {
  if (!dateStr) return 0;
  const start = new Date(dateStr);
  if (Number.isNaN(start.getTime())) return 0;
  const diffMs = Date.now() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
}

function freshnessFromAgeSec(ageSec: number | null): 'live' | 'cached' | 'unknown' {
  if (ageSec == null) return 'unknown';
  // Cron is every 15m during active hours; consider <= 20m "live"
  if (ageSec <= 20 * 60) return 'live';
  return 'cached';
}

async function buildUnifiedData(c: any, limit: number, journeyId: string, vehicleId: string) {
  const db = c.env?.TESLA_DB;

  // Soft-fail skeleton (always matches frontend contract)
  const skeleton = {
    overview: {
      tripName: 'A Whittle Wandering - Continental USA',
      vehicle: 'Midnight Shadow',
      startDate: '2025-06-01',
      daysElapsed: daysSince('2025-06-01'),
      totalMiles: 0,
      currentOdometer: 0,
      statesVisited: 0,
      totalStates: 48
    },
    currentStatus: {
      battery: { level: 0, range: 0, charging: 'Unknown' },
      location: { coordinates: { lat: 0, lng: 0 }, city: 'Unknown', state: 'Unknown', lastUpdate: new Date().toISOString() },
      vehicle: { odometer: 0, speed: 0, heading: 0, temperature: { inside: undefined as number | undefined, outside: undefined as number | undefined } }
    },
    timeline: { drives: [] as any[], charges: [] as any[] },
    routePath: [] as Array<{ lat: number; lng: number; timestamp: string }>,
    liveData: { timestamp: Date.now(), vehicleState: {}, recentActivity: {} as any },
    tessieStatus: { connected: !!c.env?.TESSIE_API_TOKEN, lastUpdate: new Date().toISOString(), dataFreshness: 'unknown' as 'live' | 'cached' | 'unknown', error: undefined as string | undefined }
  };

  if (!db) {
    logger.error('unified.build.error', { error: 'Database binding not available' });
    skeleton.tessieStatus.error = 'Database not configured';
    return skeleton;
  }

  // Test database connection first
  try {
    await db.prepare('SELECT 1').first();
  } catch (dbError: any) {
    logger.error('unified.build.error', { error: `Database connection failed: ${dbError?.message || String(dbError)}` });
    skeleton.tessieStatus.error = `Database connection failed: ${dbError?.message || 'Unknown error'}`;
    return skeleton;
  }

  try {
    // Journey metadata (preferred source for names and targets)
    const journeyRow = await db.prepare(
      `SELECT j.id, j.name, j.start_date, j.target_states, j.total_miles, v.display_name
       FROM journeys j
       LEFT JOIN vehicles v ON v.id = j.vehicle_id
       WHERE j.id = ? LIMIT 1`
    ).bind(journeyId).first();

    const startDate = (journeyRow as any)?.start_date || skeleton.overview.startDate;
    skeleton.overview.tripName = (journeyRow as any)?.name || skeleton.overview.tripName;
    skeleton.overview.vehicle = (journeyRow as any)?.display_name || skeleton.overview.vehicle;
    skeleton.overview.startDate = startDate;
    skeleton.overview.daysElapsed = daysSince(startDate);
    skeleton.overview.totalStates = Number((journeyRow as any)?.target_states || skeleton.overview.totalStates);

    // Current vehicle state
    const vs = await db.prepare(
      `SELECT battery_level, battery_range, charging_state, latitude, longitude, heading, speed, odometer,
              inside_temp, outside_temp, timestamp, state_name, city
       FROM vehicle_state
       WHERE vehicle_id = ?
       LIMIT 1`
    ).bind(vehicleId).first();

    const vsTs = (vs as any)?.timestamp as string | undefined;
    const ageSec = vsTs ? Math.round((Date.now() - new Date(vsTs).getTime()) / 1000) : null;
    skeleton.tessieStatus.lastUpdate = vsTs || skeleton.tessieStatus.lastUpdate;
    skeleton.tessieStatus.dataFreshness = freshnessFromAgeSec(ageSec);

    if (vs) {
      skeleton.currentStatus.battery = {
        level: Number((vs as any).battery_level || 0),
        range: Number((vs as any).battery_range || 0),
        charging: (vs as any).charging_state || 'Unknown'
      };
      skeleton.currentStatus.location = {
        coordinates: { lat: Number((vs as any).latitude || 0), lng: Number((vs as any).longitude || 0) },
        city: (vs as any).city || 'Unknown',
        state: (vs as any).state_name || 'Unknown',
        lastUpdate: vsTs || new Date().toISOString()
      };
      skeleton.currentStatus.vehicle = {
        odometer: Number((vs as any).odometer || 0),
        speed: Number((vs as any).speed || 0),
        heading: Number((vs as any).heading || 0),
        temperature: { inside: (vs as any).inside_temp ?? undefined, outside: (vs as any).outside_temp ?? undefined }
      };

      // Provide a Tessie-ish shape for consumers expecting nested keys
      skeleton.liveData.vehicleState = {
        charge_state: {
          battery_level: skeleton.currentStatus.battery.level,
          battery_range: skeleton.currentStatus.battery.range,
          charging_state: skeleton.currentStatus.battery.charging
        },
        drive_state: {
          latitude: skeleton.currentStatus.location.coordinates.lat,
          longitude: skeleton.currentStatus.location.coordinates.lng,
          heading: skeleton.currentStatus.vehicle.heading,
          speed: skeleton.currentStatus.vehicle.speed
        },
        climate_state: {
          inside_temp: skeleton.currentStatus.vehicle.temperature.inside,
          outside_temp: skeleton.currentStatus.vehicle.temperature.outside
        },
        vehicle_state: {
          odometer: skeleton.currentStatus.vehicle.odometer
        },
        timestamp: vsTs ? new Date(vsTs).getTime() : Date.now()
      };
    } else {
      // No live vehicle state — fall back to last known position from drives table
      const lastDrive = await db.prepare(
        `SELECT end_state, end_address, end_latitude, end_longitude, end_battery_level, ended_at
         FROM drives WHERE journey_id = ? ORDER BY ended_at DESC LIMIT 1`
      ).bind(journeyId).first();

      if (lastDrive) {
        const ld = lastDrive as any;
        skeleton.currentStatus.location = {
          coordinates: { lat: Number(ld.end_latitude || 0), lng: Number(ld.end_longitude || 0) },
          city: (ld.end_address || '').split(',')[1]?.trim() || 'Unknown',
          state: ld.end_state || 'Unknown',
          lastUpdate: ld.ended_at ? new Date(ld.ended_at).toISOString() : new Date().toISOString()
        };
        skeleton.currentStatus.battery = {
          level: Number(ld.end_battery_level || 0),
          range: 0,
          charging: 'Unknown'
        };
      }
    }

    // Stats
    const driveStats = await db.prepare(
      `SELECT COUNT(*) as total_drives, COALESCE(SUM(distance_miles), 0) as total_miles
       FROM drives WHERE journey_id = ?`
    ).bind(journeyId).first();
    const chargeStats = await db.prepare(
      `SELECT COUNT(*) as total_charges FROM charges WHERE journey_id = ?`
    ).bind(journeyId).first();
    const statesCount = await db.prepare(
      `SELECT COUNT(*) as cnt FROM states_visited WHERE journey_id = ?`
    ).bind(journeyId).first();

    const computedMiles = Number((driveStats as any)?.total_miles || 0);
    skeleton.overview.totalMiles = computedMiles || Number((journeyRow as any)?.total_miles || 0);
    skeleton.overview.statesVisited = Number((statesCount as any)?.cnt || 0);
    skeleton.overview.currentOdometer = skeleton.currentStatus.vehicle.odometer || skeleton.overview.currentOdometer;

    // Timeline
    const drives = await db.prepare(
      `SELECT id, started_at, ended_at, start_address, end_address,
              start_latitude, start_longitude, end_latitude, end_longitude,
              start_state, end_state,
              distance_miles, duration_minutes, energy_used_kwh,
              start_battery_level, end_battery_level
       FROM drives
       WHERE journey_id = ?
       ORDER BY started_at DESC
       LIMIT ?`
    ).bind(journeyId, limit).all();

    const charges = await db.prepare(
      `SELECT id, started_at, ended_at, location, latitude, longitude,
              energy_added_kwh, duration_minutes, charger_type,
              start_battery_level, end_battery_level, cost_usd
       FROM charges
       WHERE journey_id = ?
       ORDER BY started_at DESC
       LIMIT ?`
    ).bind(journeyId, limit).all();

    const driveRows = (drives as any)?.results || [];
    const chargeRows = (charges as any)?.results || [];

    skeleton.timeline.drives = driveRows.map((d: any) => ({
      id: d.id,
      date: isoToDateOnly(d.started_at) || isoToDateOnly(d.ended_at) || skeleton.overview.startDate,
      startTime: d.started_at || null,
      endTime: d.ended_at || null,
      startLocation: d.start_address || 'Unknown',
      endLocation: d.end_address || 'Unknown',
      startCoordinates: (d.start_latitude && d.start_longitude)
        ? { lat: Number(d.start_latitude), lng: Number(d.start_longitude) } : null,
      endCoordinates: (d.end_latitude && d.end_longitude)
        ? { lat: Number(d.end_latitude), lng: Number(d.end_longitude) } : null,
      startState: d.start_state || null,
      endState: d.end_state || null,
      distance: Number(d.distance_miles || 0),
      duration: Number(d.duration_minutes || 0),
      durationMinutes: Number(d.duration_minutes || 0),
      energyUsed: Number(d.energy_used_kwh || 0),
      startBattery: d.start_battery_level != null ? Number(d.start_battery_level) : null,
      endBattery: d.end_battery_level != null ? Number(d.end_battery_level) : null
    }));

    skeleton.timeline.charges = chargeRows.map((ch: any) => ({
      id: ch.id,
      date: isoToDateOnly(ch.started_at) || isoToDateOnly(ch.ended_at) || skeleton.overview.startDate,
      startTime: ch.started_at || null,
      endTime: ch.ended_at || null,
      location: ch.location || 'Unknown',
      coordinates: (ch.latitude && ch.longitude)
        ? { lat: Number(ch.latitude), lng: Number(ch.longitude) } : null,
      energyAdded: Number(ch.energy_added_kwh || 0),
      duration: Number(ch.duration_minutes || 0),
      chargerType: ch.charger_type || null,
      startBattery: ch.start_battery_level != null ? Number(ch.start_battery_level) : null,
      endBattery: ch.end_battery_level != null ? Number(ch.end_battery_level) : null,
      cost: ch.cost_usd != null ? Number(ch.cost_usd) : null
    }));

    skeleton.liveData.recentActivity = {
      lastDrive: skeleton.timeline.drives[0],
      lastCharge: skeleton.timeline.charges[0]
    };

    // Route path: ordered coordinates from ALL drives for the map polyline
    const routePathRows = await db.prepare(
      `SELECT start_latitude, start_longitude, end_latitude, end_longitude, started_at
       FROM drives
       WHERE journey_id = ? AND start_latitude IS NOT NULL AND end_latitude IS NOT NULL
         AND start_latitude != 0 AND end_latitude != 0
       ORDER BY started_at ASC`
    ).bind(journeyId).all();
    const rpRows = (routePathRows as any)?.results || [];
    const routeCoords: Array<{ lat: number; lng: number; timestamp: string }> = [];
    for (const r of rpRows) {
      if (r.start_latitude && r.start_longitude) {
        routeCoords.push({ lat: Number(r.start_latitude), lng: Number(r.start_longitude), timestamp: r.started_at });
      }
      if (r.end_latitude && r.end_longitude) {
        routeCoords.push({ lat: Number(r.end_latitude), lng: Number(r.end_longitude), timestamp: r.started_at });
      }
    }
    skeleton.routePath = routeCoords;

    return skeleton;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    logger.error('unified.build.error', { error: errMsg, stack: err?.stack });
    skeleton.tessieStatus.error = `Failed to build unified data: ${errMsg}`;
    return skeleton;
  }
}

// Shared handler for both query-param and path-param routes
async function handleUnifiedData(c: any, journeyRef?: string) {
  try {
    const parsed = querySchema.safeParse(c.req.query());
    const limit = Math.min(50, Math.max(1, Number(parsed.success ? (parsed.data.limit || '20') : 20)));
    const revalidate = parsed.success && parsed.data.revalidate === 'true';

    // Resolve journey: path param takes priority, then query param, then default
    const ref = journeyRef || (parsed.success && parsed.data.journeyId) || undefined;
    const resolved = await resolveJourneyRef(c.env?.TESLA_DB, ref);
    const journeyId = resolved.journeyId;
    const vehicleId = (parsed.success && parsed.data.vehicleId) || resolved.vehicleId;

    const cacheKey = `unified_data_v3:j=${journeyId}:v=${vehicleId}:limit=${limit}`;
    if (!revalidate) {
      const cached = await CacheService.get(c, cacheKey);
      if (cached) return c.json(cached);
    }

    const unified = await buildUnifiedData(c, limit, journeyId, vehicleId);
    await CacheService.set(c, cacheKey, unified, 15);
    return c.json(unified);
  } catch (err: any) {
    logger.error('unified.endpoint.error', { error: err?.message, stack: err?.stack });
    const skeleton = {
      overview: { tripName: 'Error', vehicle: 'Error', startDate: new Date().toISOString().slice(0, 10), daysElapsed: 0, totalMiles: 0, currentOdometer: 0, statesVisited: 0, totalStates: 48 },
      currentStatus: { battery: { level: 0, range: 0, charging: 'Unknown' }, location: { coordinates: { lat: 0, lng: 0 }, city: 'Unknown', state: 'Unknown', lastUpdate: new Date().toISOString() }, vehicle: { odometer: 0, speed: 0, heading: 0, temperature: { inside: undefined, outside: undefined } } },
      timeline: { drives: [], charges: [] },
      routePath: [],
      liveData: { timestamp: Date.now(), vehicleState: {}, recentActivity: {} },
      tessieStatus: { connected: false, lastUpdate: new Date().toISOString(), dataFreshness: 'unknown' as const, error: err?.message || 'Unknown error' }
    };
    return c.json(skeleton, 200);
  }
}

// Query-param route: GET /api/v1/unified-data?journeyId=...
unifiedDataRouter.get('/', async (c) => handleUnifiedData(c));

// Path-param route: GET /api/v1/unified-data/:journeyRef (numeric public_id or text slug)
unifiedDataRouter.get('/:journeyRef', async (c) => {
  const journeyRef = c.req.param('journeyRef');
  return handleUnifiedData(c, journeyRef);
});
