/**
 * Tesla Data Ingestion Service
 * Structured API calls to populate D1 database with real-time Tessie data
 * Runs on cron schedule
 */

import { z } from 'zod';
import { logger } from './utils/log';
import { detectStateFromCoordinates, updateStatesVisited } from './services/state-detection';

// Cloudflare D1 Database interface
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1ExecResult>;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}

/**
 * Helper to extract error message from unknown error types
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = any>(): Promise<D1Result<T>>;
}

interface D1Result<T = any> {
  results?: T[];
  success: boolean;
  error?: string;
  meta: {
    duration: number;
    size_after: number;
    rows_read: number;
    rows_written: number;
  };
}

interface D1ExecResult {
  count: number;
  duration: number;
}

interface TessieConfig {
  apiKey: string;
  baseUrl: string;
  vehicleIdOrVin: string;
}

interface IngestionResult {
  success: boolean;
  recordsProcessed: number;
  errors: string[];
  timestamp: string;
}

export class TeslaDataIngestion {
  private config: TessieConfig;
  private db: D1Database;
  private rateLimitTracker: { recordRequest(provider: string, success: boolean, latencyMs: number, errorCode?: string): Promise<void> } | null;

  constructor(db: D1Database, tessieApiKey: string, vehicleIdOrVin: string) {
    this.db = db;
    this.rateLimitTracker = null;
    this.config = {
      apiKey: tessieApiKey,
      baseUrl: 'https://api.tessie.com',
      vehicleIdOrVin: String(vehicleIdOrVin || '').trim() || '5YJYGDEE5LF027324'
    };

    // Wire into ApiRateLimitTracker if DB is available (best-effort)
    try {
      // Lazy-import to avoid circular dependency; tracker uses same D1 table.
      const { ApiRateLimitTracker } = require('./services/apiRateLimitTracker');
      this.rateLimitTracker = new ApiRateLimitTracker(db);
    } catch {
      // Tracker unavailable — continue without usage recording
    }
  }

  private normalizeIso(ts: unknown): string | null {
    if (ts == null) return null;
    if (typeof ts === 'number') {
      // Tessie often returns unix seconds, but may also return milliseconds
      // If number is > 1e12, it's likely milliseconds; otherwise seconds
      const ms = ts < 1e12 ? ts * 1000 : ts;
      const date = new Date(ms);
      if (isNaN(date.getTime())) return null;
      return date.toISOString();
    }
    if (typeof ts === 'string') {
      const n = Number(ts);
      // Match 9-13 digits: Unix seconds (9-12) or milliseconds (13)
      if (!Number.isNaN(n) && /^\d{9,13}$/.test(ts)) {
        const ms = ts.length === 13 ? n : n * 1000;
        const date = new Date(ms);
        if (isNaN(date.getTime())) return null;
        return date.toISOString();
      }
      const d = new Date(ts);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
    return null;
  }

  private async ensureVehicleAndJourney(): Promise<void> {
    // Ensure baseline records exist and map the configured VIN/vehicle identifier.
    const vin = this.config.vehicleIdOrVin || '5YJYGDEE5LF027324';
    const now = new Date().toISOString();

    // Avoid INSERT OR REPLACE on vehicles: it can delete+reinsert and violate FKs.
    await this.db.prepare(
      `INSERT OR IGNORE INTO vehicles (id, vin, display_name, model, year, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind('midnight-shadow', vin, 'Midnight Shadow', 'Model Y', 2023, now, now).run();
    await this.db.prepare(
      `UPDATE vehicles SET vin = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(vin, 'midnight-shadow').run();

    await this.db.prepare(
      `INSERT OR IGNORE INTO journeys (id, vehicle_id, name, description, start_date, target_states, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      'continental-usa-2025',
      'midnight-shadow',
      'A Whittle Wandering - Continental USA',
      '48 Continental States Tesla Model Y Road Trip Adventure',
      '2025-06-01',
      48,
      'active',
      now,
      now
    ).run();
  }



  /**
   * Main ingestion orchestrator - runs all data collection
   */
  async ingestAllData(): Promise<IngestionResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let totalRecords = 0;

    logger.info('Starting Tesla data ingestion');

    try {
      await this.ensureVehicleAndJourney();

      // 1. Current vehicle state (real-time)
      const stateResult = await this.ingestVehicleState();
      totalRecords += stateResult.recordsProcessed;
      if (!stateResult.success) errors.push(...stateResult.errors);

      // 2. Historical drives (past 30 days)
      const drivesResult = await this.ingestHistoricalDrives();
      totalRecords += drivesResult.recordsProcessed;
      if (!drivesResult.success) errors.push(...drivesResult.errors);

      // 3. Historical charges (past 30 days)
      const chargesResult = await this.ingestHistoricalCharges();
      totalRecords += chargesResult.recordsProcessed;
      if (!chargesResult.success) errors.push(...chargesResult.errors);

      // 4. Update journey metadata
      await this.updateJourneyMetadata();

      const duration = Date.now() - startTime;
      logger.info('Data ingestion completed', { duration: `${duration}ms`, recordsProcessed: totalRecords });

      return {
        success: errors.length === 0,
        recordsProcessed: totalRecords,
        errors,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Data ingestion failed', { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        recordsProcessed: totalRecords,
        errors: [extractErrorMessage(error)],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Ingest current vehicle state (battery, location, etc.)
   */
  async ingestVehicleState(): Promise<IngestionResult> {
    logger.info('Ingesting current vehicle state');
    
    try {
      await this.ensureVehicleAndJourney();
      const stateData = await this.callTessieAPI(`/${this.config.vehicleIdOrVin}/state`);
      
      if (!stateData) {
        throw new Error('No vehicle state data received');
      }

      const nowIso = new Date().toISOString();

      // Insert/update current vehicle state (single row per vehicle_id)
      await this.db.prepare(`
        INSERT OR REPLACE INTO vehicle_state (
          vehicle_id, vin, battery_level, battery_range, charging_state,
          latitude, longitude, heading, speed, odometer,
          inside_temp, outside_temp, power, locked, climate_on, shift_state,
          timestamp, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        'midnight-shadow',
        this.config.vehicleIdOrVin || '5YJYGDEE5LF027324',
        stateData.charge_state?.battery_level || 0,
        stateData.charge_state?.battery_range || 0,
        stateData.charge_state?.charging_state || 'Unknown',
        stateData.drive_state?.latitude || 0,
        stateData.drive_state?.longitude || 0,
        stateData.drive_state?.heading || 0,
        stateData.drive_state?.speed || 0,
        stateData.vehicle_state?.odometer || 0,
        stateData.climate_state?.inside_temp || null,
        stateData.climate_state?.outside_temp || null,
        stateData.charge_state?.charger_power || 0,
        stateData.vehicle_state?.locked || false,
        stateData.climate_state?.is_climate_on || false,
        stateData.drive_state?.shift_state || null,
        nowIso
      ).run();

      // Append to history table for analytics (best-effort)
      try {
        await this.db.prepare(`
          INSERT INTO vehicle_state_history (
            vehicle_id, vin, battery_level, battery_range, charging_state,
            latitude, longitude, heading, speed, odometer,
            inside_temp, outside_temp, power, timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          'midnight-shadow',
          this.config.vehicleIdOrVin || '5YJYGDEE5LF027324',
          stateData.charge_state?.battery_level || 0,
          stateData.charge_state?.battery_range || 0,
          stateData.charge_state?.charging_state || 'Unknown',
          stateData.drive_state?.latitude || 0,
          stateData.drive_state?.longitude || 0,
          stateData.drive_state?.heading || 0,
          stateData.drive_state?.speed || 0,
          stateData.vehicle_state?.odometer || 0,
          stateData.climate_state?.inside_temp || null,
          stateData.climate_state?.outside_temp || null,
          stateData.charge_state?.charger_power || 0,
          nowIso
        ).run();
      } catch (e) {
        // ignore history write failure
      }

      logger.info('Vehicle state ingested successfully');
      return { success: true, recordsProcessed: 1, errors: [], timestamp: new Date().toISOString() };

    } catch (error) {
      logger.error('Vehicle state ingestion failed', { error: error instanceof Error ? error.message : String(error) });
      return { 
        success: false, 
        recordsProcessed: 0, 
        errors: [extractErrorMessage(error)], 
        timestamp: new Date().toISOString() 
      };
    }
  }

  /**
   * Ingest historical drives from Tessie API
   */
  async ingestHistoricalDrives(): Promise<IngestionResult> {
    logger.info('Ingesting historical drives');
    
    try {
      await this.ensureVehicleAndJourney();
      // Get drives from last 30 days
      const thirtyDaysAgo = Math.floor((Date.now() - (30 * 24 * 60 * 60 * 1000)) / 1000);
      const now = Math.floor(Date.now() / 1000);
      
      const drivesData = await this.callTessieAPI(
        `/${this.config.vehicleIdOrVin}/drives?from=${thirtyDaysAgo}&to=${now}`
      );

      const driveResults = Array.isArray((drivesData as any)?.results)
        ? (drivesData as any).results
        : (Array.isArray(drivesData) ? drivesData : []);
      if (!driveResults.length) {
        logger.warn('No drives data received');
        return { success: true, recordsProcessed: 0, errors: [], timestamp: new Date().toISOString() };
      }

      let recordsProcessed = 0;
      const errors: string[] = [];

      for (const drive of driveResults) {
        try {
          const startedAt = this.normalizeIso(drive.started_at);
          
          // If started_at cannot be parsed, skip this drive with error
          if (!startedAt) {
            errors.push(`Drive ${drive.id}: Invalid started_at timestamp: ${drive.started_at}`);
            continue;
          }

          let endedAt = this.normalizeIso(drive.ended_at);
          let durationMinutes: number | undefined;

          // Handle invalid ended_at timestamp
          if (!endedAt) {
            // Try to calculate ended_at from raw timestamps if both are numeric
            if (typeof drive.started_at === 'number' && typeof drive.ended_at === 'number') {
              // Calculate duration from raw timestamps (handles both seconds and milliseconds)
              const startMs = drive.started_at < 1e12 ? drive.started_at * 1000 : drive.started_at;
              const endMs = drive.ended_at < 1e12 ? drive.ended_at * 1000 : drive.ended_at;
              const calculatedEnd = new Date(endMs);
              if (!isNaN(calculatedEnd.getTime()) && endMs > startMs) {
                endedAt = calculatedEnd.toISOString();
                durationMinutes = Math.round((endMs - startMs) / 60000);
                logger.warn(`Drive ${drive.id}: Reconstructed ended_at from raw timestamps`);
              }
            }
            
            // If still no ended_at, try to use duration_minutes from API if available
            if (!endedAt && drive.ended_at && drive.started_at) {
              // Calculate duration from raw difference
              const rawDuration = typeof drive.ended_at === 'number' && typeof drive.started_at === 'number'
                ? Math.round((drive.ended_at - drive.started_at) / 60)
                : null;
              
              if (rawDuration !== null && rawDuration > 0) {
                const startDate = new Date(startedAt);
                const calculatedEndDate = new Date(startDate.getTime() + (rawDuration * 60000));
                endedAt = calculatedEndDate.toISOString();
                durationMinutes = rawDuration;
                logger.warn(`Drive ${drive.id}: Calculated ended_at from duration (${rawDuration} minutes)`);
              }
            }
            
            // Last resort: if we have valid started_at but no way to calculate ended_at,
            // use started_at (but log as error - this indicates data quality issue)
            if (!endedAt) {
              endedAt = startedAt;
              durationMinutes = 0;
              errors.push(`Drive ${drive.id}: Invalid ended_at timestamp, using started_at (data quality issue)`);
              logger.error(`Drive ${drive.id}: Cannot parse ended_at (${drive.ended_at}), defaulting to started_at. This corrupts timeline data.`);
            }
          }

          // Calculate duration from normalized timestamps if not already calculated
          if (durationMinutes === undefined) {
            durationMinutes = Math.round(
              (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000
            );
          }
          
          await this.db.prepare(`
            INSERT OR REPLACE INTO drives (
              tessie_id, journey_id, vehicle_id, started_at, ended_at,
              start_address, end_address, start_latitude, start_longitude,
              end_latitude, end_longitude, distance_miles, duration_minutes,
              start_battery_level, end_battery_level, energy_used_kwh,
              outside_temp_avg
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            drive.id,
            'continental-usa-2025',
            'midnight-shadow',
            startedAt,
            endedAt,
            drive.starting_location || 'Unknown',
            drive.ending_location || 'Unknown',
            drive.starting_latitude || 0,
            drive.starting_longitude || 0,
            drive.ending_latitude || 0,
            drive.ending_longitude || 0,
            drive.odometer_distance || 0,
            durationMinutes,
            drive.starting_battery || 0,
            drive.ending_battery || 0,
            drive.energy_used || 0,
            drive.outside_temp || null
          ).run();

          // Update state tracking for this drive
          try {
            // Check start location
            if (drive.starting_latitude && drive.starting_longitude) {
              const startState = await detectStateFromCoordinates(
                drive.starting_latitude,
                drive.starting_longitude
              );
              if (startState) {
                await updateStatesVisited(
                  this.db,
                  'continental-usa-2025',
                  startState.code,
                  startState.name,
                  drive.starting_latitude,
                  drive.starting_longitude,
                  drive.id
                );
              }
            }

            // Check end location if different from start
            if (drive.ending_latitude && drive.ending_longitude &&
                (drive.ending_latitude !== drive.starting_latitude ||
                 drive.ending_longitude !== drive.starting_longitude)) {
              const endState = await detectStateFromCoordinates(
                drive.ending_latitude,
                drive.ending_longitude
              );
              if (endState) {
                await updateStatesVisited(
                  this.db,
                  'continental-usa-2025',
                  endState.code,
                  endState.name,
                  drive.ending_latitude,
                  drive.ending_longitude,
                  drive.id
                );
              }
            }
          } catch (stateError) {
            logger.warn(`Failed to update state tracking for drive ${drive.id}`, {
              error: extractErrorMessage(stateError)
            });
          }

          recordsProcessed++;
        } catch (driveError) {
          errors.push(`Drive ${drive.id}: ${extractErrorMessage(driveError)}`);
        }
      }

      logger.info('Processed drives', { count: recordsProcessed });
      return { 
        success: errors.length === 0, 
        recordsProcessed, 
        errors, 
        timestamp: new Date().toISOString() 
      };

    } catch (error) {
      logger.error('Drives ingestion failed', { error: error instanceof Error ? error.message : String(error) });
      return { 
        success: false, 
        recordsProcessed: 0, 
        errors: [extractErrorMessage(error)], 
        timestamp: new Date().toISOString() 
      };
    }
  }

  /**
   * Ingest historical charge session data from Tessie API
   */
  async ingestHistoricalCharges(): Promise<IngestionResult> {
    logger.info('Ingesting historical charges');
    
    try {
      await this.ensureVehicleAndJourney();
      // Get charges from last 30 days
      const thirtyDaysAgo = Math.floor((Date.now() - (30 * 24 * 60 * 60 * 1000)) / 1000);
      const now = Math.floor(Date.now() / 1000);
      
      const chargesData = await this.callTessieAPI(
        `/${this.config.vehicleIdOrVin}/charges?from=${thirtyDaysAgo}&to=${now}`
      );

      const chargeResults = Array.isArray((chargesData as any)?.results)
        ? (chargesData as any).results
        : (Array.isArray(chargesData) ? chargesData : []);
      if (!chargeResults.length) {
        logger.warn('No charges data received');
        return { success: true, recordsProcessed: 0, errors: [], timestamp: new Date().toISOString() };
      }

      let recordsProcessed = 0;
      const errors: string[] = [];

      for (const charge of chargeResults) {
        try {
          const startedAt = this.normalizeIso(charge.started_at);
          
          // If started_at cannot be parsed, skip this charge with error
          if (!startedAt) {
            errors.push(`Charge ${charge.id}: Invalid started_at timestamp: ${charge.started_at}`);
            continue;
          }

          // ended_at may be null for ongoing charges, but if provided and invalid, handle it
          let endedAt = this.normalizeIso(charge.ended_at);
          if (charge.ended_at && !endedAt) {
            // Try to calculate from raw timestamps if both are numeric
            if (typeof charge.started_at === 'number' && typeof charge.ended_at === 'number') {
              const startMs = charge.started_at < 1e12 ? charge.started_at * 1000 : charge.started_at;
              const endMs = charge.ended_at < 1e12 ? charge.ended_at * 1000 : charge.ended_at;
              const calculatedEnd = new Date(endMs);
              if (!isNaN(calculatedEnd.getTime())) {
                endedAt = calculatedEnd.toISOString();
                logger.warn(`Charge ${charge.id}: Reconstructed ended_at from raw timestamps`);
              }
            }
            
            // If still invalid and we have a value, log error but allow null (ongoing charge)
            if (!endedAt && charge.ended_at) {
              errors.push(`Charge ${charge.id}: Invalid ended_at timestamp: ${charge.ended_at}, treating as ongoing`);
            }
          }
          
          await this.db.prepare(`
            INSERT OR REPLACE INTO charges (
              tessie_id, journey_id, vehicle_id, started_at, ended_at,
              location, latitude, longitude, energy_added_kwh,
              cost_usd, start_battery_level, end_battery_level,
              charger_type, charger_power_kw
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            charge.id,
            'continental-usa-2025',
            'midnight-shadow',
            startedAt,
            endedAt,
            charge.location || 'Unknown',
            charge.latitude || 0,
            charge.longitude || 0,
            charge.energy_added || 0,
            charge.cost || 0,
            charge.starting_battery || 0,
            charge.ending_battery || 0,
            charge.charger_type || null,
            charge.charger_power || null
          ).run();
          recordsProcessed++;
        } catch (chargeError) {
          errors.push(`Charge ${charge.id}: ${extractErrorMessage(chargeError)}`);
        }
      }

      logger.info('Processed charges', { count: recordsProcessed });
      return { 
        success: errors.length === 0, 
        recordsProcessed, 
        errors, 
        timestamp: new Date().toISOString() 
      };

    } catch (error) {
      logger.error('Charges ingestion failed', { error: error instanceof Error ? error.message : String(error) });
      return { 
        success: false, 
        recordsProcessed: 0, 
        errors: [extractErrorMessage(error)], 
        timestamp: new Date().toISOString() 
      };
    }
  }

  /**
   * Update journey metadata and statistics
   */
  private async updateJourneyMetadata(): Promise<void> {
    logger.info('Updating journey metadata');

    try {
      // Calculate journey statistics from actual data
      const stats = await this.db.prepare(`
        SELECT 
          COUNT(DISTINCT d.id) as total_drives,
          COALESCE(SUM(d.distance_miles), 0) as total_miles,
          MIN(d.started_at) as journey_start,
          MAX(d.ended_at) as journey_end
        FROM drives d 
        WHERE d.journey_id = 'continental-usa-2025'
      `).first();

      const charges = await this.db.prepare(
        `SELECT COUNT(*) as total_charges, COALESCE(SUM(cost_usd), 0) as total_cost
         FROM charges WHERE journey_id = 'continental-usa-2025'`
      ).first();

      const statesVisited = await this.db.prepare(
        `SELECT COUNT(*) as cnt FROM states_visited WHERE journey_id = 'continental-usa-2025'`
      ).first();

      await this.db.prepare(
        `UPDATE journeys
         SET total_miles = ?,
             total_drives = ?,
             total_charges = ?,
             total_states = ?,
             total_cost_usd = ?,
             start_date = COALESCE(start_date, ?),
             end_date = ?,
             updated_at = datetime('now')
         WHERE id = ?`
      ).bind(
        (stats as any)?.total_miles || 0,
        (stats as any)?.total_drives || 0,
        (charges as any)?.total_charges || 0,
        (statesVisited as any)?.cnt || 0,
        (charges as any)?.total_cost || 0,
        (stats as any)?.journey_start || '2025-06-01',
        (stats as any)?.journey_end || null,
        'continental-usa-2025'
      ).run();

      logger.info('Journey metadata updated');
    } catch (error) {
      logger.error('Journey metadata update failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Make authenticated API call to Tessie
   */
  private async callTessieAPI(endpoint: string): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const headers = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json'
    } as const;

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const timeoutMs = 10_000;
    const maxAttempts = 3;

    let lastErr: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const callStart = Date.now();
      const controller = new AbortController();
      const to = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { headers, signal: controller.signal });
        clearTimeout(to);
        const latencyMs = Date.now() - callStart;

        // Retry on rate limiting / transient upstream errors
        if (!res.ok) {
          // Record the failed call
          await this.rateLimitTracker?.recordRequest('tessie', false, latencyMs, String(res.status)).catch(() => {});

          const shouldRetry = res.status === 429 || (res.status >= 500 && res.status <= 599);
          if (shouldRetry && attempt < maxAttempts) {
            let retryAfterMs = 0;
            const ra = res.headers.get('Retry-After');
            const raSec = ra ? Number(ra) : NaN;
            if (Number.isFinite(raSec) && raSec > 0) retryAfterMs = Math.min(30_000, Math.round(raSec * 1000));
            const backoffMs = Math.min(10_000, Math.round(250 * Math.pow(2, attempt - 1)));
            const jitterMs = Math.floor(Math.random() * 250);
            await sleep(Math.max(retryAfterMs, backoffMs + jitterMs));
            continue;
          }
          const body = await res.text().catch(() => '');
          throw new Error(`Tessie API error: ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 500)}` : ''}`);
        }

        // Record successful call
        const successLatency = Date.now() - callStart;
        await this.rateLimitTracker?.recordRequest('tessie', true, successLatency).catch(() => {});

        const json = await res.json();

        // Minimal runtime validation (external input is untrusted)
        if (endpoint.endsWith('/state')) {
          const stateSchema = z.object({
            charge_state: z.object({
              battery_level: z.number().optional(),
              battery_range: z.number().optional(),
              charging_state: z.string().optional(),
              charger_power: z.number().optional()
            }).optional(),
            drive_state: z.object({
              latitude: z.number().optional(),
              longitude: z.number().optional(),
              heading: z.number().optional(),
              speed: z.number().optional(),
              shift_state: z.string().optional()
            }).optional(),
            climate_state: z.object({
              inside_temp: z.number().optional(),
              outside_temp: z.number().optional(),
              is_climate_on: z.boolean().optional()
            }).optional(),
            vehicle_state: z.object({
              odometer: z.number().optional(),
              locked: z.boolean().optional()
            }).optional()
          }).passthrough();
          const parsed = stateSchema.safeParse(json);
          if (!parsed.success) throw new Error('Tessie state payload validation failed');
          return parsed.data;
        }

        if (endpoint.includes('/drives') || endpoint.includes('/charges')) {
          const listSchema = z.union([
            z.object({ results: z.array(z.any()) }).passthrough(),
            z.array(z.any())
          ]);
          const parsed = listSchema.safeParse(json);
          if (!parsed.success) throw new Error('Tessie list payload validation failed');
          return parsed.data;
        }

        return json;
      } catch (e) {
        clearTimeout(to);
        lastErr = e;
        // Abort/timeout should be retried if attempts remain
        if (attempt < maxAttempts) {
          const backoffMs = Math.min(10_000, Math.round(250 * Math.pow(2, attempt - 1)));
          const jitterMs = Math.floor(Math.random() * 250);
          await sleep(backoffMs + jitterMs);
          continue;
        }
      }
    }

    throw new Error(extractErrorMessage(lastErr));
  }

  /**
   * Health check - verify API connectivity and database access
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      // Test Tessie API connectivity
      const vehicleData = await this.callTessieAPI(`/${this.config.vehicleIdOrVin}`);
      
      // Test database connectivity
      const dbResult = await this.db.prepare('SELECT 1 as test').first();
      
      return {
        status: 'healthy',
        details: {
          tessie_api: 'connected',
          vehicle_found: !!vehicleData?.display_name,
          database: dbResult?.test === 1 ? 'connected' : 'error',
          last_check: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : String(error),
          last_check: new Date().toISOString()
        }
      };
    }
  }

  private extractErrorMessage(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error occurred';
  }
}