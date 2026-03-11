/**
 * Tests for Tesla CSV Importer
 *
 * Tests CSV parsing, validation, deduplication, and import logic
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  parseCSV,
  csvToObjects,
  generateDriveDedupeKey,
  generateEnergyDedupeKey,
  importTeslaDrives,
  importTeslaCharges,
} from '../../src/importers/tesla-csv';

describe('CSV Parser', () => {
  it('should parse simple CSV', () => {
    const csv = 'Name,Age,City\nJohn,30,NYC\nJane,25,LA';
    const rows = parseCSV(csv);

    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual(['Name', 'Age', 'City']);
    expect(rows[1]).toEqual(['John', '30', 'NYC']);
    expect(rows[2]).toEqual(['Jane', '25', 'LA']);
  });

  it('should handle quoted fields with commas', () => {
    const csv = 'Name,Address\nJohn,"123 Main St, Apt 4"\nJane,"456 Elm St"';
    const rows = parseCSV(csv);

    expect(rows).toHaveLength(3);
    expect(rows[1]).toEqual(['John', '123 Main St, Apt 4']);
    expect(rows[2]).toEqual(['Jane', '456 Elm St']);
  });

  it('should handle escaped quotes', () => {
    const csv = 'Name,Quote\nJohn,"He said ""Hello"""\nJane,"She said ""Hi"""';
    const rows = parseCSV(csv);

    expect(rows).toHaveLength(3);
    expect(rows[1]).toEqual(['John', 'He said "Hello"']);
    expect(rows[2]).toEqual(['Jane', 'She said "Hi"']);
  });

  it('should handle multiline quoted fields', () => {
    const csv = 'Name,Description\nJohn,"Line 1\nLine 2"\nJane,"Single line"';
    const rows = parseCSV(csv);

    expect(rows).toHaveLength(3);
    expect(rows[1]).toEqual(['John', 'Line 1\nLine 2']);
    expect(rows[2]).toEqual(['Jane', 'Single line']);
  });

  it('should handle CRLF line endings', () => {
    const csv = 'Name,Age\r\nJohn,30\r\nJane,25';
    const rows = parseCSV(csv);

    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual(['Name', 'Age']);
    expect(rows[1]).toEqual(['John', '30']);
  });

  it('should handle empty fields', () => {
    const csv = 'Name,Age,City\nJohn,,NYC\n,25,';
    const rows = parseCSV(csv);

    expect(rows).toHaveLength(3);
    expect(rows[1]).toEqual(['John', '', 'NYC']);
    expect(rows[2]).toEqual(['', '25', '']);
  });

  it('should handle malformed CSV gracefully', () => {
    const csv = 'Name,Age\nJohn,30\nJane'; // Missing field
    const rows = parseCSV(csv);

    expect(rows).toHaveLength(3);
    expect(rows[2]).toEqual(['Jane']); // Incomplete row
  });
});

describe('CSV to Objects', () => {
  it('should convert rows to objects using header row', () => {
    const rows = [
      ['Name', 'Age', 'City'],
      ['John', '30', 'NYC'],
      ['Jane', '25', 'LA'],
    ];

    const objects = csvToObjects(rows);

    expect(objects).toHaveLength(2);
    expect(objects[0]).toEqual({ Name: 'John', Age: '30', City: 'NYC' });
    expect(objects[1]).toEqual({ Name: 'Jane', Age: '25', City: 'LA' });
  });

  it('should handle empty CSV', () => {
    const rows: string[][] = [];
    const objects = csvToObjects(rows);

    expect(objects).toHaveLength(0);
  });

  it('should handle CSV with only header', () => {
    const rows = [['Name', 'Age', 'City']];
    const objects = csvToObjects(rows);

    expect(objects).toHaveLength(0);
  });
});

describe('Deduplication Keys', () => {
  it('should generate consistent drive dedup key', async () => {
    const key1 = await generateDriveDedupeKey(
      '2025-06-01T10:00:00Z',
      41.8781,
      -87.6298,
      40.7128,
      -74.0060
    );
    const key2 = await generateDriveDedupeKey(
      '2025-06-01T10:00:00Z',
      41.8781,
      -87.6298,
      40.7128,
      -74.0060
    );

    expect(key1).toBe(key2);
    expect(key1).toHaveLength(32); // SHA-256 hash truncated to 32 chars
  });

  it('should generate different keys for different drives', async () => {
    const key1 = await generateDriveDedupeKey(
      '2025-06-01T10:00:00Z',
      41.8781,
      -87.6298,
      40.7128,
      -74.0060
    );
    const key2 = await generateDriveDedupeKey(
      '2025-06-01T11:00:00Z', // Different time
      41.8781,
      -87.6298,
      40.7128,
      -74.0060
    );

    expect(key1).not.toBe(key2);
  });

  it('should generate consistent energy dedup key', async () => {
    const key1 = await generateEnergyDedupeKey(
      '2025-06-01T10:00:00Z',
      41.8781,
      -87.6298,
      50.5
    );
    const key2 = await generateEnergyDedupeKey(
      '2025-06-01T10:00:00Z',
      41.8781,
      -87.6298,
      50.5
    );

    expect(key1).toBe(key2);
    expect(key1).toHaveLength(32);
  });

  it('should generate different keys for different energy events', async () => {
    const key1 = await generateEnergyDedupeKey(
      '2025-06-01T10:00:00Z',
      41.8781,
      -87.6298,
      50.5
    );
    const key2 = await generateEnergyDedupeKey(
      '2025-06-01T10:00:00Z',
      41.8781,
      -87.6298,
      60.5 // Different energy
    );

    expect(key1).not.toBe(key2);
  });

  it('should handle coordinate precision correctly', async () => {
    // Keys should be different when coordinates differ at 6 decimal precision
    const key1 = await generateDriveDedupeKey(
      '2025-06-01T10:00:00Z',
      41.878136,
      -87.629798,
      40.712775,
      -74.005973
    );
    const key2 = await generateDriveDedupeKey(
      '2025-06-01T10:00:00Z',
      41.878137, // Different at 6th decimal
      -87.629799,
      40.712776,
      -74.005974
    );

    // Should be different since coordinates differ at 6 decimal precision
    expect(key1).not.toBe(key2);

    // Keys should be the same when differences are beyond 6 decimal precision
    const key3 = await generateDriveDedupeKey(
      '2025-06-01T10:00:00Z',
      41.8781361111, // Extra precision beyond 6 decimals
      -87.6297981111,
      40.7127751111,
      -74.0059731111
    );
    const key4 = await generateDriveDedupeKey(
      '2025-06-01T10:00:00Z',
      41.8781362222, // Different in 7th decimal, but rounds to same 6 decimals
      -87.6297982222,
      40.7127752222,
      -74.0059732222
    );

    // Should be the same due to 6 decimal precision rounding
    expect(key3).toBe(key4);
  });
});

describe('Tesla Drive Import', () => {
  // Mock D1 database for testing
  class MockD1Database {
    private data: Map<string, any[]> = new Map();

    prepare(sql: string) {
      return {
        bind: (...params: any[]) => {
          return {
            run: async () => {
              // Simulate deduplication - if SQL contains ON CONFLICT, check if key exists
              if (sql.includes('ON CONFLICT')) {
                // tessie_id is the first param (index 0) for drives table
                const uniqueKey = params[0];
                const table = sql.includes('drives') ? 'drives' : 'drive_segments';
                const existing = this.data.get(table) || [];
                const isDuplicate = existing.some((row: any) => row.unique_key === uniqueKey);

                if (!isDuplicate) {
                  this.data.set(table, [...existing, { unique_key: uniqueKey, ...params }]);
                  return { meta: { changes: 1 } };
                }
                return { meta: { changes: 0 } }; // Duplicate
              }
              return { meta: { changes: 1 } };
            },
          };
        },
      };
    }

    async batch(statements: any[]) {
      const results = [];
      for (const stmt of statements) {
        results.push(await stmt.run());
      }
      return results;
    }
  }

  it('should import valid drive CSV', async () => {
    const csv = `Start Time,End Time,Start Latitude,Start Longitude,End Latitude,End Longitude,Distance (mi),Energy Used (kWh),Start Battery,End Battery,Average Speed (mph),Max Speed (mph)
2025-06-01T10:00:00Z,2025-06-01T12:00:00Z,41.8781,-87.6298,40.7128,-74.0060,791.8,250.5,95,20,65.5,80.0
2025-06-01T14:00:00Z,2025-06-01T16:00:00Z,40.7128,-74.0060,42.3601,-71.0589,215.3,68.2,90,35,60.2,75.0`;

    const db = new MockD1Database() as unknown as D1Database;
    const result = await importTeslaDrives(db, csv, 'test-journey', 'test-vehicle');

    expect(result.success).toBe(true);
    expect(result.recordsProcessed).toBe(2);
    expect(result.recordsImported).toBe(2);
    expect(result.recordsSkipped).toBe(0);
    expect(result.recordsFailed).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('should skip duplicate drives', async () => {
    const csv = `Start Time,End Time,Start Latitude,Start Longitude,End Latitude,End Longitude,Distance (mi)
2025-06-01T10:00:00Z,2025-06-01T12:00:00Z,41.8781,-87.6298,40.7128,-74.0060,791.8
2025-06-01T10:00:00Z,2025-06-01T12:00:00Z,41.8781,-87.6298,40.7128,-74.0060,791.8`;

    const db = new MockD1Database() as unknown as D1Database;
    const result = await importTeslaDrives(db, csv, 'test-journey', 'test-vehicle');

    expect(result.recordsProcessed).toBe(2);
    expect(result.recordsImported).toBe(1);
    expect(result.recordsSkipped).toBe(1); // Second is duplicate
  });

  it('should handle malformed drive data', async () => {
    const csv = `Start Time,End Time,Start Latitude,Start Longitude,End Latitude,End Longitude,Distance (mi)
2025-06-01T10:00:00Z,2025-06-01T12:00:00Z,invalid,invalid,40.7128,-74.0060,791.8`;

    const db = new MockD1Database() as unknown as D1Database;
    const result = await importTeslaDrives(db, csv, 'test-journey', 'test-vehicle');

    expect(result.recordsProcessed).toBe(1);
    expect(result.recordsImported).toBe(1); // parseNumber handles invalid values with defaults
  });

  it('should handle empty CSV', async () => {
    const csv = '';

    const db = new MockD1Database() as unknown as D1Database;
    const result = await importTeslaDrives(db, csv, 'test-journey', 'test-vehicle');

    expect(result.recordsProcessed).toBe(0);
    expect(result.recordsImported).toBe(0);
  });
});

describe('Tesla Charge Import', () => {
  class MockD1Database {
    private data: Map<string, any[]> = new Map();

    prepare(sql: string) {
      return {
        bind: (...params: any[]) => {
          return {
            run: async () => {
              if (sql.includes('ON CONFLICT')) {
                const uniqueKey = params[0];
                const table = 'charges';
                const existing = this.data.get(table) || [];
                const isDuplicate = existing.some((row: any) => row.unique_key === uniqueKey);

                if (!isDuplicate) {
                  this.data.set(table, [...existing, { unique_key: uniqueKey, ...params }]);
                  return { meta: { changes: 1 } };
                }
                return { meta: { changes: 0 } };
              }
              return { meta: { changes: 1 } };
            },
          };
        },
      };
    }

    async batch(statements: any[]) {
      const results = [];
      for (const stmt of statements) {
        results.push(await stmt.run());
      }
      return results;
    }
  }

  it('should import valid charge CSV', async () => {
    const csv = `Start Time,End Time,Latitude,Longitude,Energy Added (kWh),Start Battery,End Battery,Cost,Is Supercharger
2025-06-01T12:30:00Z,2025-06-01T13:00:00Z,40.7128,-74.0060,45.5,20,75,12.50,true
2025-06-01T18:00:00Z,2025-06-01T18:45:00Z,42.3601,-71.0589,38.2,35,80,10.20,true`;

    const db = new MockD1Database() as unknown as D1Database;
    const result = await importTeslaCharges(db, csv, 'test-journey', 'test-vehicle');

    expect(result.success).toBe(true);
    expect(result.recordsProcessed).toBe(2);
    expect(result.recordsImported).toBe(2);
    expect(result.recordsSkipped).toBe(0);
    expect(result.recordsFailed).toBe(0);
  });

  it('should skip duplicate charges', async () => {
    const csv = `Start Time,End Time,Latitude,Longitude,Energy Added (kWh)
2025-06-01T12:30:00Z,2025-06-01T13:00:00Z,40.7128,-74.0060,45.5
2025-06-01T12:30:00Z,2025-06-01T13:00:00Z,40.7128,-74.0060,45.5`;

    const db = new MockD1Database() as unknown as D1Database;
    const result = await importTeslaCharges(db, csv, 'test-journey', 'test-vehicle');

    expect(result.recordsProcessed).toBe(2);
    expect(result.recordsImported).toBe(1);
    expect(result.recordsSkipped).toBe(1);
  });

  it('should handle empty CSV', async () => {
    const csv = '';

    const db = new MockD1Database() as unknown as D1Database;
    const result = await importTeslaCharges(db, csv, 'test-journey', 'test-vehicle');

    expect(result.recordsProcessed).toBe(0);
    expect(result.recordsImported).toBe(0);
  });
});
