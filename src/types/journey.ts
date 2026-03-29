export interface Journey {
  id: string;
  userId: string;
  startLocation: string;
  endLocation: string;
  startTime: Date;
  endTime: Date;
  distance: number;
  mode: 'walk' | 'bike' | 'car' | 'transit';
  calories: number;
  carbonEmission: number;
}

export interface JourneyMetrics {
  userId: string;
  totalJourneys: number;
  totalDistance: number;
  averageDistance: number;
  mostFrequentMode: string;
  totalCaloriesBurned: number;
  totalCarbonEmissionReduced: number;
  dateCalculated: Date;
}