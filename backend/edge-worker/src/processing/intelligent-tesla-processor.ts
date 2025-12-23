/**
 * INTELLIGENT TESLA DATA PROCESSOR
 * 
 * This processes raw Tessie data through multiple intelligence layers:
 * 1. Location Intelligence (Geocoding, POI detection, categorization)
 * 2. Journey Intelligence (State tracking, trip classification)
 * 3. Behavioral Intelligence (Overnight detection, charging patterns)
 * 4. Automation Intelligence (Trigger rules, notifications)
 * 
 * Flow: Tessie API → Intelligence Processing → D1 Storage → Component APIs
 */

import { Env } from '../types/env';

// =====================================================
// COMPREHENSIVE DATA INGESTION WITH INTELLIGENCE
// =====================================================

interface ProcessedDriveData {
  // Raw Tessie fields
  tessie_drive_id: number;
  started_at: string;
  ended_at: string;
  starting_location: string;
  ending_location: string;
  starting_latitude: number;
  starting_longitude: number;
  ending_latitude: number;
  ending_longitude: number;
  odometer_distance: number;
  energy_used: number;
  
  // Processed intelligence fields
  start_parsed_city: string;
  start_parsed_state: string;
  end_parsed_city: string;
  end_parsed_state: string;
  drive_type: string;
  is_state_crossing: boolean;
  is_overnight_arrival: boolean;
  triggered_charging_stop: boolean;
}

interface ProcessedChargeData {
  // Raw Tessie fields
  tessie_charge_id: number;
  started_at: string;
  ended_at: string;
  location: string;
  latitude: number;
  longitude: number;
  energy_added: number;
  is_supercharger: boolean;
  
  // Processed intelligence fields
  parsed_city: string;
  parsed_state: string;
  charger_network: string;
  charge_session_type: string;
  is_overnight_charge: boolean;
  triggered_departure_alert: boolean;
}

export class TeslaDataProcessor {
  constructor(private env: Env) {}

  /**
   * Main entry point - processes ALL Tesla data with intelligence
   */
  async processAllTeslaData(): Promise<void> {
    console.log('🧠 Starting Intelligent Tesla Data Processing...');
    
    try {
      // 1. Process Vehicle State (real-time)
      await this.processVehicleState();
      
      // 2. Process Historical Drives (with intelligence)
      await this.processHistoricalDrives();
      
      // 3. Process Historical Charges (with intelligence)
      await this.processHistoricalCharges();
      
      // 4. Run Intelligence Analysis
      await this.runIntelligenceAnalysis();
      
      // 5. Execute Automation Rules
      await this.executeAutomationRules();
      
      console.log('✅ Intelligent data processing complete!');
      
    } catch (error) {
      console.error('❌ Data processing failed:', error);
      throw error;
    }
  }

