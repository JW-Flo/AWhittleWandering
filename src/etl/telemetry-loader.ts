import { UnifiedTelemetryRecord } from '../types/telemetry';
import { Database } from '../database/database';

export class TelemetryLoader {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  async load(records: UnifiedTelemetryRecord[]): Promise<void> {
    try {
      await this.db.bulkInsert('unified_telemetry', records);
    } catch (error) {
      console.error('Failed to load telemetry records:', error);
      throw error;
    }
  }
}