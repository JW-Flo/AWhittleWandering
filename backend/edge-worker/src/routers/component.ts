import { Hono } from 'hono';
import { log } from '../middleware/requestLogger';

/**
 * Component API Router - All missing frontend-expected endpoints
 * Provides data for dashboard components, analytics, and vehicle state
 */
export const componentRouter = new Hono<{ Bindings: Env }>();

// ============================================
// Component Data Endpoints
// ============================================

/**
 * GET /api/v1/component/overview
 * Dashboard overview data
 */
componentRouter.get('/overview', async (c) => {
  try {
    const db = c.env?.TESLA_DB;
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500);
    }

    // Get journey and vehicle data
    const journey = await db.prepare(`
      SELECT * FROM journeys WHERE id = 'continental-usa-2025'
    `).first();

    const vehicleState = await db.prepare(`
      SELECT * FROM vehicle_state ORDER BY timestamp DESC LIMIT 1
    `).first();

    const driveStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_drives,
        COALESCE(SUM(distance_miles), 0) as total_miles,
        COUNT(DISTINCT start_state) as states_visited
      FROM drives WHERE journey_id = 'continental-usa-2025'
    `).first();

    const chargeStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_charges,
        COALESCE(SUM(cost_usd), 0) as total_cost,
        COALESCE(SUM(energy_added_kwh), 0) as total_energy
      FROM charges WHERE journey_id = 'continental-usa-2025'
    `).first();

    const startDate = journey?.start_date ? new Date(journey.start_date as string) : new Date('2025-06-01');
    const daysElapsed = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return c.json({
      journey: {
        name: journey?.name || 'A Whittle Wandering - Continental USA',
        startDate: journey?.start_date || '2025-06-01',
        status: journey?.status || 'active',
        daysElapsed
      },
      currentState: {
        batteryLevel: vehicleState?.battery_level || 0,
        batteryRange: vehicleState?.battery_range || 0,
        chargingState: vehicleState?.charging_state || 'Unknown',
        location: vehicleState?.city 
          ? `${vehicleState.city}, ${vehicleState.state_name}` 
          : 'Unknown',
        lastUpdate: vehicleState?.timestamp || new Date().toISOString()
      },
      progress: {
        statesVisited: (driveStats as any)?.states_visited || 0,
        totalMiles: Math.round((driveStats as any)?.total_miles || 0),
        totalDrives: (driveStats as any)?.total_drives || 0,
        totalCharges: (chargeStats as any)?.total_charges || 0,
        totalCost: Math.round(((chargeStats as any)?.total_cost || 0) * 100) / 100
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log('error', 'component.overview.error', { error: (error as Error).message });
    return c.json({ error: 'Failed to fetch overview data' }, 500);
  }
});

/**
 * GET /api/v1/component/current-status
 * Current vehicle status
 */
componentRouter.get('/current-status', async (c) => {
  try {
    const db = c.env?.TESLA_DB;
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500);
    }

    const state = await db.prepare(`
      SELECT * FROM vehicle_state ORDER BY timestamp DESC LIMIT 1
    `).first();

    if (!state) {
      return c.json({
        batteryLevel: 0,
        batteryRange: 0,
        chargingState: 'Unknown',
        location: { lat: 0, lng: 0, city: 'Unknown', state: 'Unknown' },
        driving: { speed: 0, odometer: 0, shiftState: null },
        climate: { insideTemp: null, outsideTemp: null, climateOn: false },
        security: { locked: false },
        timestamp: new Date().toISOString()
      });
    }

    return c.json({
      batteryLevel: state.battery_level || 0,
      batteryRange: state.battery_range || 0,
      chargingState: state.charging_state || 'Unknown',
      location: {
        lat: state.latitude || 0,
        lng: state.longitude || 0,
        city: state.city || 'Unknown',
        state: state.state_name || 'Unknown'
      },
      driving: {
        speed: state.speed || 0,
        odometer: state.odometer || 0,
        shiftState: state.shift_state || null
      },
      climate: {
        insideTemp: state.inside_temp || null,
        outsideTemp: state.outside_temp || null,
        climateOn: state.climate_on || false
      },
      security: {
        locked: state.locked || false
      },
      timestamp: state.timestamp || new Date().toISOString()
    });
  } catch (error) {
    log('error', 'component.current-status.error', { error: (error as Error).message });
    return c.json({ error: 'Failed to fetch current status' }, 500);
  }
});

/**
 * GET /api/v1/component/states-progress
 * States visited progress
 */
