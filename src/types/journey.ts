export interface Journey {
  id: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  duration: number;
  date: Date;
}

export interface JourneyTotals {
  totalDistance: number;
  totalDuration: number;
  averageDistance: number;
  averageDuration: number;
  journeyCount: number;
}