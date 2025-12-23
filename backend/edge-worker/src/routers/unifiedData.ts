import { Hono } from 'hono';
import { z } from 'zod';
import { CacheService } from '../services/cache';
import { logger } from '../utils/log';

export const unifiedDataRouter = new Hono();

const JOURNEY_ID = 'continental-usa-2025';
const VEHICLE_ID = 'midnight-shadow';

const querySchema = z.object({
  revalidate: z.union([z.literal('true'), z.literal('false')]).optional(),
  limit: z.string().regex(/^\d+$/).optional()
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

async function buildUnifiedData(c: any, limit: number) {
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
    liveData: { timestamp: Date.now(), vehicleState: {}, recentActivity: {} as any },
    tessieStatus: { connected: !!(c.env?.TESSIE_API_TOKEN || c.env?.TESSIE_API_KEY), lastUpdate: new Date().toISOString(), dataFreshness: 'unknown' as const, error: undefined as string | undefined }
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
    ).bind(JOURNEY_ID).first();

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
    ).bind(VEHICLE_ID).first();

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
    }

    // Stats
    const driveStats = await db.prepare(
      `SELECT COUNT(*) as total_drives, COALESCE(SUM(distance_miles), 0) as total_miles
       FROM drives WHERE journey_id = ?`
    ).bind(JOURNEY_ID).first();
    const chargeStats = await db.prepare(
      `SELECT COUNT(*) as total_charges FROM charges WHERE journey_id = ?`
    ).bind(JOURNEY_ID).first();
    const statesCount = await db.prepare(
      `SELECT COUNT(*) as cnt FROM states_visited WHERE journey_id = ?`
    ).bind(JOURNEY_ID).first();

    const computedMiles = Number((driveStats as any)?.total_miles || 0);
    skeleton.overview.totalMiles = computedMiles || Number((journeyRow as any)?.total_miles || 0);
    skeleton.overview.statesVisited = Number((statesCount as any)?.cnt || 0);
    skeleton.overview.currentOdometer = skeleton.currentStatus.vehicle.odometer || skeleton.overview.currentOdometer;

    // Timeline
    const drives = await db.prepare(
      `SELECT id, started_at, ended_at, start_address, end_address, distance_miles, duration_minutes, energy_used_kwh
       FROM drives
       WHERE journey_id = ?
       ORDER BY started_at DESC
       LIMIT ?`
    ).bind(JOURNEY_ID, limit).all();

    const charges = await db.prepare(
      `SELECT id, started_at, ended_at, location, energy_added_kwh, duration_minutes
       FROM charges
       WHERE journey_id = ?
       ORDER BY started_at DESC
       LIMIT ?`
    ).bind(JOURNEY_ID, limit).all();

    const driveRows = (drives as any)?.results || [];
    const chargeRows = (charges as any)?.results || [];

    skeleton.timeline.drives = driveRows.map((d: any) => ({
      id: d.id,
      date: isoToDateOnly(d.started_at) || isoToDateOnly(d.ended_at) || skeleton.overview.startDate,
      startLocation: d.start_address || 'Unknown',
      endLocation: d.end_address || 'Unknown',
      distance: Number(d.distance_miles || 0),
      duration: Number(d.duration_minutes || 0),
      energyUsed: Number(d.energy_used_kwh || 0)
    }));

    skeleton.timeline.charges = chargeRows.map((ch: any) => ({
      id: ch.id,
      date: isoToDateOnly(ch.started_at) || isoToDateOnly(ch.ended_at) || skeleton.overview.startDate,
      location: ch.location || 'Unknown',
      energyAdded: Number(ch.energy_added_kwh || 0),
      duration: Number(ch.duration_minutes || 0)
    }));

    skeleton.liveData.recentActivity = {
      lastDrive: skeleton.timeline.drives[0],
      lastCharge: skeleton.timeline.charges[0]
    };

    return skeleton;
  } catch (err: any) {
    logger.error('unified.build.error', { error: err?.message });
    skeleton.tessieStatus.error = 'Failed to build unified data';
    return skeleton;
  }
}

unifiedDataRouter.get('/', async (c) => {
  try {
    const parsed = querySchema.safeParse(c.req.query());
    const limit = Math.min(50, Math.max(1, Number(parsed.success ? (parsed.data.limit || '20') : 20)));
    const revalidate = parsed.success && parsed.data.revalidate === 'true';

    const cacheKey = `unified_data_v3:limit=${limit}`;
    if (!revalidate) {
      const cached = await CacheService.get(c, cacheKey);
      if (cached) return c.json(cached);
    }

    const unified = await buildUnifiedData(c, limit);
    await CacheService.set(c, cacheKey, unified, 15);
    return c.json(unified);
  } catch (err: any) {
    logger.error('unified.endpoint.error', { error: err?.message, stack: err?.stack });
    // Return skeleton with error instead of throwing
    const skeleton = {
      overview: { tripName: 'Error', vehicle: 'Error', startDate: new Date().toISOString().slice(0, 10), daysElapsed: 0, totalMiles: 0, currentOdometer: 0, statesVisited: 0, totalStates: 48 },
      currentStatus: { battery: { level: 0, range: 0, charging: 'Unknown' }, location: { coordinates: { lat: 0, lng: 0 }, city: 'Unknown', state: 'Unknown', lastUpdate: new Date().toISOString() }, vehicle: { odometer: 0, speed: 0, heading: 0, temperature: { inside: undefined, outside: undefined } } },
      timeline: { drives: [], charges: [] },
      liveData: { timestamp: Date.now(), vehicleState: {}, recentActivity: {} },
      tessieStatus: { connected: false, lastUpdate: new Date().toISOString(), dataFreshness: 'unknown' as const, error: err?.message || 'Unknown error' }
    };
    return c.json(skeleton, 200);
  }
});