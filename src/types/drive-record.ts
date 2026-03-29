export interface DriveRecord {
  id: string;
  driverId: string;
  vehicleId: string;
  startLocation: string;
  endLocation: string;
  startTimestamp: Date;
  endTimestamp: Date;
  distanceMiles: number;
  durationMinutes: number;
  status: 'completed' | 'in-progress' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface RawDriveData {
  driver_uuid: string;
  vehicle_uuid: string;
  start_address: string;
  end_address: string;
  start_time: string;
  end_time: string;
  total_miles: number;
  trip_status: string;
}