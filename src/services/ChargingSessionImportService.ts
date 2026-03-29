import { ChargingSession, ChargingSessionImportRecord } from '../models/ChargingSession';
import { v4 as uuidv4 } from 'uuid';

export class ChargingSessionImportService {
    static validateImportRecord(record: ChargingSessionImportRecord): boolean {
        if (!record.vehicle_vin || !record.charging_station_id) {
            return false;
        }
        
        if (record.energy_kwh <= 0) {
            return false;
        }

        return true;
    }

    static transformImportRecord(record: ChargingSessionImportRecord): ChargingSession {
        if (!this.validateImportRecord(record)) {
            throw new Error('Invalid charging session import record');
        }

        return {
            id: uuidv4(),
            vehicleId: record.vehicle_vin,
            chargingStationId: record.charging_station_id,
            startTime: new Date(record.start_timestamp),
            endTime: record.end_timestamp ? new Date(record.end_timestamp) : undefined,
            energyConsumed: record.energy_kwh,
            status: record.end_timestamp ? 'completed' : 'started'
        };
    }

    static importChargingSessions(records: ChargingSessionImportRecord[]): ChargingSession[] {
        return records
            .filter(this.validateImportRecord)
            .map(this.transformImportRecord);
    }
}