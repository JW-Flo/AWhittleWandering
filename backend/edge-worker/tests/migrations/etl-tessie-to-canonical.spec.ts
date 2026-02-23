import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';

const schemaSql = readFileSync('migrations/0001_comprehensive_schema.sql', 'utf8');
const importSql = readFileSync('migrations/0006_journey_data_import.sql', 'utf8');
const etlSql = readFileSync('migrations/0007_etl_tessie_to_canonical.sql', 'utf8');

describe('0007 ETL tessie to canonical migration', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('is idempotent and refreshes state + journey aggregates deterministically', () => {
    const dir = mkdtempSync(join(tmpdir(), 'etl-migration-'));
    tempDirs.push(dir);
    const dbPath = join(dir, 'test.sqlite');

    const runSql = (sql: string): void => {
      execFileSync('sqlite3', [dbPath], { input: sql });
    };

    const queryJson = <T>(sql: string): T[] => {
      const raw = execFileSync('sqlite3', ['-json', dbPath, sql], { encoding: 'utf8' }).trim();
      return raw.length ? (JSON.parse(raw) as T[]) : [];
    };

    runSql(`${schemaSql}\n${importSql}`);

    runSql(`
      INSERT INTO vehicles (id, vin, display_name) VALUES ('veh-1', 'VIN12345678901234', 'Roadtrip');
      INSERT INTO journeys (id, vehicle_id, name, start_date) VALUES ('journey-1', 'veh-1', 'Test Journey', '2026-01-01');

      INSERT INTO drive_segments (
        journey_id, vehicle_id, dedup_key, start_time, end_time,
        start_address, end_address, start_latitude, start_longitude,
        end_latitude, end_longitude, start_state, end_state,
        distance_miles, duration_minutes, energy_used_kwh,
        avg_speed_mph, max_speed_mph, start_battery_level, end_battery_level
      ) VALUES
      (
        'journey-1', 'veh-1', 'seg-1', '2026-01-01T10:00:00Z', '2026-01-01T11:00:00Z',
        'Los Angeles, CA', 'Primm, NV', 34.05, -118.24,
        35.61, -115.39, 'CA', 'NV',
        100.0, 60, 25.0,
        65.0, 82.0, 90, 70
      ),
      (
        'journey-1', 'veh-1', 'seg-2', '2026-01-01T12:00:00Z', '2026-01-01T14:00:00Z',
        'Primm, NV', 'Cedar City, UT', 35.61, -115.39,
        37.68, -113.06, 'NV', 'UT',
        120.0, 120, 30.0,
        60.0, 80.0, 70, 40
      );

      INSERT INTO energy_events (
        journey_id, vehicle_id, dedup_key, event_type,
        start_time, end_time, location_name, latitude, longitude,
        state_name, city, charger_type, is_supercharger,
        energy_added_kwh, energy_used_kwh, cost_usd,
        avg_charge_rate_kw, peak_charge_rate_kw, start_battery_level, end_battery_level
      ) VALUES (
        'journey-1', 'veh-1', 'charge-1', 'charge',
        '2026-01-01T11:10:00Z', '2026-01-01T11:45:00Z', 'Primm Supercharger', 35.61, -115.39,
        'NV', 'Primm', 'Supercharger', 1,
        40.0, 2.0, 15.0,
        72.0, 150.0, 70, 85
      );
    `);

    runSql(etlSql);
    runSql(etlSql);

    const driveCounts = queryJson<{ count: number; sum_miles: number }>(
      "SELECT COUNT(*) AS count, ROUND(SUM(distance_miles), 3) AS sum_miles FROM drives WHERE journey_id = 'journey-1';"
    )[0];
    expect(driveCounts.count).toBe(2);
    expect(driveCounts.sum_miles).toBe(220);

    const chargeCounts = queryJson<{ count: number; sum_cost: number }>(
      "SELECT COUNT(*) AS count, ROUND(SUM(cost_usd), 3) AS sum_cost FROM charges WHERE journey_id = 'journey-1';"
    )[0];
    expect(chargeCounts.count).toBe(1);
    expect(chargeCounts.sum_cost).toBe(15);

    const stateCounts = queryJson<{ count: number }>(
      "SELECT COUNT(*) AS count FROM states_visited WHERE journey_id = 'journey-1';"
    )[0];
    expect(stateCounts.count).toBe(3);

    const totals = queryJson<{
      total_miles: number;
      total_drives: number;
      total_charges: number;
      total_energy_used_kwh: number;
      total_cost_usd: number;
      total_states: number;
      overall_efficiency_miles_per_kwh: number;
    }>(`
      SELECT
        total_miles,
        total_drives,
        total_charges,
        total_energy_used_kwh,
        total_cost_usd,
        total_states,
        overall_efficiency_miles_per_kwh
      FROM journeys
      WHERE id = 'journey-1';
    `)[0];

    expect(totals.total_miles).toBe(220);
    expect(totals.total_drives).toBe(2);
    expect(totals.total_charges).toBe(1);
    expect(totals.total_energy_used_kwh).toBe(57);
    expect(totals.total_cost_usd).toBe(15);
    expect(totals.total_states).toBe(3);
    expect(totals.overall_efficiency_miles_per_kwh).toBeCloseTo(220 / 57, 6);

    const tessieIds = queryJson<{ tessie_id: number }>(
      "SELECT tessie_id FROM drives WHERE journey_id = 'journey-1' ORDER BY tessie_id;"
    );
    expect(tessieIds.map((row) => row.tessie_id)).toEqual([-2, -1]);
  });
});
