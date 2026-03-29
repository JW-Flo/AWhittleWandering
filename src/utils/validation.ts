import { TessieTelemetryRaw, TessieTelemetryValidated, TelemetryValidationError } from '../types/telemetry';

export function validateTelemetry(data: TessieTelemetryRaw): { 
  data?: TessieTelemetryValidated, 
  errors?: TelemetryValidationError[] 
} {
  const errors: TelemetryValidationError[] = [];

  // Validate timestamp
  const timestamp = new Date(data.timestamp);
  if (isNaN(timestamp.getTime())) {
    errors.push({ field: 'timestamp', message: 'Invalid timestamp format' });
  }

  // Validate vehicle ID
  if (!data.vehicleId || data.vehicleId.trim() === '') {
    errors.push({ field: 'vehicleId', message: 'Vehicle ID is required' });
  }

  // Validate battery level
  if (data.batteryLevel < 0 || data.batteryLevel > 100) {
    errors.push({ field: 'batteryLevel', message: 'Battery level must be between 0 and 100' });
  }

  // Validate charging status
  const validChargingStatuses = ['charging', 'idle', 'complete'];
  if (!validChargingStatuses.includes(data.chargingStatus)) {
    errors.push({ field: 'chargingStatus', message: 'Invalid charging status' });
  }

  // Validate location
  if (!data.location) {
    errors.push({ field: 'location', message: 'Location is required' });
  } else {
    if (data.location.latitude < -90 || data.location.latitude > 90) {
      errors.push({ field: 'location.latitude', message: 'Invalid latitude' });
    }
    if (data.location.longitude < -180 || data.location.longitude > 180) {
      errors.push({ field: 'location.longitude', message: 'Invalid longitude' });
    }
  }

  // Validate odometer
  if (data.odometer < 0) {
    errors.push({ field: 'odometer', message: 'Odometer cannot be negative' });
  }

  // Validate speed
  if (data.speed < 0) {
    errors.push({ field: 'speed', message: 'Speed cannot be negative' });
  }

  // Validate temperatures
  if (data.temperature.battery < -50 || data.temperature.battery > 100) {
    errors.push({ field: 'temperature.battery', message: 'Invalid battery temperature' });
  }
  if (data.temperature.cabin < -50 || data.temperature.cabin > 100) {
    errors.push({ field: 'temperature.cabin', message: 'Invalid cabin temperature' });
  }

  // If no errors, return validated data
  if (errors.length === 0) {
    return { 
      data: {
        ...data,
        timestamp
      }
    };
  }

  // Return errors if validation fails
  return { errors };
}

export function processTelemetryBatch(rawData: TessieTelemetryRaw[]): {
  validData: TessieTelemetryValidated[];
  invalidData: { 
    data: TessieTelemetryRaw; 
    errors: TelemetryValidationError[] 
  }[];
} {
  const validData: TessieTelemetryValidated[] = [];
  const invalidData: { 
    data: TessieTelemetryRaw; 
    errors: TelemetryValidationError[] 
  }[] = [];

  for (const item of rawData) {
    const result = validateTelemetry(item);
    
    if (result.data) {
      validData.push(result.data);
    } else if (result.errors) {
      invalidData.push({ 
        data: item, 
        errors: result.errors 
      });
    }
  }

  return { validData, invalidData };
}