import { RawTelemetryRecord, UnifiedTelemetryRecord } from '../types/telemetry';
import { v4 as uuidv4 } from 'uuid';

export class TelemetryTransformer {
  static transform(rawRecord: RawTelemetryRecord): UnifiedTelemetryRecord {
    if (!this.validateRecord(rawRecord)) {
      throw new Error('Invalid telemetry record');
    }

    return {
      id: uuidv4(),
      vehicleId: rawRecord.vehicleId,
      recordedAt: new Date(rawRecord.timestamp),
      batteryPercentage: rawRecord.batteryLevel,
      chargingStatus: rawRecord.chargeState,
      location: {
        latitude: rawRecord.latitude,
        longitude: rawRecord.longitude
      },
      speedKph: rawRecord.speed,
      odometerMiles: rawRecord.odometer
    };
  }

  private static validateRecord(record: RawTelemetryRecord): boolean {
    return !!(
      record.timestamp &&
      record.vehicleId &&
      record.batteryLevel !== undefined &&
      record.chargeState &&
      record.latitude !== undefined &&
      record.longitude !== undefined &&
      record.speed !== undefined &&
      record.odometer !== undefined
    );
  }
}