export interface Journey {
  id: string;
  userId: string;
  startLocation: string;
  endLocation: string;
  startTime: Date;
  endTime?: Date;
  distance?: number;
  mode: 'walk' | 'bike' | 'car' | 'transit';
  status: 'in-progress' | 'completed' | 'cancelled';
}

export interface JourneyMetrics {
  journeyId: string;
  averageSpeed?: number;
  totalDuration?: number;
  caloriesBurned?: number;
  carbonEmissionsSaved?: number;
}