import { RawTelemetryRecord } from '../types/telemetry';
import { TessieApiClient } from '../clients/tessie-api-client';

export class TelemetryExtractor {
  private apiClient: TessieApiClient;

  constructor(apiClient: TessieApiClient) {
    this.apiClient = apiClient;
  }

  async extract(startDate: Date, endDate: Date): Promise<RawTelemetryRecord[]> {
    try {
      const rawRecords = await this.apiClient.fetchTelemetry(startDate, endDate);
      return rawRecords;
    } catch (error) {
      console.error('Failed to extract telemetry records:', error);
      throw error;
    }
  }
}