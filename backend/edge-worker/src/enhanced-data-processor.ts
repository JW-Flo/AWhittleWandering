/**
 * Enhanced Data Processor
 * Comprehensive data processing for all Tessie API fields with scalable architecture
 */

interface EnhancedVehicleState {
  // Core vehicle data
  battery_level: number;
  battery_range: number;
  charging_state: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  odometer: number;
  
  // Enhanced fields from Tessie
  shift_state?: string; // Park, Drive, Reverse, Neutral
  power?: number; // Current power usage in kW
  locked?: boolean;
  climate_on?: boolean;
  inside_temp?: number;
  outside_temp?: number;
  software_update_status?: string;
  car_version?: string;
  
  timestamp: number;
}

interface EnhancedDriveData {
  // Core drive data
  id: number;
  started_at: number;
  ended_at: number;
  starting_location: string;
  ending_location: string;
  starting_latitude: number;
  starting_longitude: number;
  ending_latitude: number;
  ending_longitude: number;
  
  // Enhanced fields from Tessie
  odometer_distance: number; // Actual miles driven
  energy_used: number; // kWh consumed
  average_speed: number;
  max_speed: number;
  starting_battery: number;
  ending_battery: number;
  average_inside_temperature?: number;
  average_outside_temperature?: number;
  rated_range_used?: number;
  tag?: string; // Personal/Business
  starting_range?: number;
  ending_range?: number;
}

interface EnhancedChargeData {
  // Core charge data
  id: number;
  started_at: number;
  ended_at: number;
  location: string;
  latitude: number;
  longitude: number;
  
  // Enhanced fields from Tessie
  energy_added: number; // kWh added to battery
  energy_used?: number; // kWh consumed during charging (losses)
  miles_added: number; // Rated miles added
  miles_added_ideal?: number; // Ideal miles added
  starting_battery: number;
  ending_battery: number;
  cost: number;
  is_supercharger: boolean;
  charger_power_kw?: number;
  charge_rate_avg?: number;
  charge_rate_max?: number;
}

export class EnhancedDataProcessor {
  private db: D1Database;
  private journeyId: string;
  private vehicleId: string;

  constructor(db: D1Database, journeyId: string = 'continental-usa-2025', vehicleId: string = 'midnight-shadow') {
    this.db = db;
    this.journeyId = journeyId;
    this.vehicleId = vehicleId;
  }