componentRouter.get('/states-progress', async (c) => {
  try {
    const db = c.env?.TESLA_DB;
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500);
    }

    const states = await db.prepare(`
      SELECT 
        state_name as name,
        state_code as code,
        first_visited_date as firstVisit,
        visit_count as visitCount,
        total_miles_in_state as totalMiles
      FROM states_visited 
      WHERE journey_id = 'continental-usa-2025'
      ORDER BY first_visited_date ASC
    `).all();

    return c.json({
      visited: states.results || [],
      totalVisited: states.results?.length || 0,
      targetStates: 48,
      percentComplete: Math.round(((states.results?.length || 0) / 48) * 100),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log('error', 'component.states-progress.error', { error: (error as Error).message });
    return c.json({ error: 'Failed to fetch states progress' }, 500);
  }
});

/**
 * GET /api/v1/component/recent-drives
 * Recent drive entries
 */
componentRouter.get('/recent-drives', async (c) => {
  try {
    const db = c.env?.TESLA_DB;
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500);
    }

    const limit = parseInt(c.req.query('limit') || '10');

    const drives = await db.prepare(`
      SELECT 
        id,
        started_at as startTime,
        ended_at as endTime,
        start_address as startLocation,
        end_address as endLocation,
        start_state as startState,
        end_state as endState,
        distance_miles as distance,
        duration_minutes as duration,
        energy_used_kwh as energyUsed,
        average_speed as avgSpeed,
        start_battery_level as startBattery,
        end_battery_level as endBattery
      FROM drives 
      WHERE journey_id = 'continental-usa-2025'
      ORDER BY started_at DESC 
      LIMIT ?
    `).bind(limit).all();

    return c.json({
      drives: drives.results || [],
      count: drives.results?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log('error', 'component.recent-drives.error', { error: (error as Error).message });
    return c.json({ error: 'Failed to fetch recent drives' }, 500);
  }
});

// ============================================
// Analytics Endpoints
// ============================================

/**
 * GET /api/v1/analytics/comprehensive
 * Comprehensive analytics data
 */
export const analyticsRouter = new Hono<{ Bindings: Env }>();

analyticsRouter.get('/comprehensive', async (c) => {
  try {
    const db = c.env?.TESLA_DB;
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500);
    }

    const driveStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_drives,
        COALESCE(SUM(distance_miles), 0) as total_miles,
        COALESCE(AVG(average_speed), 0) as avg_speed,
        COALESCE(MAX(max_speed), 0) as max_speed,
        COALESCE(SUM(energy_used_kwh), 0) as total_energy_used,
        COALESCE(AVG(duration_minutes), 0) as avg_duration
      FROM drives WHERE journey_id = 'continental-usa-2025'
    `).first();

    const chargeStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_charges,
        COALESCE(SUM(energy_added_kwh), 0) as total_energy_added,
        COALESCE(SUM(cost_usd), 0) as total_cost,
        COALESCE(AVG(duration_minutes), 0) as avg_charge_duration,
        COUNT(CASE WHEN is_supercharger = 1 THEN 1 END) as supercharger_sessions
      FROM charges WHERE journey_id = 'continental-usa-2025'
    `).first();

    const stateCount = await db.prepare(`
      SELECT COUNT(DISTINCT state_name) as count 
      FROM states_visited WHERE journey_id = 'continental-usa-2025'
    `).first();

    return c.json({
      driving: {
        totalDrives: (driveStats as any)?.total_drives || 0,
        totalMiles: Math.round((driveStats as any)?.total_miles || 0),
        avgSpeed: Math.round((driveStats as any)?.avg_speed || 0),
        maxSpeed: Math.round((driveStats as any)?.max_speed || 0),
        totalEnergyUsed: Math.round(((driveStats as any)?.total_energy_used || 0) * 100) / 100,
        avgDuration: Math.round((driveStats as any)?.avg_duration || 0)
      },
      charging: {
        totalCharges: (chargeStats as any)?.total_charges || 0,
        totalEnergyAdded: Math.round(((chargeStats as any)?.total_energy_added || 0) * 100) / 100,
        totalCost: Math.round(((chargeStats as any)?.total_cost || 0) * 100) / 100,
        avgChargeDuration: Math.round((chargeStats as any)?.avg_charge_duration || 0),
        superchargerSessions: (chargeStats as any)?.supercharger_sessions || 0
      },
      journey: {
        statesVisited: (stateCount as any)?.count || 0,
        targetStates: 48,
        percentComplete: Math.round((((stateCount as any)?.count || 0) / 48) * 100)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log('error', 'analytics.comprehensive.error', { error: (error as Error).message });
    return c.json({ error: 'Failed to fetch comprehensive analytics' }, 500);
  }
});

/**
 * GET /api/v1/analytics/efficiency
 * Efficiency metrics
 */
