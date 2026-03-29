export interface ChargingSession {
  id: string;
  vehicleId: string;
  startTime: Date;
  endTime: Date | null;
  energyConsumed: number; // kWh
  chargingStationId: string;
  status: 'started' | 'completed' | 'interrupted';
  locationLatitude?: number;
  locationLongitude?: number;
}

export interface RawChargingSessionData {
  session_id: string;
  vehicle_identifier: string;
  start_timestamp: string;
  end_timestamp?: string;
  kwh_delivered: number;
  charging_point_id: string;
}