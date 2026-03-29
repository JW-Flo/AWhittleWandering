import { DriveRecord, RawDriveData } from '../types/drive-record';
import { v4 as uuidv4 } from 'uuid';

export class DriveRecordTransformer {
  static transform(rawData: RawDriveData): DriveRecord {
    if (!this.validateRawData(rawData)) {
      throw new Error('Invalid drive record data');
    }

    return {
      id: uuidv4(),
      driverId: rawData.driver_uuid,
      vehicleId: rawData.vehicle_uuid,
      startLocation: rawData.start_address,
      endLocation: rawData.end_address,
      startTimestamp: new Date(rawData.start_time),
      endTimestamp: new Date(rawData.end_time),
      distanceMiles: rawData.total_miles,
      durationMinutes: this.calculateDurationMinutes(
        new Date(rawData.start_time), 
        new Date(rawData.end_time)
      ),
      status: this.mapStatus(rawData.trip_status),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private static validateRawData(data: RawDriveData): boolean {
    return !!(
      data.driver_uuid && 
      data.vehicle_uuid && 
      data.start_address && 
      data.end_address && 
      data.start_time && 
      data.end_time && 
      data.total_miles >= 0
    );
  }

  private static calculateDurationMinutes(start: Date, end: Date): number {
    return Math.round((end.getTime() - start.getTime()) / 60000);
  }

  private static mapStatus(status: string): DriveRecord['status'] {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'completed';
      case 'in progress':
        return 'in-progress';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'in-progress';
    }
  }
}