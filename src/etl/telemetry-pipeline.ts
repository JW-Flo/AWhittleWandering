import { TelemetryExtractor } from './telemetry-extractor';
import { TelemetryTransformer } from './telemetry-transformer';
import { TelemetryLoader } from './telemetry-loader';
import { TessieApiClient } from '../clients/tessie-api-client';
import { Database } from '../database/database';

export class TelemetryPipeline {
  private extractor: TelemetryExtractor;
  private loader: TelemetryLoader;

  constructor(apiClient: TessieApiClient, database: Database) {
    this.extractor = new TelemetryExtractor(apiClient);
    this.loader = new TelemetryLoader(database);
  }

  async run(startDate: Date, endDate: Date): Promise<void> {
    try {
      const rawRecords = await this.extractor.extract(startDate, endDate);
      
      const unifiedRecords = rawRecords.map(record => 
        TelemetryTransformer.transform(record)
      );

      await this.loader.load(unifiedRecords);

      console.log('Processed ${unifiedRecords.length} telemetry records');
    } catch (error) {
      console.error('Telemetry pipeline failed:', error);
      throw error;
    }
  }
}