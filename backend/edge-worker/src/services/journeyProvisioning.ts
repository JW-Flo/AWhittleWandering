/**
 * Journey Provisioning Service
 * 
 * Creates isolated D1 databases and R2 buckets for each journey.
 * Each user/journey gets their own:
 * - D1 database for vehicle telemetry, drives, charges, etc.
 * - R2 bucket for media (photos, videos, voice recordings, transcripts)
 */

import { logger } from '../utils/log';

interface ProvisioningEnv {
  TESLA_DB: D1Database;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
}

interface JourneyRegistration {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  vehicle_vin?: string;
  tessie_api_key?: string;
  d1_database_id?: string;
  d1_database_name?: string;
  r2_bucket_name?: string;
  status: 'pending' | 'provisioning' | 'active' | 'suspended' | 'deleted';
  created_at: string;
  updated_at: string;
}

interface ProvisioningResult {
  success: boolean;
  journey_id: string;
  d1_database_id?: string;
  d1_database_name?: string;
  r2_bucket_name?: string;
  errors: string[];
}

// Comprehensive schema for journey-specific databases
const JOURNEY_SCHEMA = `
-- Tesla Journey Database Schema
-- Each journey gets an isolated database with this schema

PRAGMA foreign_keys = ON;

-- Vehicle information
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  vin TEXT UNIQUE NOT NULL,
  display_name TEXT,
  model TEXT,
  year INTEGER,
  color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Current vehicle state (single row, updated frequently)
CREATE TABLE IF NOT EXISTS vehicle_state (
  vehicle_id TEXT PRIMARY KEY,
  vin TEXT NOT NULL,
  battery_level INTEGER DEFAULT 0,
  battery_range REAL DEFAULT 0,
  charging_state TEXT DEFAULT 'Unknown',
  latitude REAL DEFAULT 0,
  longitude REAL DEFAULT 0,
  heading REAL DEFAULT 0,
  speed REAL DEFAULT 0,
  odometer REAL DEFAULT 0,
  inside_temp REAL,
  outside_temp REAL,
  shift_state TEXT,
  power INTEGER,
  locked BOOLEAN DEFAULT FALSE,
  climate_on BOOLEAN DEFAULT FALSE,
  car_version TEXT,
  timestamp DATETIME NOT NULL,
  state_name TEXT,
  city TEXT,
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- Historical vehicle state snapshots
CREATE TABLE IF NOT EXISTS vehicle_state_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id TEXT NOT NULL,
  battery_level INTEGER,
  latitude REAL,
  longitude REAL,
  speed REAL,
  odometer REAL,
  timestamp DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- Drive sessions
CREATE TABLE IF NOT EXISTS drives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tessie_id INTEGER UNIQUE,
  vehicle_id TEXT NOT NULL,
  started_at DATETIME NOT NULL,
  ended_at DATETIME NOT NULL,
  start_address TEXT,
  end_address TEXT,
  start_latitude REAL,
  start_longitude REAL,
  end_latitude REAL,
  end_longitude REAL,
  start_state TEXT,
  end_state TEXT,
  distance_miles REAL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  energy_used_kwh REAL DEFAULT 0,
  average_speed REAL DEFAULT 0,
  max_speed REAL DEFAULT 0,
  start_battery_level INTEGER,
  end_battery_level INTEGER,
  starting_range REAL,
  ending_range REAL,
  outside_temp_avg REAL,
  efficiency_miles_per_kwh REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- Charging sessions
CREATE TABLE IF NOT EXISTS charges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tessie_id INTEGER UNIQUE,
  vehicle_id TEXT NOT NULL,
  started_at DATETIME NOT NULL,
  ended_at DATETIME,
  location TEXT,
  latitude REAL,
  longitude REAL,
  state_name TEXT,
  city TEXT,
  charger_type TEXT,
  charger_power_kw REAL,
  energy_added_kwh REAL DEFAULT 0,
  start_battery_level INTEGER,
  end_battery_level INTEGER,
  start_range REAL,
  end_range REAL,
  miles_added INTEGER DEFAULT 0,
  cost_usd REAL,
  duration_minutes INTEGER DEFAULT 0,
  is_supercharger BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- States visited
CREATE TABLE IF NOT EXISTS states_visited (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  state_name TEXT NOT NULL UNIQUE,
  state_code TEXT,
  first_visited_at DATETIME,
  first_drive_id INTEGER,
  visit_count INTEGER DEFAULT 1,
  total_miles REAL DEFAULT 0,
  entry_latitude REAL,
  entry_longitude REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (first_drive_id) REFERENCES drives(id)
);

-- Media metadata (files stored in R2)
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_filename TEXT,
  mime_type TEXT,
  file_size INTEGER,
  r2_object_key TEXT UNIQUE NOT NULL,
  media_type TEXT, -- 'photo', 'video', 'audio', 'transcript'
  title TEXT,
  description TEXT,
  latitude REAL,
  longitude REAL,
  state_name TEXT,
  city TEXT,
  taken_at DATETIME,
  drive_id INTEGER,
  charge_id INTEGER,
  tags TEXT, -- JSON array
  transcription TEXT, -- For voice recordings
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (drive_id) REFERENCES drives(id),
  FOREIGN KEY (charge_id) REFERENCES charges(id)
);

-- Daily analytics
CREATE TABLE IF NOT EXISTS daily_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  total_drives INTEGER DEFAULT 0,
  total_distance_miles REAL DEFAULT 0,
  total_energy_used_kwh REAL DEFAULT 0,
  total_charges INTEGER DEFAULT 0,
  total_energy_added_kwh REAL DEFAULT 0,
  total_cost_usd REAL DEFAULT 0,
  efficiency_miles_per_kwh REAL,
  states_visited_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ingestion logs
CREATE TABLE IF NOT EXISTS ingestion_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation TEXT NOT NULL,
  records_processed INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT TRUE,
  errors TEXT,
  duration_ms INTEGER DEFAULT 0,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_drives_dates ON drives(started_at, ended_at);
CREATE INDEX IF NOT EXISTS idx_drives_states ON drives(start_state, end_state);
CREATE INDEX IF NOT EXISTS idx_charges_dates ON charges(started_at, ended_at);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(media_type);
CREATE INDEX IF NOT EXISTS idx_media_location ON media(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_vehicle_state_history_time ON vehicle_state_history(timestamp DESC);
`;

