export interface ChargingSession {
    id?: string;
    vehicleId: string;
    startTime: Date;
    endTime?: Date;
    energyConsumed: number; // in kWh
    chargingStationId: string;
    status: 'started' | 'completed' | 'interrupted';
    totalCost?: number;
}

export interface ChargingSessionImportRecord {
    vehicle_vin: string;
    charging_station_id: string;
    start_timestamp: string;
    end_timestamp?: string;
    energy_kwh: number;
}