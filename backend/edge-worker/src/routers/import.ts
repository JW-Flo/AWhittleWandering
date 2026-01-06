/**
 * Data Import API Router
 *
 * Handles importing Tesla drive and charge data from CSV files
 * and waypoint narrative data from JSON.
 *
 * Authentication: Required (JWT Bearer token)
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { importTeslaDrives, importTeslaCharges } from '../importers/tesla-csv';
import { logger } from '../utils/log';

interface ImportEnv {
  TESLA_DB: D1Database;
  JWT_SECRET?: string;
}

export const importRouter = new Hono<{ Bindings: ImportEnv }>();

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const WaypointSchema = z.object({
  id: z.string().optional(),
  sequenceNumber: z.number(),
  timestamp: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  locationName: z.string(),
  stateName: z.string().optional(),
  city: z.string().optional(),
  waypointType: z.enum(['narrative', 'photo', 'milestone', 'poi']).default('narrative'),
  category: z.enum(['scenic', 'food', 'lodging', 'landmark', 'rest', 'charge']).optional(),
  title: z.string(),
  description: z.string().optional(),
  narrativeText: z.string().optional(),
  photoUrls: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  weather: z.record(z.any()).optional(),
  highlights: z.array(z.string()).optional(),
  isPublic: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

const WaypointsImportSchema = z.object({
  waypoints: z.array(WaypointSchema),
  journeyId: z.string().default('continental-usa-2025'),
});

type Waypoint = z.infer<typeof WaypointSchema>;

// =====================================================
// AUTHENTICATION MIDDLEWARE
// =====================================================

async function verifyAuth(c: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Missing or invalid authorization header' }, 401);
  }

  // TODO: Implement proper JWT verification
  // For now, just check that a token is present
  const token = authHeader.substring(7);
  if (!token) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  // In production, verify JWT here using JWT_SECRET
  // const jwtSecret = c.env?.JWT_SECRET;
  // if (!jwtSecret) {
  //   return c.json({ success: false, error: 'Authentication not configured' }, 500);
  // }
  // const verified = await verifyJWT(token, jwtSecret);
  // if (!verified) {
  //   return c.json({ success: false, error: 'Invalid token' }, 403);
  // }

  return null; // Auth passed
}

// =====================================================
// IMPORT ENDPOINTS
// =====================================================

/**
 * POST /api/v1/import/tesla-drives
 *
 * Import Tesla drive segments from CSV file
 *
 * Request: multipart/form-data with 'file' field
 * Response: Import statistics
 */
importRouter.post('/tesla-drives', async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 500);
  }

  // Check authentication
  const authError = await verifyAuth(c);
  if (authError) return authError;

  try {
    // Parse multipart form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const journeyId = (formData.get('journeyId') as string) || 'continental-usa-2025';
    const vehicleId = (formData.get('vehicleId') as string) || 'midnight-shadow';

    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400);
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return c.json({ success: false, error: 'File must be a CSV' }, 400);
    }

    // Read file content
    const csvContent = await file.text();

    logger.info('import.tesla-drives.start', {
      filename: file.name,
      size: file.size,
      journeyId,
      vehicleId
    });

    // Create audit log entry
    const auditResult = await db.prepare(`
      INSERT INTO import_audit (
        journey_id, import_type, import_source, filename, status, started_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
      RETURNING id
    `).bind(journeyId, 'drive_segments', 'csv', file.name, 'processing').first();

    const auditId = (auditResult as any)?.id;

    // Import drives
    const result = await importTeslaDrives(db, csvContent, journeyId, vehicleId);

    // Update audit log
    if (auditId) {
      await db.prepare(`
        UPDATE import_audit
        SET records_processed = ?,
            records_imported = ?,
            records_skipped = ?,
            records_failed = ?,
            status = ?,
            error_summary = ?,
            duration_ms = ?,
            completed_at = datetime('now')
        WHERE id = ?
      `).bind(
        result.recordsProcessed,
        result.recordsImported,
        result.recordsSkipped,
        result.recordsFailed,
        result.success ? 'completed' : (result.recordsImported > 0 ? 'partial' : 'failed'),
        JSON.stringify(result.errors),
        result.duration,
        auditId
      ).run();
    }

    // Update journey aggregates
    await updateJourneyAggregates(db, journeyId);

    logger.info('import.tesla-drives.complete', {
      filename: file.name,
      ...result
    });

    return c.json({
      success: result.success,
      message: `Imported ${result.recordsImported} drive segments`,
      stats: {
        processed: result.recordsProcessed,
        imported: result.recordsImported,
        skipped: result.recordsSkipped,
        failed: result.recordsFailed,
        duration: result.duration
      },
      errors: result.errors.slice(0, 10) // Return first 10 errors
    });
  } catch (err: any) {
    logger.error('import.tesla-drives.error', { error: err.message, stack: err.stack });
    return c.json({
      success: false,
      error: 'Import failed',
      message: err.message || String(err)
    }, 500);
  }
});

