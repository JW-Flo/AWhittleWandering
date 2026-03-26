export interface JourneyMetrics {
  totalDistance: number;
  totalDuration: number;
  totalEnergyConsumed: number;
  averageEfficiency: number;
  journeyCount: number;
}

export interface JourneyRecord {
  timestamp: Date;
  distance: number;
  duration: number;
  energyUsed: number;
}