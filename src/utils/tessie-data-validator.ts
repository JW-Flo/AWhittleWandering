import { 
  TessieDataFile, 
  TessieDataRecord, 
  ValidationResult 
} from '../types/tessie-data.types';

export class TessieDataValidator {
  static validateFile(file: TessieDataFile): ValidationResult {
    const errors: string[] = [];

    // Validate file version
    if (!file.version || file.version.trim() === '') {
      errors.push('Invalid file version');
    }

    // Validate timestamp
    if (!file.timestamp || file.timestamp <= 0) {
      errors.push('Invalid file timestamp');
    }

    // Validate records
    if (!file.data || file.data.length === 0) {
      errors.push('No data records found');
    } else {
      file.data.forEach((record, index) => {
        const recordErrors = this.validateRecord(record);
        if (recordErrors.length > 0) {
          errors.push('Record ${index} validation failed: ${recordErrors.join(', ')}');
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateRecord(record: TessieDataRecord): string[] {
    const errors: string[] = [];

    // Validate common record properties
    if (!record.id || record.id.trim() === '') {
      errors.push('Invalid record ID');
    }

    if (!record.timestamp || record.timestamp <= 0) {
      errors.push('Invalid record timestamp');
    }

    // Type-specific validations
    switch (record.type) {
      case 'charge':
        errors.push(...this.validateChargeRecord(record.details));
        break;
      case 'drive':
        errors.push(...this.validateDriveRecord(record.details));
        break;
      case 'climate':
        errors.push(...this.validateClimateRecord(record.details));
        break;
      default:
        errors.push('Invalid record type');
    }

    return errors;
  }

  private static validateChargeRecord(details: any): string[] {
    const errors: string[] = [];
    const chargeDetails = details as ChargeDetails;

    if (chargeDetails.batteryLevel < 0 || chargeDetails.batteryLevel > 100) {
      errors.push('Invalid battery level');
    }

    if (chargeDetails.chargingRate < 0) {
      errors.push('Invalid charging rate');
    }

    return errors;
  }

  private static validateDriveRecord(details: any): string[] {
    const errors: string[] = [];
    const driveDetails = details as DriveDetails;

    if (!driveDetails.startLocation || driveDetails.startLocation.trim() === '') {
      errors.push('Invalid start location');
    }

    if (driveDetails.distance < 0) {
      errors.push('Invalid drive distance');
    }

    return errors;
  }

  private static validateClimateRecord(details: any): string[] {
    const errors: string[] = [];
    const climateDetails = details as ClimateDetails;

    if (climateDetails.temperature < -50 || climateDetails.temperature > 150) {
      errors.push('Invalid temperature');
    }

    if (!['heat', 'cool', 'off'].includes(climateDetails.hvacMode)) {
      errors.push('Invalid HVAC mode');
    }

    return errors;
  }
}