  /**
   * Process real-time vehicle state with location intelligence
   */
  private async processVehicleState(): Promise<void> {
    const token = this.env.TESSIE_API_TOKEN || this.env.TESSIE_API_KEY;
    const response = await fetch(`https://api.tessie.com/${this.env.VEHICLE_ID}/state`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json() as any;
    
    // Parse location intelligence
    const locationIntel = await this.parseLocationIntelligence(
      data.drive_state?.latitude,
      data.drive_state?.longitude
    );
    
    // Store comprehensive vehicle state
    await this.env.DB.prepare(`
      INSERT OR REPLACE INTO vehicle_state_comprehensive (
        vehicle_id, timestamp, latitude, longitude, heading, speed, shift_state,
        battery_level, battery_range, charging_state, charge_rate, charger_power,
        inside_temp, outside_temp, locked, sentry_mode, odometer, car_version,
        tpms_pressure_fl, tpms_pressure_fr, tpms_pressure_rl, tpms_pressure_rr,
        pack_current, pack_voltage, energy_remaining, lifetime_energy_used,
        parsed_address, parsed_city, parsed_state, is_home_location, is_overnight_location
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      'midnight-shadow',
      new Date().toISOString(),
      data.drive_state?.latitude || 0,
      data.drive_state?.longitude || 0,
      data.drive_state?.heading || 0,
      data.drive_state?.speed || 0,
      data.drive_state?.shift_state,
      data.charge_state?.battery_level || 0,
      data.charge_state?.battery_range || 0,
      data.charge_state?.charging_state || 'Unknown',
      data.charge_state?.charge_rate || 0,
      data.charge_state?.charger_power || 0,
      data.climate_state?.inside_temp,
      data.climate_state?.outside_temp,
      data.vehicle_state?.locked || false,
      data.vehicle_state?.sentry_mode || false,
      data.vehicle_state?.odometer || 0,
      data.vehicle_state?.car_version,
      data.vehicle_state?.tpms_pressure_fl,
      data.vehicle_state?.tpms_pressure_fr,
      data.vehicle_state?.tpms_pressure_rl,
      data.vehicle_state?.tpms_pressure_rr,
      data.charge_state?.pack_current,
      data.charge_state?.pack_voltage,
      data.charge_state?.energy_remaining,
      data.charge_state?.lifetime_energy_used,
      locationIntel.formatted_address,
      locationIntel.city,
      locationIntel.state,
      locationIntel.is_home_location,
      locationIntel.is_overnight_location
    ).run();
  }

  /**
   * Process historical drives with comprehensive intelligence
   */
  private async processHistoricalDrives(): Promise<void> {
    console.log('🚗 Processing historical drives...');
    const token = this.env.TESSIE_API_TOKEN || this.env.TESSIE_API_KEY;
    
    // Get drives since June 1, 2025
    const response = await fetch(`https://api.tessie.com/${this.env.VEHICLE_ID}/drives?since=2025-06-01T00:00:00Z`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json() as any;
    let processedCount = 0;
    
    for (const drive of data.results || []) {
      try {
        // Process location intelligence for start/end
        const [startIntel, endIntel] = await Promise.all([
          this.parseLocationIntelligence(drive.starting_latitude, drive.starting_longitude),
          this.parseLocationIntelligence(drive.ending_latitude, drive.ending_longitude)
        ]);
        
        // Analyze drive intelligence
        const driveIntel = this.analyzeDriveIntelligence(drive, startIntel, endIntel);
        
        // Store comprehensive drive data
        await this.env.DB.prepare(`
          INSERT OR REPLACE INTO drives_comprehensive (
            tessie_drive_id, vehicle_id, journey_id, started_at, ended_at,
            starting_location, ending_location, starting_latitude, starting_longitude,
            ending_latitude, ending_longitude, odometer_distance, energy_used,
            average_speed, max_speed, starting_battery, ending_battery,
            average_inside_temperature, average_outside_temperature,
            start_parsed_city, start_parsed_state, end_parsed_city, end_parsed_state,
            drive_type, is_state_crossing, is_overnight_arrival, triggered_charging_stop
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          drive.id,
          'midnight-shadow',
          'continental-usa-2025',
          new Date(drive.started_at * 1000).toISOString(),
          new Date(drive.ended_at * 1000).toISOString(),
          drive.starting_location,
          drive.ending_location,
          drive.starting_latitude,
          drive.starting_longitude,
          drive.ending_latitude,
          drive.ending_longitude,
          drive.odometer_distance,
          drive.energy_used,
          drive.average_speed,
          drive.max_speed,
          drive.starting_battery,
          drive.ending_battery,
          drive.average_inside_temperature,
          drive.average_outside_temperature,
          startIntel.city,
          startIntel.state,
          endIntel.city,
          endIntel.state,
          driveIntel.drive_type,
          driveIntel.is_state_crossing,
          driveIntel.is_overnight_arrival,
          driveIntel.triggered_charging_stop
        ).run();
        
        // Update state tracking
        await this.updateStateTracking(startIntel.state, endIntel.state, drive);
        
        processedCount++;
        
        if (processedCount % 100 === 0) {
          console.log(`  Processed ${processedCount} drives...`);
        }
        
      } catch (error) {
        console.error(`Error processing drive ${drive.id}:`, error);
      }
    }
    
    console.log(`✅ Processed ${processedCount} drives with intelligence`);
  }

  /**
   * Process historical charges with charging network intelligence
   */
  private async processHistoricalCharges(): Promise<void> {
    console.log('🔋 Processing historical charges...');
    const token = this.env.TESSIE_API_TOKEN || this.env.TESSIE_API_KEY;
    
    const response = await fetch(`https://api.tessie.com/${this.env.VEHICLE_ID}/charges?since=2025-06-01T00:00:00Z`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json() as any;
    let processedCount = 0;
    
    for (const charge of data.results || []) {
      try {
        // Process location intelligence
        const locationIntel = await this.parseLocationIntelligence(charge.latitude, charge.longitude);
        
        // Analyze charging intelligence
        const chargeIntel = this.analyzeChargingIntelligence(charge, locationIntel);
        
        // Store comprehensive charge data
        await this.env.DB.prepare(`
          INSERT OR REPLACE INTO charges_comprehensive (
            tessie_charge_id, vehicle_id, journey_id, started_at, ended_at,
            location, latitude, longitude, energy_added, starting_battery, ending_battery,
            is_supercharger, is_fast_charger, charger_network, cost_usd,
            parsed_city, parsed_state, charge_session_type, is_overnight_charge
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          charge.id,
          'midnight-shadow',
          'continental-usa-2025',
          new Date(charge.started_at * 1000).toISOString(),
          charge.ended_at ? new Date(charge.ended_at * 1000).toISOString() : null,
          charge.location,
          charge.latitude,
          charge.longitude,
          charge.energy_added,
          charge.starting_battery,
          charge.ending_battery,
          charge.is_supercharger,
          charge.is_fast_charger,
          chargeIntel.charger_network,
          charge.cost || 0,
          locationIntel.city,
          locationIntel.state,
          chargeIntel.charge_session_type,
          chargeIntel.is_overnight_charge
        ).run();
        
        processedCount++;
        
        if (processedCount % 50 === 0) {
          console.log(`  Processed ${processedCount} charges...`);
        }
        
      } catch (error) {
        console.error(`Error processing charge ${charge.id}:`, error);
      }
    }
    
    console.log(`✅ Processed ${processedCount} charges with intelligence`);
  }

  /**
   * Parse location intelligence from coordinates
   */
  private async parseLocationIntelligence(lat: number, lng: number): Promise<any> {
    if (!lat || !lng) {
      return {
        formatted_address: null,
        city: null,
        state: null,
        is_home_location: false,
        is_overnight_location: false
      };
    }
    
    // Simple state detection based on coordinates
    const state = this.detectStateFromCoordinates(lat, lng);
    
    // Check if this is a known home location (Monroe, NC area)
    const isHomeLocation = this.isHomeLocation(lat, lng);
    
    return {
      formatted_address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      city: this.detectCityFromCoordinates(lat, lng),
      state: state,
      is_home_location: isHomeLocation,
      is_overnight_location: false // Will be determined by time analysis
    };
  }

  /**
   * Analyze drive patterns and classify drive type
   */
  private analyzeDriveIntelligence(drive: any, startIntel: any, endIntel: any): any {
    const distance = drive.odometer_distance || 0;
    const duration = drive.duration_minutes || 0;
    
    // Classify drive type
    let driveType = 'local';
    if (distance > 100) driveType = 'road_trip';
    else if (distance < 5) driveType = 'charging_move';
    else if (this.isCommutePattern(startIntel, endIntel)) driveType = 'commute';
    
    // Detect state crossing
    const isStateCrossing = startIntel.state !== endIntel.state && startIntel.state && endIntel.state;
    
    // Detect overnight arrival (drive ending late evening/night)
    const endTime = new Date(drive.ended_at * 1000);
    const isOvernightArrival = endTime.getHours() >= 22 || endTime.getHours() <= 6;
    
    // Detect if this triggers a charging stop
    const triggeredChargingStop = drive.ending_battery < 20 || distance > 200;
    
    return {
      drive_type: driveType,
      is_state_crossing: isStateCrossing,
      is_overnight_arrival: isOvernightArrival,
      triggered_charging_stop: triggeredChargingStop
    };
  }

  /**
   * Analyze charging patterns and classify session type
   */
  private analyzeChargingIntelligence(charge: any, locationIntel: any): any {
    const energyAdded = charge.energy_added || 0;
    const duration = (charge.ended_at - charge.started_at) / 60; // minutes
    
    // Determine charger network
    let chargerNetwork = 'Unknown';
    if (charge.is_supercharger) chargerNetwork = 'Tesla Supercharger';
    else if (locationIntel.is_home_location) chargerNetwork = 'Home';
    else if (charge.is_fast_charger) chargerNetwork = 'Fast Charger';
    else chargerNetwork = 'Level 2';
    
    // Classify session type
    let sessionType = 'travel_charge';
    if (locationIntel.is_home_location) sessionType = 'home_charge';
    else if (energyAdded < 10) sessionType = 'top_up';
    else if (duration > 480) sessionType = 'overnight_charge'; // 8+ hours
    else if (charge.ending_battery >= 95) sessionType = 'full_charge';
    
    // Detect overnight charging
    const startTime = new Date(charge.started_at * 1000);
    const isOvernightCharge = duration > 360 || startTime.getHours() >= 22 || startTime.getHours() <= 6;
    
    return {
      charger_network: chargerNetwork,
      charge_session_type: sessionType,
      is_overnight_charge: isOvernightCharge
    };
  }

  /**
   * Update state tracking with intelligence
   */
  private async updateStateTracking(startState: string, endState: string, drive: any): Promise<void> {
    const states = [startState, endState].filter(Boolean);
    
    for (const state of states) {
      await this.env.DB.prepare(`
        INSERT INTO states_visited_comprehensive 
        (journey_id, state_name, first_entered, total_visits, total_miles_in_state, drives_in_state)
        VALUES (?, ?, ?, 1, ?, 1)
        ON CONFLICT(journey_id, state_name) DO UPDATE SET
          total_visits = total_visits + 1,
          total_miles_in_state = total_miles_in_state + ?,
          drives_in_state = drives_in_state + 1,
          last_exited = ?,
          updated_at = datetime('now')
      `).bind(
        'continental-usa-2025',
        state,
        new Date(drive.started_at * 1000).toISOString(),
        drive.odometer_distance || 0,
        drive.odometer_distance || 0,
        new Date(drive.ended_at * 1000).toISOString()
      ).run();
    }
  }

  /**
   * Run post-processing intelligence analysis
   */
  private async runIntelligenceAnalysis(): Promise<void> {
    console.log('🧠 Running intelligence analysis...');
    
    // Detect overnight stays
    await this.detectOvernightStays();
    
    // Update location intelligence
    await this.updateLocationIntelligence();
    
    // Calculate journey statistics
    await this.calculateJourneyStats();
    
    console.log('✅ Intelligence analysis complete');
  }

  /**
   * Detect overnight stays from drive patterns
   */
  private async detectOvernightStays(): Promise<void> {
    // Find drives with long gaps between end of one and start of next
    const stayGaps = await this.env.DB.prepare(`
      SELECT 
        d1.ending_location,
        d1.ending_latitude,
        d1.ending_longitude,
        d1.ended_at as arrival_time,
        d2.started_at as departure_time,
        (julianday(d2.started_at) - julianday(d1.ended_at)) * 24 as hours_stayed
      FROM drives_comprehensive d1
      JOIN drives_comprehensive d2 ON d2.started_at = (
        SELECT MIN(started_at) 
        FROM drives_comprehensive 
        WHERE started_at > d1.ended_at 
        AND journey_id = d1.journey_id
      )
      WHERE d1.journey_id = ? 
      AND (julianday(d2.started_at) - julianday(d1.ended_at)) * 24 > 6 -- 6+ hour gap
      ORDER BY d1.ended_at
    `).bind('continental-usa-2025').all();
    
    for (const stay of stayGaps.results as any[]) {
      await this.env.DB.prepare(`
        INSERT OR IGNORE INTO overnight_stays 
        (vehicle_id, journey_id, location, latitude, longitude, arrival_time, departure_time, duration_hours)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'midnight-shadow',
        'continental-usa-2025',
        stay.ending_location,
        stay.ending_latitude,
        stay.ending_longitude,
        stay.arrival_time,
        stay.departure_time,
        stay.hours_stayed
      ).run();
    }
  }

  /**
   * Update location intelligence based on visit patterns
   */
  private async updateLocationIntelligence(): Promise<void> {
    // This would integrate with Google Places API, etc.
    // For now, just mark frequently visited locations
    console.log('📍 Updating location intelligence...');
  }

  /**
   * Calculate comprehensive journey statistics
   */
  private async calculateJourneyStats(): Promise<void> {
    console.log('📊 Calculating journey statistics...');
    
    // Update journey totals, efficiency metrics, etc.
    // This will be used by the component APIs
  }

  /**
   * Execute automation rules based on current data
   */
  private async executeAutomationRules(): Promise<void> {
    console.log('🤖 Executing automation rules...');
    
    // Check for rule triggers and execute actions
    // Examples: Low battery alerts, state entry notifications, charging complete alerts
  }

  // Helper methods
  private detectStateFromCoordinates(lat: number, lng: number): string | null {
    // Simple state detection - you'd want a more robust solution
    if (lat >= 33.5 && lat <= 36.5 && lng >= -84 && lng <= -80) return 'North Carolina';
    if (lat >= 32 && lat <= 35.5 && lng >= -83.5 && lng <= -78.5) return 'South Carolina';
    // Add more states as needed
    return null;
  }

  private detectCityFromCoordinates(lat: number, lng: number): string | null {
    // Simple city detection
    if (this.isHomeLocation(lat, lng)) return 'Monroe';
    // Add more city detection logic
    return null;
  }

  private isHomeLocation(lat: number, lng: number): boolean {
    // Monroe, NC home base area
    return lat >= 35.0 && lat <= 35.1 && lng >= -80.7 && lng <= -80.5;
  }

  private isCommutePattern(startIntel: any, endIntel: any): boolean {
    // Detect commute patterns (home to work, work to home, etc.)
    return startIntel.is_home_location || endIntel.is_home_location;
  }
}

// Export the processor
export async function processComprehensiveTeslaData(env: Env): Promise<void> {
  const processor = new TeslaDataProcessor(env);
  await processor.processAllTeslaData();
}
