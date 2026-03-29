import { RawChargingSessionData, ChargingSession } from '../types/ChargingSession';

export function validateChargingSessionData(data: RawChargingSessionData): boolean {
  if (!data.session_id || !data.vehicle_identifier || !data.start_timestamp) {
    return false;
  }

  if (data.kwh_delivered <= 0) {
    return false;
  }

  return true;
}

export function normalizeChargingSessionData(rawData: RawChargingSessionData): ChargingSession {
  if (!validateChargingSessionData(rawData)) {
    throw new Error('Invalid charging session data');
  }

  return {
    id: rawData.session_id,
    vehicleId: rawData.vehicle_identifier,
    startTime: new Date(rawData.start_timestamp),
    endTime: rawData.end_timestamp ? new Date(rawData.end_timestamp) : null,
    energyConsumed: rawData.kwh_delivered,
    chargingStationId: rawData.charging_point_id,
    status: rawData.end_timestamp ? 'completed' : 'started'
  };
}