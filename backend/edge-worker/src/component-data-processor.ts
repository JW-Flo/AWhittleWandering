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
          COUNT(DISTINCT sv.state_name) as states_count
        FROM drives d 
        LEFT JOIN states_visited sv ON sv.journey_id = d.journey_id
        WHERE d.journey_id = ?
      `).bind(this.journeyId).first();

      // HARDCODE journey start date as requested
      const startDate = new Date('2025-06-01T00:00:00Z');
      const daysElapsed = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Get current odometer from live data
      const currentOdometer = tessieData?.vehicle_state?.odometer || 0;
      
      // Calculate trip miles using SAFE calculation with hardcoded start
      const tripStartOdometer = 65000; // Conservative estimate
      const tripMiles = Math.max(0, currentOdometer - tripStartOdometer);

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
        // First try to detect state from coordinates
        const detectedState = await this.detectStateFromCoordinates(
          tessieData.drive_state.latitude, 
          tessieData.drive_state.longitude
        );
        if (detectedState !== 'Unknown') {
          currentState = detectedState;
        }

        // Try to get more specific location from latest drive for CITY only
        // Do not override GPS-detected state with potentially stale address data
        const latestDrive = await this.db.prepare(`
          SELECT end_address, start_address FROM drives 
          WHERE journey_id = ? 
          ORDER BY ended_at DESC 
          LIMIT 1
        `).bind(this.journeyId).first();

        if (latestDrive?.end_address) {
          const location = this.parseLocation(latestDrive.end_address);
          if (location.city !== 'Unknown') currentCity = location.city;
          // Only use address state if GPS detection failed
          if (detectedState === 'Unknown' && location.state !== 'Unknown') {
            currentState = location.state;
          }
        } else if (latestDrive?.start_address) {
          const location = this.parseLocation(latestDrive.start_address);
          if (location.city !== 'Unknown') currentCity = location.city;
          // Only use address state if GPS detection failed
          if (detectedState === 'Unknown' && location.state !== 'Unknown') {
            currentState = location.state;
          }
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

  /**
   * Helper: Detect state from coordinates
   */
  private async detectStateFromCoordinates(lat: number, lng: number): Promise<string> {
    // More comprehensive state boundaries for all continental US states
    const US_STATES = [
      // Northeast
      { name: 'Connecticut', minLat: 40.9959, maxLat: 42.0508, minLng: -73.7277, maxLng: -71.7869 },
      { name: 'Maine', minLat: 42.9633, maxLat: 47.4596, minLng: -71.0826, maxLng: -66.8847 },
      { name: 'Massachusetts', minLat: 41.2376, maxLat: 42.8868, minLng: -73.5081, maxLng: -69.9286 },
      { name: 'New Hampshire', minLat: 42.6970, maxLat: 45.3058, minLng: -72.5570, maxLng: -70.6104 },
      { name: 'New Jersey', minLat: 38.9281, maxLat: 41.3574, minLng: -75.5597, maxLng: -73.8937 },
      { name: 'New York', minLat: 40.4774, maxLat: 45.0158, minLng: -79.7624, maxLng: -71.7774 },
      { name: 'Pennsylvania', minLat: 39.7198, maxLat: 42.2694, minLng: -80.5194, maxLng: -74.6895 },
      { name: 'Rhode Island', minLat: 41.1460, maxLat: 42.0187, minLng: -71.8620, maxLng: -71.1208 },
      { name: 'Vermont', minLat: 42.7269, maxLat: 45.0167, minLng: -73.4370, maxLng: -71.4653 },
      
      // Southeast  
      { name: 'Delaware', minLat: 38.4513, maxLat: 39.8390, minLng: -75.7887, maxLng: -74.9848 },
      { name: 'Florida', minLat: 24.3963, maxLat: 31.0014, minLng: -87.6349, maxLng: -79.9743 },
      { name: 'Georgia', minLat: 30.3552, maxLat: 35.0008, minLng: -85.6051, maxLng: -80.7514 },
      { name: 'Maryland', minLat: 37.9113, maxLat: 39.7231, minLng: -79.4877, maxLng: -75.0490 },
      { name: 'North Carolina', minLat: 33.7514, maxLat: 36.5881, minLng: -84.3219, maxLng: -75.3603 },
      { name: 'South Carolina', minLat: 32.0346, maxLat: 35.2155, minLng: -83.3532, maxLng: -78.5408 },
      { name: 'Virginia', minLat: 36.5407, maxLat: 39.4660, minLng: -83.6754, maxLng: -75.1663 },
      { name: 'West Virginia', minLat: 37.2014, maxLat: 40.6381, minLng: -82.6447, maxLng: -77.7190 },
      
      // Midwest
      { name: 'Illinois', minLat: 36.9703, maxLat: 42.5081, minLng: -91.5133, maxLng: -87.0199 },
      { name: 'Indiana', minLat: 37.7717, maxLat: 41.7613, minLng: -88.0978, maxLng: -84.7844 },
      { name: 'Iowa', minLat: 40.3756, maxLat: 43.5012, minLng: -96.6396, maxLng: -90.1400 },
      { name: 'Kansas', minLat: 36.9931, maxLat: 40.0031, minLng: -102.0517, maxLng: -94.5882 },
      { name: 'Michigan', minLat: 41.6962, maxLat: 48.2388, minLng: -90.4182, maxLng: -82.4128 },
      { name: 'Minnesota', minLat: 43.4993, maxLat: 49.3844, minLng: -97.2394, maxLng: -89.4910 },
      { name: 'Missouri', minLat: 35.9957, maxLat: 40.6136, minLng: -95.7742, maxLng: -89.0993 },
      { name: 'Nebraska', minLat: 39.9999, maxLat: 43.0017, minLng: -104.0572, maxLng: -95.3082 },
      { name: 'North Dakota', minLat: 45.9350, maxLat: 49.0007, minLng: -104.0489, maxLng: -96.5544 },
      { name: 'Ohio', minLat: 38.4033, maxLat: 41.9773, minLng: -84.8203, maxLng: -80.5185 },
      { name: 'South Dakota', minLat: 42.4798, maxLat: 45.9454, minLng: -104.0572, maxLng: -96.4362 },
      { name: 'Wisconsin', minLat: 42.4919, maxLat: 47.0808, minLng: -92.8893, maxLng: -86.2491 },
      
      // South
      { name: 'Alabama', minLat: 30.2307, maxLat: 35.0041, minLng: -88.4730, maxLng: -84.8925 },
      { name: 'Arkansas', minLat: 33.0041, maxLat: 36.4996, minLng: -94.6178, maxLng: -89.6444 },
      { name: 'Kentucky', minLat: 36.4970, maxLat: 39.1472, minLng: -89.5715, maxLng: -81.9647 },
      { name: 'Louisiana', minLat: 28.9385, maxLat: 33.0197, minLng: -94.0431, maxLng: -88.8177 },
      { name: 'Mississippi', minLat: 30.1734, maxLat: 34.9961, minLng: -91.6552, maxLng: -88.0972 },
      { name: 'Oklahoma', minLat: 33.6201, maxLat: 37.0020, minLng: -103.0025, maxLng: -94.4312 },
      { name: 'Tennessee', minLat: 34.9829, maxLat: 36.6781, minLng: -90.3103, maxLng: -81.6469 },
      { name: 'Texas', minLat: 25.8371, maxLat: 36.5007, minLng: -106.6456, maxLng: -93.5083 },
      
      // West
      { name: 'Arizona', minLat: 31.3322, maxLat: 37.0043, minLng: -114.8165, maxLng: -109.0453 },
      { name: 'California', minLat: 32.5343, maxLat: 42.0095, minLng: -124.4096, maxLng: -114.1312 },
      { name: 'Colorado', minLat: 36.9924, maxLat: 41.0034, minLng: -109.0606, maxLng: -102.0415 },
      { name: 'Idaho', minLat: 41.9880, maxLat: 49.0010, minLng: -117.2433, maxLng: -111.0435 },
      { name: 'Montana', minLat: 44.3583, maxLat: 49.0010, minLng: -116.0505, maxLng: -104.0395 },
      { name: 'Nevada', minLat: 35.0018, maxLat: 42.0022, minLng: -120.0065, maxLng: -114.0396 },
      { name: 'New Mexico', minLat: 31.3323, maxLat: 37.0001, minLng: -109.0501, maxLng: -103.0018 },
      { name: 'Oregon', minLat: 41.9918, maxLat: 46.2991, minLng: -124.7037, maxLng: -116.4634 },
      { name: 'Utah', minLat: 36.9979, maxLat: 42.0013, minLng: -114.0529, maxLng: -109.0411 },
      { name: 'Washington', minLat: 45.5436, maxLat: 49.0025, minLng: -124.8489, maxLng: -116.9155 },
      { name: 'Wyoming', minLat: 40.9996, maxLat: 45.0058, minLng: -111.0568, maxLng: -104.0519 }
    ];
    
    for (const state of US_STATES) {
      if (lat >= state.minLat && lat <= state.maxLat && lng >= state.minLng && lng <= state.maxLng) {
        return state.name;
      }
    }
    
    return 'Unknown';
  }
}
