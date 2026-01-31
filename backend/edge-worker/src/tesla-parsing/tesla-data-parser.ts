/**
 * Cloudflare-Native Tesla Data Parser
 * Inspired by TeslaMate's parsing patterns but built for Cloudflare infrastructure
 * Handles real Tesla data ingestion, processing, and storage
 */

export interface TeslaVehicleState {
  id: number;
  vehicle_id: number;
  vin: string;
  display_name: string;
  state: 'online' | 'asleep' | 'offline';
  
  // Drive state
  latitude?: number;
  longitude?: number;
  heading?: number;
  speed?: number;
  power?: number;
  shift_state?: string;
  
  // Battery state
  battery_level?: number;
  battery_range?: number;
  est_battery_range?: number;
  ideal_battery_range?: number;
  usable_battery_level?: number;
  
  // Climate state
  inside_temp?: number;
  outside_temp?: number;
  driver_temp_setting?: number;
  passenger_temp_setting?: number;
  is_climate_on?: boolean;
  fan_status?: number;
  
  // Vehicle state
  odometer?: number;
  car_version?: string;
  locked?: boolean;
  sentry_mode?: boolean;
  
  // Location context
  location_name?: string;
  address?: string;
  geofence?: string;
  
  // Timestamps
  timestamp: string;
  updated_at: string;
}

export interface TeslaDriveSession {
  id?: number;
  vehicle_id: number;
  start_date: string;
  end_date?: string;
  
  // Position data
  start_latitude: number;
  start_longitude: number;
  end_latitude?: number;
  end_longitude?: number;
  
  // Trip metrics
  start_battery_level: number;
  end_battery_level?: number;
  start_range: number;
  end_range?: number;
  start_odometer: number;
  end_odometer?: number;
  
  // Environmental data
  outside_temp_avg?: number;
  inside_temp_avg?: number;
  speed_max?: number;
  power_max?: number;
  power_min?: number;
  
  // Calculated fields
  distance?: number;
  duration_minutes?: number;
  energy_used?: number;
  efficiency?: number;
  
  // Address information
  start_address?: string;
  end_address?: string;
  
  // Geographic context
  start_state?: string;
  end_state?: string;
  states_visited?: string[];
  
  created_at: string;
  updated_at: string;
}

export interface TeslaPositionPoint {
  id?: number;
  drive_id?: number;
  vehicle_id: number;
  
  // Core position data
  timestamp: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  heading?: number;
  speed?: number;
  power?: number;
  
  // Vehicle state at position
  odometer: number;
  battery_level: number;
  battery_range?: number;
  est_battery_range?: number;
  ideal_battery_range?: number;
  usable_battery_level?: number;
  
  // Environmental data
  outside_temp?: number;
  inside_temp?: number;
  fan_status?: number;
  driver_temp_setting?: number;
  passenger_temp_setting?: number;
  is_climate_on?: boolean;
  
  // Charging state
  charge_limit_soc?: number;
  charger_power?: number;
  charging_state?: string;
  
  // Additional sensors
  tpms_pressure_fl?: number;
  tpms_pressure_fr?: number;
  tpms_pressure_rl?: number;
  tpms_pressure_rr?: number;
  
  created_at: string;
}

export class TeslaDataParser {
  private db: D1Database;
  private bucket?: R2Bucket;
  
  constructor(db: D1Database, bucket?: R2Bucket) {
    this.db = db;
    this.bucket = bucket;
  }

