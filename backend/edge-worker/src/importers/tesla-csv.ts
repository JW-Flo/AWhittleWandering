/**
 * Tesla CSV Importer
 *
 * Handles parsing and importing Tesla drive and charge data from CSV files
 * with proper validation, deduplication, and error handling.
 */

import { z } from 'zod';

// =====================================================
// CSV PARSING UTILITIES
// =====================================================

/**
 * Parse CSV with proper quote handling
 * Handles quoted fields, escaped quotes, and multiline fields
 */
export function parseCSV(csvContent: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++; // Skip next quote
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
      } else if (char === ',') {
        // End of field
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' || char === '\r') {
        // End of row
        if (currentField || currentRow.length > 0) {
          currentRow.push(currentField.trim());
          if (currentRow.some(f => f.length > 0)) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentField = '';
        }
        // Skip \r\n
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else {
        currentField += char;
      }
    }
  }

  // Add last field and row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(f => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Convert CSV rows to objects using header row
 */
export function csvToObjects<T>(rows: string[][]): T[] {
  if (rows.length === 0) return [];

  const headers = rows[0];
  const data = rows.slice(1);

  return data.map(row => {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj as T;
  });
}

// =====================================================
// HEADER NORMALIZATION (Tessie export → internal format)
// =====================================================

/**
 * Map Tessie CSV export headers to internal format.
 * Tessie uses verbose headers like "Started At (CST)" while
 * we use simplified "Start Time" internally.
 */
const TESSIE_DRIVE_HEADER_MAP: Record<string, string> = {
  'Started At (CST)': 'Start Time',
  'Started At (EST)': 'Start Time',
  'Started At (PST)': 'Start Time',
  'Started At (UTC)': 'Start Time',
  'Started At': 'Start Time',
  'Ended At (CST)': 'End Time',
  'Ended At (EST)': 'End Time',
  'Ended At (PST)': 'End Time',
  'Ended At (UTC)': 'End Time',
  'Ended At': 'End Time',
  'Tag': 'Tag',
  'Duration (Minutes)': 'Duration (minutes)',
  'Starting Location': 'Start Address',
  'Starting Saved Location': 'Start Saved Location',
  'Starting Latitude': 'Start Latitude',
  'Starting Longitude': 'Start Longitude',
  'Starting Odometer (mi)': 'Odometer (start)',
  'Ending Location': 'End Address',
  'Ending Saved Location': 'End Saved Location',
  'Ending Latitude': 'End Latitude',
  'Ending Longitude': 'End Longitude',
  'Ending Odometer (mi)': 'Odometer (end)',
  'Starting Battery (%)': 'Start Battery',
  'Ending Battery (%)': 'End Battery',
  'Average Inside Temperature (°F)': 'Inside Temp (avg)',
  'Average Outside Temperature (°F)': 'Outside Temp (avg)',
  'Average Speed (mph)': 'Average Speed (mph)',
  'Max Speed (mph)': 'Max Speed (mph)',
  'Rated Range Used (mi)': 'Rated Range Used (mi)',
  'Ideal Range Used (mi)': 'Ideal Range Used (mi)',
  'Distance (mi)': 'Distance (mi)',
  'Total Energy Used (kWh)': 'Energy Used (kWh)',
  'Average Energy Used (Wh/mi)': 'Average Energy Used (Wh/mi)',
};

const TESSIE_CHARGE_HEADER_MAP: Record<string, string> = {
  'Started At (CST)': 'Start Time',
  'Started At (EST)': 'Start Time',
  'Started At (PST)': 'Start Time',
  'Started At (UTC)': 'Start Time',
  'Started At': 'Start Time',
  'Ended At (CST)': 'End Time',
  'Ended At (EST)': 'End Time',
  'Ended At (PST)': 'End Time',
  'Ended At (UTC)': 'End Time',
  'Ended At': 'End Time',
  'Charge Energy Added (kWh)': 'Energy Added (kWh)',
  'Energy Added (kWh)': 'Energy Added (kWh)',
  'Charger Type': 'Charger Type',
  'Is Supercharger': 'Is Supercharger',
  'Duration (Minutes)': 'Duration (minutes)',
};

/**
 * Normalize CSV headers by applying header map.
 * If a header doesn't have a mapping, keep it as-is.
 */
function normalizeHeaders(rows: string[][], headerMap: Record<string, string>): string[][] {
  if (rows.length === 0) return rows;
  const normalized = [...rows];
  normalized[0] = rows[0].map(h => headerMap[h] || h);
  return normalized;
}

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

