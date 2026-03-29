export interface TessieTelemetryRaw {
  timestamp: string;
  vehicleId: string;
  batteryLevel: number;
  chargingStatus: 'charging' | 'idle' | 'complete';
  location: {
    latitude: number;
    longitude: number;
  };
  odometer: number;
  speed: number;
  temperature: {
    battery: number;
    cabin: number;
  };
}

export interface TessieTelemetryValidated {
  timestamp: Date;
  vehicleId: string;
  batteryLevel: number;
  chargingStatus: 'charging' | 'idle' | 'complete';
  location: {
    latitude: number;
    longitude: number;
  };
  odometer: number;
  speed: number;
  temperature: {
    battery: number;
    cabin: number;
  };
}

export interface TelemetryValidationError {
  field: string;
  message: string;
}