analyticsRouter.get('/efficiency', async (c) => {
  try {
    const db = c.env?.TESLA_DB;
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500);
    }

    const efficiency = await db.prepare(`
      SELECT 
        DATE(started_at) as date,
        AVG(CASE WHEN energy_used_kwh > 0 THEN distance_miles / energy_used_kwh ELSE 0 END) as efficiency,
        SUM(distance_miles) as daily_miles,
        SUM(energy_used_kwh) as daily_energy,
        COUNT(*) as drive_count
      FROM drives 
      WHERE journey_id = 'continental-usa-2025'
      GROUP BY DATE(started_at)
      ORDER BY date DESC
      LIMIT 30
    `).all();

    const avgEfficiency = await db.prepare(`
      SELECT AVG(CASE WHEN energy_used_kwh > 0 THEN distance_miles / energy_used_kwh ELSE 0 END) as avg
      FROM drives WHERE journey_id = 'continental-usa-2025' AND energy_used_kwh > 0
    `).first();

    return c.json({
      dailyEfficiency: efficiency.results || [],
      overallEfficiency: Math.round(((avgEfficiency as any)?.avg || 0) * 100) / 100,
      unit: 'miles/kWh',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log('error', 'analytics.efficiency.error', { error: (error as Error).message });
    return c.json({ error: 'Failed to fetch efficiency data' }, 500);
  }
});

/**
 * GET /api/v1/analytics/charging
 * Charging analytics
 */
analyticsRouter.get('/charging', async (c) => {
  try {
    const db = c.env?.TESLA_DB;
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500);
    }

    const byType = await db.prepare(`
      SELECT 
        charger_type as type,
        COUNT(*) as sessions,
        SUM(energy_added_kwh) as totalEnergy,
        SUM(cost_usd) as totalCost,
        AVG(duration_minutes) as avgDuration
      FROM charges 
      WHERE journey_id = 'continental-usa-2025'
      GROUP BY charger_type
    `).all();

    const byState = await db.prepare(`
      SELECT 
        state_name as state,
        COUNT(*) as sessions,
        SUM(energy_added_kwh) as totalEnergy,
        SUM(cost_usd) as totalCost
      FROM charges 
      WHERE journey_id = 'continental-usa-2025'
      GROUP BY state_name
      ORDER BY sessions DESC
      LIMIT 10
    `).all();

    return c.json({
      byChargerType: byType.results || [],
      byState: byState.results || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log('error', 'analytics.charging.error', { error: (error as Error).message });
    return c.json({ error: 'Failed to fetch charging analytics' }, 500);
  }
});

// ============================================
// Vehicle State Endpoints
// ============================================

export const vehicleRouter = new Hono<{ Bindings: Env }>();

/**
 * GET /api/v1/vehicle/state/enhanced
 * Enhanced vehicle state with additional metadata
 */
vehicleRouter.get('/state/enhanced', async (c) => {
  try {
    const db = c.env?.TESLA_DB;
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500);
    }

    const state = await db.prepare(`
      SELECT vs.*, v.display_name, v.model, v.year
      FROM vehicle_state vs
      LEFT JOIN vehicles v ON vs.vin = v.vin
      ORDER BY vs.timestamp DESC LIMIT 1
    `).first();

    const lastDrive = await db.prepare(`
      SELECT * FROM drives 
      WHERE journey_id = 'continental-usa-2025'
      ORDER BY ended_at DESC LIMIT 1
    `).first();

    const lastCharge = await db.prepare(`
      SELECT * FROM charges 
      WHERE journey_id = 'continental-usa-2025'
      ORDER BY ended_at DESC LIMIT 1
    `).first();

    return c.json({
      vehicle: {
        name: state?.display_name || 'Midnight Shadow',
        model: state?.model || 'Model Y',
        year: state?.year || 2023,
        vin: state?.vin || 'Unknown'
      },
      state: {
        battery: {
          level: state?.battery_level || 0,
          range: state?.battery_range || 0,
          charging: state?.charging_state || 'Unknown'
        },
        location: {
          lat: state?.latitude || 0,
          lng: state?.longitude || 0,
          heading: state?.heading || 0,
          city: state?.city || null,
          state: state?.state_name || null,
          address: state?.address || null
        },
        driving: {
          speed: state?.speed || 0,
          odometer: state?.odometer || 0,
          shiftState: state?.shift_state || null,
          power: state?.power || 0
        },
        climate: {
          inside: state?.inside_temp || null,
          outside: state?.outside_temp || null,
          climateOn: state?.climate_on || false
        },
        security: {
          locked: state?.locked || false
        }
      },
      lastActivity: {
        lastDrive: lastDrive ? {
          endedAt: lastDrive.ended_at,
          distance: lastDrive.distance_miles,
          destination: lastDrive.end_address
        } : null,
        lastCharge: lastCharge ? {
          endedAt: lastCharge.ended_at,
          energyAdded: lastCharge.energy_added_kwh,
          location: lastCharge.location
        } : null
      },
      timestamp: state?.timestamp || new Date().toISOString()
    });
  } catch (error) {
    log('error', 'vehicle.enhanced.error', { error: (error as Error).message });
    return c.json({ error: 'Failed to fetch enhanced vehicle state' }, 500);
  }
});

