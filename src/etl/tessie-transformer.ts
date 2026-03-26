import { RawTessieData, CanonicalVehicleStatus, CanonicalChargingEvent } from '../types/tessie';

export class TessieDataTransformer {
  static transformVehicleStatus(rawData: RawTessieData): CanonicalVehicleStatus {
    if (!rawData) {
      throw new Error('Invalid raw data provided');
    }

    return {
      vehicleId: rawData.vehicle_id,
      timestamp: new Date(rawData.timestamp),
      batteryLevel: rawData.battery_level,
      chargingState: rawData.charging_state,
      location: {
        latitude: rawData.latitude,
        longitude: rawData.longitude
      },
      odometer: rawData.odometer
    };
  }

  static transformChargingEvent(rawData: RawTessieData): CanonicalChargingEvent {
    if (!rawData) {
      throw new Error('Invalid raw data provided');
    }

    return {
      vehicleId: rawData.vehicle_id,
      timestamp: new Date(rawData.timestamp),
      energyAdded: rawData.energy_added,
      chargingPower: rawData.charging_power
    };
  }

  static transformBatch(rawDataArray: RawTessieData[]): {
    vehicleStatuses: CanonicalVehicleStatus[];
    chargingEvents: CanonicalChargingEvent[];
  } {
    if (!Array.isArray(rawDataArray)) {
      throw new Error('Input must be an array of raw data');
    }

    return {
      vehicleStatuses: rawDataArray.map(this.transformVehicleStatus),
      chargingEvents: rawDataArray.map(this.transformChargingEvent)
    };
  }
}