  /**
   * Parse and normalize Tesla API vehicle data
   */
  parseVehicleState(rawData: any): TeslaVehicleState {
    const driveState = rawData.drive_state || {};
    const chargeState = rawData.charge_state || {};
    const climateState = rawData.climate_state || {};
    const vehicleState = rawData.vehicle_state || {};
    
    return {
      id: rawData.id,
      vehicle_id: rawData.vehicle_id,
      vin: rawData.vin,
      display_name: rawData.display_name,
      state: rawData.state,
      
      // Drive state
      latitude: driveState.latitude,
      longitude: driveState.longitude,
      heading: driveState.heading,
      speed: driveState.speed,
      power: driveState.power,
      shift_state: driveState.shift_state,
      
      // Battery state
      battery_level: chargeState.battery_level,
      battery_range: chargeState.battery_range,
      est_battery_range: chargeState.est_battery_range,
      ideal_battery_range: chargeState.ideal_battery_range,
      usable_battery_level: chargeState.usable_battery_level,
      
      // Climate state
      inside_temp: climateState.inside_temp,
      outside_temp: climateState.outside_temp,
      driver_temp_setting: climateState.driver_temp_setting,
      passenger_temp_setting: climateState.passenger_temp_setting,
      is_climate_on: climateState.is_climate_on,
      fan_status: climateState.fan_status,
      
      // Vehicle state
      odometer: vehicleState.odometer,
      car_version: vehicleState.car_version,
      locked: vehicleState.locked,
      sentry_mode: vehicleState.sentry_mode,
      
      timestamp: rawData.timestamp || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Parse streaming data from Tesla WebSocket
   */
  parseStreamingData(rawStreamData: string): Partial<TeslaPositionPoint> | null {
    try {
      const parts = rawStreamData.split(',');
      if (parts.length < 12) {
        return null;
      }

      const [
        timestamp,
        speed,
        odometer,
        soc,
        elevation,
        estHeading,
        estLat,
        estLng,
        power,
        shiftState,
        range,
        estRange,
        heading
      ] = parts;

      return {
        timestamp: new Date(parseInt(timestamp, 10)).toISOString(),
        speed: this.parseNumber(speed),
        odometer: this.parseNumber(odometer),
        battery_level: this.parseNumber(soc),
        elevation: this.parseNumber(elevation),
        heading: this.parseNumber(heading) || this.parseNumber(estHeading),
        latitude: this.parseNumber(estLat),
        longitude: this.parseNumber(estLng),
        power: this.parseNumber(power),
        battery_range: this.parseNumber(range),
        est_battery_range: this.parseNumber(estRange),
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error parsing streaming data:', error);
      return null;
    }
  }

  /**
   * Detect drive sessions from position data
   */
  async detectDriveSession(vehicleId: number, position: TeslaPositionPoint): Promise<TeslaDriveSession | null> {
    // Check for active drive session
    const activeDrive = await this.db
      .prepare('SELECT * FROM drives WHERE vehicle_id = ? AND end_date IS NULL ORDER BY start_date DESC LIMIT 1')
      .bind(vehicleId)
      .first<TeslaDriveSession>();

    const isDriving = position.speed && position.speed > 0;
    const hasMovement = position.power && Math.abs(position.power) > 0;

    if (!activeDrive && (isDriving || hasMovement)) {
      // Start new drive session
      const newDrive: TeslaDriveSession = {
        vehicle_id: vehicleId,
        start_date: position.timestamp,
        start_latitude: position.latitude,
        start_longitude: position.longitude,
        start_battery_level: position.battery_level,
        start_range: position.battery_range || position.est_battery_range || 0,
        start_odometer: position.odometer,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result = await this.db
        .prepare(`
          INSERT INTO drives (
            vehicle_id, start_date, start_latitude, start_longitude,
            start_battery_level, start_range, start_odometer, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          newDrive.vehicle_id,
          newDrive.start_date,
          newDrive.start_latitude,
          newDrive.start_longitude,
          newDrive.start_battery_level,
          newDrive.start_range,
          newDrive.start_odometer,
          newDrive.created_at,
          newDrive.updated_at
        )
        .run();

      newDrive.id = result.meta?.last_row_id as number;
      return newDrive;
    }

    if (activeDrive && (!isDriving && !hasMovement)) {
      // End current drive session
      const endTime = new Date().toISOString();
      const duration = Math.floor(
        (new Date(endTime).getTime() - new Date(activeDrive.start_date).getTime()) / 60000
      );

      if (duration > 2) { // Only save drives longer than 2 minutes
        await this.db
          .prepare(`
            UPDATE drives SET
              end_date = ?,
              end_latitude = ?,
              end_longitude = ?,
              end_battery_level = ?,
              end_range = ?,
              end_odometer = ?,
              duration_minutes = ?,
              updated_at = ?
            WHERE id = ?
          `)
          .bind(
            endTime,
            position.latitude,
            position.longitude,
            position.battery_level,
            position.battery_range || position.est_battery_range,
            position.odometer,
            duration,
            new Date().toISOString(),
            activeDrive.id
          )
          .run();

        // Calculate additional metrics
        await this.calculateDriveMetrics(activeDrive.id!);
      }
    }

    return activeDrive;
  }

  /**
   * Calculate drive metrics (distance, efficiency, etc.)
   */
  private async calculateDriveMetrics(driveId: number): Promise<void> {
    const drive = await this.db
      .prepare('SELECT * FROM drives WHERE id = ?')
      .bind(driveId)
      .first<TeslaDriveSession>();

    if (!drive || !drive.end_date) return;

    // Calculate distance using haversine formula
    const distance = this.calculateDistance(
      drive.start_latitude,
      drive.start_longitude,
      drive.end_latitude!,
      drive.end_longitude!
    );

    // Calculate energy used
    const energyUsed = drive.start_range - (drive.end_range || 0);
    const efficiency = distance > 0 ? (energyUsed / distance) * 100 : 0;

    // Get temperature and speed statistics from positions
    const stats = await this.db
      .prepare(`
        SELECT 
          AVG(outside_temp) as avg_outside_temp,
          AVG(inside_temp) as avg_inside_temp,
          MAX(speed) as max_speed,
          MAX(power) as max_power,
          MIN(power) as min_power
        FROM positions 
        WHERE drive_id = ?
      `)
      .bind(driveId)
      .first<any>();

    await this.db
      .prepare(`
        UPDATE drives SET
          distance = ?,
          energy_used = ?,
          efficiency = ?,
          outside_temp_avg = ?,
          inside_temp_avg = ?,
          speed_max = ?,
          power_max = ?,
          power_min = ?,
          updated_at = ?
        WHERE id = ?
      `)
      .bind(
        distance,
        energyUsed,
        efficiency,
        stats?.avg_outside_temp,
        stats?.avg_inside_temp,
        stats?.max_speed,
        stats?.max_power,
        stats?.min_power,
        new Date().toISOString(),
        driveId
      )
      .run();
  }

  /**
   * Store position data with drive association
   */
  async storePosition(position: TeslaPositionPoint, driveId?: number): Promise<number | null> {
    const positionWithDrive = { ...position, drive_id: driveId };

    const result = await this.db
      .prepare(`
        INSERT INTO positions (
          drive_id, vehicle_id, timestamp, latitude, longitude, elevation, heading,
          speed, power, odometer, battery_level, battery_range, est_battery_range,
          ideal_battery_range, usable_battery_level, outside_temp, inside_temp,
          fan_status, driver_temp_setting, passenger_temp_setting, is_climate_on,
          charge_limit_soc, charger_power, charging_state, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        positionWithDrive.drive_id,
        positionWithDrive.vehicle_id,
        positionWithDrive.timestamp,
        positionWithDrive.latitude,
        positionWithDrive.longitude,
        positionWithDrive.elevation,
        positionWithDrive.heading,
        positionWithDrive.speed,
        positionWithDrive.power,
        positionWithDrive.odometer,
        positionWithDrive.battery_level,
        positionWithDrive.battery_range,
        positionWithDrive.est_battery_range,
        positionWithDrive.ideal_battery_range,
        positionWithDrive.usable_battery_level,
        positionWithDrive.outside_temp,
        positionWithDrive.inside_temp,
        positionWithDrive.fan_status,
        positionWithDrive.driver_temp_setting,
        positionWithDrive.passenger_temp_setting,
        positionWithDrive.is_climate_on,
        positionWithDrive.charge_limit_soc,
        positionWithDrive.charger_power,
        positionWithDrive.charging_state,
        positionWithDrive.created_at
      )
      .run();

    return result.meta?.last_row_id as number || null;
  }

  /**
   * Backup raw data to R2 storage
   */
  async backupRawData(data: any, type: 'vehicle_state' | 'streaming' | 'positions'): Promise<void> {
    if (!this.bucket) return;

    const timestamp = new Date().toISOString();
    const key = `tesla-data/${type}/${timestamp.split('T')[0]}/${timestamp}.json`;

    await this.bucket.put(key, JSON.stringify({
      timestamp,
      type,
      data
    }), {
      httpMetadata: {
        contentType: 'application/json'
      }
    });
  }

  /**
   * Helper methods
   */
  private parseNumber(value: string): number | undefined {
    if (!value || value === '') return undefined;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