  /**
   * Process and store enhanced vehicle state with all available fields
   */
  async processVehicleState(stateData: any): Promise<void> {
    const enhancedState: EnhancedVehicleState = {
      battery_level: stateData.charge_state?.battery_level || 0,
      battery_range: stateData.charge_state?.battery_range || 0,
      charging_state: stateData.charge_state?.charging_state || 'Unknown',
      latitude: stateData.drive_state?.latitude || 0,
      longitude: stateData.drive_state?.longitude || 0,
      heading: stateData.drive_state?.heading || 0,
      speed: stateData.drive_state?.speed || 0,
      odometer: stateData.vehicle_state?.odometer || 0,
      
      // Enhanced fields
      shift_state: stateData.drive_state?.shift_state,
      power: stateData.drive_state?.power,
      locked: stateData.vehicle_state?.locked,
      climate_on: stateData.climate_state?.is_climate_on,
      inside_temp: stateData.climate_state?.inside_temp,
      outside_temp: stateData.climate_state?.outside_temp,
      software_update_status: stateData.vehicle_state?.software_update?.status,
      car_version: stateData.vehicle_state?.car_version,
      
      timestamp: Date.now()
    };

    // Store current vehicle state
    await this.db.prepare(`
      INSERT OR REPLACE INTO vehicle_state (
        vehicle_id, battery_level, battery_range, charging_state,
        latitude, longitude, heading, speed, odometer,
        inside_temp, outside_temp, shift_state, power, 
        locked, climate_on, software_update_status, car_version,
        timestamp, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      this.vehicleId,
      enhancedState.battery_level,
      enhancedState.battery_range,
      enhancedState.charging_state,
      enhancedState.latitude,
      enhancedState.longitude,
      enhancedState.heading,
      enhancedState.speed,
      enhancedState.odometer,
      enhancedState.inside_temp,
      enhancedState.outside_temp,
      enhancedState.shift_state,
      enhancedState.power,
      enhancedState.locked,
      enhancedState.climate_on,
      enhancedState.software_update_status,
      enhancedState.car_version,
      new Date(enhancedState.timestamp).toISOString()
    ).run();

    // Store in history for trend analysis
    await this.db.prepare(`
      INSERT INTO vehicle_state_history (
        vehicle_id, battery_level, battery_range, charging_state,
        latitude, longitude, speed, odometer, outside_temp, inside_temp,
        power, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      this.vehicleId,
      enhancedState.battery_level,
      enhancedState.battery_range,
      enhancedState.charging_state,
      enhancedState.latitude,
      enhancedState.longitude,
      enhancedState.speed,
      enhancedState.odometer,
      enhancedState.outside_temp,
      enhancedState.inside_temp,
      enhancedState.power,
      new Date(enhancedState.timestamp).toISOString()
    ).run();

    // Update current status component data
    await this.updateCurrentStatusComponent(enhancedState);
  }

  /**
   * Process and store enhanced drive data
   */
  async processDriveData(driveData: EnhancedDriveData[]): Promise<void> {
    for (const drive of driveData) {
      // Store enhanced drive data
      await this.db.prepare(`
        INSERT OR REPLACE INTO drives (
          tessie_id, vehicle_id, journey_id, started_at, ended_at,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, distance_miles, duration_minutes,
          energy_used_kwh, average_speed, max_speed, outside_temp_avg,
          start_battery_level, end_battery_level, start_range, end_range,
          rated_range_used, drive_tag, average_inside_temp, average_outside_temp,
          starting_range, ending_range
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        drive.id,
        this.vehicleId,
        this.journeyId,
        new Date(drive.started_at * 1000).toISOString(),
        new Date(drive.ended_at * 1000).toISOString(),
        drive.starting_location,
        drive.ending_location,
        drive.starting_latitude,
        drive.starting_longitude,
        drive.ending_latitude,
        drive.ending_longitude,
        drive.odometer_distance,
        Math.round((drive.ended_at - drive.started_at) / 60),
        drive.energy_used,
        drive.average_speed,
        drive.max_speed,
        drive.average_outside_temperature,
        drive.starting_battery,
        drive.ending_battery,
        drive.starting_range,
        drive.ending_range,
        drive.rated_range_used,
        drive.tag,
        drive.average_inside_temperature,
        drive.average_outside_temperature,
        drive.starting_range,
        drive.ending_range
      ).run();
    }

    // Update analytics
    await this.updateDriveAnalytics(driveData);
  }

  /**
   * Process and store enhanced charge data
   */
  async processChargeData(chargeData: EnhancedChargeData[]): Promise<void> {
    for (const charge of chargeData) {
      // Store enhanced charge data
      await this.db.prepare(`
        INSERT OR REPLACE INTO charges (
          tessie_id, vehicle_id, journey_id, started_at, ended_at,
          location, latitude, longitude, charger_type, charger_power_kw,
          energy_added_kwh, energy_used_kwh, charge_rate_avg, charge_rate_max,
          start_battery_level, end_battery_level, start_range, end_range,
          cost_usd, duration_minutes, is_supercharger, miles_added, miles_added_ideal,
          cost_per_kwh, peak_charging_rate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        charge.id,
        this.vehicleId,
        this.journeyId,
        new Date(charge.started_at * 1000).toISOString(),
        new Date(charge.ended_at * 1000).toISOString(),
        charge.location,
        charge.latitude,
        charge.longitude,
        charge.is_supercharger ? 'Supercharger' : 'Destination',
        charge.charger_power_kw,
        charge.energy_added,
        charge.energy_used,
        charge.charge_rate_avg,
        charge.charge_rate_max,
        charge.starting_battery,
        charge.ending_battery,
        null, // start_range - not in Tessie API
        null, // end_range - not in Tessie API
        charge.cost,
        Math.round((charge.ended_at - charge.started_at) / 60),
        charge.is_supercharger,
        charge.miles_added,
        charge.miles_added_ideal,
        charge.cost > 0 && charge.energy_added > 0 ? charge.cost / charge.energy_added : null,
        charge.charge_rate_max
      ).run();
    }

    // Update analytics
    await this.updateChargeAnalytics(chargeData);
  }

  /**
   * Update current status component with enhanced data
   */
  private async updateCurrentStatusComponent(state: EnhancedVehicleState): Promise<void> {
    await this.db.prepare(`
      INSERT OR REPLACE INTO current_status (
        id, vehicle_id, battery_level, battery_range, charging_status,
        current_speed, current_latitude, current_longitude,
        inside_temp_f, outside_temp_f, is_locked, is_climate_on,
        last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      `${this.vehicleId}-status`,
      this.vehicleId,
      state.battery_level,
      Math.round(state.battery_range),
      state.charging_state,
      Math.round(state.speed || 0),
      state.latitude,
      state.longitude,
      state.inside_temp ? Math.round((state.inside_temp * 9/5) + 32) : null, // C to F
      state.outside_temp ? Math.round((state.outside_temp * 9/5) + 32) : null, // C to F
      state.locked || false,
      state.climate_on || false,
      new Date().toISOString()
    ).run();
  }

  /**
   * Update drive analytics for the day
   */
  private async updateDriveAnalytics(drives: EnhancedDriveData[]): Promise<void> {
    const drivesByDate = this.groupByDate(drives, drive => new Date(drive.started_at * 1000));

    for (const [date, dateDrives] of Object.entries(drivesByDate)) {
      const totalDistance = dateDrives.reduce((sum, d) => sum + d.odometer_distance, 0);
      const totalEnergy = dateDrives.reduce((sum, d) => sum + (d.energy_used || 0), 0);
      const avgSpeed = dateDrives.reduce((sum, d) => sum + d.average_speed, 0) / dateDrives.length;
      const maxSpeed = Math.max(...dateDrives.map(d => d.max_speed || 0));

      await this.db.prepare(`
        INSERT OR REPLACE INTO drive_analytics (
          journey_id, date, total_drives, total_distance_miles,
          total_energy_used_kwh, avg_speed_mph, max_speed_mph,
          efficiency_miles_per_kwh, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        this.journeyId,
        date,
        dateDrives.length,
        totalDistance,
        totalEnergy,
        avgSpeed,
        maxSpeed,
        totalEnergy > 0 ? totalDistance / totalEnergy : 0
      ).run();
    }
  }

  /**
   * Update charge analytics for the day
   */
  private async updateChargeAnalytics(charges: EnhancedChargeData[]): Promise<void> {
    const chargesByDate = this.groupByDate(charges, charge => new Date(charge.started_at * 1000));

    for (const [date, dateCharges] of Object.entries(chargesByDate)) {
      const totalEnergy = dateCharges.reduce((sum, c) => sum + c.energy_added, 0);
      const totalCost = dateCharges.reduce((sum, c) => sum + (c.cost || 0), 0);
      const superchargerCount = dateCharges.filter(c => c.is_supercharger).length;
      const destinationCount = dateCharges.filter(c => !c.is_supercharger).length;
      const avgChargeRate = dateCharges.reduce((sum, c) => sum + (c.charge_rate_avg || 0), 0) / dateCharges.length;
      const totalTime = dateCharges.reduce((sum, c) => sum + (c.ended_at - c.started_at), 0) / 60; // minutes

      await this.db.prepare(`
        INSERT OR REPLACE INTO charge_analytics (
          journey_id, date, total_charges, total_energy_added_kwh,
          total_cost_usd, avg_charge_rate_kw, supercharger_sessions,
          destination_charges, total_charge_time_minutes, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        this.journeyId,
        date,
        dateCharges.length,
        totalEnergy,
        totalCost,
        avgChargeRate,
        superchargerCount,
        destinationCount,
        totalTime
      ).run();
    }
  }

  /**
   * Helper function to group data by date
   */
  private groupByDate<T>(items: T[], dateExtractor: (item: T) => Date): Record<string, T[]> {
    return items.reduce((groups, item) => {
      const date = dateExtractor(item).toISOString().split('T')[0]; // YYYY-MM-DD
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * Generate comprehensive analytics for frontend consumption
   */
  async generateAnalytics(startDate: string, endDate: string): Promise<any> {
    // Get drive analytics
    const driveAnalytics = await this.db.prepare(`
      SELECT * FROM drive_analytics 
      WHERE journey_id = ? AND date BETWEEN ? AND ?
      ORDER BY date ASC
    `).bind(this.journeyId, startDate, endDate).all();

    // Get charge analytics
    const chargeAnalytics = await this.db.prepare(`
      SELECT * FROM charge_analytics
      WHERE journey_id = ? AND date BETWEEN ? AND ?
      ORDER BY date ASC
    `).bind(this.journeyId, startDate, endDate).all();

    // Get efficiency metrics
    const efficiencyData = await this.db.prepare(`
      SELECT * FROM efficiency_metrics
      WHERE journey_id = ? AND date BETWEEN ? AND ?
      ORDER BY date ASC
    `).bind(this.journeyId, startDate, endDate).all();

    return {
      drives: driveAnalytics.results || [],
      charges: chargeAnalytics.results || [],
      efficiency: efficiencyData.results || [],
      summary: {
        totalDrives: driveAnalytics.results?.reduce((sum: number, d: any) => sum + (d.total_drives || 0), 0) || 0,
        totalMiles: driveAnalytics.results?.reduce((sum: number, d: any) => sum + (d.total_distance_miles || 0), 0) || 0,
        totalCharges: chargeAnalytics.results?.reduce((sum: number, c: any) => sum + (c.total_charges || 0), 0) || 0,
        totalEnergyUsed: driveAnalytics.results?.reduce((sum: number, d: any) => sum + (d.total_energy_used_kwh || 0), 0) || 0,
        totalChargingCost: chargeAnalytics.results?.reduce((sum: number, c: any) => sum + (c.total_cost_usd || 0), 0) || 0
      }
    };
  }
}
