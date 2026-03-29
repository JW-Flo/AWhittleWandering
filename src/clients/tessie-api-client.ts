import axios from 'axios';
import { RawTelemetryRecord } from '../types/telemetry';

export class TessieApiClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.tessie.com') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async fetchTelemetry(
    startDate: Date, 
    endDate: Date
  ): Promise<RawTelemetryRecord[]> {
    try {
      const response = await axios.get('${this.baseUrl}/telemetry', {
        headers: { 'Authorization': 'Bearer ${this.apiKey}' },
        params: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        }
      });

      return response.data as RawTelemetryRecord[];
    } catch (error) {
      console.error('Failed to fetch telemetry from Tessie API:', error);
      throw error;
    }
  }
}