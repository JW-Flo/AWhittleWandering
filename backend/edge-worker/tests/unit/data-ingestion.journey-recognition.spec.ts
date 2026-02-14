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
        if (query.includes('SELECT purchased_date FROM vehicles')) {
          // Return null for purchased_date to use default behavior
          return (null as T);
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
    const db = new FakeDb([{ journey_id: 'continental-usa-2025', ended_at: '2025-06-10T08:00:00Z' }]);
    const ingestion = new TeslaDataIngestion(db as any, 'token', 'VIN123');

    const journeyId = await (ingestion as any).resolveJourneyIdForDrive('2025-06-10T18:00:00.000Z');

    expect(journeyId).toBe('continental-usa-2025');
    expect(db.insertedJourneyIds).toEqual([]);
  });

  it('creates a new auto journey when there is a long drive gap', async () => {
    const db = new FakeDb([
      { journey_id: 'continental-usa-2025', ended_at: '2025-06-10T08:00:00Z' },
      { cnt: 1 }
    ]);
    const ingestion = new TeslaDataIngestion(db as any, 'token', 'VIN123');

    const journeyId = await (ingestion as any).resolveJourneyIdForDrive('2025-06-11T23:00:00.000Z');

    expect(journeyId).toBe('auto-20250611-02');
    expect(db.insertedJourneyIds).toContain('auto-20250611-02');
  });

  it('maps charges to an existing matching journey date window', async () => {
    const db = new FakeDb([{ id: 'auto-20250611-02' }]);
    const ingestion = new TeslaDataIngestion(db as any, 'token', 'VIN123');

    const journeyId = await (ingestion as any).resolveJourneyIdForCharge('2025-06-12T01:00:00.000Z');

    expect(journeyId).toBe('auto-20250611-02');
  });

  it('handles invalid or unparseable drive startedAt values', async () => {
    const db = new FakeDb([]);
    const ingestion = new TeslaDataIngestion(db as any, 'token', 'VIN123');

    const promise = (ingestion as any).resolveJourneyIdForDrive('not-a-valid-date');

    await expect(promise).resolves.toBeDefined();
  });

  it('handles drives at date boundaries without failing', async () => {
    const db = new FakeDb([{ journey_id: 'boundary-test', ended_at: '2025-06-10T23:59:59Z' }]);
    const ingestion = new TeslaDataIngestion(db as any, 'token', 'VIN123');

    const journeyId = await (ingestion as any).resolveJourneyIdForDrive('2025-06-11T00:00:01.000Z');

    expect(typeof journeyId).toBe('string');
  });

  it('creates a journey when there are no existing journeys', async () => {
    const db = new FakeDb([]);
    const ingestion = new TeslaDataIngestion(db as any, 'token', 'VIN123');

    const journeyId = await (ingestion as any).resolveJourneyIdForDrive('2025-06-10T10:00:00.000Z');

    expect(journeyId).toBeDefined();
    expect(db.insertedJourneyIds).toContain(journeyId);
  });

  it('supports concurrent journey resolution without errors', async () => {
    const db = new FakeDb([]);
    const ingestion = new TeslaDataIngestion(db as any, 'token', 'VIN123');

    const startedAt = '2025-06-10T12:00:00.000Z';

    const [journeyId1, journeyId2] = await Promise.all([
      (ingestion as any).resolveJourneyIdForDrive(startedAt),
      (ingestion as any).resolveJourneyIdForDrive(startedAt)
    ]);

    expect(journeyId1).toBeDefined();
    expect(journeyId2).toBeDefined();
    expect(db.insertedJourneyIds.length).toBeGreaterThanOrEqual(1);
  });
});
