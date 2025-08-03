/**
 * Cron-Based Data Ingestion Controller
 * Scheduled endpoints for regular Tesla data updates
 */

import { TeslaDataIngestion } from './data-ingestion';

// Cloudflare D1 Database interface
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1ExecResult>;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
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

export class CronDataController {
  private ingestion: TeslaDataIngestion;
  private db: D1Database;

  constructor(db: D1Database, tessieApiKey: string, vehicleVin: string) {
    this.db = db;
    this.ingestion = new TeslaDataIngestion(db, tessieApiKey, vehicleVin);
  }

  /**
   * Full data sync - runs every 30 minutes
   * Comprehensive update of all Tesla data
   */
  async fullDataSync(): Promise<Response> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Starting scheduled full data sync...');
      
      const result = await this.ingestion.ingestAllData();
      const duration = Date.now() - startTime;

      // Log the operation
      await this.logIngestionOperation('full_sync', result, duration);

      return new Response(JSON.stringify({
        success: result.success,
        operation: 'full_sync',
        recordsProcessed: result.recordsProcessed,
        duration: `${duration}ms`,
        errors: result.errors,
        timestamp: result.timestamp,
        scheduledBy: 'cron'
      }), {
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      await this.logIngestionOperation('full_sync', {
        success: false,
        recordsProcessed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString()
      }, duration);

      return new Response(JSON.stringify({
        success: false,
        operation: 'full_sync',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}ms`,
        scheduledBy: 'cron'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Quick vehicle state update - runs every 5 minutes
   * Updates current location, battery, etc.
   */
  async quickStateUpdate(): Promise<Response> {
    const startTime = Date.now();
    
    try {
      console.log('⚡ Starting quick vehicle state update...');
      
      const result = await this.ingestion.ingestVehicleState();
      const duration = Date.now() - startTime;

      // Log the operation
      await this.logIngestionOperation('vehicle_state', result, duration);

      return new Response(JSON.stringify({
        success: result.success,
        operation: 'quick_state_update',
        recordsProcessed: result.recordsProcessed,
        duration: `${duration}ms`,
        errors: result.errors,
        timestamp: result.timestamp,
        scheduledBy: 'cron'
      }), {
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      return new Response(JSON.stringify({
        success: false,
        operation: 'quick_state_update',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}ms`,
        scheduledBy: 'cron'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Historical data backfill - runs daily
   * Ensures we have complete historical data
   */
  async historicalBackfill(): Promise<Response> {
    const startTime = Date.now();
    
    try {
      console.log('📚 Starting historical data backfill...');
      
      // Get last 7 days of data to ensure completeness
      const sevenDaysAgo = Math.floor((Date.now() - (7 * 24 * 60 * 60 * 1000)) / 1000);
      const now = Math.floor(Date.now() / 1000);
      
      const drivesResult = await this.ingestion.ingestHistoricalDrives();
      const chargesResult = await this.ingestion.ingestHistoricalCharges();
      
      const totalRecords = drivesResult.recordsProcessed + chargesResult.recordsProcessed;
      const allErrors = [...drivesResult.errors, ...chargesResult.errors];
      const success = drivesResult.success && chargesResult.success;
      
      const duration = Date.now() - startTime;

      // Log the operation
      await this.logIngestionOperation('historical_backfill', {
        success,
        recordsProcessed: totalRecords,
        errors: allErrors,
        timestamp: new Date().toISOString()
      }, duration);

      return new Response(JSON.stringify({
        success,
        operation: 'historical_backfill',
        recordsProcessed: totalRecords,
        breakdown: {
          drives: drivesResult.recordsProcessed,
          charges: chargesResult.recordsProcessed
        },
        duration: `${duration}ms`,
        errors: allErrors,
        scheduledBy: 'cron'
      }), {
        status: success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      return new Response(JSON.stringify({
        success: false,
        operation: 'historical_backfill',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}ms`,
        scheduledBy: 'cron'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Data quality check - runs hourly
   * Validates data integrity and flags issues
   */
  async dataQualityCheck(): Promise<Response> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Starting data quality check...');
      
      const issues: string[] = [];
      const stats: any = {};

      // Check for data gaps
      const latestDrive = await this.db.prepare(`
        SELECT MAX(started_at) as latest FROM drives WHERE journey_id = 'continental-usa-2025'
      `).first();

      const latestCharge = await this.db.prepare(`
        SELECT MAX(started_at) as latest FROM charges WHERE journey_id = 'continental-usa-2025'
      `).first();

      const latestState = await this.db.prepare(`
        SELECT MAX(timestamp) as latest FROM vehicle_states
      `).first();

      // Check if data is too old (more than 2 hours)
      const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
      
      if (!latestState?.latest || latestState.latest < twoHoursAgo) {
        issues.push('Vehicle state data is stale (>2 hours old)');
      }

      // Check for duplicate records
      const duplicateDrives = await this.db.prepare(`
        SELECT COUNT(*) as count FROM (
          SELECT started_at, ended_at, COUNT(*) as dup_count
          FROM drives 
          GROUP BY started_at, ended_at 
          HAVING dup_count > 1
        )
      `).first();

      if (duplicateDrives?.count > 0) {
        issues.push(`Found ${duplicateDrives.count} duplicate drive records`);
      }

      // Get data statistics
      stats.totalDrives = await this.db.prepare(`
        SELECT COUNT(*) as count FROM drives WHERE journey_id = 'continental-usa-2025'
      `).first();

      stats.totalCharges = await this.db.prepare(`
        SELECT COUNT(*) as count FROM charges WHERE journey_id = 'continental-usa-2025'
      `).first();

      stats.dataFreshness = {
        latestDrive: latestDrive?.latest,
        latestCharge: latestCharge?.latest,
        latestState: latestState?.latest
      };

      const duration = Date.now() - startTime;
      const success = issues.length === 0;

      // Log the quality check
      await this.logIngestionOperation('data_quality_check', {
        success,
        recordsProcessed: 0,
        errors: issues,
        timestamp: new Date().toISOString()
      }, duration);

      return new Response(JSON.stringify({
        success,
        operation: 'data_quality_check',
        issues,
        statistics: stats,
        duration: `${duration}ms`,
        scheduledBy: 'cron'
      }), {
        status: success ? 200 : 200, // Always return 200 for quality checks
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      return new Response(JSON.stringify({
        success: false,
        operation: 'data_quality_check',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}ms`,
        scheduledBy: 'cron'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * AI/ML data processing - runs every 6 hours
   * Processes raw data for intelligent insights
   */
  async aiDataProcessing(): Promise<Response> {
    const startTime = Date.now();
    
    try {
      console.log('🤖 Starting AI/ML data processing...');
      
      let processedComponents = 0;
      const errors: string[] = [];

      // 1. Route Analysis
      try {
        await this.processRouteAnalysis();
        processedComponents++;
      } catch (error) {
        errors.push(`Route Analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // 2. Efficiency Trends
      try {
        await this.processEfficiencyTrends();
        processedComponents++;
      } catch (error) {
        errors.push(`Efficiency Trends: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // 3. Charging Patterns
      try {
        await this.processChargingPatterns();
        processedComponents++;
      } catch (error) {
        errors.push(`Charging Patterns: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      const duration = Date.now() - startTime;
      const success = errors.length === 0;

      await this.logIngestionOperation('ai_processing', {
        success,
        recordsProcessed: processedComponents,
        errors,
        timestamp: new Date().toISOString()
      }, duration);

      return new Response(JSON.stringify({
        success,
        operation: 'ai_data_processing',
        componentsProcessed: processedComponents,
        duration: `${duration}ms`,
        errors,
        scheduledBy: 'cron'
      }), {
        status: success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      return new Response(JSON.stringify({
        success: false,
        operation: 'ai_data_processing',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}ms`,
        scheduledBy: 'cron'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Log ingestion operation for monitoring
   */
  private async logIngestionOperation(
    operation: string, 
    result: any, 
    durationMs: number
  ): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO ingestion_logs 
        (operation, records_processed, success, errors, duration_ms)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        operation,
        result.recordsProcessed || 0,
        result.success,
        JSON.stringify(result.errors || []),
        durationMs
      ).run();
    } catch (error) {
      console.error('Failed to log ingestion operation:', error);
    }
  }

  /**
   * AI Processing Methods
   */
  private async processRouteAnalysis(): Promise<void> {
    // Analyze route efficiency and patterns
    const routeData = await this.db.prepare(`
      SELECT 
        d.*,
        LAG(end_latitude) OVER (ORDER BY started_at) as prev_lat,
        LAG(end_longitude) OVER (ORDER BY started_at) as prev_lng
      FROM drives d 
      WHERE d.journey_id = 'continental-usa-2025' 
      ORDER BY started_at
    `).all();

    // Calculate route complexity and cache result
    const analysis = {
      totalSegments: routeData.results?.length || 0,
      avgDistance: routeData.results?.reduce((sum: number, d: any) => sum + (d.distance_miles || 0), 0) / (routeData.results?.length || 1),
      routeComplexity: 'calculated', // Would implement actual complexity algorithm
      lastUpdated: new Date().toISOString()
    };

    await this.db.prepare(`
      INSERT OR REPLACE INTO component_cache 
      (id, component_name, cache_key, data, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      'route_analysis_current',
      'route_analysis',
      'continental-usa-2025',
      JSON.stringify(analysis),
      new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours
    ).run();
  }

  private async processEfficiencyTrends(): Promise<void> {
    // Calculate efficiency trends over time
    const efficiencyData = await this.db.prepare(`
      SELECT 
        DATE(started_at) as drive_date,
        AVG(efficiency_score) as avg_efficiency,
        COUNT(*) as drive_count,
        SUM(distance_miles) as total_miles
      FROM drives 
      WHERE journey_id = 'continental-usa-2025' 
        AND efficiency_score IS NOT NULL
      GROUP BY DATE(started_at)
      ORDER BY drive_date
    `).all();

    const trends = {
      dailyEfficiency: efficiencyData.results || [],
      overallTrend: 'stable', // Would implement trend analysis
      lastUpdated: new Date().toISOString()
    };

    await this.db.prepare(`
      INSERT OR REPLACE INTO component_cache 
      (id, component_name, cache_key, data, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      'efficiency_trends_current',
      'efficiency_trends',
      'continental-usa-2025',
      JSON.stringify(trends),
      new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
    ).run();
  }

  private async processChargingPatterns(): Promise<void> {
    // Analyze charging behavior and patterns
    const chargingData = await this.db.prepare(`
      SELECT 
        charger_type,
        AVG(charging_efficiency) as avg_efficiency,
        AVG(cost_per_kwh) as avg_cost_per_kwh,
        COUNT(*) as session_count,
        SUM(energy_added_kwh) as total_energy
      FROM charges 
      WHERE journey_id = 'continental-usa-2025'
        AND charging_efficiency IS NOT NULL
      GROUP BY charger_type
    `).all();

    const patterns = {
      byChargerType: chargingData.results || [],
      totalSessions: chargingData.results?.reduce((sum: number, c: any) => sum + (c.session_count || 0), 0) || 0,
      lastUpdated: new Date().toISOString()
    };

    await this.db.prepare(`
      INSERT OR REPLACE INTO component_cache 
      (id, component_name, cache_key, data, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      'charging_patterns_current',
      'charging_patterns',
      'continental-usa-2025',
      JSON.stringify(patterns),
      new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
    ).run();
  }
}
