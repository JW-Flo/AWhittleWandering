/**
 * Dynamic Places API Router
 * 
 * Identifies places and infers activities using:
 * 1. Reverse geocoding (OpenStreetMap)
 * 2. Web search when needed (Serper/Google)
 * 3. AI classification (Cloudflare AI)
 * 
 * No hardcoded categories - learns dynamically.
 * Rate limit aware - tracks usage and skips exhausted providers.
 */

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { DynamicPlaceIntelligence } from '../services/dynamicPlaceIntelligence';
import { ApiRateLimitTracker } from '../services/apiRateLimitTracker';
import { logger } from '../utils/log';

export const placesRouter = new Hono<{ Bindings: Env }>();

/**
 * Validates journey ID format to prevent injection attacks and ensure data integrity.
 * 
 * Valid journey IDs must:
 * - Contain only alphanumeric characters, hyphens, and underscores
 * - Be between 1 and 100 characters long
 * - Examples: "continental-usa-2025", "europe_tour_2024", "journey123"
 * 
 * @param journeyId - The journey ID to validate
 * @returns true if the journey ID is valid, false otherwise
 */
function validateJourneyId(journeyId: string | undefined): boolean {
  return !!journeyId && /^[a-zA-Z0-9_-]{1,100}$/.test(journeyId);
}

/**
 * GET /api/v1/places/providers
 * Check which search providers are configured
 */