/**
 * Tesla Drive CSV Row Schema (accepts both Tessie export and internal format)
 */
const TeslaDriveRowSchema = z.object({
  // Temporal
  'Start Time': z.string(),
  'End Time': z.string(),

  // Location
  'Start Address': z.string().optional(),
  'End Address': z.string().optional(),
  'Start Latitude': z.string(),
  'Start Longitude': z.string(),
  'End Latitude': z.string(),
  'End Longitude': z.string(),

  // Distance and energy
  'Distance (mi)': z.string(),
  'Energy Used (kWh)': z.string().optional(),

  // Battery
  'Start Battery': z.string().optional(),
  'End Battery': z.string().optional(),

  // Speed
  'Average Speed (mph)': z.string().optional(),
  'Max Speed (mph)': z.string().optional(),

  // Temperature
  'Outside Temp (avg)': z.string().optional(),
  'Inside Temp (avg)': z.string().optional(),

  // Additional fields
  'Tag': z.string().optional(),
  'Duration (minutes)': z.string().optional(),
  'Odometer (start)': z.string().optional(),
  'Odometer (end)': z.string().optional(),
  'Rated Range Used (mi)': z.string().optional(),
}).passthrough(); // Allow additional fields

/**
 * Tesla Charge CSV Row Schema
 */
const TeslaChargeRowSchema = z.object({
  // Temporal
  'Start Time': z.string(),
  'End Time': z.string().optional(),

  // Location
  'Location': z.string().optional(),
  'Latitude': z.string(),
  'Longitude': z.string(),

  // Charger info
  'Charger Type': z.string().optional(),
  'Is Supercharger': z.string().optional(),

  // Energy
  'Energy Added (kWh)': z.string(),
  'Energy Used (kWh)': z.string().optional(),

  // Battery
  'Start Battery': z.string().optional(),
  'End Battery': z.string().optional(),

  // Cost
  'Cost': z.string().optional(),

  // Additional fields
  'Duration (minutes)': z.string().optional(),
  'Odometer': z.string().optional(),
}).passthrough();

export type TeslaDriveRow = z.infer<typeof TeslaDriveRowSchema>;
export type TeslaChargeRow = z.infer<typeof TeslaChargeRowSchema>;

// =====================================================
// DEDUPLICATION
// =====================================================

/**
 * Generate SHA-256 hash using Web Crypto API
 * Returns first 32 characters of hex-encoded hash
 */
async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 32);
}

/**
 * Generate deduplication key for drive segment
 * Hash of: start_time + start_lat + start_lng + end_lat + end_lng
 */
