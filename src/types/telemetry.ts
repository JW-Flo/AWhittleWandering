export interface RawTelemetryRecord {
  timestamp: string;
  vehicleId: string;
  batteryLevel: number;
  chargeState: 'charging' | 'idle' | 'discharging';
  latitude: number;
  longitude: number;
  speed: number;
  odometer: number;
}

export interface UnifiedTelemetryRecord {
  id: string;
  vehicleId: string;
  recordedAt: Date;
  batteryPercentage: number;
  chargingStatus: 'charging' | 'idle' | 'discharging';
  location: {
    latitude: number;
    longitude: number;
  };
  speedKph: number;
  odometerMiles: number;
}