placesRouter.get('/providers', async (c) => {
  const providers = [
    { 
      name: 'serper', 
      configured: !!c.env.SERPER_API_KEY,
      freeQuota: '2,500/month',
      docs: 'https://serper.dev/',
    },
    { 
      name: 'brave', 
      configured: !!c.env.BRAVE_API_KEY,
      freeQuota: '2,000/month',
      docs: 'https://brave.com/search/api/',
    },
    { 
      name: 'tavily', 
      configured: !!c.env.TAVILY_API_KEY,
      freeQuota: '1,000/month',
      docs: 'https://tavily.com/',
    },
    { 
      name: 'cloudflare_ai', 
      configured: !!c.env.AI,
      freeQuota: 'Included with Workers',
      docs: 'https://developers.cloudflare.com/workers-ai/',
    },
  ];

  const totalFreeQueries = providers
    .filter(p => p.configured && p.name !== 'cloudflare_ai')
    .reduce((sum, p) => {
      const num = parseInt(p.freeQuota.replace(/,/g, ''), 10);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);

  return c.json({
    success: true,
    providers,
    totalConfigured: providers.filter(p => p.configured).length,
    estimatedFreeQueries: totalFreeQueries,
    fallbackOrder: ['serper', 'brave', 'tavily', 'cloudflare_ai'],
  });
});

/**
 * GET /api/v1/places/rate-limits
 * Get current rate limit status for all providers
 */
placesRouter.get('/rate-limits', async (c) => {
  const tracker = new ApiRateLimitTracker(c.env.TESLA_DB);
  
  try {
    const statuses = await tracker.getAllProviderStatuses();
    const analytics = await tracker.getUsageAnalytics(30);
    
    // Find best available provider
    const bestProvider = await tracker.getBestAvailableProvider([
      'serper', 'brave', 'tavily', 'cloudflare_ai'
    ]);

    return c.json({
      success: true,
      providers: statuses,
      bestAvailableProvider: bestProvider,
      analytics: {
        last30Days: analytics,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get rate limit status', { error });
    return c.json({ 
      success: false, 
      error: 'Failed to get rate limit status',
      message: 'Rate limit table may not exist - run migrations',
    }, 500);
  }
});

/**
 * GET /api/v1/places/rate-limits/:provider
 * Get detailed rate limit status for a specific provider
 */
placesRouter.get('/rate-limits/:provider', async (c) => {
  const provider = c.req.param('provider');
  const tracker = new ApiRateLimitTracker(c.env.TESLA_DB);
  
  try {
    const status = await tracker.getProviderStatus(provider);
    const prediction = await tracker.predictQuotaExhaustion(provider);

    return c.json({
      success: true,
      provider,
      status,
      prediction,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get provider rate limit status', { error, provider });
    return c.json({ success: false, error: 'Failed to get rate limit status' }, 500);
  }
});

/**
 * POST /api/v1/places/identify
 * Identify a place at given coordinates
 */
placesRouter.post('/identify', async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  const { latitude, longitude } = body;
  if (latitude === undefined || longitude === undefined) {
    return c.json({ success: false, error: 'latitude and longitude required' }, 400);
  }

  const intelligence = new DynamicPlaceIntelligence(c.env);
  const place = await intelligence.identifyPlace(latitude, longitude);

  return c.json({
    success: true,
    place,
  });
});

/**
 * POST /api/v1/places/analyze-stop
 * Analyze a stop and infer activity
 */
placesRouter.post('/analyze-stop', async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  const { latitude, longitude, duration_minutes, arrived_at, departed_at } = body;
  
  if (latitude === undefined || longitude === undefined) {
    return c.json({ success: false, error: 'latitude and longitude required' }, 400);
  }
  if (!duration_minutes && !arrived_at) {
    return c.json({ success: false, error: 'duration_minutes or arrived_at required' }, 400);
  }

  const arrivedAtDate = arrived_at ? new Date(arrived_at) : new Date();
  const departedAtDate = departed_at ? new Date(departed_at) : undefined;
  const duration = duration_minutes || 
    (departedAtDate ? (departedAtDate.getTime() - arrivedAtDate.getTime()) / (1000 * 60) : 60);

  const intelligence = new DynamicPlaceIntelligence(c.env);
  const analysis = await intelligence.analyzeStop(
    latitude,
    longitude,
    duration,
    arrivedAtDate,
    departedAtDate
  );

  return c.json({
    success: true,
    analysis: {
      place: analysis.place,
      activity: analysis.inferred_activity,
      flags: {
        is_overnight: analysis.is_overnight,
        is_likely_home: analysis.is_likely_home,
        is_likely_work: analysis.is_likely_work,
      },
    },
  });
});

/**
 * POST /api/v1/places/correct
 * Correct a place classification (user feedback)
 */
placesRouter.post('/correct', async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  const { latitude, longitude, name, place_type, place_description } = body;
  
  if (latitude === undefined || longitude === undefined) {
    return c.json({ success: false, error: 'latitude and longitude required' }, 400);
  }

  const intelligence = new DynamicPlaceIntelligence(c.env);
  await intelligence.correctPlace(latitude, longitude, {
    name,
    place_type,
    place_description,
  });

  return c.json({
    success: true,
    message: 'Place correction saved',
  });
});

/**
 * GET /api/v1/places/stops/:journeyId
 * Get all stops for a journey with place info
 */
placesRouter.get('/stops/:journeyId', async (c) => {
  const journeyId = c.req.param('journeyId');
  
  // Validate journey ID format
  if (!validateJourneyId(journeyId)) {
    return c.json({
      success: false,
      error: 'Invalid journey ID format'
    }, 400);
  }
  
  const limit = parseInt(c.req.query('limit') || '50', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  const result = await c.env.TESLA_DB.prepare(`
    SELECT * FROM stops 
    WHERE journey_id = ?
    ORDER BY arrived_at DESC
    LIMIT ? OFFSET ?
  `).bind(journeyId, limit, offset).all();

  return c.json({
    success: true,
    stops: result.results || [],
    count: result.results?.length || 0,
    pagination: { limit, offset },
  });
});

/**
 * GET /api/v1/places/stops/:journeyId/activities
 * Get activity summary for a journey
 */
placesRouter.get('/stops/:journeyId/activities', async (c) => {
  const journeyId = c.req.param('journeyId');
  
  // Validate journey ID format
  if (!validateJourneyId(journeyId)) {
    return c.json({
      success: false,
      error: 'Invalid journey ID format'
    }, 400);
  }
  
  const days = parseInt(c.req.query('days') || '30', 10);

  // Get activity breakdown
  const activities = await c.env.TESLA_DB.prepare(`
    SELECT 
      inferred_activity,
      place_type,
      place_name,
      COUNT(*) as count,
      SUM(duration_minutes) as total_minutes,
      AVG(duration_minutes) as avg_minutes
    FROM stops
    WHERE journey_id = ?
      AND inferred_activity IS NOT NULL
      AND arrived_at >= datetime('now', '-' || ? || ' days')
    GROUP BY inferred_activity, place_type
    ORDER BY count DESC
  `).bind(journeyId, days).all();

  // Get unique places visited
  const places = await c.env.TESLA_DB.prepare(`
    SELECT 
      place_name,
      place_type,
      city,
      state_name,
      COUNT(*) as visit_count,
      SUM(duration_minutes) as total_time
    FROM stops
    WHERE journey_id = ?
      AND place_name IS NOT NULL
      AND arrived_at >= datetime('now', '-' || ? || ' days')
    GROUP BY place_name
    ORDER BY visit_count DESC
    LIMIT 20
  `).bind(journeyId, days).all();

  return c.json({
    success: true,
    summary: {
      period_days: days,
      activities: activities.results || [],
      top_places: places.results || [],
    },
  });
});

/**
 * POST /api/v1/places/batch-analyze
 * Analyze multiple stops at once (for backfill)
 */
placesRouter.post('/batch-analyze', async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  const { stops } = body;
  if (!Array.isArray(stops)) {
    return c.json({ success: false, error: 'stops array required' }, 400);
  }

  const intelligence = new DynamicPlaceIntelligence(c.env);
  const results = [];

  for (const stop of stops.slice(0, 20)) { // Limit to 20 per request
    try {
      const analysis = await intelligence.analyzeStop(
        stop.latitude,
        stop.longitude,
        stop.duration_minutes || 60,
        new Date(stop.arrived_at || Date.now()),
        stop.departed_at ? new Date(stop.departed_at) : undefined
      );
      results.push({
        input: stop,
        analysis,
      });
    } catch (error) {
      results.push({
        input: stop,
        error: 'Analysis failed',
      });
    }
  }

  return c.json({
    success: true,
    results,
    processed: results.length,
  });
});

