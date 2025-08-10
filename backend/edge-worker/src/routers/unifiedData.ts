import { Hono } from 'hono';
import { CacheService } from '../services/cache';
import { log } from '../middleware/requestLogger';

export const unifiedDataRouter = new Hono();

async function buildUnifiedData(c: any) {
  log('info', 'unified.build.start');

  const db = c.env?.TESLA_DB;
  if (!db) {
    throw new Error('Database not available');
  }

  // Basic structure for unified data response
  const unifiedData = {
    timestamp: new Date().toISOString(),
    vehicle: null as any,
    journey: {
      id: 'continental-usa-2025',
      name: 'Continental USA Tesla Road Trip 2025',
      status: 'active',
      stats: {
        totalMiles: 0,
        statesVisited: 0,
        totalDrives: 0,
        totalCharges: 0
      }
    },
    segments: [] as any[],
    milestones: [] as any[]
  };

  try {
    // Latest vehicle state
    const vehicleRow = await db.prepare(`
      SELECT v.vin, v.display_name, vs.* FROM vehicle_state vs
      LEFT JOIN vehicles v ON vs.vin = v.vin
      ORDER BY vs.timestamp DESC LIMIT 1
    `).first();

    if (vehicleRow) {
      unifiedData.vehicle = {
        vin: vehicleRow.vin,
        name: vehicleRow.display_name || 'Tesla Vehicle',
        location: {
          latitude: vehicleRow.latitude,
          longitude: vehicleRow.longitude
        },
        battery: {
          level: vehicleRow.battery_level,
          range: vehicleRow.battery_range
        },
        state: vehicleRow.vehicle_state,
        lastUpdate: vehicleRow.timestamp
      };
    }

    // Journey stats
    const driveStats = await db.prepare(`
      SELECT COUNT(*) as total_drives, 
             COUNT(DISTINCT start_state) as states_visited,
             SUM(distance_miles) as total_miles
      FROM drives 
      WHERE start_state IS NOT NULL
    `).first();

    const chargeStats = await db.prepare(`
      SELECT COUNT(*) as total_charges
      FROM charges
    `).first();

    if (driveStats) {
      unifiedData.journey.stats = {
        totalMiles: (driveStats as any).total_miles || 0,
        statesVisited: (driveStats as any).states_visited || 0,
        totalDrives: (driveStats as any).total_drives || 0,
        totalCharges: (chargeStats as any)?.total_charges || 0
      };
    }

    // Recent drive segments
    const recentDrives = await db.prepare(`
      SELECT * FROM drives 
      ORDER BY started_at DESC 
      LIMIT 5
    `).all();

    unifiedData.segments = (recentDrives.results || []).map((drive: any) => ({
      id: drive.drive_id,
      startTime: drive.started_at,
      endTime: drive.ended_at,
      distance: drive.distance_miles,
      startLocation: drive.start_city || 'Unknown',
      endLocation: drive.end_city || 'Unknown',
      efficiency: drive.efficiency_wh_per_mile,
      state: drive.start_state
    }));

    // Basic milestones based on states visited
    const stateVisits = await db.prepare(`
      SELECT DISTINCT start_state, MIN(started_at) as first_visit
      FROM drives 
      WHERE start_state IS NOT NULL
      GROUP BY start_state
      ORDER BY first_visit ASC
    `).all();

    unifiedData.milestones = (stateVisits.results || []).map((visit: any, index: number) => ({
      id: `state-${visit.start_state}`,
      type: 'state_visit',
      title: `Visited ${visit.start_state}`,
      description: `First visit to ${visit.start_state}`,
      achievedAt: visit.first_visit,
      rarity: index < 5 ? 'common' : 'rare',
      value: visit.start_state
    }));

  } catch (error) {
    log('error', 'unified.build.error', { error: (error as any)?.message });
    // Return minimal data on error
  }

  return unifiedData;
}

unifiedDataRouter.get('/', async (c) => {
  try {
    const cacheKey = 'unified_data_latest_v2';
    const revalidate = c.req.query('revalidate') === 'true';

    // Check cache unless revalidate requested
    if (!revalidate) {
      const cached = await CacheService.get(c, cacheKey);
      if (cached) {
        log('debug', 'unified.cache.hit', { key: cacheKey });
        return c.json(cached);
      }
    }

    // Build fresh data
    const unifiedData = await buildUnifiedData(c);

    // Cache for 15 seconds
    await CacheService.set(c, cacheKey, unifiedData, 15);

    log('info', 'unified.build.complete');
    return c.json(unifiedData);

  } catch (error) {
    log('error', 'unified.error', { error: (error as any)?.message });
    return c.json({
      error: 'Failed to fetch unified data',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Legacy redirect
unifiedDataRouter.get('/legacy', async (c) => {
  return c.redirect('/api/v1/unified-data', 308);
});