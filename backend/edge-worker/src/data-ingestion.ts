/**
 * Tesla Data Ingestion Service
 * Structured API calls to populate D1 database with real-time Tessie data
 * Runs on cron schedule
 */

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

interface TessieConfig {
  apiKey: string;
  baseUrl: string;
  vehicleVin: string;
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

  constructor(db: D1Database, tessieApiKey: string, vehicleVin: string) {
    this.db = db;
    this.config = {
      apiKey: tessieApiKey,
      baseUrl: 'https://api.tessie.com',
      vehicleVin: vehicleVin
    };
  }

  /**
   * Main ingestion orchestrator - runs all data collection
   */
  async ingestAllData(): Promise<IngestionResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let totalRecords = 0;

    console.log('🚀 Starting Tesla data ingestion...');

    try {
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
      console.log(`✅ Data ingestion completed in ${duration}ms`);
      console.log(`📊 Total records processed: ${totalRecords}`);

      return {
        success: errors.length === 0,
        recordsProcessed: totalRecords,
        errors,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Data ingestion failed:', error);
      return {
        success: false,
        recordsProcessed: totalRecords,
        errors: [error.message],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Ingest current vehicle state (battery, location, etc.)
   */
  async ingestVehicleState(): Promise<IngestionResult> {
    console.log('📡 Ingesting current vehicle state...');
    
    try {
      const stateData = await this.callTessieAPI(`/${this.config.vehicleVin}/state`);
      
      if (!stateData) {
        throw new Error('No vehicle state data received');
      }

      // Insert/update current vehicle state
      await this.db.prepare(`
        INSERT OR REPLACE INTO vehicle_states (
          vin, timestamp, battery_level, battery_range, charging_state,
          latitude, longitude, heading, speed, odometer,
          inside_temp, outside_temp, locked, climate_on,
          raw_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        this.config.vehicleVin,
        new Date().toISOString(),
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
        stateData.vehicle_state?.locked || false,
        stateData.climate_state?.is_climate_on || false,
        JSON.stringify(stateData)
      ).run();

      console.log('✅ Vehicle state ingested successfully');
      return { success: true, recordsProcessed: 1, errors: [], timestamp: new Date().toISOString() };

    } catch (error) {
      console.error('❌ Vehicle state ingestion failed:', error);
      return { 
        success: false, 
        recordsProcessed: 0, 
        errors: [error.message], 
        timestamp: new Date().toISOString() 
      };
    }
  }

  /**
   * Ingest historical drives from Tessie API
   */
  async ingestHistoricalDrives(): Promise<IngestionResult> {
    console.log('🛣️ Ingesting historical drives...');
    
    try {
      // Get drives from last 30 days
      const thirtyDaysAgo = Math.floor((Date.now() - (30 * 24 * 60 * 60 * 1000)) / 1000);
      const now = Math.floor(Date.now() / 1000);
      
      const drivesData = await this.callTessieAPI(
        `/${this.config.vehicleVin}/drives?from=${thirtyDaysAgo}&to=${now}`
      );

      if (!drivesData?.results) {
        console.log('⚠️ No drives data received');
        return { success: true, recordsProcessed: 0, errors: [], timestamp: new Date().toISOString() };
      }

      let recordsProcessed = 0;
      const errors: string[] = [];

      for (const drive of drivesData.results) {
        try {
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
            this.config.vehicleVin,
            drive.started_at,
            drive.ended_at,
            drive.starting_location || 'Unknown',
            drive.ending_location || 'Unknown',
            drive.starting_latitude || 0,
            drive.starting_longitude || 0,
            drive.ending_latitude || 0,
            drive.ending_longitude || 0,
            drive.odometer_distance || 0,
            Math.round((drive.ended_at - drive.started_at) / 60),
            drive.starting_battery || 0,
            drive.ending_battery || 0,
            drive.energy_used || 0,
            drive.outside_temp || null
          ).run();

          recordsProcessed++;
        } catch (driveError) {
          errors.push(`Drive ${drive.id}: ${driveError.message}`);
        }
      }

      console.log(`✅ Processed ${recordsProcessed} drives`);
      return { 
        success: errors.length === 0, 
        recordsProcessed, 
        errors, 
        timestamp: new Date().toISOString() 
      };

    } catch (error) {
      console.error('❌ Drives ingestion failed:', error);
      return { 
        success: false, 
        recordsProcessed: 0, 
        errors: [error.message], 
        timestamp: new Date().toISOString() 
      };
    }
  }

  /**
   * Ingest historical charge session data from Tessie API
   */
  async ingestHistoricalCharges(): Promise<IngestionResult> {
    console.log('⚡ Ingesting historical charges...');
    
    try {
      // Get charges from last 30 days
      const thirtyDaysAgo = Math.floor((Date.now() - (30 * 24 * 60 * 60 * 1000)) / 1000);
      const now = Math.floor(Date.now() / 1000);
      
      const chargesData = await this.callTessieAPI(
        `/${this.config.vehicleVin}/charges?from=${thirtyDaysAgo}&to=${now}`
      );

      if (!chargesData?.results) {
        console.log('⚠️ No charges data received');
        return { success: true, recordsProcessed: 0, errors: [], timestamp: new Date().toISOString() };
      }

      let recordsProcessed = 0;
      const errors: string[] = [];

      for (const charge of chargesData.results) {
        try {
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
            this.config.vehicleVin,
            charge.started_at,
            charge.ended_at,
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
          errors.push(`Charge ${charge.id}: ${chargeError instanceof Error ? chargeError.message : String(chargeError)}`);
        }
      }

      console.log(`✅ Processed ${recordsProcessed} charges`);
      return { 
        success: errors.length === 0, 
        recordsProcessed, 
        errors, 
        timestamp: new Date().toISOString() 
      };

    } catch (error) {
      console.error('❌ Charges ingestion failed:', error);
      return { 
        success: false, 
        recordsProcessed: 0, 
        errors: [error instanceof Error ? error.message : String(error)], 
        timestamp: new Date().toISOString() 
      };
    }
  }

  /**
   * Update journey metadata and statistics
   */
  private async updateJourneyMetadata(): Promise<void> {
    console.log('📊 Updating journey metadata...');

    try {
      // Calculate journey statistics from actual data
      const stats = await this.db.prepare(`
        SELECT 
          COUNT(DISTINCT d.id) as total_drives,
          COALESCE(SUM(d.distance_miles), 0) as total_miles,
          COUNT(DISTINCT CASE 
            WHEN d.start_address LIKE '%,%' 
            THEN 
              CASE 
                WHEN INSTR(d.start_address, ',') > 0 
                THEN TRIM(SUBSTR(d.start_address, INSTR(d.start_address, ',') + 1))
                ELSE 'Unknown'
              END
          END) as states_visited,
          MIN(d.started_at) as journey_start,
          MAX(d.ended_at) as journey_end
        FROM drives d 
        WHERE d.journey_id = 'continental-usa-2025'
      `).first();

      // Ensure vehicle record exists first
      await this.db.prepare(`
        INSERT OR IGNORE INTO vehicles (
          id, vin, display_name, model, year, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        this.config.vehicleVin,
        this.config.vehicleVin,
        'Tesla Model S',
        'Model S',
        2023,
        new Date().toISOString(),
        new Date().toISOString()
      ).run();

      // Update journey record with vehicle_id
      await this.db.prepare(`
        INSERT OR REPLACE INTO journeys (
          id, vehicle_id, name, start_date, end_date, total_miles, 
          states_visited, total_drives, status, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'continental-usa-2025',
        this.config.vehicleVin,  // Add required vehicle_id
        'A Whittle Wandering - Continental USA',
        stats.journey_start || new Date().toISOString(),
        stats.journey_end || new Date().toISOString(),
        stats.total_miles || 0,
        stats.states_visited || 0,
        stats.total_drives || 0,
        'active',
        new Date().toISOString()
      ).run();

      console.log('✅ Journey metadata updated');
    } catch (error) {
      console.error('❌ Journey metadata update failed:', error);
      throw error;
    }
  }

  /**
   * Make authenticated API call to Tessie
   */
  private async callTessieAPI(endpoint: string): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Tessie API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Health check - verify API connectivity and database access
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      // Test Tessie API connectivity
      const vehicleData = await this.callTessieAPI(`/${this.config.vehicleVin}`);
      
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
}