// ============================================
// AI/ML Endpoints (Stubs for now)
// ============================================

export const aiRouter = new Hono<{ Bindings: Env }>();

/**
 * POST /api/v1/route/optimize
 * AI-powered route optimization
 */
aiRouter.post('/route/optimize', async (c) => {
  try {
    const body = await c.req.json();
    
    // Stub implementation - returns mock optimized route
    return c.json({
      success: true,
      message: 'Route optimization completed',
      optimizedRoute: {
        estimatedDuration: body.waypoints?.length * 120 || 240,
        estimatedDistance: body.waypoints?.length * 150 || 300,
        estimatedEnergy: body.waypoints?.length * 40 || 80,
        suggestedStops: [
          { type: 'supercharger', estimatedArrival: 'In 2 hours', chargeTime: 25 }
        ],
        efficiencyScore: 85
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({ error: 'Route optimization failed' }, 500);
  }
});

/**
 * POST /api/v1/journal/generate
 * AI-powered journal entry generation
 */
aiRouter.post('/journal/generate', async (c) => {
  try {
    const body = await c.req.json();
    const db = c.env?.TESLA_DB;

    // Get recent drive data for context
    let recentDrives = [];
    if (db) {
      const drives = await db.prepare(`
        SELECT * FROM drives 
        WHERE journey_id = 'continental-usa-2025'
        ORDER BY started_at DESC LIMIT 5
      `).all();
      recentDrives = drives.results || [];
    }

    // Stub implementation - returns mock journal entry
    return c.json({
      success: true,
      journal: {
        title: body.title || 'Road Trip Adventures',
        content: `Today's journey took us through amazing landscapes. We covered ${recentDrives.length > 0 ? Math.round((recentDrives[0] as any).distance_miles) : 150} miles of scenic roads. The Tesla performed flawlessly with an efficiency of 3.5 miles per kWh.`,
        highlights: [
          'Scenic mountain views',
          'Supercharger stop with great amenities',
          'Crossed into a new state'
        ],
        photos: [],
        generatedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({ error: 'Journal generation failed' }, 500);
  }
});

// ============================================
// Debug Endpoints
// ============================================

export const debugRouter = new Hono<{ Bindings: Env }>();

/**
 * GET /api/v1/debug/tessie-sample
 * Sample Tessie data for debugging
 */
debugRouter.get('/tessie-sample', async (c) => {
  try {
    const db = c.env?.TESLA_DB;
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500);
    }

    const vehicleState = await db.prepare(`
      SELECT * FROM vehicle_state ORDER BY timestamp DESC LIMIT 1
    `).first();

    return c.json({
      success: true,
      sample: vehicleState || { message: 'No vehicle state data available' },
      tessieConfigured: !!c.env?.TESSIE_API_KEY,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch sample data' }, 500);
  }
});

/**
 * GET /api/v1/debug/drives-check
 * Check drives data integrity
 */
debugRouter.get('/drives-check', async (c) => {
  try {
    const db = c.env?.TESLA_DB;
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500);
    }

    const driveCount = await db.prepare(`
      SELECT COUNT(*) as count FROM drives WHERE journey_id = 'continental-usa-2025'
    `).first();

    const chargeCount = await db.prepare(`
      SELECT COUNT(*) as count FROM charges WHERE journey_id = 'continental-usa-2025'
    `).first();

    const latestDrive = await db.prepare(`
      SELECT * FROM drives WHERE journey_id = 'continental-usa-2025' ORDER BY started_at DESC LIMIT 1
    `).first();

    const latestCharge = await db.prepare(`
      SELECT * FROM charges WHERE journey_id = 'continental-usa-2025' ORDER BY started_at DESC LIMIT 1
    `).first();

    return c.json({
      success: true,
      stats: {
        totalDrives: (driveCount as any)?.count || 0,
        totalCharges: (chargeCount as any)?.count || 0
      },
      latestDrive: latestDrive || null,
      latestCharge: latestCharge || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({ error: 'Drives check failed' }, 500);
  }
});
