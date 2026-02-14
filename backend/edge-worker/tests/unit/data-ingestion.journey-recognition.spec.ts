import { describe, it, expect } from 'vitest';
import { TeslaDataIngestion } from '../../src/data-ingestion';

type FirstResponse = Record<string, unknown> | null;

class FakeDb {
  public insertedJourneyIds: string[] = [];
  constructor(private firstQueue: FirstResponse[]) {}

  prepare(query: string) {
    const db = this;
    let bound: unknown[] = [];

    return {
      bind(...values: unknown[]) {
        bound = values;
        return this;
      },
      async first<T = any>() {
        if (query.includes('SELECT COUNT(*) as cnt FROM journeys WHERE id LIKE')) {
          const next = db.firstQueue.shift();
          return (next ?? { cnt: 0 }) as T;
        }
        const next = db.firstQueue.shift();
        return (next ?? null) as T;
      },
      async run() {
        if (query.includes('INSERT OR IGNORE INTO journeys')) {
          db.insertedJourneyIds.push(String(bound[0]));
        }
        return { success: true, meta: { duration: 0, size_after: 0, rows_read: 0, rows_written: 1 } } as any;
      },
      async all<T = any>() {
        return { success: true, results: [] as T[], meta: { duration: 0, size_after: 0, rows_read: 0, rows_written: 0 } } as any;
      }
    };
  }

  async exec() {
    return { count: 0, duration: 0 };
  }

  async batch() {
    return [];
  }
}

describe('TeslaDataIngestion journey recognition', () => {
  it('reuses previous journey when the drive gap is short', async () => {
    const db = new FakeDb([{ 
      journey_id: 'continental-usa-2025', 
      ended_at: '2025-06-10T08:00:00Z',
      distance_miles: 50,
      end_latitude: 37.7749,
      end_longitude: -122.4194,
      end_state: 'CA'
    }]);
    const ingestion = new TeslaDataIngestion(db as any, 'token', 'VIN123');

    const journeyId = await (ingestion as any).resolveJourneyIdForDrive(
      '2025-06-10T18:00:00.000Z',
      45, // distance
      37.8044, // lat (nearby SF)
      -122.2711 // lon (nearby SF)
    );

    expect(journeyId).toBe('continental-usa-2025');
    expect(db.insertedJourneyIds).toEqual([]);
  });

  it('creates a new auto journey when there is a long drive gap', async () => {
    const db = new FakeDb([
      { 
        journey_id: 'continental-usa-2025', 
        ended_at: '2025-06-10T08:00:00Z',
        distance_miles: 50,
        end_latitude: 37.7749,
        end_longitude: -122.4194,
        end_state: 'CA'
      },
      { cnt: 1 }
    ]);
    const ingestion = new TeslaDataIngestion(db as any, 'token', 'VIN123');

    const journeyId = await (ingestion as any).resolveJourneyIdForDrive(
      '2025-06-11T23:00:00.000Z',
      30,
      37.8044,
      -122.2711
    );

    expect(journeyId).toBe('auto-20250611-02');
    expect(db.insertedJourneyIds).toContain('auto-20250611-02');
  });

  it('creates new journey for short casual drive after gap', async () => {
    const db = new FakeDb([
      { 
        journey_id: 'continental-usa-2025', 
        ended_at: '2025-06-10T08:00:00Z',
        distance_miles: 200,
        end_latitude: 37.7749,
        end_longitude: -122.4194,
        end_state: 'CA'
      },
      { cnt: 0 }
    ]);
    const ingestion = new TeslaDataIngestion(db as any, 'token', 'VIN123');

    // Short drive (5 miles) after 4-hour gap = casual errand, new journey
    const journeyId = await (ingestion as any).resolveJourneyIdForDrive(
      '2025-06-10T12:00:00.000Z',
      5, // short casual drive
      37.8044,
      -122.2711
    );

    expect(journeyId).toBe('auto-20250610-01');
    expect(db.insertedJourneyIds).toContain('auto-20250610-01');
  });

  it('reuses journey for short drive with very short gap (quick errand)', async () => {
    const db = new FakeDb([
      { 
        journey_id: 'continental-usa-2025', 
        ended_at: '2025-06-10T08:00:00Z',
        distance_miles: 200,
        end_latitude: 37.7749,
        end_longitude: -122.4194,
        end_state: 'CA'
      }
    ]);
    const ingestion = new TeslaDataIngestion(db as any, 'token', 'VIN123');

    // Short drive (5 miles) after 1-hour gap = quick errand during journey
    const journeyId = await (ingestion as any).resolveJourneyIdForDrive(
      '2025-06-10T09:00:00.000Z',
      5, // short drive
      37.8044,
      -122.2711
    );

    expect(journeyId).toBe('continental-usa-2025');
    expect(db.insertedJourneyIds).toEqual([]);
  });

  it('creates new journey when drives are far apart with long gap', async () => {
    const db = new FakeDb([
      { 
        journey_id: 'continental-usa-2025', 
        ended_at: '2025-06-10T08:00:00Z',
        distance_miles: 200,
        end_latitude: 37.7749, // San Francisco
        end_longitude: -122.4194,
        end_state: 'CA'
      },
      { cnt: 0 }
    ]);
    const ingestion = new TeslaDataIngestion(db as any, 'token', 'VIN123');

    // 14-hour gap, drives 400+ miles apart = new journey
    const journeyId = await (ingestion as any).resolveJourneyIdForDrive(
      '2025-06-10T22:00:00.000Z',
      50,
      34.0522, // Los Angeles (400+ miles away)
      -118.2437
    );

    expect(journeyId).toBe('auto-20250610-01');
    expect(db.insertedJourneyIds).toContain('auto-20250610-01');
  });

  it('reuses journey for overnight gap with nearby location (hotel stay)', async () => {
    const db = new FakeDb([
      { 
        journey_id: 'continental-usa-2025', 
        ended_at: '2025-06-10T22:00:00Z',
        distance_miles: 200,
        end_latitude: 37.7749,
        end_longitude: -122.4194,
        end_state: 'CA'
      }
    ]);
    const ingestion = new TeslaDataIngestion(db as any, 'token', 'VIN123');

    // 10-hour overnight gap, same location = hotel stay, continue journey
    const journeyId = await (ingestion as any).resolveJourneyIdForDrive(
      '2025-06-11T08:00:00.000Z',
      150,
      37.7800, // Very nearby (few blocks away)
      -122.4100
    );

    expect(journeyId).toBe('continental-usa-2025');
    expect(db.insertedJourneyIds).toEqual([]);
  });

  it('maps charges to an existing matching journey date window', async () => {
    const db = new FakeDb([{ id: 'auto-20250611-02' }]);
    const ingestion = new TeslaDataIngestion(db as any, 'token', 'VIN123');

    const journeyId = await (ingestion as any).resolveJourneyIdForCharge('2025-06-12T01:00:00.000Z');

    expect(journeyId).toBe('auto-20250611-02');
  });
});