/**
 * POST /api/v1/import/tesla-charges
 *
 * Import Tesla charge events from CSV file
 *
 * Request: multipart/form-data with 'file' field
 * Response: Import statistics
 */
importRouter.post('/tesla-charges', async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 500);
  }

  // Check authentication
  const authError = await verifyAuth(c);
  if (authError) return authError;

  try {
    // Parse multipart form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const journeyId = (formData.get('journeyId') as string) || 'continental-usa-2025';
    const vehicleId = (formData.get('vehicleId') as string) || 'midnight-shadow';

    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400);
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return c.json({ success: false, error: 'File must be a CSV' }, 400);
    }

    // Read file content
    const csvContent = await file.text();

    logger.info('import.tesla-charges.start', {
      filename: file.name,
      size: file.size,
      journeyId,
      vehicleId
    });

    // Create audit log entry
    const auditResult = await db.prepare(`
      INSERT INTO import_audit (
        journey_id, import_type, import_source, filename, status, started_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
      RETURNING id
    `).bind(journeyId, 'energy_events', 'csv', file.name, 'processing').first();

    const auditId = (auditResult as any)?.id;

    // Import charges
    const result = await importTeslaCharges(db, csvContent, journeyId, vehicleId);

    // Update audit log
    if (auditId) {
      await db.prepare(`
        UPDATE import_audit
        SET records_processed = ?,
            records_imported = ?,
            records_skipped = ?,
            records_failed = ?,
            status = ?,
            error_summary = ?,
            duration_ms = ?,
            completed_at = datetime('now')
        WHERE id = ?
      `).bind(
        result.recordsProcessed,
        result.recordsImported,
        result.recordsSkipped,
        result.recordsFailed,
        result.success ? 'completed' : (result.recordsImported > 0 ? 'partial' : 'failed'),
        JSON.stringify(result.errors),
        result.duration,
        auditId
      ).run();
    }

    // Update journey aggregates
    await updateJourneyAggregates(db, journeyId);

    logger.info('import.tesla-charges.complete', {
      filename: file.name,
      ...result
    });

    return c.json({
      success: result.success,
      message: `Imported ${result.recordsImported} charge events`,
      stats: {
        processed: result.recordsProcessed,
        imported: result.recordsImported,
        skipped: result.recordsSkipped,
        failed: result.recordsFailed,
        duration: result.duration
      },
      errors: result.errors.slice(0, 10)
    });
  } catch (err: any) {
    logger.error('import.tesla-charges.error', { error: err.message, stack: err.stack });
    return c.json({
      success: false,
      error: 'Import failed',
      message: err.message || String(err)
    }, 500);
  }
});

/**
 * POST /api/v1/import/waypoints
 *
 * Import narrative waypoints from JSON
 *
 * Request: JSON array of waypoints
 * Response: Import statistics
 */
importRouter.post('/waypoints', async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 500);
  }

  // Check authentication
  const authError = await verifyAuth(c);
  if (authError) return authError;

  try {
    const startTime = Date.now();

    // Parse and validate request body
    const body = await c.req.json();
    const validated = WaypointsImportSchema.parse(body);

    const journeyId = validated.journeyId;
    const waypoints = validated.waypoints;

    logger.info('import.waypoints.start', {
      journeyId,
      count: waypoints.length
    });

    // Create audit log entry
    const auditResult = await db.prepare(`
      INSERT INTO import_audit (
        journey_id, import_type, import_source, status, started_at
      ) VALUES (?, ?, ?, ?, datetime('now'))
      RETURNING id
    `).bind(journeyId, 'waypoints', 'json', 'processing').first();

    const auditId = (auditResult as any)?.id;

    // Import waypoints in batches
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const errors: any[] = [];

    const BATCH_SIZE = 500;
    for (let i = 0; i < waypoints.length; i += BATCH_SIZE) {
      const batch = waypoints.slice(i, i + BATCH_SIZE);
      const statements: D1PreparedStatement[] = [];

      for (const waypoint of batch) {
        try {
          const waypointId = waypoint.id || crypto.randomUUID();
          const date = new Date(waypoint.timestamp).toISOString().slice(0, 10);

          const stmt = db.prepare(`
            INSERT INTO waypoints (
              id, journey_id, sequence_number, timestamp, date,
              latitude, longitude, location_name, state_name, city,
              waypoint_type, category,
              title, description, narrative_text,
              photo_urls, tags, weather, highlights,
              is_public, is_featured,
              import_source, import_timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
              timestamp = excluded.timestamp,
              title = excluded.title,
              description = excluded.description,
              narrative_text = excluded.narrative_text,
              updated_at = datetime('now')
          `).bind(
            waypointId,
            journeyId,
            waypoint.sequenceNumber,
            waypoint.timestamp,
            date,
            waypoint.latitude,
            waypoint.longitude,
            waypoint.locationName,
            waypoint.stateName || null,
            waypoint.city || null,
            waypoint.waypointType,
            waypoint.category || null,
            waypoint.title,
            waypoint.description || null,
            waypoint.narrativeText || null,
            waypoint.photoUrls ? JSON.stringify(waypoint.photoUrls) : null,
            waypoint.tags ? JSON.stringify(waypoint.tags) : null,
            waypoint.weather ? JSON.stringify(waypoint.weather) : null,
            waypoint.highlights ? JSON.stringify(waypoint.highlights) : null,
            waypoint.isPublic ? 1 : 0,
            waypoint.isFeatured ? 1 : 0,
            'json'
          );

          statements.push(stmt);
        } catch (err: any) {
          failed++;
          errors.push({
            waypoint: waypoint.title,
            error: err.message || String(err)
          });
        }
      }

      // Execute batch
      if (statements.length > 0) {
        const results = await db.batch(statements);
        // All waypoints are inserted or updated, so count as imported
        imported += results.length;
      }
    }

    const duration = Date.now() - startTime;

    // Update audit log
    if (auditId) {
      await db.prepare(`
        UPDATE import_audit
        SET records_processed = ?,
            records_imported = ?,
            records_skipped = ?,
            records_failed = ?,
            status = ?,
            error_summary = ?,
            duration_ms = ?,
            completed_at = datetime('now')
        WHERE id = ?
      `).bind(
        waypoints.length,
        imported,
        skipped,
        failed,
        failed === 0 ? 'completed' : (imported > 0 ? 'partial' : 'failed'),
        JSON.stringify(errors),
        duration,
        auditId
      ).run();
    }

    logger.info('import.waypoints.complete', {
      journeyId,
      imported,
      failed
    });

    return c.json({
      success: failed === 0,
      message: `Imported ${imported} waypoints`,
      stats: {
        processed: waypoints.length,
        imported,
        skipped,
        failed,
        duration
      },
      errors: errors.slice(0, 10)
    });
  } catch (err: any) {
    logger.error('import.waypoints.error', { error: err.message, stack: err.stack });
    return c.json({
      success: false,
      error: 'Import failed',
      message: err.message || String(err)
    }, 500);
  }
});

