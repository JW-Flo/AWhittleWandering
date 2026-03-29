export interface RawJourneyData {
  distance: number;
  duration: number;
  startTime: Date;
  endTime: Date;
  elevationGain: number;
  caloriesBurned: number;
}

export interface AggregatedJourneyMetrics {
  totalDistance: number;
  totalDuration: number;
  averageSpeed: number;
  totalElevationGain: number;
  totalCaloriesBurned: number;
  journeyCount: number;
}