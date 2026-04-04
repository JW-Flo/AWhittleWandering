export interface TessieDataFile {
  version: string;
  timestamp: number;
  data: TessieDataRecord[];
}

export interface TessieDataRecord {
  id: string;
  type: 'charge' | 'drive' | 'climate';
  timestamp: number;
  details: ChargeDetails | DriveDetails | ClimateDetails;
}

export interface ChargeDetails {
  batteryLevel: number;
  chargingRate: number;
  chargingLocation?: string;
}

export interface DriveDetails {
  startLocation: string;
  endLocation: string;
  distance: number;
  energyUsed: number;
}

export interface ClimateDetails {
  temperature: number;
  hvacMode: 'heat' | 'cool' | 'off';
  batteryImpact: number;
}

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
}