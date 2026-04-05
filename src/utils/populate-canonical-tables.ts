import { parse } from 'csv-parser';
import { createReadStream } from 'fs';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// Schema for raw Tessie drive export
const tessieDriveSchema = z.object({
  timestamp: z.string().datetime(),
  vin: z.string().length(17),
  odometer: z.number().nonnegative(),
  shift_state: z.enum(['P', 'R', 'N', 'D']),
  speed: z.number().nonnegative(),
  power: z.number(),
  energy: z.number(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// Schema for raw Tessie charge export
const tessieChargeSchema = z.object({
  timestamp: z.string().datetime(),
  vin: z.string().length(17),
  battery_level: z.number().min(0).max(100),
  charger_power: z.number().nonnegative().optional(),
  charger_voltage: z.number().nonnegative().optional(),
  charger_actual_current: z.number().nonnegative().optional(),
  charge_port_door_open: z.boolean(),
  charge_port_latch: z.enum(['Engaged', 'Disengaged']),
});

interface Env {
  DB: any; // D1Database binding provided at runtime
}

async function migrateDrives(env: Env, rows: any[]) {
  const stmt = env.DB.prepare(
    `INSERT INTO drives (
      id, vin, timestamp_start, timestamp_end,
      distance_km, energy_used_kwh,
      avg_speed_kph, max_speed_kph,
      start_odometer, end_odometer
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  // Group by trip: simple heuristic - same vin, shift_state changes P->D and D->P
  const trips: any[] = [];
  let currentTrip: any = null;

  for (const row of rows) {
    const validated = tessieDriveSchema.parse(row);
    const ts = new Date(validated.timestamp).getTime();

    if (validated.shift_state === 'P' && !currentTrip) {
      // Start of a potential trip
      currentTrip = {
        vin: validated.vin,
        start: ts,
        end: ts,
        startOdo: validated.odometer,
        endOdo: validated.odometer,
        distances: [],
        energies: [],
        speeds: [],
      };
    } else if (currentTrip) {
      currentTrip.end = ts;
      currentTrip.endOdo = validated.odometer;
      if (validated.speed !== null) {
        currentTrip.speeds.push(validated.speed);
      }
      if (validated.energy !== null) {
        currentTrip.energies.push(validated.energy);
      }
      // Approximate distance from odometer diff later
    }

    if (validated.shift_state === 'P' && currentTrip && currentTrip.endOdo !== currentTrip.startOdo) {
      // Trip ended
      trips.push(currentTrip);
      currentTrip = null;
    }
  }

  if (currentTrip) {
    trips.push(currentTrip);
  }

  for (const trip of trips) {
    const id = randomUUID();
    const distance = (trip.endOdo - trip.startOdo) / 1000; // km
    const energyUsed = trip.energies.reduce((a, b) => a + b, 0) / 1000; // kWh
    const avgSpeed = trip.speeds.length ? (trip.speeds.reduce((a, b) => a + b, 0) / trip.speeds.length) * 3.6 : 0; // kph
    const maxSpeed = trip.speeds.length ? Math.max(...trip.speeds) * 3.6 : 0;

    await stmt.bind(
      id,
      trip.vin,
      new Date(trip.start).toISOString(),
      new Date(trip.end).toISOString(),
      distance,
      energyUsed,
      avgSpeed,
      maxSpeed,
      trip.startOdo,
      trip.endOdo
    ).run();
    await stmt.reset();
  }
}

async function migrateCharges(env: Env, rows: any[]) {
  const stmt = env.DB.prepare(
    `INSERT INTO charges (
      id, vin, timestamp_start, timestamp_end,
      energy_added_kwh,
      charger_power_kw,
      start_battery_level,
      end_battery_level
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  // Simple charge session detection: same vin, battery_level increasing while plugged in
  const sessions: any[] = [];
  let current: any = null;

  for (const row of rows) {
    const validated = tessieChargeSchema.parse(row);
    const ts = new Date(validated.timestamp).getTime();

    if (!current) {
      current = {
        vin: validated.vin,
        start: ts,
        end: ts,
        startLevel: validated.battery_level,
        endLevel: validated.battery_level,
        powerSum: validated.charger_power ?? 0,
        powerCount: validated.charger_power ? 1 : 0,
      };
    } else if (current.vin === validated.vin) {
      current.end = ts;
      current.endLevel = validated.battery_level;
      if (validated.charger_power !== null) {
        current.powerSum += validated.charger_power;
        current.powerCount++;
      }
    }

    // Heuristic: session ends when battery level drops or charger power goes to 0 after charging
    if (validated.battery_level < current.endLevel || (validated.charger_power === 0 && current.powerCount > 0)) {
      sessions.push(current);
      current = null;
    }
  }

  if (current) {
    sessions.push(current);
  }

  for (const sess of sessions) {
    const id = randomUUID();
    const energyAdded = ((sess.endLevel - sess.startLevel) / 100) * 100; // Assume 100 kWh pack, adjust if needed
    const avgPower = sess.powerCount ? (sess.powerSum / sess.powerCount) : 0;

    await stmt.bind(
      id,
      sess.vin,
      new Date(sess.start).toISOString(),
      new Date(sess.end).toISOString(),
      energyAdded,
      avgPower,
      sess.startLevel,
      sess.endLevel
    ).run();
    await stmt.reset();
  }
}

async function runMigration() {
  // In a worker context, env is passed to fetch handler.
  // For this script we assume the DB binding is available via a global
  // injected by the runtime (e.g., when run with `wrangler dev` and --persist).
  // @ts-expect-error global DB binding
  const env: Env = { DB: DB };

  if (!env.DB) {
    throw new Error('Database binding not found. Ensure DB is defined in wrangler.toml.');
  }

  console.log('Starting migration from raw Tessie data...');

  // Paths to raw CSV exports (adjust as needed)
  const driveCsv = './data/raw-tessie-drives.csv';
  const chargeCsv = './data/raw-tessie-charges.csv';

  const driveRows: any[] = [];
  await new Promise<void>((resolve, reject) => {
    createReadStream(driveCsv)
      .pipe(parse({ headers: true, skipEmptyLines: true }))
      .on('data', (row) => driveRows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  const chargeRows: any[] = [];
  await new Promise<void>((resolve, reject) => {
    createReadStream(chargeCsv)
      .pipe(parse({ headers: true, skipEmptyLines: true }))
      .on('data', (row) => chargeRows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Parsed ${driveRows.length} drive rows and ${chargeRows.length} charge rows.`);

  // Optional: validate with zod (throws on invalid)
  driveRows.forEach(tessieDriveSchema.parse);
  chargeRows.forEach(tessieChargeSchema.parse);

  await migrateDrives(env, driveRows);
  await migrateCharges(env, chargeRows);

  console.log('Migration completed successfully.');
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

export { runMigration };