export async function generateDriveDedupeKey(
  startTime: string,
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<string> {
  const data = `${startTime}|${startLat.toFixed(6)}|${startLng.toFixed(6)}|${endLat.toFixed(6)}|${endLng.toFixed(6)}`;
  return generateHash(data);
}

/**
 * Generate deduplication key for energy event
 * Hash of: start_time + latitude + longitude + energy_added
 */
export async function generateEnergyDedupeKey(
  startTime: string,
  lat: number,
  lng: number,
  energyAdded: number
): Promise<string> {
  const data = `${startTime}|${lat.toFixed(6)}|${lng.toFixed(6)}|${energyAdded.toFixed(2)}`;
  return generateHash(data);
}

// =====================================================
// IMPORT FUNCTIONS
// =====================================================

export interface ImportResult {
  success: boolean;
  recordsProcessed: number;
  recordsImported: number;
  recordsSkipped: number;
  recordsFailed: number;
  errors: Array<{ row: number; error: string; data?: any }>;
  duration: number;
}

/**
 * Safe number parsing
 */
function parseNumber(value: string | undefined, defaultValue: number = 0): number {
  if (!value) return defaultValue;
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Safe integer parsing
 */
function parseInt(value: string | undefined, defaultValue: number = 0): number {
  if (!value) return defaultValue;
  const num = Number.parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Safe boolean parsing
 */
function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
}

/**
 * Extract US state name from a Tessie address string.
 * Addresses typically look like: "Street, City, State ZIP, United States"
 */
function extractStateName(address: string | undefined | null): string | null {
  if (!address) return null;
  // Match ", State ZIP," or ", State ZIP" at end
  const match = address.match(/,\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+\d{5}/);
  if (match) return match[1];
  // Fallback: try second-to-last comma-segment (for addresses like "City, State, Country")
  const parts = address.split(',').map(s => s.trim());
  if (parts.length >= 3) {
    const stateCandidate = parts[parts.length - 2].replace(/\d{5}.*/, '').trim();
    if (stateCandidate && /^[A-Z][a-z]/.test(stateCandidate)) return stateCandidate;
  }
  return null;
}

/**
 * Convert a dedup hash string to a deterministic integer for tessie_id.
 * Uses first 8 hex chars → 32-bit integer.
 */
function hashToTessieId(hash: string): number {
  return Number.parseInt(hash.substring(0, 8), 16);
}

/**
 * Import Tesla drives from CSV into the `drives` table.
 * Normalizes Tessie CSV headers, validates rows, and writes with dedup via tessie_id.
 */
export async function importTeslaDrives(
  db: D1Database,
  csvContent: string,
  journeyId: string,
  vehicleId: string
): Promise<ImportResult> {
  const startTime = Date.now();
  const errors: ImportResult['errors'] = [];
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  try {
    // Parse CSV and normalize Tessie headers to internal format
    const rawRows = parseCSV(csvContent);
    const rows = normalizeHeaders(rawRows, TESSIE_DRIVE_HEADER_MAP);
    const objects = csvToObjects<TeslaDriveRow>(rows);

    // Process in batches (D1 limit: 500 statements per batch)
    const BATCH_SIZE = 100; // conservative to stay within CPU limits

    for (let i = 0; i < objects.length; i += BATCH_SIZE) {
      const batch = objects.slice(i, i + BATCH_SIZE);
      const statements: D1PreparedStatement[] = [];

      for (let j = 0; j < batch.length; j++) {
        const rowIndex = i + j + 2; // +2 for header row and 0-indexing
        const row = batch[j];

        try {
          // Validate row against schema
          const validated = TeslaDriveRowSchema.parse(row);

          // Parse coordinates
          const startLat = parseNumber(validated['Start Latitude']);
          const startLng = parseNumber(validated['Start Longitude']);
          const endLat = parseNumber(validated['End Latitude']);
          const endLng = parseNumber(validated['End Longitude']);
          const driveStartTime = validated['Start Time'];

          // Generate deterministic tessie_id from hash for deduplication
          const dedupHash = await generateDriveDedupeKey(driveStartTime, startLat, startLng, endLat, endLng);
          const tessieId = hashToTessieId(dedupHash);

          // Parse numeric fields
          const duration = parseInt(validated['Duration (minutes)']);
          const distance = parseNumber(validated['Distance (mi)']);
          const energyUsed = parseNumber(validated['Energy Used (kWh)']);
          const efficiency = energyUsed > 0 ? distance / energyUsed : 0;
          const ratedRangeUsed = parseNumber(validated['Rated Range Used (mi)']);

          // Extract state names from addresses
          const startAddress = validated['Start Address'] || null;
          const endAddress = validated['End Address'] || null;
          const startState = extractStateName(startAddress);
          const endState = extractStateName(endAddress);

          // Insert into `drives` table (canonical table read by unified-data API)
          const stmt = db.prepare(`
            INSERT INTO drives (
              tessie_id, vehicle_id, journey_id,
              started_at, ended_at,
              start_address, end_address,
              start_latitude, start_longitude, end_latitude, end_longitude,
              start_state, end_state,
              distance_miles, duration_minutes, energy_used_kwh,
              average_speed, max_speed,
              start_battery_level, end_battery_level,
              rated_range_used, outside_temp_avg, average_inside_temp,
              drive_tag, efficiency_miles_per_kwh
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(tessie_id) DO NOTHING
          `).bind(
            tessieId,
            vehicleId,
            journeyId,
            validated['Start Time'],
            validated['End Time'],
            startAddress,
            endAddress,
            startLat,
            startLng,
            endLat,
            endLng,
            startState,
            endState,
            distance,
            duration,
            energyUsed,
            parseNumber(validated['Average Speed (mph)']),
            parseNumber(validated['Max Speed (mph)']),
            parseInt(validated['Start Battery']),
            parseInt(validated['End Battery']),
            ratedRangeUsed,
            parseNumber(validated['Outside Temp (avg)']),
            parseNumber(validated['Inside Temp (avg)']),
            validated['Tag'] || null,
            efficiency
          );

          statements.push(stmt);
        } catch (err: any) {
          failed++;
          errors.push({
            row: rowIndex,
            error: err.message || String(err),
            data: row
          });
        }
      }

      // Execute batch
      if (statements.length > 0) {
        const results = await db.batch(statements);
        const insertedCount = results.filter(r => (r.meta as any).changes > 0).length;
        imported += insertedCount;
        skipped += (statements.length - insertedCount);
      }
    }

    return {
      success: failed === 0,
      recordsProcessed: objects.length,
      recordsImported: imported,
      recordsSkipped: skipped,
      recordsFailed: failed,
      errors,
      duration: Date.now() - startTime
    };
  } catch (err: any) {
    return {
      success: false,
      recordsProcessed: 0,
      recordsImported: 0,
      recordsSkipped: 0,
      recordsFailed: 0,
      errors: [{ row: 0, error: `Fatal error: ${err.message || String(err)}` }],
      duration: Date.now() - startTime
    };
  }
}

/**
 * Import Tesla charges from CSV
 */
export async function importTeslaCharges(
  db: D1Database,
  csvContent: string,
  journeyId: string,
  vehicleId: string
): Promise<ImportResult> {
  const startTime = Date.now();
  const errors: ImportResult['errors'] = [];
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  try {
    // Parse CSV
    const rows = parseCSV(csvContent);
    const objects = csvToObjects<TeslaChargeRow>(rows);

    // Process in batches
    const BATCH_SIZE = 500;

    for (let i = 0; i < objects.length; i += BATCH_SIZE) {
      const batch = objects.slice(i, i + BATCH_SIZE);
      const statements: D1PreparedStatement[] = [];

      for (let j = 0; j < batch.length; j++) {
        const rowIndex = i + j + 2;
        const row = batch[j];

        try {
          // Validate row
          const validated = TeslaChargeRowSchema.parse(row);

          // Parse data
          const lat = parseNumber(validated['Latitude']);
          const lng = parseNumber(validated['Longitude']);
          const startTime = validated['Start Time'];
          const energyAdded = parseNumber(validated['Energy Added (kWh)']);

          // Generate dedup key
          const dedupKey = await generateEnergyDedupeKey(startTime, lat, lng, energyAdded);

          // Calculate duration
          const duration = validated['Duration (minutes)']
            ? parseInt(validated['Duration (minutes)'])
            : 0;

          // Calculate efficiency
          const energyUsed = parseNumber(validated['Energy Used (kWh)']);
          const efficiency = energyUsed > 0 ? (energyAdded / energyUsed) * 100 : 100;

          // Battery delta
          const startBattery = parseInt(validated['Start Battery']);
          const endBattery = parseInt(validated['End Battery']);
          const batteryDelta = endBattery - startBattery;

          // Determine charger type
          const isSupercharger = parseBoolean(validated['Is Supercharger']);
          const chargerType = validated['Charger Type'] || (isSupercharger ? 'Supercharger' : 'Level2');

          // Prepare insert statement
          const stmt = db.prepare(`
            INSERT INTO energy_events (
              journey_id, vehicle_id, dedup_key, event_type,
              start_time, end_time, duration_minutes,
              location_name, latitude, longitude,
              charger_type, is_supercharger,
              energy_added_kwh, energy_used_kwh, charge_efficiency_percent,
              start_battery_level, end_battery_level, battery_delta,
              cost_usd, odometer,
              import_source, import_timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(dedup_key) DO NOTHING
          `).bind(
            journeyId,
            vehicleId,
            dedupKey,
            'charge',
            validated['Start Time'],
            validated['End Time'] || null,
            duration,
            validated['Location'] || null,
            lat,
            lng,
            chargerType,
            isSupercharger ? 1 : 0,
            energyAdded,
            energyUsed,
            efficiency,
            startBattery,
            endBattery,
            batteryDelta,
            parseNumber(validated['Cost']),
            parseNumber(validated['Odometer']),
            'csv'
          );

          statements.push(stmt);
        } catch (err: any) {
          failed++;
          errors.push({
            row: rowIndex,
            error: err.message || String(err),
            data: row
          });
        }
      }

      // Execute batch
      if (statements.length > 0) {
        const results = await db.batch(statements);
        const insertedCount = results.filter(r => (r.meta as any).changes > 0).length;
        imported += insertedCount;
        skipped += (statements.length - insertedCount);
      }
    }

    return {
      success: failed === 0,
      recordsProcessed: objects.length,
      recordsImported: imported,
      recordsSkipped: skipped,
      recordsFailed: failed,
      errors,
      duration: Date.now() - startTime
    };
  } catch (err: any) {
    return {
      success: false,
      recordsProcessed: 0,
      recordsImported: 0,
      recordsSkipped: 0,
      recordsFailed: 0,
      errors: [{ row: 0, error: `Fatal error: ${err.message || String(err)}` }],
      duration: Date.now() - startTime
    };
  }
}
