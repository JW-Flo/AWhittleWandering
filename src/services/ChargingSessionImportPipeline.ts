import { RawChargingSessionData, ChargingSession } from '../types/ChargingSession';
import { normalizeChargingSessionData } from '../utils/dataValidation';

export class ChargingSessionImportPipeline {
  private rawData: RawChargingSessionData[];
  private processedSessions: ChargingSession[] = [];
  private errors: Error[] = [];

  constructor(rawData: RawChargingSessionData[]) {
    this.rawData = rawData;
  }

  public process(): void {
    this.processedSessions = [];
    this.errors = [];

    for (const sessionData of this.rawData) {
      try {
        const normalizedSession = normalizeChargingSessionData(sessionData);
        this.processedSessions.push(normalizedSession);
      } catch (error) {
        this.errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  public getProcessedSessions(): ChargingSession[] {
    return this.processedSessions;
  }

  public getErrors(): Error[] {
    return this.errors;
  }

  public hasErrors(): boolean {
    return this.errors.length > 0;
  }
}