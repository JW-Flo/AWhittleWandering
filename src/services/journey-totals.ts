import { Journey } from '../types/journey';

interface JourneyTotals {
  totalDistance: number;
  totalDuration: number;
  averageSpeed: number;
}

export function calculateJourneyTotals(journeys: Journey[]): JourneyTotals {
  if (!journeys || journeys.length === 0) {
    return {
      totalDistance: 0,
      totalDuration: 0,
      averageSpeed: 0
    };
  }

  // TODO: Handle potential edge cases with distance/duration calculations
  const totalDistance = journeys.reduce((sum, journey) => sum + (journey.distance || 0), 0);
  const totalDuration = journeys.reduce((sum, journey) => sum + (journey.duration || 0), 0);
  
  // TODO: Implement more robust average speed calculation
  const averageSpeed = totalDistance > 0 
    ? totalDistance / (totalDuration / 3600) 
    : 0;

  return {
    totalDistance: Number(totalDistance.toFixed(2)),
    totalDuration: Number(totalDuration.toFixed(2)),
    averageSpeed: Number(averageSpeed.toFixed(2))
  };
}
