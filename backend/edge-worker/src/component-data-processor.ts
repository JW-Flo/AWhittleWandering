/**
 * Component Data Processor
 * Transforms raw Tessie API data into clean, component-ready data stored in D1
 * SAFE IMPLEMENTATION - Does not replace existing functionality
 */

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
  meta: any;
}

export class ComponentDataProcessor {
  private db: D1Database;
  private journeyId: string = 'continental-usa-2025';
  private vehicleId: string;

  constructor(db: D1Database, vehicleId: string) {
    this.db = db;
    this.vehicleId = vehicleId;
  }

  /**
   * SAFE: Process all component data without affecting existing APIs
   */
  async processAllComponentData(tessieData: any): Promise<void> {
    console.log('🔄 Processing component-ready data (SAFE MODE)...');

    try {
      await Promise.all([
        this.processJourneyOverview(tessieData),
        this.processCurrentStatus(tessieData),
        this.processStatesProgress(),
        this.processRecentDrives()
      ]);

      console.log('✅ Component data processing complete (SAFE)');
    } catch (error) {
      console.error('❌ Component processing failed (continuing safely):', error);
      // Don't throw - let existing system continue working
    }
  }

  /**
   * Process Journey Overview Component Data
   */
  private async processJourneyOverview(tessieData: any): Promise<void> {
    try {
      // Get journey statistics from database
      const stats = await this.db.prepare(`
        SELECT 
          COUNT(DISTINCT d.id) as total_drives,
          COALESCE(SUM(d.distance_miles), 0) as total_drive_miles,
          MIN(d.started_at) as journey_start,
          MAX(d.ended_at) as journey_end,
          COUNT(DISTINCT sv.state_name) as states_count
        FROM drives d 
        LEFT JOIN states_visited sv ON sv.journey_id = d.journey_id
        WHERE d.journey_id = ?
      `).bind(this.journeyId).first();

      // Calculate days elapsed
      const startDate = stats?.journey_start ? new Date(stats.journey_start) : new Date('2025-06-01');
      const daysElapsed = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Get current odometer from live data
      const currentOdometer = tessieData?.vehicle_state?.odometer || 0;
      
      // Calculate trip miles using SAFE calculation
      const estimatedStartOdometer = 65000; // Conservative estimate based on current data
      const tripMiles = Math.max(0, currentOdometer - estimatedStartOdometer);

      // Store processed overview data
      await this.db.prepare(`
        INSERT OR REPLACE INTO journey_overview (
          id, journey_id, total_miles, current_odometer, trip_miles,
          days_elapsed, states_visited_count, journey_start_date,
          journey_end_date, status, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        `${this.journeyId}-overview`,
        this.journeyId,
        Math.round(tripMiles),
        Math.round(currentOdometer),
        Math.round(stats?.total_drive_miles || 0),
        daysElapsed,
        stats?.states_count || 0,
        startDate.toISOString(),
        null, // Journey ongoing
        'active',
        new Date().toISOString()
      ).run();
    } catch (error) {
      console.error('Journey overview processing failed:', error);
    }
  }

  /**
   * Process Current Status Component Data
   */
  private async processCurrentStatus(tessieData: any): Promise<void> {
    try {
      // Parse current location safely
      let currentCity = 'Unknown';
      let currentState = 'Unknown';

      // Try to get location from latest drive if coordinates available
      if (tessieData?.drive_state?.latitude && tessieData?.drive_state?.longitude) {
        const latestDrive = await this.db.prepare(`
          SELECT end_address FROM drives 
          WHERE journey_id = ? 
          ORDER BY ended_at DESC 
          LIMIT 1
        `).bind(this.journeyId).first();

        if (latestDrive?.end_address) {
          const location = this.parseLocation(latestDrive.end_address);
          currentCity = location.city;
          currentState = location.state;
        }
      }

      // Convert temperatures to Fahrenheit safely
      const insideTempF = tessieData?.climate_state?.inside_temp ? 
        Math.round(tessieData.climate_state.inside_temp * 9/5 + 32) : null;
      const outsideTempF = tessieData?.climate_state?.outside_temp ? 
        Math.round(tessieData.climate_state.outside_temp * 9/5 + 32) : null;

      // Store processed current status
      await this.db.prepare(`
        INSERT OR REPLACE INTO current_status (
          id, vehicle_id, battery_level, battery_range, charging_status,
          current_speed, current_city, current_state, current_latitude,
          current_longitude, inside_temp_f, outside_temp_f, is_locked,
          is_climate_on, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        `${this.vehicleId}-status`,
        this.vehicleId,
        tessieData?.charge_state?.battery_level || 0,
        tessieData?.charge_state?.battery_range || 0,
        this.formatChargingStatus(tessieData?.charge_state?.charging_state),
        Math.round(tessieData?.drive_state?.speed || 0),
        currentCity,
        currentState,
        tessieData?.drive_state?.latitude || null,
        tessieData?.drive_state?.longitude || null,
        insideTempF,
        outsideTempF,
        tessieData?.vehicle_state?.locked || false,
        tessieData?.climate_state?.is_climate_on || false,
        new Date().toISOString()
      ).run();
    } catch (error) {
      console.error('Current status processing failed:', error);
    }
  }

  /**
   * Process States Progress Component Data
   */
  private async processStatesProgress(): Promise<void> {
    try {
      // Get unique states from drives with visit order
      const statesData = await this.db.prepare(`
        SELECT DISTINCT
          CASE 
            WHEN end_address LIKE '%Texas%' THEN 'Texas'
            WHEN end_address LIKE '%New Mexico%' THEN 'New Mexico'
            WHEN end_address LIKE '%Arizona%' THEN 'Arizona'
            WHEN end_address LIKE '%Utah%' THEN 'Utah'
            WHEN end_address LIKE '%Nevada%' THEN 'Nevada'
            WHEN end_address LIKE '%California%' THEN 'California'
            WHEN end_address LIKE '%Colorado%' THEN 'Colorado'
            WHEN end_address LIKE '%Wyoming%' THEN 'Wyoming'
            WHEN end_address LIKE '%Montana%' THEN 'Montana'
            WHEN end_address LIKE '%Idaho%' THEN 'Idaho'
            WHEN end_address LIKE '%Washington%' THEN 'Washington'
            WHEN end_address LIKE '%Oregon%' THEN 'Oregon'
            WHEN end_address LIKE '%North Dakota%' THEN 'North Dakota'
            WHEN end_address LIKE '%South Dakota%' THEN 'South Dakota'
            WHEN end_address LIKE '%Minnesota%' THEN 'Minnesota'
            WHEN end_address LIKE '%Wisconsin%' THEN 'Wisconsin'
            WHEN end_address LIKE '%Illinois%' THEN 'Illinois'
            WHEN end_address LIKE '%Indiana%' THEN 'Indiana'
            WHEN end_address LIKE '%Ohio%' THEN 'Ohio'
            WHEN end_address LIKE '%Michigan%' THEN 'Michigan'
            WHEN end_address LIKE '%Pennsylvania%' THEN 'Pennsylvania'
            WHEN end_address LIKE '%New York%' THEN 'New York'
            WHEN end_address LIKE '%Vermont%' THEN 'Vermont'
            WHEN end_address LIKE '%New Hampshire%' THEN 'New Hampshire'
            WHEN end_address LIKE '%Maine%' THEN 'Maine'
            WHEN end_address LIKE '%Massachusetts%' THEN 'Massachusetts'
            WHEN end_address LIKE '%Rhode Island%' THEN 'Rhode Island'
            WHEN end_address LIKE '%Connecticut%' THEN 'Connecticut'
            WHEN end_address LIKE '%New Jersey%' THEN 'New Jersey'
            WHEN end_address LIKE '%Delaware%' THEN 'Delaware'
            WHEN end_address LIKE '%Maryland%' THEN 'Maryland'
            WHEN end_address LIKE '%Virginia%' THEN 'Virginia'
            WHEN end_address LIKE '%West Virginia%' THEN 'West Virginia'
            WHEN end_address LIKE '%North Carolina%' THEN 'North Carolina'
            WHEN end_address LIKE '%South Carolina%' THEN 'South Carolina'
            WHEN end_address LIKE '%Georgia%' THEN 'Georgia'
            WHEN end_address LIKE '%Florida%' THEN 'Florida'
            WHEN end_address LIKE '%Alabama%' THEN 'Alabama'
            WHEN end_address LIKE '%Mississippi%' THEN 'Mississippi'
            WHEN end_address LIKE '%Tennessee%' THEN 'Tennessee'
            WHEN end_address LIKE '%Kentucky%' THEN 'Kentucky'
            WHEN end_address LIKE '%Louisiana%' THEN 'Louisiana'
            WHEN end_address LIKE '%Arkansas%' THEN 'Arkansas'
            WHEN end_address LIKE '%Missouri%' THEN 'Missouri'
            WHEN end_address LIKE '%Iowa%' THEN 'Iowa'
            WHEN end_address LIKE '%Kansas%' THEN 'Kansas'
            WHEN end_address LIKE '%Nebraska%' THEN 'Nebraska'
            WHEN end_address LIKE '%Oklahoma%' THEN 'Oklahoma'
          END as state_name,
          MIN(started_at) as first_visited,
          COUNT(id) as drive_count,
          SUM(distance_miles) as total_miles
        FROM drives
        WHERE journey_id = ? 
          AND end_address IS NOT NULL
        GROUP BY state_name
        HAVING state_name IS NOT NULL
        ORDER BY first_visited ASC
      `).bind(this.journeyId).all();

      // Clear existing states progress safely
      await this.db.prepare('DELETE FROM states_progress WHERE journey_id = ?')
        .bind(this.journeyId).run();

      let visitOrder = 1;
      for (const state of statesData.results || []) {
        const stateAbbrev = this.getStateAbbreviation(state.state_name?.trim());
        
        await this.db.prepare(`
          INSERT INTO states_progress (
            id, journey_id, state_name, state_abbreviation, first_visited_date,
            visit_order, total_miles_in_state, is_current_state, last_updated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          `${this.journeyId}-${stateAbbrev}`,
          this.journeyId,
          state.state_name?.trim() || 'Unknown',
          stateAbbrev,
          state.first_visited,
          visitOrder++,
          Math.round(state.total_miles || 0),
          false, // Will be updated separately for current state
          new Date().toISOString()
        ).run();
      }
    } catch (error) {
      console.error('States progress processing failed:', error);
    }
  }

  /**
   * Process Recent Drives Component Data
   */
  private async processRecentDrives(): Promise<void> {
    try {
      const recentDrives = await this.db.prepare(`
        SELECT 
          id, started_at, ended_at, start_address, end_address,
          distance_miles, duration_minutes, energy_used_kwh
        FROM drives 
        WHERE journey_id = ?
        ORDER BY started_at DESC 
        LIMIT 10
      `).bind(this.journeyId).all();

      // Clear existing recent drives safely
      await this.db.prepare('DELETE FROM recent_drives_summary WHERE journey_id = ?')
        .bind(this.journeyId).run();

      let driveOrder = 1;
      for (const drive of recentDrives.results || []) {
        const startLocation = this.parseLocation(drive.start_address);
        const endLocation = this.parseLocation(drive.end_address);
        
        await this.db.prepare(`
          INSERT INTO recent_drives_summary (
            id, journey_id, drive_date, start_city, start_state,
            end_city, end_state, distance_miles, duration_hours,
            energy_used_kwh, average_speed_mph, drive_order, last_updated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          `${this.journeyId}-drive-${drive.id}`,
          this.journeyId,
          drive.started_at,
          startLocation.city,
          startLocation.state,
          endLocation.city,
          endLocation.state,
          Math.round(drive.distance_miles || 0),
          Math.round((drive.duration_minutes || 0) / 60 * 10) / 10, // 1 decimal place
          Math.round((drive.energy_used_kwh || 0) * 10) / 10,
          Math.round((drive.distance_miles || 0) / ((drive.duration_minutes || 1) / 60)),
          driveOrder++,
          new Date().toISOString()
        ).run();
      }
    } catch (error) {
      console.error('Recent drives processing failed:', error);
    }
  }

  /**
   * Helper: Parse location string into city/state
   */
  private parseLocation(address: string): { city: string; state: string } {
    if (!address || typeof address !== 'string') {
      return { city: 'Unknown', state: 'Unknown' };
    }

    const parts = address.split(',').map(p => p.trim());
    
    if (parts.length >= 2) {
      const state = this.normalizeStateName(parts[parts.length - 1]);
      const city = parts[0];
      return { city, state };
    }
    
    return { city: address, state: 'Unknown' };
  }

  /**
   * Helper: Format charging status for display
   */
  private formatChargingStatus(status: string): string {
    switch (status?.toLowerCase()) {
      case 'charging': return 'Charging';
      case 'complete': return 'Complete';
      case 'disconnected': return 'Disconnected';
      case 'nopower': return 'No Power';
      default: return 'Unknown';
    }
  }

  /**
   * Helper: Get state abbreviation from full name
   */
  private getStateAbbreviation(stateName: string): string {
    const stateMap: { [key: string]: string } = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
      'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
      'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
      'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
      'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
      'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
      'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
      'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
    };
    
    return stateMap[stateName] || stateName?.substr(0, 2)?.toUpperCase() || 'XX';
  }

  /**
   * Helper: Normalize state names
   */
  private normalizeStateName(input: string): string {
    const stateNames = [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
      'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
      'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
      'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
      'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
      'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
      'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
      'Wisconsin', 'Wyoming'
    ];

    return stateNames.find(state => 
      input.toLowerCase().includes(state.toLowerCase())
    ) || input;
  }
}