/**
 * GET /api/v1/import/history
 *
 * Get import history/audit log
 */
importRouter.get('/history', async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 500);
  }

  // Check authentication
  const authError = await verifyAuth(c);
  if (authError) return authError;

  try {
    const journeyId = c.req.query('journeyId') || 'continental-usa-2025';
    const limit = Math.min(100, parseInt(c.req.query('limit') || '50', 10));

    const results = await db.prepare(`
      SELECT id, journey_id, import_type, import_source, filename,
             records_processed, records_imported, records_skipped, records_failed,
             status, duration_ms, started_at, completed_at
      FROM import_audit
      WHERE journey_id = ?
      ORDER BY started_at DESC
      LIMIT ?
    `).bind(journeyId, limit).all();

    return c.json({
      success: true,
      imports: results.results || [],
      count: (results.results || []).length
    });
  } catch (err: any) {
    logger.error('import.history.error', { error: err.message });
    return c.json({
      success: false,
      error: 'Failed to fetch import history',
      message: err.message || String(err)
    }, 500);
  }
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Update journey aggregates after import
 */
async function updateJourneyAggregates(db: D1Database, journeyId: string): Promise<void> {
  try {
    // Calculate total miles and drives from segments
    const segmentStats = await db.prepare(`
      SELECT
        COUNT(*) as total_segments,
        COALESCE(SUM(distance_miles), 0) as total_miles,
        COALESCE(SUM(energy_used_kwh), 0) as total_energy
      FROM drive_segments
      WHERE journey_id = ?
    `).bind(journeyId).first();

    // Calculate total charges from energy events
    const energyStats = await db.prepare(`
      SELECT
        COUNT(*) as total_charges,
        COALESCE(SUM(cost_usd), 0) as total_cost
      FROM energy_events
      WHERE journey_id = ? AND event_type = 'charge'
    `).bind(journeyId).first();

    // Calculate efficiency
    const totalMiles = Number((segmentStats as any)?.total_miles || 0);
    const totalEnergy = Number((segmentStats as any)?.total_energy || 0);
    const efficiency = totalEnergy > 0 ? totalMiles / totalEnergy : 0;

    // Update journey record
    await db.prepare(`
      UPDATE journeys
      SET total_miles = ?,
          total_drives = ?,
          total_charges = ?,
          total_energy_used_kwh = ?,
          total_cost_usd = ?,
          overall_efficiency_miles_per_kwh = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      totalMiles,
      (segmentStats as any)?.total_segments || 0,
      (energyStats as any)?.total_charges || 0,
      totalEnergy,
      (energyStats as any)?.total_cost || 0,
      efficiency,
      journeyId
    ).run();

    logger.info('journey.aggregates.updated', {
      journeyId,
      totalMiles,
      totalDrives: (segmentStats as any)?.total_segments,
      totalCharges: (energyStats as any)?.total_charges
    });
  } catch (err: any) {
    logger.error('journey.aggregates.error', { journeyId, error: err.message });
    // Don't throw - this is a best-effort update
  }
}