export class JourneyProvisioningService {
  private env: ProvisioningEnv;
  private accountId: string;
  private apiToken: string;

  constructor(env: ProvisioningEnv) {
    this.env = env;
    this.accountId = env.CLOUDFLARE_ACCOUNT_ID || '';
    this.apiToken = env.CLOUDFLARE_API_TOKEN || '';
  }

  /**
   * Check if provisioning is properly configured
   */
  isConfigured(): boolean {
    return !!(this.accountId && this.apiToken);
  }

  /**
   * Generate a safe database/bucket name from journey details
   */
  private generateResourceName(journeyId: string, prefix: string): string {
    // Cloudflare resource names: lowercase, alphanumeric, hyphens, max 63 chars
    const sanitized = journeyId
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 40);
    return `${prefix}-${sanitized}`;
  }

  /**
   * Create a new D1 database via Cloudflare API
   */
  async createD1Database(journeyId: string): Promise<{ id: string; name: string } | null> {
    if (!this.isConfigured()) {
      logger.error('Provisioning not configured: missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN');
      return null;
    }

    const dbName = this.generateResourceName(journeyId, 'journey-db');
    
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: dbName }),
        }
      );

      const data = await response.json() as any;
      
      if (!data.success) {
        logger.error('Failed to create D1 database', { errors: data.errors, journeyId });
        return null;
      }

      const dbId = data.result.uuid;
      logger.info('Created D1 database', { dbId, dbName, journeyId });

      // Apply schema to the new database
      await this.applySchemaToDatabase(dbId);

      return { id: dbId, name: dbName };
    } catch (error) {
      logger.error('Error creating D1 database', { error, journeyId });
      return null;
    }
  }

  /**
   * Apply the journey schema to a database
   */
  private async applySchemaToDatabase(databaseId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${databaseId}/raw`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sql: JOURNEY_SCHEMA }),
        }
      );

      const data = await response.json() as any;
      
      if (!data.success) {
        logger.error('Failed to apply schema to D1 database', { errors: data.errors, databaseId });
        return false;
      }

      logger.info('Applied schema to D1 database', { databaseId });
      return true;
    } catch (error) {
      logger.error('Error applying schema to D1 database', { error, databaseId });
      return false;
    }
  }

  /**
   * Create a new R2 bucket via Cloudflare API
   */
  async createR2Bucket(journeyId: string): Promise<string | null> {
    if (!this.isConfigured()) {
      logger.error('Provisioning not configured: missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN');
      return null;
    }

    const bucketName = this.generateResourceName(journeyId, 'journey-media');
    
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/r2/buckets`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: bucketName }),
        }
      );

      const data = await response.json() as any;
      
      if (!data.success) {
        // Check if bucket already exists (not an error for idempotency)
        const alreadyExists = data.errors?.some((e: any) => 
          e.message?.includes('already exists') || e.code === 10004
        );
        if (alreadyExists) {
          logger.info('R2 bucket already exists', { bucketName, journeyId });
          return bucketName;
        }
        logger.error('Failed to create R2 bucket', { errors: data.errors, journeyId });
        return null;
      }

      logger.info('Created R2 bucket', { bucketName, journeyId });
      return bucketName;
    } catch (error) {
      logger.error('Error creating R2 bucket', { error, journeyId });
      return null;
    }
  }

  /**
   * Register a new journey in the platform registry
   */
  async registerJourney(
    userId: string,
    name: string,
    options: {
      description?: string;
      vehicleVin?: string;
      tessieApiKey?: string;
    } = {}
  ): Promise<JourneyRegistration | null> {
    const journeyId = `journey-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    try {
      // Insert into registry with pending status
      await this.env.TESLA_DB.prepare(`
        INSERT INTO journey_registry (
          id, user_id, name, description, vehicle_vin, tessie_api_key,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      `).bind(
        journeyId,
        userId,
        name,
        options.description || null,
        options.vehicleVin || null,
        options.tessieApiKey || null,
        now,
        now
      ).run();

      return {
        id: journeyId,
        user_id: userId,
        name,
        description: options.description,
        vehicle_vin: options.vehicleVin,
        tessie_api_key: options.tessieApiKey,
        status: 'pending',
        created_at: now,
        updated_at: now,
      };
    } catch (error) {
      logger.error('Failed to register journey', { error, userId, name });
      return null;
    }
  }

  /**
   * Provision resources for a journey (D1 + R2)
   */
  async provisionJourney(journeyId: string): Promise<ProvisioningResult> {
    const errors: string[] = [];
    let d1Result: { id: string; name: string } | null = null;
    let r2BucketName: string | null = null;

    // Update status to provisioning
    await this.updateJourneyStatus(journeyId, 'provisioning');

    // Create D1 database
    d1Result = await this.createD1Database(journeyId);
    if (!d1Result) {
      errors.push('Failed to create D1 database');
    }

    // Create R2 bucket
    r2BucketName = await this.createR2Bucket(journeyId);
    if (!r2BucketName) {
      errors.push('Failed to create R2 bucket');
    }

    // Update journey registry with resource info
    if (d1Result || r2BucketName) {
      await this.env.TESLA_DB.prepare(`
        UPDATE journey_registry 
        SET d1_database_id = ?,
            d1_database_name = ?,
            r2_bucket_name = ?,
            status = ?,
            updated_at = ?
        WHERE id = ?
      `).bind(
        d1Result?.id || null,
        d1Result?.name || null,
        r2BucketName,
        errors.length === 0 ? 'active' : 'pending',
        new Date().toISOString(),
        journeyId
      ).run();
    }

    const success = errors.length === 0;
    if (success) {
      await this.updateJourneyStatus(journeyId, 'active');
    }

    return {
      success,
      journey_id: journeyId,
      d1_database_id: d1Result?.id,
      d1_database_name: d1Result?.name,
      r2_bucket_name: r2BucketName || undefined,
      errors,
    };
  }

  /**
   * Update journey status
   */
  private async updateJourneyStatus(journeyId: string, status: JourneyRegistration['status']): Promise<void> {
    await this.env.TESLA_DB.prepare(`
      UPDATE journey_registry SET status = ?, updated_at = ? WHERE id = ?
    `).bind(status, new Date().toISOString(), journeyId).run();
  }

  /**
   * Get journey by ID
   */
  async getJourney(journeyId: string): Promise<JourneyRegistration | null> {
    const result = await this.env.TESLA_DB.prepare(`
      SELECT * FROM journey_registry WHERE id = ?
    `).bind(journeyId).first<JourneyRegistration>();
    return result;
  }

  /**
   * List all journeys for a user
   */
  async listUserJourneys(userId: string): Promise<JourneyRegistration[]> {
    const result = await this.env.TESLA_DB.prepare(`
      SELECT * FROM journey_registry WHERE user_id = ? ORDER BY created_at DESC
    `).bind(userId).all<JourneyRegistration>();
    return result.results || [];
  }

  /**
   * Delete journey and its resources
   */
  async deleteJourney(journeyId: string): Promise<boolean> {
    const journey = await this.getJourney(journeyId);
    if (!journey) return false;

    const errors: string[] = [];

    // Delete D1 database if exists
    if (journey.d1_database_id) {
      try {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${journey.d1_database_id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${this.apiToken}`,
            },
          }
        );
        const data = await response.json() as any;
        if (!data.success) {
          errors.push(`Failed to delete D1: ${JSON.stringify(data.errors)}`);
        }
      } catch (error) {
        errors.push(`Error deleting D1: ${error}`);
      }
    }

    // Delete R2 bucket if exists (must be empty first)
    if (journey.r2_bucket_name) {
      try {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/r2/buckets/${journey.r2_bucket_name}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${this.apiToken}`,
            },
          }
        );
        const data = await response.json() as any;
        if (!data.success) {
          // Bucket might not be empty - log but continue
          logger.warn('Failed to delete R2 bucket (may not be empty)', { 
            bucket: journey.r2_bucket_name, 
            errors: data.errors 
          });
        }
      } catch (error) {
        errors.push(`Error deleting R2: ${error}`);
      }
    }

    // Mark as deleted in registry
    await this.updateJourneyStatus(journeyId, 'deleted');

    return errors.length === 0;
  }
}

