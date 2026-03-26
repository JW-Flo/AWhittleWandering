export interface RawTessieData {
  timestamp: string;
  vehicle_id: string;
  battery_level: number;
  charging_state: string;
  latitude: number;
  longitude: number;
  odometer: number;
  energy_added: number;
  charging_power: number;
}

export interface CanonicalVehicleStatus {
  vehicleId: string;
  timestamp: Date;
  batteryLevel: number;
  chargingState: string;
  location: {
    latitude: number;
    longitude: number;
  };
  odometer: number;
}

export interface CanonicalChargingEvent {
  vehicleId: string;
  timestamp: Date;
  energyAdded: number;
  chargingPower: number;
}