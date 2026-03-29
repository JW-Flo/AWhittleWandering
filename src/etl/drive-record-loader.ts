import { DriveRecord } from '../types/drive-record';
import { DatabaseClient } from '../database/client';

export class DriveRecordLoader {
  constructor(private dbClient: DatabaseClient) {}

  async loadDriveRecords(records: DriveRecord[]): Promise<void> {
    if (records.length === 0) {
      return;
    }

    try {
      const query = '
        INSERT INTO drive_records (
          id, 
          driver_id, 
          vehicle_id, 
          start_location, 
          end_location, 
          start_timestamp, 
          end_timestamp, 
          distance_miles, 
          duration_minutes, 
          status, 
          created_at, 
          updated_at
        ) VALUES ${this.generateValuePlaceholders(records)}
        ON CONFLICT (id) DO UPDATE SET
          start_location = EXCLUDED.start_location,
          end_location = EXCLUDED.end_location,
          end_timestamp = EXCLUDED.end_timestamp,
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
      ';

      const values = this.flattenRecords(records);
      await this.dbClient.query(query, values);
    } catch (error) {
      console.error('Error loading drive records:', error);
      throw error;
    }
  }

  private generateValuePlaceholders(records: DriveRecord[]): string {
    return records
      .map((_, index) => '(
        $${index * 12 + 1}, 
        $${index * 12 + 2}, 
        $${index * 12 + 3}, 
        $${index * 12 + 4}, 
        $${index * 12 + 5}, 
        $${index * 12 + 6}, 
        $${index * 12 + 7}, 
        $${index * 12 + 8}, 
        $${index * 12 + 9}, 
        $${index * 12 + 10}, 
        $${index * 12 + 11}, 
        $${index * 12 + 12}
      )')
      .join(', ');
  }

  private flattenRecords(records: DriveRecord[]): any[] {
    return records.flatMap(record => [
      record.id,
      record.driverId,
      record.vehicleId,
      record.startLocation,
      record.endLocation,
      record.startTimestamp,
      record.endTimestamp,
      record.distanceMiles,
      record.durationMinutes,
      record.status,
      record.createdAt,
      record.updatedAt
    ]);
  }
}