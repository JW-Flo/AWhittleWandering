import { RawDriveData } from '../types/drive-record';
import { DriveRecordTransformer } from './drive-record-transformer';
import { DriveRecordLoader } from './drive-record-loader';
import { DatabaseClient } from '../database/client';

export class DriveRecordETL {
  private transformer: DriveRecordTransformer;
  private loader: DriveRecordLoader;

  constructor(dbClient: DatabaseClient) {
    this.transformer = new DriveRecordTransformer();
    this.loader = new DriveRecordLoader(dbClient);
  }

  async process(rawData: RawDriveData[]): Promise<void> {
    try {
      const transformedRecords = rawData.map(data => 
        DriveRecordTransformer.transform(data)
      );

      await this.loader.loadDriveRecords(transformedRecords);
    } catch (error) {
      console.error('Drive record ETL process failed:', error);
      throw error;
    }
  }
}